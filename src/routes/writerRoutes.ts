import { Router } from "express";
import { authenticate, writer } from "../middleware/auth";
import { WriterController } from "../controllers/WriterController";
import { handleInputErrors } from "../middleware/validation";
import { body, param } from "express-validator";
import { contact, social } from "../middleware/writer";

const router = Router()

router.use(authenticate, writer)

router.get('/profile', WriterController.profile)
router.put('/profile',
    body('bio').notEmpty().withMessage('La bio es obligatoria'),
    body('nickname').notEmpty().withMessage('El apodo es obligatorio'),
    handleInputErrors,
    WriterController.updateProfile
)

router.get('/social', WriterController.getSocialAndContact)

router.post('/social-network',
    body('type').notEmpty().withMessage('El tipo es obligatorio'),
    body('name').notEmpty().withMessage('El nombre es obligatorio'),
    body('url').notEmpty().withMessage('El enlace es obligatorio'),
    handleInputErrors,
    social,
    WriterController.createSocialNetwork
)

router.put('/social-network/:socialId',
    param('socialId').isMongoId().withMessage('ID no valido'),
    body('type').notEmpty().withMessage('El tipo es obligatorio'),
    body('name').notEmpty().withMessage('El nombre es obligatorio'),
    body('url').notEmpty().withMessage('El enlace es obligatorio'),
    handleInputErrors,
    social,
    WriterController.editSocialNetwork
)

router.delete('/social-network/:socialId',
    param('socialId').isMongoId().withMessage('ID no valido'),
    handleInputErrors,
    WriterController.deleteSocialNetWork
)

router.post('/contact',
    body('type').notEmpty().withMessage('El tipo es obligatorio'),
    body('name').notEmpty().withMessage('El nombre es obligatorio'),
    handleInputErrors,
    contact,
    WriterController.createContact
)

router.put('/contact/:contactId',
    param('contactId').isMongoId().withMessage('ID no valido'),
    body('type').notEmpty().withMessage('El tipo es obligatorio'),
    body('name').notEmpty().withMessage('El nombre es obligatorio'),
    handleInputErrors,
    contact,
    WriterController.editContact
)

router.delete('/contact/:contactId',
    param('contactId').isMongoId().withMessage('ID no valido'),
    handleInputErrors,
    WriterController.deleteContact
)

export default router