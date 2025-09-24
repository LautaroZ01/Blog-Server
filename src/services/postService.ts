import { Types } from "mongoose";
import Category, { ICategory } from "../models/Category";
import { IPost } from "../models/Post";
import Tag from "../models/Tag";
import PostSection, { IPostSection } from "../models/PostSection";
import { deletePhoto } from "../utils/cloudinary";

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

export async function updateSections(postId: Types.ObjectId, newSections: any[]) {
    // Traemos todas las secciones actuales del post
    const existingSections = await PostSection.find({ post: postId })

    const existingMap = new Map(existingSections.map(s => [s._id.toString(), s]))
    const finalSectionIds: Types.ObjectId[] = []

    // 1. Recorrer las secciones nuevas (update o create)
    for (const newSection of newSections) {
        if (newSection._id && existingMap.has(newSection._id)) {
            // ---- UPDATE ----
            const section = existingMap.get(newSection._id)!

            // ✅ Verificar que el título no esté duplicado en otro section del mismo post
            const duplicate = await PostSection.findOne({
                post: postId,
                title: newSection.title,
                _id: { $ne: newSection._id } // excluye la misma sección
            })
            if (duplicate) {
                throw new Error(`Ya existe una sección con el título "${newSection.title}" en este post`)
            }

            section.title = newSection.title
            section.content = newSection.content

            if (section.thumbnail !== newSection.thumbnail) {
                if (section.thumbnail) {
                    await deletePhoto(section.thumbnail, "auto")
                }
                section.thumbnail = newSection.thumbnail
            }

            await section.save()
            finalSectionIds.push(section._id)

        } else {
            // ---- CREATE ----
            // ✅ Verificar que no exista otra sección con el mismo título en este post
            const duplicate = await PostSection.findOne({
                post: postId,
                title: newSection.title
            })
            if (duplicate) {
                throw new Error(`Ya existe una sección con el título "${newSection.title}" en este post`)
            }

            const createdSection = new PostSection({
                title: newSection.title,
                content: newSection.content,
                thumbnail: newSection.thumbnail,
                post: postId
            })
            await createdSection.save()
            finalSectionIds.push(createdSection._id)
        }
    }

    // 2. Eliminar las secciones que no están en la lista nueva
    for (const oldSection of existingSections) {
        if (!finalSectionIds.includes(oldSection._id)) {
            if (oldSection.thumbnail) {
                await deletePhoto(oldSection.thumbnail, "auto")
            }
            await PostSection.deleteOne({ _id: oldSection._id })
        }
    }

    return finalSectionIds
}
