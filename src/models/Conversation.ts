import mongoose, { Schema, Document, PopulatedDoc, Types } from "mongoose";
import { IUser } from "./User";
import Message, { IMessage } from "./Message";

export interface IConversation extends Document {
    participants: PopulatedDoc<IUser & Document>[]
    messages: PopulatedDoc<IMessage & Document>[]
    isActive: boolean
}

const ConversationSchema: Schema = new Schema({
    participants: [
        {
            type: Types.ObjectId,
            ref: 'User'
        }
    ],
    messages: [
        {
            type: Types.ObjectId,
            ref: 'Message'
        }
    ],
    isActive: {
        type: Boolean,
        default: true,
    }
}, { timestamps: true })

ConversationSchema.pre('deleteOne', { document: true }, async function () {
    const conversationId = this._id

    if (!conversationId) return

    await Message.deleteMany({ conversationId })
})

const Conversation = mongoose.model<IConversation>('Conversation', ConversationSchema)
export default Conversation