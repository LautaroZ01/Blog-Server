import { Request, Response } from 'express';
import Conversation from '../models/Conversation';
import Message from '../models/Message';
import User from '../models/User';
import { getIo } from '../services/socket';

export class ChatController {
    static createConversation = async (req: Request, res: Response) => {
        const { participants } = req.body;
        try {
            const sortedParticipants = participants.sort();

            const existingConversation = await Conversation.findOne({
                participants: { $all: sortedParticipants, $size: sortedParticipants.length }
            });

            if (existingConversation) {
                res.json(existingConversation._id)
                return
            }

            const newConversation = new Conversation({ participants });
            await newConversation.save();
            res.status(201).json(newConversation._id);
        } catch (error) {
            res.status(500).json({ error: 'Hubo un error' });
        }
    }

    static getConversationsByUser = async (req: Request, res: Response) => {
        const userId = req.user._id;

        try {
            const conversations = await Conversation.find({ participants: userId })
                .select('_id participants isActive messages')
                .populate({
                    path: 'participants',
                    select: '_id name lastname email photo',
                    match: { _id: { $ne: userId } }
                })
                .populate({
                    path: 'messages',
                    select: 'text isRead sender'
                });


            if (!conversations || conversations.length === 0) {
                const error = new Error('No hay ninguna conversación aún');
                res.status(400).json({ error: error.message });
                return;
            }

            res.json(conversations);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Hubo un error' })
        }
    };

    static sendMessage = async (req: Request, res: Response) => {
        const { text } = req.body;
        const sender = req.user.id
        const conversationId = req.conversation._id;

        try {
            // Crear y guardar el nuevo mensaje
            const newMessage = new Message({ conversationId, sender, text });
            req.conversation.messages.push(newMessage.id);

            await Promise.all([newMessage.save(), req.conversation.save()]);

            const message = await Message.findById(newMessage.id)
                .select('_id conversationId sender text isRead createdAt')
                .populate('sender', '_id name lastname email photo');

            if (conversationId) {
                const io = getIo();
                io.to(conversationId.toString() as string).emit('newMessage', message);

                io.emit('updateConversationList', {
                    conversationId: conversationId.toString(),
                    lastMessage: {
                        _id: message._id,
                        text: message.text,
                        sender: message.sender._id,
                        isRead: message.isRead,
                    },
                    unreadCount: 1, // Inicialmente, el mensaje no está leído
                });

                if (req.conversation.participants.includes(req.user.id)) {
                    io.emit('notificationMessage', true);
                }

            }

            res.status(201).json(message);
        } catch (error) {
            res.status(500).json({ error: 'Hubo un error' });
        }
    };

    static getMessages = async (req: Request, res: Response) => {
        const { id } = req.conversation;
        const receiverId = req.conversation.participants.filter(participant => participant.toString() !== req.user.id.toString())[0]

        try {
            const messages = await Message.find({ conversationId: id })
                .select('_id conversationId sender text isRead createdAt')
                .populate('sender', ('_id name lastname email photo'));

            const unreadMessages = messages.filter(
                message => !message.isRead && message.sender._id.toString() !== req.user.id.toString()
            );

            if (unreadMessages.length > 0) {
                await Message.updateMany(
                    {
                        _id: { $in: unreadMessages.map(msg => msg._id) }
                    },
                    { $set: { isRead: true } }
                );

                const io = getIo();
                io.to(id.toString()).emit('messagesMarkedAsRead', {
                    conversationId: id.toString(),
                    messageIds: unreadMessages.map(msg => msg._id.toString()),
                });
            }



            const receiver = await User.findById(receiverId).select('_id name lastname email photo')

            res.json({
                messages,
                receiver
            });

        } catch (error) {
            res.status(500).json({ error: 'Hubo un error' });
        }
    };

    static getUsersWithoutConversation = async (req: Request, res: Response) => {
        // Tarea: Obtener los usuarios que sean escritores y los que no, de acuerdo al rol del usuario autenticado
        const userId = req.user.id;

        try {
            const conversations = await Conversation.find({
                participants: userId,
            });
            const participantIds = conversations.flatMap((conv) =>
                conv.participants.map((participant) => participant.toString())
            );

            let users = []

            if (req.user.role === 'writer') {
                users = await User.find({
                    _id: { $nin: [...participantIds, userId] },
                    role: 'user'
                }).select('_id name lastname email photo');
            } else {
                users = await User.find({
                    _id: { $nin: [...participantIds, userId] },
                    role: 'writer'
                }).select('_id name lastname email photo');
            }

            res.json(users);
        } catch (error) {
            console.error(error);
            res.status(500).send('Error al obtener los usuarios');
        }
    };
}