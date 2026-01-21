import cloudinary from '../config/cloudinary';
import { config } from '../config/env';
import { Readable } from 'stream';

interface UploadResult {
  url: string;
  publicId: string;
}

/**
 * Upload a single image to Cloudinary
 */
export const uploadImage = async (
  fileBuffer: Buffer,
  folder?: string
): Promise<UploadResult> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder || config.cloudinary.folder,
        resource_type: 'image',
        transformation: [
          { quality: 'auto', fetch_format: 'auto' },
        ],
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else if (result) {
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
          });
        }
      }
    );

    const readableStream = new Readable();
    readableStream.push(fileBuffer);
    readableStream.push(null);
    readableStream.pipe(uploadStream);
  });
};

/**
 * Upload multiple images to Cloudinary
 */
export const uploadMultipleImages = async (
  files: Express.Multer.File[],
  folder?: string
): Promise<UploadResult[]> => {
  const uploadPromises = files.map((file) =>
    uploadImage(file.buffer, folder)
  );
  return Promise.all(uploadPromises);
};

/**
 * Delete an image from Cloudinary
 */
export const deleteImage = async (publicId: string): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
    throw new Error('Failed to delete image');
  }
};

/**
 * Delete multiple images from Cloudinary
 */
export const deleteMultipleImages = async (
  publicIds: string[]
): Promise<void> => {
  try {
    await cloudinary.api.delete_resources(publicIds);
  } catch (error) {
    console.error('Error deleting images from Cloudinary:', error);
    throw new Error('Failed to delete images');
  }
};