import { Request, Response } from "express"
import Category from "../models/Category";
import Tag from "../models/Tag";
import Post from "../models/Post";
import { handleCategoryChange, handleTagChange, updateSections } from "../services/postService";
import { deletePhoto, uploadImage } from "../utils/cloudinary";
import Comment, { commentStatus } from "../models/Comment";
import User from "../models/User";
import PostSection, { IPostSection } from "../models/PostSection";
import { calculateReadTime } from "../utils/util";

export class PostController {
    static getPosts = async (req: Request, res: Response) => {
        try {
            const {
                limit = '10',
                page = '1',
                category,
                tag,
                search
            } = req.query;

            const query: any = { status: 'published' };

            if (category) {
                query.category = category;
            }

            if (tag) {
                query.tags = tag;
            }
            if (search) {
                query.$or = [
                    { title: { $regex: search, $options: 'i' } },
                    { excerpt: { $regex: search, $options: 'i' } },
                    { content: { $regex: search, $options: 'i' } }
                ];
            }

            const pageNumber = parseInt(page as string, 10);
            const limitNumber = parseInt(limit as string, 10);
            const skip = (pageNumber - 1) * limitNumber;
            const [posts, total] = await Promise.all([
                Post.find(query)
                    .populate({
                        path: 'author',
                        select: '_id name email photo role'
                    })
                    .populate({
                        path: 'category',
                        select: 'name slug'
                    })
                    .populate({
                        path: 'tags',
                        select: 'name slug'
                    })
                    .select('-__v -viewCount -updatedAt -sections')
                    .sort('-createdAt')
                    .skip(skip)
                    .limit(limitNumber),
                Post.countDocuments(query)
            ]);

            const totalPages = Math.ceil(total / limitNumber);

            res.json({
                data: posts,
                pagination: {
                    total,
                    page: pageNumber,
                    limit: limitNumber,
                    totalPages,
                    hasNextPage: pageNumber < totalPages,
                    hasPreviousPage: pageNumber > 1
                }
            });
        } catch (error) {
            console.error('Error fetching posts:', error);
            res.status(500).json({ error: 'Hubo un error al obtener las publicaciones' });
        }
    }

    static getPostBySlug = async (req: Request, res: Response) => {
        try {
            const { slug } = req.params
            const post = await Post.findOne({ slug }).populate({
                path: 'author',
                select: '_id name email photo role'
            })
                .populate({
                    path: 'category',
                    select: 'name slug'
                })
                .populate({
                    path: 'tags',
                    select: 'name slug'
                })
                .populate({
                    path: 'sections',
                    select: 'title content thumbnail'
                })
                .select('-__v -updatedAt')

            if (!post) {
                res.status(404).json({ error: 'El articulo no existe' })
                return
            }

            post.viewCount += 1
            await post.save()

            const { viewCount, ...sendPost } = post.toObject()

            res.json(sendPost)
        } catch (error) {
            console.error('Error fetching post by slug:', error);
            res.status(500).json({ error: 'Hubo un error al obtener el articulo' });
        }
    }

    static createPost = async (req: Request, res: Response) => {
        try {
            const { title, content, sections = [], ...rest } = req.body

            const postExists = await Post.findOne({ title })
            if (postExists) {
                res.status(400).json({ error: 'El articulo ya existe' })
                return
            }

            const post = new Post({
                ...rest,
                title,
                content: req.content
            });

            post.author = req.user.id

            post.tags.forEach(async (tag: any) => {
                const tagExists = await Tag.findById(tag._id)
                tagExists.posts.push(post.id)
                await tagExists.save()
            })

            let fullContent = req.content || '';

            if (Array.isArray(sections) && sections.length > 0) {
                const createdSections = await Promise.all(
                    sections.map(async (section: IPostSection) => {
                        fullContent += ' ' + section.content;
                        const newSection = new PostSection({
                            title: section.title,
                            content: section.content,
                            thumbnail: section.thumbnail,
                            post: post._id
                        })
                        await newSection.save()
                        return newSection._id
                    })
                )

                post.sections.push(...createdSections)
            }

            post.readTime = calculateReadTime(fullContent) + 2

            req.category.posts.push(post.id)

            await Promise.all([await req.category.save(), await post.save()])

            res.status(201).json({
                message: 'Articulo creado exitosamente',
                postId: post._id
            });

        } catch (error) {
            res.status(500).json({ error: 'Hubo un error' });
        }
    }

    static updatePostImages = async (req: Request, res: Response) => {
        try {
            const { images } = req.body

            if (!images || images.length === 0) {
                res.status(400).json({ error: 'Las imagenes son obligatorias' })
                return
            }

            req.post.images.push(...images);

            await req.post.save()

            res.send('Imagenes subidas correctamente')
        } catch (error) {
            res.status(500).json({ error: 'Hubo un error' });
        }
    }

    static updatePost = async (req: Request, res: Response) => {
        try {
            const { title, content, category, sections, ...rest } = req.body

            const postExists = await Post.findOne({ title });
            if (postExists && postExists.id.toString() !== req.post.id.toString()) {
                res.status(400).json({ error: 'El articulo ya existe' })
                return
            }

            if (rest.tags) {
                await handleTagChange(req.post, rest.tags);
            }

            if (category) {
                req.post.category = await handleCategoryChange(req.post, req.category);
            }

            req.post.title = title
            req.post.content = req.content
            let fullContent = req.content || '';
            Object.keys(rest).forEach(key => {
                req.post[key] = rest[key];
            });

            if (sections) {
                const updatedSectionIds = await updateSections(req.post.id, sections)
                req.post.sections = updatedSectionIds
                const sectionsText = sections.map((section: IPostSection) => section.content).join(' ');
                fullContent += ' ' + sectionsText;
            }

            req.post.readTime = calculateReadTime(fullContent) + 2

            await req.post.save()

            res.send('Articulo actualizado')
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    static deletePost = async (req: Request, res: Response) => {
        try {
            const post = req.post;

            // Eliminar las imagenes del post de Cloudinary
            if (post.images && post.images.length > 0) {
                await Promise.all(post.images.map(async (image) => await deletePhoto(image, 'auto')));
            }

            // Eliminar imagenes de las secciones antes de eliminar el post
            if (post.sections && post.sections.length > 0) {
                await Promise.all(post.sections.map(async (sectionId) => {
                    const section = await PostSection.findById(sectionId);
                    if (section && section.thumbnail) {
                        await deletePhoto(section.thumbnail, 'auto');
                    }
                }));
            }

            // Eliminar el post
            await post.deleteOne();

            // Eliminar el post de la categoria
            const category = await Category.findById(post.category);
            if (category) {
                category.posts = category.posts.filter(p => p.toString() !== post.id);
                await category.save();
            }

            // Eliminar el post de los tags
            for (const tagId of post.tags) {
                const tag = await Tag.findById(tagId);
                if (tag) {
                    tag.posts = tag.posts.filter(p => p.toString() !== post.id);
                    await tag.save();
                }
            }

            res.send('Articulo eliminado');

        } catch (error) {
            res.status(500).json({ error: 'Hubo un error' });
        }
    }

    static deletePostImage = async (req: Request, res: Response) => {
        try {
            const { imageUrl } = req.body

            if (!imageUrl) {
                res.status(400).json({ error: 'La URL de la imagen es obligatoria' })
                return
            }

            // Eliminar la imagen de Cloudinary
            await deletePhoto(imageUrl, 'auto');

            // Eliminar la imagen del post
            req.post.images = req.post.images.filter(image => image !== imageUrl);
            await req.post.save();

            res.send('Imagen eliminada correctamente')
        } catch (error) {
            res.status(500).json({ error: 'Hubo un error' });
        }
    }

    static likePost = async (req: Request, res: Response) => {
        try {
            const post = req.post

            if (post.likes.includes(req.user.id)) {
                res.status(400).json({ error: 'Ya has dado like a este articulo' })
                return
            }

            post.likes.push(req.user.id)
            await post.save()
            res.send('Me gusta agregado correctamente')
        } catch (error) {
            res.status(500).json({ error: 'Hubo un error' });
        }
    }

    static dislikePost = async (req: Request, res: Response) => {
        try {
            const post = req.post

            if (!post.likes.includes(req.user.id)) {
                res.status(400).json({ error: 'No has dado like a este articulo' })
                return
            }

            post.likes = post.likes.filter(like => like.toString() !== req.user.id)
            await post.save()
            res.send('Me gusta eliminado correctamente')
        } catch (error) {
            res.status(500).json({ error: 'Hubo un error' });
        }
    }
}

export class CategoryController {
    static getCategories = async (req: Request, res: Response) => {
        try {
            const categories = await Category.find().select('-posts -description -createdAt -updatedAt -__v')
            res.json(categories)
        } catch (error) {
            res.status(500).json({ error: 'Hubo un error' });
        }
    }

    static getCategoryBySlug = async (req: Request, res: Response) => {
        try {
            const { slug } = req.params

            const category = await Category.findOne({ slug }).select('-posts -createdAt -updatedAt -__v')
            if (!category) {
                res.status(404).json({ error: 'La categoria no existe' })
                return
            }

            res.json(category)

        } catch (error) {
            res.status(500).json({ error: 'Hubo un error' });
        }
    }

    static createCategory = async (req: Request, res: Response) => {
        try {
            const { name } = req.body

            const categoryExists = await Category.findOne({ name })
            if (categoryExists) {
                res.status(400).json({ error: 'La categoria ya existe' })
                return
            }

            const category = new Category(req.body)
            await category.save()

            res.send('Categoria creada')
        } catch (error) {
            res.status(500).json({ error: 'Hubo un error' });
        }
    }

    static updateCategory = async (req: Request, res: Response) => {
        try {
            const { id } = req.params

            const category = await Category.findById(id)
            if (!category) {
                res.status(404).json({ error: 'La categoria no existe' })
                return
            }

            const { name, description } = req.body

            const categoryExists = await Category.findOne({ name })
            if (categoryExists && categoryExists._id.toString() !== id) {
                res.status(400).json({ error: 'La categoria ya existe' })
                return
            }

            category.name = name
            category.description = description
            await category.save()

            res.send('Categoria actualizada')
        } catch (error) {
            res.status(500).json({ error: 'Hubo un error' });
        }
    }

    static deleteCategory = async (req: Request, res: Response) => {
        try {
            const { id } = req.params

            const category = await Category.findById(id)
            if (!category) {
                res.status(404).json({ error: 'La categoria no existe' })
                return
            }

            if (category.posts.length > 0) {
                res.status(400).json({ error: 'No se puede eliminar una categoria con articulos asociados' })
                return
            }

            await category.deleteOne()

            res.send('Categoria eliminada')

        } catch (error) {
            res.status(500).json({ error: 'Hubo un error' });
        }
    }

}

export class TagController {
    static getTags = async (req: Request, res: Response) => {
        try {
            const tags = await Tag.find().select('-posts -createdAt -updatedAt -__v')
            res.json(tags)
        } catch (error) {
            res.status(500).json({ error: 'Hubo un error' });
        }
    }

    static getTagBySlug = async (req: Request, res: Response) => {
        try {
            const { slug } = req.params

            const tags = await Tag.findOne({ slug }).select('-posts -createdAt -updatedAt -__v')
            if (!tags) {
                res.status(404).json({ error: 'El tag no existe' })
                return
            }

            res.json(tags)

        } catch (error) {
            res.status(500).json({ error: 'Hubo un error' });
        }
    }

    static createTag = async (req: Request, res: Response) => {
        try {
            const { name } = req.body

            const tagExists = await Tag.findOne({ name })
            if (tagExists) {
                res.status(400).json({ error: 'El tag ya existe' })
                return
            }

            const tag = new Tag(req.body)
            await tag.save()

            res.send('Tag creado')
        } catch (error) {
            res.status(500).json({ error: 'Hubo un error' });
        }
    }

    static updateTag = async (req: Request, res: Response) => {
        try {
            const { id } = req.params

            const tag = await Tag.findById(id)
            if (!tag) {
                res.status(404).json({ error: 'El tag no existe' })
                return
            }

            const { name } = req.body

            const tagExists = await Tag.findOne({ name })
            if (tagExists && tagExists._id.toString() !== id) {
                res.status(400).json({ error: 'El tag ya existe' })
                return
            }

            tag.name = name
            await tag.save()

            res.send('Tag actualizado')
        } catch (error) {
            res.status(500).json({ error: 'Hubo un error' });
        }
    }

    static deleteTag = async (req: Request, res: Response) => {
        try {
            const { id } = req.params

            const tag = await Tag.findById(id)
            if (!tag) {
                res.status(404).json({ error: 'El tag no existe' })
                return
            }

            await tag.deleteOne()

            res.send('Tag eliminado')

        } catch (error) {
            res.status(500).json({ error: 'Hubo un error' });
        }
    }
}

export class CommentController {

    static getComments = async (req: Request, res: Response) => {
        try {
            const { postId } = req.params


            const comments = await Comment.find({ post: postId })
                .populate({
                    path: 'author',
                    select: '_id name email photo role'
                })
                .populate({
                    path: 'replies',
                    populate: {
                        path: 'author',
                        select: '_id name email photo role'
                    },
                    select: '-updatedAt -__v -reports -replies -status',
                    match: { status: 'approved' },
                    options: { sort: { createdAt: -1 } }
                })
                .where('status', 'approved')
                .select('-post -updatedAt -reports -__v -status')
                .sort({ createdAt: -1 })
            res.json(comments)
        } catch (error) {
            res.status(500).json({ error: 'Hubo un error' });
        }
    }

    static createComment = async (req: Request, res: Response) => {
        try {
            const { content } = req.body
            const { postId } = req.params
            const user = await User.findById(req.user.id)

            if (user.status === 'suspended') {
                res.status(403).json({ error: 'No puedes comentar, tu cuenta esta suspendida' })
                return
            }

            const comment = new Comment({
                content,
                post: postId,
                author: req.user.id
            })
            const post = await Post.findById(postId)

            if (!post) {
                res.status(404).json({ error: 'El post no existe' })
                return
            }

            post.comments.push(comment.id)

            user.comments.push(comment.id)
            Promise.all([await post.save(), await comment.save(), await user.save()])

            res.send('Comentario publicado')
        } catch (error) {
            res.status(500).json({ error: 'Hubo un error' });
        }
    }

    static updateComment = async (req: Request, res: Response) => {
        try {
            const { content } = req.body
            const { comment } = req

            comment.content = content
            await comment.save()

            res.send('Comentario actualizado')
        } catch (error) {
            res.status(500).json({ error: 'Hubo un error' });
        }
    }

    static deleteComment = async (req: Request, res: Response) => {
        try {
            const { comment } = req

            await comment.deleteOne()

            res.send('Comentario eliminado')
        } catch (error) {
            res.status(500).json({ error: 'Hubo un error' });
        }
    }

    static reportComment = async (req: Request, res: Response) => {
        try {
            const { comment } = req

            comment.reports++

            if (comment.reports >= 5) {
                comment.status = commentStatus.DISABLED
            }

            const user = await User.findById(comment.author).select('comments')

            if (user?.comments.length >= 2) {
                user.status = 'suspended'
            }

            Promise.all([await comment.save(), await user.save()])

            res.send('Comentario reportado')
        } catch (error) {
            res.status(500).json({ error: 'Hubo un error' });
        }
    }

    static replyComment = async (req: Request, res: Response) => {
        try {
            const { content } = req.body
            const { parentCommentId } = req.params
            const user = await User.findById(req.user.id)

            if (user.status === 'suspended') {
                res.status(403).json({ error: 'No puedes comentar, tu cuenta esta suspendida' })
                return
            }

            const comment = new Comment({
                content,
                parentComment: parentCommentId,
                author: req.user.id
            })

            const parentComment = await Comment.findById(parentCommentId)
            if (!parentComment) {
                res.status(404).json({ error: 'El comentario no existe' })
                return
            }

            if (req.user.id !== parentComment.author.toString() && req.user.role !== 'admin' && req.user.role !== 'writer') {
                res.status(403).json({ error: 'No tienes permiso para realizar esta accion' })
                return
            }

            parentComment.replies.push(comment.id)
            user.comments.push(comment.id)

            Promise.all([await parentComment.save(), await comment.save(), await user.save()])

            res.send('Comentario publicado')
        } catch (error) {
            res.status(500).json({ error: 'Hubo un error' });
        }
    }

    static changeCommentStatus = async (req: Request, res: Response) => {
        try {
            const { comment } = req

            comment.status = (comment.status === commentStatus.APPROVED) ? commentStatus.DISABLED : commentStatus.APPROVED
            await comment.save()

            res.send('Estado del comentario cambiado')
        } catch (error) {
            res.status(500).json({ error: 'Hubo un error' });
        }
    }
}