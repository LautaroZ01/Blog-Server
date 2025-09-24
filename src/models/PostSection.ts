import mongoose, { Schema, trusted, Types } from "mongoose"

export interface IPostSection {
    title: string
    content: string
    thumbnail: string
    post: Types.ObjectId
}

const PostSectionSchema: Schema = new Schema({
    title: {
        type: String,
        require: true
    },
    content: {
        type: String,
        require: true
    },
    thumbnail: {
        type: String,
        default: ''
    },
    post: {
        type: Types.ObjectId,
        ref: 'Post',
        require: true
    }
}, { timestamps: true })

PostSectionSchema.index({ title: 1, post: 1 }, { unique: true })

const PostSection = mongoose.model<IPostSection>('PostSection', PostSectionSchema)

export default PostSection
