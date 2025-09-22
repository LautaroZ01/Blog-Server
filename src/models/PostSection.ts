import mongoose, { Schema, Types } from "mongoose"

export interface IPostSection {
    title: string
    content: string
    thumbnail: string
    post: Types.ObjectId
}

const PostSectionSchema: Schema = new Schema({
    title: {
        type: String,
        requier: true,
        unique: true
    },
    content: {
        type: String,
        requier: true
    },
    thumbnail: {
        type: String,
        default: ''
    },
    post: {
        type: Types.ObjectId,
        ref: 'Post',
        requier: true
    }
}, { timestamps: true })

const PostSection = mongoose.model<IPostSection>('PostSection', PostSectionSchema)

export default PostSection
