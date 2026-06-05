import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
export const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'ecommerce-nest', // folder name on the cloudinary
    allowedFormats: ['jpg', 'png', 'jpeg', 'webp'], // allowed formats on the cloudinary
    transformation: [{ width: 1000, height: 1000, crop: 'limit' }], // automatically resize
  } as any,
});
