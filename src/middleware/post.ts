import { NextFunction, Request, Response } from "express";
import Category, { ICategory } from "../models/Category";
import Tag from "../models/Tag";

import { JSDOM } from 'jsdom';
import Post, { IPost } from "../models/Post";
import Comment, { IComment } from "../models/Comment";
const window = new JSDOM('').window;
const DOMPurify = require('dompurify')(window);

declare global {
    namespace Express {
        interface Request {
            content?: IPost['content'],
            category?: ICategory,
            post?: IPost,
            comment?: IComment,
        }
    }
}

export async function postMiddleware(req: Request, res: Response, next: NextFunction) {
    try {
        const { title, content, category, tags } = req.body;

        const cleanContent = DOMPurify.sanitize(content || '');
        if (!cleanContent) {
            res.status(400).json({ error: 'El contenido no fue escrito correctamente' })
            return
        }

        const categoryExists = await Category.findById(category)
        if (!categoryExists) {
            res.status(404).json({ error: 'La categoria no existe' })
            return
        }

        const tagsExists = await Tag.find({ _id: { $in: tags } })
        if (tagsExists.length !== tags.length) {
            res.status(404).json({ error: 'Uno o mas etiquetas no existen' })
            return
        }

        req.content = cleanContent
        req.category = categoryExists
        next();
    } catch (error) {
        res.status(500).json({ error: 'Hubo un error' });
    }
}

export async function postExists(req: Request, res: Response, next: NextFunction) {
    try {
        const { postId } = req.params

        const post = await Post.findById(postId)
        if (!post) {
            res.status(404).json({ error: 'El articulo no existe' })
            return
        }

        req.post = post
        next();
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: 'Hubo un error' })
        return
    }
}

export async function commentMiddleware(req: Request, res: Response, next: NextFunction) {
    try {
        const { commentId } = req.params

        const comment = await Comment.findById(commentId)
        if (!comment) {
            res.status(404).json({ error: 'El comentario no existe' })
            return
        }

        if (req.user?.role !== 'admin' && req.user?.role !== 'writer' && req.user?.id !== comment.author.toString()) {
            res.status(403).json({ error: 'No tienes permiso para realizar esta accion' })
            return
        }

        req.comment = comment
        next();
    } catch (error) {
        res.status(500).json({ error: 'Hubo un error' })
        return
    }
}