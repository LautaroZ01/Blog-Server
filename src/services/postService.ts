import { Types } from "mongoose";
import Category, { ICategory } from "../models/Category";
import { IPost } from "../models/Post";
import Tag from "../models/Tag";

export async function handleCategoryChange(post: IPost, newCategory: ICategory) {
    if (post.category !== newCategory.id.toString()) {
        const oldCategory = await Category.findById(post.category);
        if (oldCategory) {
            oldCategory.posts = oldCategory.posts.filter(
                postId => postId.toString() !== post.id.toString()
            );
            await oldCategory.save();
        }

        const newCategoryPost = await Category.findById(newCategory.id);
        if (newCategoryPost) {
            newCategoryPost.posts.push(post.id);
            await newCategoryPost.save();
        }

        return newCategoryPost.id;
    }
    return post.category;
}

export async function handleTagChange(post: IPost, newTags: string[]) {
    const removedTags = post.tags.filter(
        (tagId: Types.ObjectId) => !newTags.includes(tagId.toString())
    );
    for (const tagId of removedTags) {
        const tag = await Tag.findById(tagId);
        if (tag) {
            tag.posts = tag.posts.filter(
                postId => postId.toString() !== post.id.toString()
            );
            await tag.save();
        }
    }

    const addedTags = newTags.filter(
        tagId => !post.tags.some((t: Types.ObjectId) => t.toString() === tagId)
    );

    for (const tagId of addedTags) {
        const tag = await Tag.findById(tagId);
        if (tag && !tag.posts.includes(post.id)) {
            tag.posts.push(post.id);
            await tag.save();
        }
    }
}