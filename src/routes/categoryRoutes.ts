import { Router } from "express";
import { CategoryController } from "../controllers/PostController";
import { admin, authenticate } from "../middleware/auth";
import { body, param } from "express-validator";
import { handleInputErrors } from "../middleware/validation";

const router = Router()

router.get('/', CategoryController.getCategories)
router.get('/:slug',
    param('slug').isString().withMessage('El slug no es valido'),
    handleInputErrors,
    CategoryController.getCategoryBySlug)
router.post('/',
    authenticate,
    admin,
    body('name').notEmpty().withMessage('El nombre es obligatorio'),
    body('description')
        .optional()
        .isString()
        .withMessage('La descripcion debe ser una cadena de caracteres'),
    handleInputErrors,
    CategoryController.createCategory
)

router.put('/:id',
    authenticate,
    admin,
    param('id').isMongoId().withMessage('El id no es valido'),
    body('name').notEmpty().withMessage('El nombre es obligatorio'),
    body('description')
        .optional()
        .isString()
        .withMessage('La descripcion debe ser una cadena de caracteres'),
    handleInputErrors,
    CategoryController.updateCategory
)

router.delete('/:id',
    authenticate,
    admin,
    param('id').isMongoId().withMessage('El id no es valido'),
    handleInputErrors,
    CategoryController.deleteCategory
)

export default router