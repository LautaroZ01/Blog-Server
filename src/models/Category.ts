import mongoose, { Document, Schema, Types } from "mongoose";
import { slugPreSave } from "../utils/slug";

export interface ICategory extends Document {
    name: string
    slug: string
    description: string
    posts: Types.ObjectId[]
}

const CategorySchema: Schema = new Schema({
    name: {
        type: String,
        require: true,
        unique: true,
    },
    // Se debe generar a partir del nombre
    slug: {
        type: String,
        require: true,
        unique: true,
    },
    description: {
        type: String,
    },
    posts: [{
        type: Types.ObjectId,
        ref: 'Post'
    }]
}, { timestamps: true})

slugPreSave(CategorySchema);

const Category = mongoose.model<ICategory>('Category', CategorySchema)
export default Category