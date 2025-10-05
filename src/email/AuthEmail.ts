import { transporter } from "../config/email";
import dotenv from 'dotenv';

dotenv.config()

interface IEmail {
    email: string,
    name: string,
    token: string
}

export interface IEmailPassword {
    email: string
    name: string
}

export class AuthEmail {
    static sendConfirmationEmail = async (user: IEmail) => {
        const info = await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: 'Blog - Confirma tu cuenta',
            text: 'Blog - Confirma tu cuenta',
            html: `
            <p> Hola ${user.name}, has creado tu cuenta en el Blog, ya casi esta todo listo, solo debes confirmar tu cuenta </p>
            <p>Visita el siguiente enlace:</p>
            <a href="${process.env.FRONTEND_URL}/auth/confirm-account" >Confirmar cuenta</a>
            <p>Ingresa el codigo: <b>${user.token}</b></p>
            <p>Este token expira en 10 minutos</p>
            `
        })
    }
    static sendPasswordResetToken = async (user: IEmail) => {
        const info = await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: 'Blog - Restablece tu constraseña',
            text: 'Blog - Restablece tu constraseña',
            html: `
            <p> Hola ${user.name}, has solicitado reestablecer tu constraseña.</p>
            <p>Visita el siguiente enlace:</p>
            <a href="${process.env.FRONTEND_URL}/auth/new-password" >Reestablecer constraseña</a>
            <p>Ingresa el codigo: <b>${user.token}</b></p>
            <p>Este token expira en 10 minutos</p>
            `
        })
    }

    static sendUserWithOutPassword = async (user: IEmailPassword) => {
        const info = await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: 'Blog - Establece tu constraseña',
            text: 'Blog - Establece tu constraseña',
            html: `
            <h1>Debes cerrar sesion para realizar estos pasos</h1>
            <p> Hola ${user.name}, has solicitado establecer tu constraseña.</p>
            <p>Visita el siguiente enlace:</p>
            <a href="${process.env.FRONTEND_URL}/auth/forgot-password" >Establecer constraseña</a>
            `
        })
    }
}