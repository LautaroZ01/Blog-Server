import { Request, Response } from "express"
import Category from "../models/Category";
import Tag from "../models/Tag";
import Post from "../models/Post";
import Comment, { commentStatus, IComment } from "../models/Comment";
import User, { IUser } from "../models/User";
import { Types } from "mongoose";
import { LIMIT_PER_PAGE } from "../utils/util";

interface Query {
    search?: string;
    page?: string;
}
interface QueryUser extends Query {
    role?: string;
    status?: string;
}

interface QueryPost extends Query {
    status?: string;
    category?: string;
    tag?: string;
}

export class DashboardController {
    static getAllUsers = async (req: Request<{}, {}, {}, QueryUser>, res: Response) => {
        const { role, status, search = '', page = '1' } = req.query;
        try {
            const query: Record<string, any> = { _id: { $ne: req.user.id } };

            if (role) query.role = role;
            if (status) query.status = status;
            if (search) {
                query.$or = [
                    { name: { $regex: search as string, $options: 'i' } },
                    { lastname: { $regex: search as string, $options: 'i' } },
                    { email: { $regex: search as string, $options: 'i' } }
                ];
            }

            const pageNumber = parseInt(page as string, 10) || 1;
            const limitNumber = LIMIT_PER_PAGE;
            const skip = (pageNumber - 1) * limitNumber;

            const total = await User.countDocuments(query);
            const totalPages = Math.ceil(total / limitNumber);

            const pagination = {
                total,
                page: pageNumber,
                totalPages
            }

            const users = await User.find(query)
                .select('-createdAt -updatedAt -__v -password -bio -isVerified -providerId -birthdate -nickname -country -provider')
                .skip(skip)
                .limit(limitNumber)

            res.json({ users, pagination })
        } catch (error) {
            res.status(500).json({ error: 'Hubo un error' });
        }
    }

    static getUserById = async (req: Request, res: Response) => {
        const { userId } = req.params

        try {
            const user = await User.findById(userId).select('-__v -password -updatedAt').populate({
                path: 'comments',
                select: '-__v -updatedAt -post -author',
                options: { sort: { createdAt: -1 } },
                populate: {
                    path: 'replies',
                    populate: {
                        path: 'author',
                        select: '_id name email photo role'
                    },
                    select: '-updatedAt -__v -replies',
                    options: { sort: { createdAt: -1 } }
                }
            })

            if (!user) {
                res.status(404).json({ error: 'El usuario no existe' })
                return
            }

            res.json(user)
        } catch (error) {
            res.status(500).json({ error: 'Hubo un error' });
        }
    }

    static changeUserStatus = async (req: Request, res: Response) => {
        const { userId } = req.params

        try {
            const user = await User.findById(userId).populate({
                path: 'comments',
                match: { status: commentStatus.DISABLED }
            })

            if (!user) {
                res.status(404).json({ error: 'El usuario no existe' })
                return
            }

            if (user.status === 'active') {
                user.status = 'suspended'
            } else {
                user.isVerified = true
                user.status = 'active'
                if (user.comments && user.comments.length > 0) {
                    user.comments.forEach(async (commentId: Types.ObjectId) => {
                        const comment = await Comment.findById(commentId)
                        comment.status = commentStatus.SPAM
                        comment.reports = 0
                        await comment.save()
                    })
                }
            }

            await user.save()

            res.send('Estado de usuarios actualizado correctamente')
        } catch (error) {
            console.error(error)
            res.status(500).json({ error: 'Hubo un error' });
        }
    }

    static changeRoleUser = async (req: Request, res: Response) => {
        const { role } = req.body
        try {
            if (req.registeredUser.role === "writer") {
                const posts = await Post.find({ author: req.registeredUser.id })
                if (posts.length > 0) {
                    res.status(400).json({ error: 'No se puede modificar el rol del usuario porque tiene articulos publicados' })
                    return
                }
            }


            req.registeredUser.role = role

            await req.registeredUser.save()

            res.send('Usuario actualizado correctamente')
        } catch (error) {
            res.status(500).json({ error: 'Hubo un error' });
        }

    }

    static deleteUser = async (req: Request, res: Response) => {
        const { userId } = req.params

        try {
            req.registeredUser.status = 'inactive'
            req.registeredUser.isVerified = false
            await req.registeredUser.save()

            res.send('Usuario eliminado correctamente')
        } catch (error) {
            res.status(500).json({ error: 'Hubo un error' });
        }
    }

    static getCategories = async (req: Request<{}, {}, {}, Query>, res: Response) => {
        try {
            const { search, page = "1" } = req.query
            const query: Record<string, any> = {}
            if (search) query.name = { $regex: search as string, $options: 'i' }

            const pageNumber = parseInt(page as string, 10) || 1;
            const limitNumber = LIMIT_PER_PAGE;
            const skip = (pageNumber - 1) * limitNumber;

            const total = await Category.countDocuments(query);
            const totalPages = Math.ceil(total / limitNumber);

            const pagination = {
                total,
                page: pageNumber,
                totalPages
            }

            const categories = await Category.find(query).select('-createdAt -updatedAt -__v').skip(skip).limit(limitNumber)

            res.json({ categories, pagination })
        } catch (error) {
            res.status(500).json({ error: 'Hubo un error' });
        }
    }

    static getCategoryById = async (req: Request, res: Response) => {
        const { categoryId } = req.params

        try {
            const category = await Category.findById(categoryId).select('-createdAt -updatedAt -__v')
            if (!category) {
                res.status(404).json({ error: 'No se encontró la categoría' })
                return
            }
            res.json(category)
        } catch (error) {
            res.status(500).json({ error: 'Hubo un error' });
        }
    }

    static getTags = async (req: Request<{}, {}, {}, Query>, res: Response) => {
        try {
            const { search, page = "1" } = req.query
            const query: Record<string, any> = {}
            if (search) query.name = { $regex: search as string, $options: 'i' }

            const pageNumber = parseInt(page as string, 10) || 1;
            const limitNumber = LIMIT_PER_PAGE;
            const skip = (pageNumber - 1) * limitNumber;

            const total = await Tag.countDocuments(query);
            const totalPages = Math.ceil(total / limitNumber);

            const pagination = {
                total,
                page: pageNumber,
                totalPages
            }

            const tags = await Tag.find(query).select('-createdAt -updatedAt -__v').skip(skip).limit(limitNumber)

            res.json({ tags, pagination })
        } catch (error) {
            res.status(500).json({ error: 'Hubo un error' });
        }
    }

    static getTagById = async (req: Request, res: Response) => {
        const { tagId } = req.params

        try {
            const tag = await Tag.findById(tagId).select('-createdAt -updatedAt -__v')
            if (!tag) {
                res.status(404).json({ error: 'No se encontró el tag' })
                return
            }
            res.json(tag)
        } catch (error) {
            res.status(500).json({ error: 'Hubo un error' });
        }
    }

    static getPosts = async (req: Request<{}, {}, {}, QueryPost>, res: Response) => {
        try {
            const { status, category, tag, search, page = "1" } = req.query

            const query: Record<string, any> = { author: req.user.id }

            if (status) query.status = status
            if (category) query.category = await Category.findOne({ name: category }).select('_id')
            if (tag) query.tags = await Tag.findOne({ name: tag }).select('_id')
            if (search) query.$or = [
                { title: { $regex: search as string, $options: 'i' } }
            ]

            const pageNumber = parseInt(page as string, 10) || 1;
            const limitNumber = LIMIT_PER_PAGE;
            const skip = (pageNumber - 1) * limitNumber;

            const total = await Post.countDocuments(query);
            const totalPages = Math.ceil(total / limitNumber);

            const pagination = {
                total,
                page: pageNumber,
                totalPages
            }

            const posts = await Post.find(query)
                .populate({
                    path: 'category',
                    select: 'name slug'
                }).populate({
                    path: 'tags',
                    select: 'slug'
                }).select('-__v -author -content')
                .skip(skip)
                .limit(limitNumber)

            const categories = await Category.find().select('name')
            const tags = await Tag.find().select('name')

            res.json({ posts, categories, tags, pagination })
        } catch (error) {
            console.error(error)
            res.status(500).json({ error: 'Hubo un error' });
        }
    }

    static getPostById = async (req: Request, res: Response) => {
        const { postId } = req.params

        try {
            const post = await Post.findById(postId)
                .populate({
                    path: 'category',
                    select: '_id name'
                })
                .populate({
                    path: 'tags',
                    select: '-createdAt -updatedAt -__v'
                })
                .select('title content images status category tags author');

            if (!post) {
                res.status(404).json({ error: 'El articulo no existe' })
                return
            }

            if (post.author.toString() !== req.user.id) {
                res.status(403).json({ error: 'No tienes permiso para ver este artículo' })
                return
            }

            res.json(post);

        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Hubo un error' });
        }
    }

    static getCommentsByPostId = async (req: Request, res: Response) => {
        const { postId } = req.params

        try {
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
                    select: '-updatedAt -__v -replies',
                    options: { sort: { createdAt: -1 } }
                })
                .select('-post -updatedAt -__v')
                .sort({ createdAt: -1 })

            if (!comments) {
                res.status(404).json({ error: 'No se encontraron comentarios' })
                return
            }

            res.json(comments);

        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Hubo un error' });
        }
    }

    static getWriter = async (req: Request, res: Response) => {
        const { writerId } = req.params
        const writerEmail = 'correo@correo.com'
        try {
            const selected = '-password -createdAt -updatedAt -__v -comments -isVerified -provider -status'
            let writer: IUser | null
            if(writerId) {
                writer = await User.findById(writerId).select(selected)

            }else{
                writer = await User.findOne({ email: writerEmail }).select(selected)
            }
            
            if (!writer) {
                res.status(404).json({ error: 'No se encontró el escritor' })
                return
            }

            if(writer.role !== 'writer') {
                res.status(403).json({ error: 'No tienes permiso para ver este usuario' })
                return
            }

            const { role, ...writerInfo } = writer.toObject()

            res.json(writerInfo)
        } catch (error) {
            res.status(500).json({ error: 'Hubo un error' })
        }
    }
}