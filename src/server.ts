import http from 'http'
import express from "express";
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { connectDB } from './config/db';

import authRoutes from './routes/authRoutes';
import writerRoutes from './routes/writerRoutes';
import postRoutes from './routes/postRoutes';
import chatRoutes from './routes/chatRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import categoryRoutes from './routes/categoryRoutes';
import tagRoutes from './routes/tagRoutes';
import commentRoutes from './routes/commentRoutes';
import { corsMiddleware } from './config/cors';
import passport from 'passport';
import session from 'express-session';
import { initSocket } from './services/socket';

dotenv.config()
connectDB()

const app = express();

// Configuracion de cors
app.use(corsMiddleware());

// Configuracion de body parser
app.use(express.json())

// Configuracion de cookie parser
app.use(cookieParser())
app.use(session({
    secret: process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Cambia a true si estás usando HTTPS
}));

app.use(passport.initialize());
app.use(passport.session());

const server = http.createServer(app);

initSocket(server);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/writer', writerRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/post', postRoutes);
app.use('/api/category', categoryRoutes);
app.use('/api/tag', tagRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/comment', commentRoutes);

export default server;