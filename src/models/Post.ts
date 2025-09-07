import mongoose, { Schema } from "mongoose";
import { Document, PopulatedDoc, Types } from "mongoose";
import slugify from "slugify";
import { slugPostPreSave } from "../utils/slug";
import Comment from "./Comment";

const postStatus = {
    DRAFT: 'draft',
    PUBLISHED: 'published',
    ARCHIVED: 'archived',
} as const

export const postStatusValues = Object.values(postStatus)

export type PostStatus = typeof postStatus[keyof typeof postStatus]

export interface IPost extends Document {
    title: string
    content: string
    slug: string
    author: Types.ObjectId
    images: string[]
    viewCount: number
    status: PostStatus
    comments: Types.ObjectId[]
    tags: Types.ObjectId[]
    likes: Types.ObjectId[]
    category: Types.ObjectId
}

const PostSchema: Schema = new Schema({
    title: {
        type: String,
        require: true,
        unique: true
    },
    content: {
        type: String,
        require: true
    },
    slug: {
        type: String,
        require: true,
        unique: true
    },
    author: {
        type: Types.ObjectId,
        ref: 'User',
        require: true
    },
    images: [{
        type: String,
    }],
    viewCount: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: Object.values(postStatus),
        default: postStatus.DRAFT
    },
    comments: [{
        type: Types.ObjectId,
        ref: 'Comment'
    }],
    tags: [{
        type: Types.ObjectId,
        ref: 'Tag'
    }],
    likes: [{
        type: Types.ObjectId,
        ref: 'User'
    }],
    category: {
        type: Types.ObjectId,
        ref: 'Category',
        require: true
    }
}, { timestamps: true })

slugPostPreSave(PostSchema)

PostSchema.pre('deleteOne', { document: true, query: false }, async function () {
    const postId = this._id;
    await Comment.deleteMany({ post: postId });
});

const Post = mongoose.model<IPost>('Post', PostSchema)
export default Post