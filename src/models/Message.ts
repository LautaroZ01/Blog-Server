import mongoose, { Schema, Document, PopulatedDoc, Types } from "mongoose";
import { IConversation } from "./Conversation";
import { IUser } from "./User";

export interface IMessage extends Document {
    conversationId: PopulatedDoc<IConversation & Document>
    sender: PopulatedDoc<IUser & Document>
    text: string
    isRead: boolean
}

export interface PopulatedMessage extends Omit<IMessage, 'sender'> {
    sender: IUser;
}

const MessageSchema: Schema = new Schema({
    conversationId: {
        type: Types.ObjectId,
        ref: 'Conversation'
    },
    sender: {
        type: Types.ObjectId,
        ref: 'User'
    },
    text: {
        type: String,
        require: true
    },
    isRead: {
        type: Boolean,
        default: false
    }
}, { timestamps: true })

const Message = mongoose.model<IMessage>('Message', MessageSchema)
export default Message