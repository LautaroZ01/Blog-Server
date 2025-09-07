import { Server } from 'socket.io';
import Message, { IMessage } from '../models/Message';
import Conversation from '../models/Conversation';
import User from '../models/User';

let io: Server;

export const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST'],
        },
    });

    const userSocketMap: { [userId: string]: string } = {};

    io.on('connection', (socket) => {
        const userId = socket.handshake.query.userId;

        userSocketMap[userId as string] = socket.id;
        io.emit('getOnlineUsers', Object.keys(userSocketMap))

        socket.on('joinConversation', (conversationId) => {
            socket.join(conversationId);
        });

        socket.on('leaveConversation', (conversationId) => {
            socket.leave(conversationId);
        });

        socket.on('markMessageAsRead', async (conversationId, messageId) => {
            await Message.findByIdAndUpdate(messageId, { isRead: true });
            io.emit('messageRead', messageId);
        });

        socket.on('disconnect', async () => {
            delete userSocketMap[userId as string]
            io.emit('getOnlineUsers', Object.keys(userSocketMap))
        });
    });
};

export const getIo = () => {
    if (!io) {
        throw new Error('Socket.io not initialized');
    }
    return io;
};