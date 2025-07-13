var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import dotenv from 'dotenv';
dotenv.config();
import { v2 as cloudinary } from 'cloudinary';
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
export function uploadToStorage(_a) {
    return __awaiter(this, arguments, void 0, function* ({ buffer, filename }) {
        try {
            const uploadResult = yield new Promise((resolve, reject) => {
                cloudinary.uploader.upload_stream({
                    folder: 'bills',
                    public_id: filename.replace(/\.[^/.]+$/, ''), // ไม่ต้องมี .png/.jpg
                    resource_type: 'image',
                    overwrite: true,
                }, (error, result) => {
                    if (error)
                        return reject(error);
                    resolve(result);
                }).end(buffer);
            });
            const directLink = uploadResult.secure_url;
            return { directLink };
        }
        catch (error) {
            console.error('Error uploading to Cloudinary:', error);
            throw error;
        }
    });
}
