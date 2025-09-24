import { Router } from "express";
import { PostController } from "../controllers/PostController";
import { authenticate, writer } from "../middleware/auth";
import { body, param } from "express-validator";
import { postStatusValues } from "../models/Post";
import { handleInputErrors } from "../middleware/validation";
import { postExists, postMiddleware } from "../middleware/post";

const router = Router()

router.get('/', PostController.getPosts)

router.post('/',
    authenticate,
    writer,
    body('title').notEmpty().withMessage('El título es obligatorio'),
    body('content').notEmpty().withMessage('El contenido es obligatorio'),
    body('category').notEmpty().withMessage('La categoría es obligatoria').isMongoId().withMessage('La categoría no es válida'),
    body('tags').notEmpty().withMessage('Los tags son obligatorios'),
    body('status').notEmpty().withMessage('El estado es obligatorio').isIn(postStatusValues).withMessage('El estado no es válido'),
    body('sections').optional().isArray().withMessage('Las secciones deben ser una lista'),
    handleInputErrors,
    postMiddleware,
    PostController.createPost
)

router.param('postId', postExists)

router.put('/:postId',
    authenticate,
    writer,
    param('postId').isMongoId().withMessage('El id no es válido'),
    body('title').notEmpty().withMessage('El título es obligatorio'),
    body('content').notEmpty().withMessage('El contenido es obligatorio'),
    body('category').notEmpty().withMessage('La categoría es obligatoria').isMongoId().withMessage('La categoría no es válida'),
    body('tags').notEmpty().withMessage('Los tags son obligatorios'),
    body('status').notEmpty().withMessage('El estado es obligatorio').isIn(postStatusValues).withMessage('El estado no es válido'),
    body('sections').optional().isArray().withMessage('Las secciones deben ser una lista'),
    handleInputErrors,
    postMiddleware,
    PostController.updatePost
)

router.patch('/images/:postId',
    authenticate,
    writer,
    param('postId').isMongoId().withMessage('El id no es válido'),
    body('images').notEmpty().withMessage('Las imagenes son obligatorias'),
    handleInputErrors,
    PostController.updatePostImages
)

router.delete('/image/:postId',
    authenticate,
    writer,
    param('postId').isMongoId().withMessage('El id no es válido'),
    body('imageUrl').notEmpty().withMessage('La URL de la imagen es obligatoria'),
    handleInputErrors,
    PostController.deletePostImage
)

router.delete('/:postId',
    authenticate,
    writer,
    param('postId').isMongoId().withMessage('El id no es válido'),
    handleInputErrors,
    PostController.deletePost
)

router.get('/:slug',
    param('slug').notEmpty().withMessage('El slug es obligatorio'),
    handleInputErrors,
    PostController.getPostBySlug
)

router.patch('/:postId/like',
    authenticate,
    param('postId').isMongoId().withMessage('El id no es válido'),
    handleInputErrors,
    PostController.likePost
)

router.patch('/:postId/dislike',
    authenticate,
    param('postId').isMongoId().withMessage('El id no es válido'),
    handleInputErrors,
    PostController.dislikePost
)

export default router