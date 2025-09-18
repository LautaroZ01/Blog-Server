import { Request, Response } from "express"
import User from "../models/User";
import { ContactEmail } from "../email/ContactEmail";

export class WriterController {
    static profile = async (req: Request, res: Response) => {
        try {
            const user = await User.findById(req.user.id).select('nickname bio socialNetworks contacts')

            res.json(user)
        } catch (error) {
            res.status(500).json({ error: 'Hubo un error' });
        }
    }

    static updateProfile = async (req: Request, res: Response) => {
        try {
            const { bio, nickname } = req.body

            req.user.bio = bio
            req.user.nickname = nickname

            await req.user.save()
            res.send('Perfil actualizado correactamente')

        } catch (error) {
            res.status(500).json({ error: 'Hubo un error' });
        }
    }

    static getSocialAndContact = async (req: Request, res: Response) => {
        try {
            const { socialNetworks, contacts } = await User.findById(req.user.id).select('socialNetworks contacts')

            res.json({ socialNetworks, contacts })

        } catch (error) {
            res.status(500).json({ error: 'Hubo un error' });
        }
    }

    static createSocialNetwork = async (req: Request, res: Response) => {
        try {
            req.social.socialNetworks.push(req.body)
            await req.social.save()
            res.status(201).send('Red social agregada correctamente')

        } catch (error) {
            res.status(500).json({ error: 'Hubo un error' });
        }
    }

    static editSocialNetwork = async (req: Request, res: Response) => {
        try {
            const { socialId } = req.params
            const { name, type, url } = req.body

            const social = req.social.socialNetworks.filter(social => social._id.toString() === socialId)[0]

            if (!social) {
                const error = new Error('Esa red social no existe')
                res.status(400).json({ error: error.message })
                return
            }

            social.name = name
            social.type = type
            social.url = url

            await req.social.save()
            res.send('Red social actualizada correctamente')

        } catch (error) {
            res.status(500).json({ error: 'Hubo un error' });
        }
    }

    static deleteSocialNetWork = async (req: Request, res: Response) => {
        try {
            const { socialId } = req.params

            const user = await User.findById(req.user.id).select('socialNetworks')

            const socialIndex = user.socialNetworks.findIndex(
                social => social._id.toString() === socialId
            );

            if (socialIndex === -1) {
                const error = new Error('Esa red social no existe');
                res.status(400).json({ error: error.message });
                return;
            }

            user.socialNetworks.splice(socialIndex, 1);

            await user.save()
            res.send('Red social eliminada correctamente')

        } catch (error) {
            res.status(500).json({ error: 'Hubo un error' });
        }
    }

    static createContact = async (req: Request, res: Response) => {
        try {
            req.contact.contacts.push(req.body)
            await req.contact.save()
            res.status(201).send('Contacto agregado correctamente')

        } catch (error) {
            res.status(500).json({ error: 'Hubo un error' });
        }
    }

    static editContact = async (req: Request, res: Response) => {
        try {
            const { contactId } = req.params
            const { name, type } = req.body

            const contact = req.contact.contacts.filter(contact => contact._id.toString() === contactId)[0]

            if (!contact) {
                const error = new Error('Esa contacto no existe')
                res.status(400).json({ error: error.message })
                return
            }

            contact.name = name
            contact.type = type

            await req.contact.save()
            res.send('Contacto actualizada correctamente')

        } catch (error) {
            res.status(500).json({ error: 'Hubo un error' });
        }
    }

    static deleteContact = async (req: Request, res: Response) => {
        try {
            const { contactId } = req.params

            const user = await User.findById(req.user.id).select('contacts')

            const contactIndex = user.contacts.findIndex(
                contact => contact._id.toString() === contactId
            );

            if (contactIndex === -1) {
                const error = new Error('Ese contacto no existe');
                res.status(400).json({ error: error.message });
                return;
            }

            user.contacts.splice(contactIndex, 1);

            await user.save()
            res.send('Contacto eliminada correctamente')

        } catch (error) {
            res.status(500).json({ error: 'Hubo un error' });
        }
    }
}