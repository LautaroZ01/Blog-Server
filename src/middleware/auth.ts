import { Request, Response, NextFunction } from "express";
import jwt from 'jsonwebtoken'
import User, { IUser } from "../models/User";

declare global {
    namespace Express {
        interface Request {
            user?: IUser
        }
    }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies.access_token
    if (!token) {
        const error = new Error('No Autorizado')
        res.status(401).json({ error: error.message })
        return
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        if (typeof decoded === 'object' && decoded.id) {
            const user = await User.findById(decoded.id).select('_id name email role photo status')

            if (user) {
                req.user = user
                next()
            } else {
                res.status(500).json({ error: 'Token No Valido' })
                return
            }
        }

    } catch (error) {
        res.status(500).json({ error: 'Token No Valido' })
        return
    }
}

export const writer = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { role } = req.user

        if (role === 'user') {
            const error = new Error('No Autorizado')
            res.status(401).json({ error: error.message })
            return
        }

        next();

    } catch (error) {
        res.status(500).json({ error: 'Acceso No Valido' })
        return
    }
}

export const admin = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { role } = req.user

        if (role === 'user') {
            const error = new Error('No Autorizado')
            res.status(401).json({ error: error.message })
            return
        }

        next();

    } catch (error) {
        res.status(500).json({ error: 'Acceso No Valido' })
        return
    }
}