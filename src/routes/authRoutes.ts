import { Router } from "express";
import { AuthController } from "../controllers/AuthController";
import { body, param } from "express-validator";
import { handleInputErrors } from "../middleware/validation";
import { authenticate } from "../middleware/auth";
import passport from '../config/passport';

const router = Router()

router.post('/create-account',
    body('name').notEmpty().withMessage('El nombre es obligatorio'),
    body('lastname').notEmpty().withMessage('El apellido es obligatorio'),
    body('birthdate').notEmpty().withMessage('La fecha de nacimiento es obligatoria'),
    body('country').notEmpty().withMessage('El pais es obligatorio'),
    body('email').isEmail().withMessage('Email no valido'),
    body('password').isLength({ min: 8 }).withMessage('El password es muy corto, minimo 8 caracteres'),
    body('password_confirmation').custom((value, { req }) => {
        if (value !== req.body.password) {
            throw new Error('Las constraseñas no coinciden')
        }
        return true
    }),
    handleInputErrors,
    AuthController.createAccount
)

router.post('/confirm-account',
    body('token').notEmpty().withMessage('El Token es obligatorio'),
    handleInputErrors,
    AuthController.confirmAccount
)

router.post('/request-code',
    body('email').isEmail().withMessage('E-mail no valido'),
    handleInputErrors,
    AuthController.requestConfirmationCode
)

router.post('/forgot-password',
    body('email').isEmail().withMessage('E-mail no valido'),
    handleInputErrors,
    AuthController.forgotPassword
)

router.post('/validate-token',
    body('token').notEmpty().withMessage('El Token es obligatorio'),
    handleInputErrors,
    AuthController.validateToken
)

router.post('/update-password/:token',
    param('token').isNumeric().withMessage('Token no valido'),
    body('password').isLength({ min: 8 }).withMessage('El password es muy corto, minimo 8 caracteres'),
    body('password_confirmation').custom((value, { req }) => {
        if (value !== req.body.password) {
            throw new Error('Las constraseñas no coinciden')
        }
        return true
    }),
    handleInputErrors,
    AuthController.updatePasswordWithToken
)

router.post('/update-password',
    authenticate,
    body('current_password').notEmpty().withMessage('La contraseña actual es obligaroria'),
    body('password').isLength({ min: 8 }).withMessage('El password es muy corto, minimo 8 caracteres'),
    body('password_confirmation').custom((value, { req }) => {
        if (value !== req.body.password) {
            throw new Error('Las constraseñas no coinciden')
        }
        return true
    }),
    handleInputErrors,
    AuthController.updateCurrentUserPassword
)

router.post('/login',
    body('email').isEmail().withMessage('E-mail no valido'),
    body('password').notEmpty().withMessage('El password es obligatorio'),
    handleInputErrors,
    AuthController.login
)

router.get('/logout', AuthController.logout)

router.get('/profile', authenticate, AuthController.profile)

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback', passport.authenticate('google', { failureRedirect: `${process.env.FRONTEND_URL}/auth/login` }), AuthController.sessionCallBack);

router.get('/facebook', passport.authenticate('facebook', { scope: ['public_profile', 'email'] }))

router.get('/facebook/callback', passport.authenticate('facebook', { failureRedirect: `${process.env.FRONTEND_URL}/auth/login` }), AuthController.sessionCallBack);

router.get('/user',
    authenticate,
    AuthController.user
)

router.put('/profile',
    body('email').isEmail().withMessage('E-mail no valido'),
    body('name').notEmpty().withMessage('El nombre es obligatorio'),
    body('lastname').notEmpty().withMessage('El apellido es obligatorio'),
    body('birthdate').notEmpty().withMessage('La fecha de nacimiento es obligatoria'),
    body('country').notEmpty().withMessage('El pais es obligatorio'),
    handleInputErrors,
    authenticate,
    AuthController.updateProfile
)

router.patch('/photo', authenticate, AuthController.updateProfilePhoto)

router.post('/check-password',
    authenticate,
    body('password').notEmpty().withMessage('La contraseña actual es obligaroria'),
    handleInputErrors,
    AuthController.checkPassword
)

router.post('/email',
    body('email').notEmpty().withMessage('El correo es obligatorio'),
    body('name').notEmpty().withMessage('El nombre es obligatorio'),
    body('subject').notEmpty().withMessage('El asunto es obligatorio'),
    body('message').notEmpty().withMessage('El mensaje es obligatorio'),
    handleInputErrors,
    AuthController.sendEmail
)

export default router