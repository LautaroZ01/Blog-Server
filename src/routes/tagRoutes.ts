import { Router } from "express";
import { TagController } from "../controllers/PostController";
import { body, param } from "express-validator";
import { handleInputErrors } from "../middleware/validation";
import { admin, authenticate } from "../middleware/auth";

const router = Router()

router.get('/', TagController.getTags)
router.get('/:slug',
    param('slug').isString().withMessage('El slug no es valido'),
    handleInputErrors,
    TagController.getTagBySlug)
router.post('/',
    authenticate,
    admin,
    body('name').notEmpty().withMessage('El nombre es obligatorio'),
    handleInputErrors,
    TagController.createTag
)

router.put('/:id',
    authenticate,
    admin,
    param('id').isMongoId().withMessage('El id no es valido'),
    body('name').notEmpty().withMessage('El nombre es obligatorio'),
    handleInputErrors,
    TagController.updateTag
)

router.delete('/:id',
    authenticate,
    admin,
    param('id').isMongoId().withMessage('El id no es valido'),
    handleInputErrors,
    TagController.deleteTag
)

export default router