import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { CommentController } from "../controllers/PostController";
import { body, param } from "express-validator";
import { handleInputErrors } from "../middleware/validation";
import { commentMiddleware, postExists } from "../middleware/post";

const router = Router()

router.get('/:postId', 
    param('postId').isMongoId().withMessage('El id no es valido'),
    handleInputErrors,
    postExists,
    CommentController.getComments
)

router.post('/:postId', authenticate,
    param('postId').isMongoId().withMessage('El id no es valido'),
    body('content').notEmpty().withMessage('El contenido es obligatorio'),
    body('parentComment').optional().isMongoId().withMessage('El comentario padre no es valido'),
    handleInputErrors,
    CommentController.createComment
)


router.put('/:commentId',
    authenticate,
    param('commentId').isMongoId().withMessage('El id no es valido'),
    body('content').notEmpty().withMessage('El contenido es obligatorio'),
    handleInputErrors,
    commentMiddleware,
    CommentController.updateComment
)

router.delete('/:commentId',
    authenticate,
    param('commentId').isMongoId().withMessage('El id no es valido'),
    commentMiddleware,
    CommentController.deleteComment
)

router.patch('/:commentId/report',
    authenticate,
    param('commentId').isMongoId().withMessage('El id no es valido'),
    commentMiddleware,
    handleInputErrors,
    CommentController.reportComment
)

router.patch('/:commentId/status',
    authenticate,
    param('commentId').isMongoId().withMessage('El id no es valido'),
    commentMiddleware,
    handleInputErrors,
    CommentController.changeCommentStatus
)

// Reply Comments

router.post('/:parentCommentId/reply',
    authenticate,
    param('parentCommentId').isMongoId().withMessage('El id no es valido'),
    body('content').notEmpty().withMessage('El contenido es obligatorio'),
    handleInputErrors,
    CommentController.replyComment
)

export default router