import { Request, Response, NextFunction } from "express";
import User, { ContactsType, ISocialNetwork, IUser, SocialNetworkTypes } from "../models/User";

declare global {
    namespace Express {
        interface Request {
            social?: IUser,
            contact?: IUser
        }
    }
}

export const social = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { type, name } = req.body
        const { socialId } = req.params

        const user = await User.findById(req.user.id).select('socialNetworks')

        if (!Object.values(SocialNetworkTypes).includes(type)) {
            const error = new Error('Esa red social no esta permitida')
            res.status(400).json({ error: error.message, validTypes: Object.values(SocialNetworkTypes) })
            return
        }

        let exists

        if (socialId) {
            exists = user.socialNetworks.some((social: ISocialNetwork) => social.type === type && social.name === name && social._id.toString() !== socialId);
        } else {
            exists = user.socialNetworks.some((social: ISocialNetwork) => social.type === type && social.name === name);
        }

        if (exists) {
            res.status(400).json({ error: 'Ya existe una red social con ese nombre' });
            return
        }

        req.social = user
        next()
    } catch (error) {
        res.status(500).json({ error: 'Hubo un error' })
        return
    }
}

export const contact = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { type, name } = req.body

        const user = await User.findById(req.user.id).select('contacts')

        if (!Object.values(ContactsType).includes(type)) {
            const error = new Error('Ese contacto no esta permitida')
            res.status(400).json({ error: error.message, validTypes: Object.values(ContactsType) })
            return
        }

        const exists = user.contacts.some((contact: any) => contact.type === type && contact.name === name);

        if (exists) {
            res.status(400).json({ error: 'Ya existe un contacto con ese nombre' });
            return
        }

        req.contact = user
        next()
    } catch (error) {
        res.status(500).json({ error: 'Hubo un error' })
        return
    }
}