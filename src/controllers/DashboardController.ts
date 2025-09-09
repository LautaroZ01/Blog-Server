import { Request, Response } from "express"
import Category from "../models/Category";
import Tag from "../models/Tag";
import Post from "../models/Post";
import Comment, { commentStatus, IComment } from "../models/Comment";
import User from "../models/User";
import { Types } from "mongoose";

interface Query {
    role?: string;
    status?: string;
    search?: string;
}

export class DashboardController {
    static getAllUsers = async (req: Request<{}, {}, {}, Query>, res: Response) => {
        const { role, status, search = '' } = req.query;
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

            const users = await User.find(query)
                .select('-createdAt -updatedAt -__v -password -bio -isVerified -providerId -birthdate -nickname -country -provider')
            res.json(users)
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

    static deleteUser = async (req: Request, res: Response)=>{
        const {userId} = req.params

        try {
            req.registeredUser.status = 'inactive'
            req.registeredUser.isVerified = false
            await req.registeredUser.save()
            
            res.send('Usuario eliminado correctamente')
        } catch (error) {
            res.status(500).json({ error: 'Hubo un error' });
        }
    }

    static getCategories = async (req: Request, res: Response) => {
        try {
            const categories = await Category.find().select('-createdAt -updatedAt -__v')
            res.json(categories)
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

    static getTags = async (req: Request, res: Response) => {
        try {
            const tags = await Tag.find().select('-createdAt -updatedAt -__v')
            res.json(tags)
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

    static getPosts = async (req: Request, res: Response) => {
        try {
            const posts = await Post.find({ author: req.user.id })
                .populate({
                    path: 'category',
                    select: 'name slug'
                }).populate({
                    path: 'tags',
                    select: 'slug'
                }).select('-__v -author -content')

            res.json(posts)
        } catch (error) {
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


}