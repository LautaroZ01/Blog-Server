import { Request, Response } from "express"
import User from "../models/User"
import { checkPassword, hashPassword } from "../utils/auth"
import { generateToken } from "../utils/token"
import Token from "../models/Token"
import { AuthEmail } from "../email/AuthEmail"
import { generateJWT } from "../utils/jwt"
import { deletePhoto, uploadImage } from "../utils/cloudinary"

export class AuthController {
    static createAccount = async (req: Request, res: Response) => {
        try {
            const { password, email } = req.body

            // Prevenir duplicados
            const userExists = await User.findOne({ email })

            if (userExists) {
                const error = new Error('El usuario ya existe')
                res.status(409).json({ error: error.message })
                return
            }

            // Crea un usuario
            const user = new User(req.body);

            // Hash Password
            user.password = await hashPassword(password)

            // Generar token
            const token = new Token()
            token.token = generateToken()
            token.user = user.id

            // Enviar email
            AuthEmail.sendConfirmationEmail({
                email: user.email,
                name: user.name,
                token: token.token
            })

            await Promise.all([user.save(), token.save()]);
            res.status(201).send('Cuenta creada, revisa tu email para confirmarla')

        } catch (error) {
            res.status(500).json({ error: 'Hubo un error' })
        }
    }

    static confirmAccount = async (req: Request, res: Response) => {
        try {
            const { token } = req.body

            const tokenExists = await Token.findOne({ token })

            if (!tokenExists) {
                const error = new Error('Token no valido')
                res.status(404).json({ error: error.message })
                return
            }

            const user = await User.findById(tokenExists.user)
            user.isVerified = true

            await Promise.allSettled([user.save(), tokenExists.deleteOne()])
            res.send('Cuanta confirmada correctamente')

        } catch (error) {
            res.status(500).json({ error: 'Hubo un error' })

        }
    }

    static requestConfirmationCode = async (req: Request, res: Response) => {
        try {
            const { email } = req.body

            // Usuario exist
            const user = await User.findOne({ email })

            if (!user) {
                const error = new Error('El Usuario no esta registrado')
                res.status(404).json({ error: error.message })
                return
            }

            if (user.isVerified) {
                const error = new Error('El Usuario ya esta confirmado')
                res.status(403).json({ error: error.message })
                return
            }

            // Generar token
            const token = new Token()
            token.token = generateToken()
            token.user = user.id

            // Enviar email
            AuthEmail.sendConfirmationEmail({
                email: user.email,
                name: user.name,
                token: token.token
            })

            await Promise.allSettled([user.save(), token.save()])
            res.send('Se envio un nuevo token a tu email')
        } catch (error) {
            res.status(500).json({ error: 'Hubo un error' })
        }
    }

    static forgotPassword = async (req: Request, res: Response) => {
        try {
            const { email } = req.body

            // Usuario exist
            const user = await User.findOne({ email })

            if (!user) {
                const error = new Error('El Usuario no esta registrado')
                res.status(404).json({ error: error.message })
                return
            }

            // Generar token
            const token = new Token()
            token.token = generateToken()
            token.user = user.id
            await token.save()

            // Enviar email
            AuthEmail.sendPasswordResetToken({
                email: user.email,
                name: user.name,
                token: token.token
            })
            res.send('Revisa tu email para instrucciones')
        } catch (error) {
            res.status(500).json({ error: 'Hubo un error' })
        }
    }

    static validateToken = async (req: Request, res: Response) => {
        try {
            const { token } = req.body

            const tokenExists = await Token.findOne({ token })

            if (!tokenExists) {
                const error = new Error('Token no valido')
                res.status(404).json({ error: error.message })
                return
            }
            res.send('Token valido, define tu nueva contraseña')

        } catch (error) {
            res.status(500).json({ error: 'Hubo un error' })

        }
    }

    static updatePasswordWithToken = async (req: Request, res: Response) => {
        try {
            const { token } = req.params
            const { password } = req.body

            const tokenExists = await Token.findOne({ token })

            if (!tokenExists) {
                const error = new Error('Token no valido')
                res.status(404).json({ error: error.message })
                return
            }

            const user = await User.findById(tokenExists.user)
            user.password = await hashPassword(password)

            await Promise.all([user.save(), tokenExists.deleteOne()])

            res.send('La contraseña ha sido actualizada')

        } catch (error) {
            res.status(500).json({ error: 'Hubo un error' })

        }
    }

    static login = async (req: Request, res: Response) => {
        try {
            const { email, password } = req.body
            const user = await User.findOne({ email })

            if (!user) {
                const error = new Error('Usuario no encontrado')
                res.status(404).json({ error: error.message })
                return
            }

            if(user.status === 'inactive'){
                const error = new Error('La cuenta no ha sido desactivada')
                res.status(401).json({ error: error.message })
                return
            }

            if (!user.isVerified) {
                const token = new Token()
                token.user = user.id
                token.token = generateToken()
                await token.save()

                // Enviar email
                AuthEmail.sendConfirmationEmail({
                    email: user.email,
                    name: user.name,
                    token: token.token
                })

                const error = new Error('La cuenta no ha sido confirmada, hemos enviado un email de confirmacion')
                res.status(401).json({ error: error.message })
                return
            }

            // Revisar password
            const isPasswordCorrect = await checkPassword(password, user.password)

            if (!isPasswordCorrect) {
                const error = new Error('La contraseña es incorrecta')
                res.status(404).json({ error: error.message })
                return
            }

            const token = generateJWT({ id: user.id })

            res.cookie('access_token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV == 'production', // la cookie solo se puede acceder en https
                sameSite: 'strict',
                maxAge: 30 * 24 * 60 * 60 * 1000
            }).send('Login correcto')

        } catch (error) {
            res.status(500).json({ error: 'Hubo un error' })
        }
    }

    static sessionCallBack = async (req: Request, res: Response) => {
        try {
            if (!req.user) {
                const error = new Error('Le usuario no existe')
                res.status(401).json({ error: error.message })
                return
            }

            const token = generateJWT({ id: req.user.id });

            res.cookie('access_token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV == 'production',
                sameSite: 'strict',
                maxAge: 30 * 24 * 60 * 60 * 1000
            }).redirect(process.env.FRONTEND_URL);

        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Hubo un error' });
        }
    };

    static logout = async (req: Request, res: Response) => {
        res.clearCookie('access_token').send('Cerraste tu sesion')
    }

    static user = async (req: Request, res: Response) => {
        res.json(req.user)
    }

    static profile = async (req: Request, res: Response) => {
        try {
            const user = await User.findById(req.user.id).select('email name lastname role photo country birthdate')

            res.json(user)
        } catch (error) {
            res.status(500).json({ error: 'Hubo un error' });
        }
    }

    static updateCurrentUserPassword = async (req: Request, res: Response) => {
        const { current_password, password } = req.body

        const user = await User.findById(req.user.id)

        if (user.provider !== 'local' && !user.password) {

            // Enviar email
            AuthEmail.sendUserWithOutPassword({
                email: user.email,
                name: user.name
            })

            const error = new Error('Debes establecer una contraseña. Revisa tu email para instrucciones')
            res.status(401).json({ error: error.message })
            return
        }

        const isPasswordCorrect = await checkPassword(current_password, user.password)

        if (!isPasswordCorrect) {
            const error = new Error('La contraseña actual es incorrecta')
            res.status(401).json({ error: error.message })
            return
        }
        user.password = await hashPassword(password)

        try {
            await user.save()
            res.send('La contraseña se actualizo correcatemente')
        } catch (error) {
            res.status(500).send('Hubo un error')
        }
    }

    static updateProfile = async (req: Request, res: Response) => {
        const { email, name, lastname, birthdate, country } = req.body

        const userExists = await User.findOne({ email })

        if (userExists && userExists.id.toString() !== req.user.id.toString()) {
            const error = new Error('Ese email ya esta registrado')
            res.status(409).json({ error: error.message })
            return
        }

        if (req.user.provider !== 'local' && email !== req.user.email) {
            const error = new Error('No puedes cambiar el email')
            res.status(403).json({ error: error.message })
            return
        }

        req.user.email = email
        req.user.name = name
        req.user.lastname = lastname
        req.user.birthdate = birthdate
        req.user.country = country

        try {
            await req.user.save()
            res.send('Perfil actualizado correactamente')
        } catch (error) {
            res.status(500).json({ error: 'Hubo un error' });
        }
    }

    static updateProfilePhoto = async (req: Request, res: Response) => {
        try {
            const { photo } = req.body;
            const userId = req.user._id;

            if (!photo) {
                const error = new Error('La foto es requerida')
                res.status(400).json({ error: error.message })
                return
            }

            if (req.user.photo) {
                await deletePhoto(req.user.photo, 'face')
            }

            const uploadResponse = await uploadImage(photo, 200, 200, 'face')
            await User.findByIdAndUpdate(
                userId,
                { photo: uploadResponse.secure_url },
                { new: true }
            );

            res.send("Foto actualizada correctamente");

        } catch (error) {
            res.status(500).json({ error: 'Hubo un error' });
        }
    }

    static checkPassword = async (req: Request, res: Response) => {

        const { password } = req.body

        const user = await User.findById(req.user.id)

        const isPasswordCorrect = await checkPassword(password, user.password)

        if (!isPasswordCorrect) {
            const error = new Error('La contraseña actual es incorrecta')
            res.status(401).json({ error: error.message })
            return
        }

        res.send('Contraseña correcta')
    }
}