import mongoose, { Document, Schema, Types } from "mongoose";
import Post from "./Post";
import User from "./User";

const commentStatus = {
    APPROVED: 'approved',
    DISABLED: 'disabled',
    SPAM: 'spam',
} as const

export type CommentStatus = typeof commentStatus[keyof typeof commentStatus]

export interface IComment extends Document {
    content: string,
    post: Types.ObjectId
    author: Types.ObjectId
    status: CommentStatus
    reports: number
    parentComment?: Types.ObjectId
    replies: Types.ObjectId[]
}

const CommentSchema: Schema = new Schema({
    content: {
        type: String,
        require: true,
    },
    post: {
        type: Types.ObjectId,
        ref: 'Post',
        require: true,
    },
    parentComment: {
        type: Types.ObjectId,
        ref: 'Comment',
        default: null
    },
    replies: [{
        type: Types.ObjectId,
        ref: 'Comment',
        default: []
    }],
    author: {
        type: Types.ObjectId,
        ref: 'User',
        require: true,
    },
    status: {
        type: String,
        enum: Object.values(commentStatus),
        default: commentStatus.APPROVED,
    },
    reports: {
        type: Number,
        default: 0,
    }
}, { timestamps: true })

CommentSchema.pre('deleteOne', { document: true, query: false }, async function () {
    const commentId = this._id
    await Post.updateMany(
        { comments: commentId },
        { $pull: { comments: commentId } }
    );
    await User.updateMany(
        { comments: commentId },
        { $pull: { comments: commentId } }
    );
})

CommentSchema.pre('deleteOne', { document: true, query: false }, async function () {
    const commentId = this._id;
    const replies = await Comment.find({ parentComment: commentId });

    for (const reply of replies) {
        await reply.deleteOne();
    }

    await Comment.deleteMany({ parentComment: commentId });
});


const Comment = mongoose.model<IComment>('Comment', CommentSchema)
export default Comment
export { commentStatus }