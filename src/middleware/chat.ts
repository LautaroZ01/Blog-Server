import { Request, Response, NextFunction } from "express";
import Conversation, { IConversation } from "../models/Conversation";

declare global {
    namespace Express {
        interface Request {
            conversation: IConversation
        }
    }
}

export async function conversacionExists(req: Request, res: Response, next: NextFunction) {
    try {
        const { conversationId } = req.params
        const conversation = await Conversation.findById(conversationId)

        if (!conversation) {
            const error = new Error('No autorizado')
            res.status(404).json({ error: error.message })
            return
        }

        req.conversation = conversation
        next()
    } catch (error) {
        res.status(500).json({ error: 'Hubo un error' })
        return
    }
}