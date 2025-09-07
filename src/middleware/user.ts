import { Request, Response, NextFunction } from "express";
import User, { IUser } from "../models/User";

declare global {
    namespace Express {
        interface Request {
            registeredUser?: IUser
        }
    }
}

export const userExists = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { userId } = req.params

        const user = await User.findById(userId)
        if (!user) {
            res.status(404).json({ error: 'El usuario no existe' })
            return
        }

        req.registeredUser = user
        next();
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: 'Hubo un error' })
        return
    }
}
