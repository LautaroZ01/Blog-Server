import { Router } from "express";
import { DashboardController } from "../controllers/DashboardController";
import { admin, authenticate, writer } from "../middleware/auth";
import { body, param } from "express-validator";
import { handleInputErrors } from "../middleware/validation";
import { userExists } from "../middleware/user";
import { PdfController } from "../controllers/PdfController";

const router = Router()

// Users
router.get('/user',
    authenticate,
    admin,
    DashboardController.getAllUsers
)

router.get('/user/:userId',
    authenticate,
    admin,
    param('userId')
        .isMongoId().withMessage('El id del usuario no es valido'),
    handleInputErrors,
    DashboardController.getUserById
)

router.patch('/user/:userId/status',
    authenticate,
    admin,
    param('userId')
        .isMongoId().withMessage('El id del usuario no es valido'),
    handleInputErrors,
    DashboardController.changeUserStatus
)

router.patch("/user/:userId/role",
    authenticate,
    admin,
    userExists,
    param('userId')
        .isMongoId().withMessage('El id del usuario no es valido'),
    body('role')
        .notEmpty().withMessage('El rol es obligatorio')
        .isIn(['user', 'writer', 'admin'])
        .withMessage('El rol no es valido'),
    handleInputErrors,
    DashboardController.changeRoleUser
)

router.delete('/user/:userId',
    authenticate,
    admin,
    userExists,
    param('userId')
        .isMongoId().withMessage('El id del usuario no es valido'),
    handleInputErrors,
    DashboardController.deleteUser
)

router.get('/writer/:writerId?',
    param('writerId')
        .optional()
        .isMongoId().withMessage('El id del escritor no es valido'),
    handleInputErrors,
    DashboardController.getWriter
)

// Categories
router.get('/category',
    authenticate,
    admin,
    DashboardController.getCategories
)
router.get('/category/:categoryId',
    authenticate,
    admin,
    param('categoryId').isMongoId().withMessage('El id de la categoria no es valido'),
    handleInputErrors,
    DashboardController.getCategoryById
)

// Etiquetas
router.get('/tag', authenticate, admin, DashboardController.getTags)
router.get('/tag/:tagId',
    authenticate,
    admin,
    param('tagId').isMongoId().withMessage('El id del tag no es valido'),
    handleInputErrors,
    DashboardController.getTagById
)

// Articulos
router.get('/post', authenticate, writer, DashboardController.getPosts)
router.get('/post/stats',
    authenticate,
    writer,
    PdfController.postsStats
)
router.get('/post/:postId',
    authenticate,
    writer,
    param('postId').isMongoId().withMessage('El id del articulo no es valido'),
    handleInputErrors,
    DashboardController.getPostById
)

// Comentarios
router.get('/comment/:postId',
    authenticate,
    writer,
    param('postId').isMongoId().withMessage('El id del articulo no es valido'),
    handleInputErrors,
    DashboardController.getCommentsByPostId
)

export default router