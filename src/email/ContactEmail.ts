import { transporter } from "../config/email"

interface IEmail {
    email: string
    name: string
    subject: string
    message: string
}

export class ContactEmail {

    static sendContactEmail = async (email: IEmail) => {
        const info = await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER,
            subject: email.subject,
            text: email.message,
            html: `
            Recibiste un correo de ${email.name} (${email.email})
            <p>${email.message}</p>
            `
        })

    }

}