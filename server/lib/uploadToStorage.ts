import dotenv from 'dotenv';
dotenv.config();

import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

interface UploadParams {
  buffer: Buffer;
  filename: string;
}

export async function uploadToStorage({ buffer, filename }: UploadParams): Promise<{ directLink: string }> {
  try {
    const uploadResult = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: 'bills',
          public_id: filename.replace(/\.[^/.]+$/, ''), // ไม่ต้องมี .png/.jpg
          resource_type: 'image',
          overwrite: true,
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      ).end(buffer);
    });
    const directLink = uploadResult.secure_url;
    console.log('Uploaded to Cloudinary:', directLink);
    return { directLink };
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw error;
  }
} 