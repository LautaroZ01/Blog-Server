import { transporter } from "../config/email"
import { IEmailPassword } from "./AuthEmail"


export class UserEmail {

    static sendPostPDF = async (user: IEmailPassword, title: string, pdfBuffer: Buffer, filename: string) => {
        const info = await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: `Tu artículo solicitado — ${title}`,
            html: `
              <p>Hola 👋,</p>
              <p>Adjunto encontrarás el artículo que solicitaste: <strong>${title}</strong>.</p>
              <p>Saludos,<br>El equipo de Blog Interactivo</p>
            `,
            attachments: [
                {
                    filename,
                    content: pdfBuffer,
                    contentType: 'application/pdf'
                }
            ]
        })
    }

}
