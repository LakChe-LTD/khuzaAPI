"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteMultipleImages = exports.deleteImage = exports.uploadMultipleImages = exports.uploadImage = void 0;
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
const env_1 = require("../config/env");
const stream_1 = require("stream");
const uploadImage = async (fileBuffer, folder) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary_1.default.uploader.upload_stream({
            folder: folder || env_1.config.cloudinary.folder,
            resource_type: 'image',
            transformation: [
                { quality: 'auto', fetch_format: 'auto' },
            ],
        }, (error, result) => {
            if (error) {
                reject(error);
            }
            else if (result) {
                resolve({
                    url: result.secure_url,
                    publicId: result.public_id,
                });
            }
        });
        const readableStream = new stream_1.Readable();
        readableStream.push(fileBuffer);
        readableStream.push(null);
        readableStream.pipe(uploadStream);
    });
};
exports.uploadImage = uploadImage;
const uploadMultipleImages = async (files, folder) => {
    const uploadPromises = files.map((file) => (0, exports.uploadImage)(file.buffer, folder));
    return Promise.all(uploadPromises);
};
exports.uploadMultipleImages = uploadMultipleImages;
const deleteImage = async (publicId) => {
    try {
        await cloudinary_1.default.uploader.destroy(publicId);
    }
    catch (error) {
        console.error('Error deleting image from Cloudinary:', error);
        throw new Error('Failed to delete image');
    }
};
exports.deleteImage = deleteImage;
const deleteMultipleImages = async (publicIds) => {
    try {
        await cloudinary_1.default.api.delete_resources(publicIds);
    }
    catch (error) {
        console.error('Error deleting images from Cloudinary:', error);
        throw new Error('Failed to delete images');
    }
};
exports.deleteMultipleImages = deleteMultipleImages;
//# sourceMappingURL=cloudinary.js.map