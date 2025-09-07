import cloudinary from "../config/cloudinary";

type photoType = 'face' | 'auto'

export const deletePhoto = async (photo: string, type: photoType) => {
    try {
        if (!photo || !photo.includes('res.cloudinary.com')) return;

        const urlParts = photo.split('/');
        const publicIdWithExtension = urlParts[urlParts.length - 1];
        const publicId = publicIdWithExtension.split('.')[0];

        const path = type === 'face' ? 'user_avatars' : ''
        if(path) {
            await cloudinary.uploader.destroy(path + '/' + publicId);
        }else{
            await cloudinary.uploader.destroy(publicId);
        }

    } catch (error) {
        throw new Error('No se pudo eliminar la imagen anterior');
    }
}

export const uploadImage = async (photo: string, w: number, h: number, type: photoType) => {
    try {
        const uploadResponse = await cloudinary.uploader.upload(`data:image/jpeg;base64,${photo}`,
            {
                folder: type === 'face' ? 'user_avatars' : 'article_images',
                transformation: [
                    { width: w, height: h, crop: 'fill', gravity: type }
                ]
            }
        );

        return uploadResponse;
    } catch (error) {
        throw new Error('Error al subir la imagen a Cloudinary');
    }
}