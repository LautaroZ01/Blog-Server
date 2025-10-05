import { Request, Response } from 'express';
import { generatePostPdf } from '../services/pdfService';
import { UserEmail } from '../email/UserEmail';

export class PdfController {
    static sendPostAsPdf = async (req: Request, res: Response) => {
        try {
            const { postId } = req.params
            const user = {
                email: req.user.email,
                name: req.user.name
            }

            const { buffer, filename, title } = await generatePostPdf(postId);
            await UserEmail.sendPostPDF(user, title, buffer, filename);

            res.send('El articulo fue enviado, revisa tu correo')
        } catch (error: any) {
            console.error(error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

