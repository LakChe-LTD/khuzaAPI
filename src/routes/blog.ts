import express from 'express';
// import {
//   createBlog,
//   getBlogs,
//   getBlog,
//   updateBlog,
//   deleteBlog,
//   getBlogsByCategory,
//   getRecentBlogs,
// } from '../controllers/blogController';
import { authenticate } from '../middleware/auth.js';
import { uploadSingle } from '../middleware/upload.js';
import { createBlog, deleteBlog, getBlog, getBlogs, getBlogsByCategory, getRecentBlogs, updateBlog } from '../controllers/blogController.js';


const router = express.Router();

// Public routes
router.get('/', getBlogs);
router.get('/recent/:limit?', getRecentBlogs); // Get recent blogs
router.get('/category/:category', getBlogsByCategory); // Get blogs by category
router.get('/:id', getBlog); // Must be last to avoid conflicts

// Protected routes (Admin only)
router.post('/', authenticate, uploadSingle, createBlog);
router.put('/:id', authenticate, uploadSingle, updateBlog);
router.delete('/:id', authenticate, deleteBlog);

export default router;