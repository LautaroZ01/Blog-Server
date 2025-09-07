import mongoose, { Document, Schema, Types } from "mongoose";
import { slugPreSave } from "../utils/slug";
import Post from "./Post";

export interface ITag extends Document {
    name: string
    slug: string
    posts: Types.ObjectId[]
}

const TagSchema: Schema = new Schema({
    name: {
        type: String,
        require: true,
        unique: true,
    },
    slug: {
        type: String,
        require: true,
        unique: true,
    },
    posts: [{
        type: Types.ObjectId,
        ref: 'Post'
    }]
}, { timestamps: true })

slugPreSave(TagSchema);

TagSchema.pre('deleteOne', { document: true, query: false }, async function () {
    const tagId = this._id;
    await Post.updateMany(
        { tags: tagId },
        { $pull: { tags: tagId } }
    );
});

const Tag = mongoose.model<ITag>('Tag', TagSchema)
export default Tag