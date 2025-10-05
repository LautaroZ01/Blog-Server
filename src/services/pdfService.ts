import fs from 'fs';
import path from 'path';
import Handlebars from 'handlebars';
import puppeteer from 'puppeteer';
import Post from '../models/Post';

interface PopulatedPost {
    id: string;
    title: string;
    content: string;
    slug: string;
    images: string[];
    readTime: number;
    createdAt: Date;
    author: { name: string; email: string } | null;
    category: { name: string } | null;
    sections: { title: string; content: string; thumbnail?: string }[];
}

export async function generatePostPdf(postId: string) {
    // Obtener el post con relaciones
    const post = await Post.findById(postId)
        .populate({
            path: 'author',
            select: 'name email'
        })
        .populate({
            path: 'category',
            select: 'name'
        })
        .populate({
            path: 'sections',
            select: 'title content thumbnail'
        })
        .select('-__v -updatedAt -comments -likes -tags -status -viewCount')
        .lean<PopulatedPost>()

    if (!post) throw new Error('Post no encontrado');

    // Obtener imagen principal
    const headerImage = post.images?.length ? post.images[0] : null;

    // Preparar datos para plantilla
    const templatePath = path.join(__dirname, '../templates/postTemplate.hbs');
    const templateSrc = fs.readFileSync(templatePath, 'utf8');
    const template = Handlebars.compile(templateSrc);

    const authorName = post.author.name || 'Autor desconocide'

    const html = template({
        title: post.title,
        authorName,
        categoryName: post.category?.name || 'Sin categoría',
        date: new Date(post.createdAt).toLocaleDateString('es-AR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }),
        readTime: post.readTime || 1,
        headerImage,
        content: post.content,
        sections: post.sections?.map((s: any) => ({
            title: s.title,
            content: s.content,
            thumbnail: s.thumbnail || null
        })) || []
    });

    // Generar PDF con Puppeteer
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfUint8 = await page.pdf({ format: 'A4', printBackground: true });
    const pdfBuffer = Buffer.from(pdfUint8);
    await browser.close();

    return {
        buffer: pdfBuffer,
        filename: `${post.slug || post.id}.pdf`,
        title: post.title
    };
}
