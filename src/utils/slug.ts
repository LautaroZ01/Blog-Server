// utils/slugMiddleware.ts
import { Document, Schema } from 'mongoose';
import slugify from 'slugify';

interface ISlugDocument extends Document {
    name: string;
    slug?: string;
    isModified(field: string): boolean;
}

interface ISlugPostDocument extends Document {
    title: string;
    slug?: string;
    isModified(field: string): boolean;
}

export function slugPreSave(schema: Schema) {
    schema.pre('save', function (this: ISlugDocument, next) {
        if (!this.isModified('name')) return next();
        this.slug = slugify(this.name, { lower: true, strict: true });
        next();
    });
}

export function slugPostPreSave(schema: Schema) {
    schema.pre('save', function (this: ISlugPostDocument, next) {
        if (!this.isModified('title')) return next();
        this.slug = slugify(this.title, { lower: true, strict: true });
        next();
    });
}