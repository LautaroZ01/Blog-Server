import { Request, Response } from 'express';
import { generatePostPdf } from '../services/pdfService';
import { UserEmail } from '../email/UserEmail';
import User from '../models/User';
import Category from '../models/Category';
import Tag from '../models/Tag';
import Post from '../models/Post';
import Comment from '../models/Comment';

export class PdfController {
    static sendPostAsPdf = async (req: Request, res: Response) => {
        try {
            const { postId } = req.params
            const user = {
                email: req.user.email,
                name: req.user.name
            }

            const { buffer, filename, title } = await generatePostPdf(postId);
            await UserEmail.sendPostPDF(user, title, buffer, filename);

            res.send('El articulo fue enviado, revisa tu correo')
        } catch (error: any) {
            console.error(error);
            res.status(500).json({ error: 'Hubo un error al generar el PDF' });
        }
    }

    static postsStats = async (req: Request, res: Response) => {
        try {
            const { status, category, tag, writer, search } = req.query

            let query: Record<string, any> = {}
            req.user.role !== 'admin' && (query = { author: req.user.id })

            if (status) query.status = status
            if (category) query.category = await Category.findOne({ name: category }).select('_id')
            if (tag) query.tags = await Tag.findOne({ name: tag }).select('_id')
            if (writer) query.author = await User.findOne({ email: writer }).select('_id')
            if (search) query.$or = [
                { title: { $regex: search as string, $options: 'i' } }
            ]

            const posts = await Post.find(query)
                .populate({
                    path: 'category',
                    select: 'name createdAt'
                }).populate({
                    path: 'tags',
                    select: 'name createdAt'
                }).populate({
                    path: 'sections',
                    select: 'title createdAt'
                }).populate({
                    path: 'author',
                    select: 'name createdAt'
                })
                .select('-__v -author -content')
                .lean<any>()

            if (!posts) {
                res.status(404).json({ error: 'No se encontraron articulos' })
                return
            }

            const totalPosts = posts.length;
            const totalViews = posts.reduce((acc, p) => acc + (p.viewCount || 0), 0);
            const totalReadTime = posts.reduce((acc, p) => acc + (p.readTime || 0), 0);
            const avgReadTime = totalPosts ? totalReadTime / totalPosts : 0;
            const totalComments = posts.reduce((acc, p) => acc + (p.comments?.length || 0), 0);
            const totalLikes = posts.reduce((acc, p) => acc + (p.likes?.length || 0), 0);

            const postsByCategory: Record<string, number> = {};
            posts.forEach(p => {
                const catName = p.category?.name || 'Sin categoría';
                postsByCategory[catName] = (postsByCategory[catName] || 0) + 1;
            });

            // ==== Posts por mes ====
            const postsByMonth: Record<string, number> = {};
            posts.forEach(p => {
                const date = new Date(p.createdAt);
                const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                postsByMonth[key] = (postsByMonth[key] || 0) + 1;
            });

            const stats = {
                totalPosts,
                totalViews,
                totalReadTime,
                avgReadTime: Number(avgReadTime.toFixed(2)),
                totalComments,
                totalLikes,
                postsByCategory: Object.entries(postsByCategory).map(([category, count]) => ({ category, count })),
                postsByMonth: Object.entries(postsByMonth).map(([month, count]) => ({ month, count })),
            };

            res.json(stats);

        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Hubo un error al generar el PDF' });

        }
    }

}

