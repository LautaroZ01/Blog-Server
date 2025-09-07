import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { body, param } from "express-validator";
import { ChatController } from "../controllers/ChatController";
import { handleInputErrors } from "../middleware/validation";
import { conversacionExists } from "../middleware/chat";

const router = Router()

router.post('/conversation',
    body('participants')
        .notEmpty().withMessage('Los participantes son obligatorios')
        .isArray({ min: 2 }).withMessage('Debe haber al menos 2 participantes'),
    handleInputErrors,
    authenticate,
    ChatController.createConversation
)

router.get('/conversation',
    authenticate,
    ChatController.getConversationsByUser
)

router.param('conversationId' ,authenticate)
router.param('conversationId' ,conversacionExists)

router.post('/messages/:conversationId',
    param('conversationId')
        .isMongoId().withMessage('Se requiere la conversacion para enviar un mensaje'),
    body('text')
        .notEmpty().withMessage('El contenido del mensaje es obligatorio')
        .isString().withMessage('El contenido es una cadena de caracteres'),
    handleInputErrors,
    ChatController.sendMessage
)

router.get('/messages/:conversationId',
    param('conversationId')
        .isMongoId().withMessage('Se requiere la conversacion para obtener los mensajes'),
    handleInputErrors,
    ChatController.getMessages
)

router.get('/users-without-conversation', authenticate, ChatController.getUsersWithoutConversation);

export default router