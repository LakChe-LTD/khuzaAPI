"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRecentBlogs = exports.getBlogsByCategory = exports.deleteBlog = exports.updateBlog = exports.getBlog = exports.getBlogs = exports.createBlog = void 0;
const Blog_js_1 = __importDefault(require("../models/Blog.js"));
const cloudinary_js_1 = require("../utils/cloudinary.js");
const responseFormatter_js_1 = require("../utils/responseFormatter.js");
const createBlog = async (req, res) => {
    try {
        const { title, content, highlightedQuote, category, tags, publishDate, status } = req.body;
        const file = req.file;
        if (!file) {
            res.status(400).json({
                success: false,
                message: 'Featured image is required',
            });
            return;
        }
        const imageResult = await (0, cloudinary_js_1.uploadImage)(file.buffer, 'khuza/uploads/blogs');
        const blog = await Blog_js_1.default.create({
            title,
            content,
            highlightedQuote: highlightedQuote || undefined,
            featuredImage: {
                url: imageResult.url,
                publicId: imageResult.publicId,
            },
            author: req.admin?._id,
            category: category || undefined,
            tags: tags ? (typeof tags === 'string' ? JSON.parse(tags) : tags) : [],
            publishDate: publishDate || undefined,
            status: status || 'draft',
        });
        const populatedBlog = await Blog_js_1.default.findById(blog._id).populate('author', 'name email');
        res.status(201).json({
            success: true,
            message: 'Blog created successfully',
            data: (0, responseFormatter_js_1.formatBlogForDetail)(populatedBlog),
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to create blog',
        });
    }
};
exports.createBlog = createBlog;
const getBlogs = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const status = req.query.status;
        const category = req.query.category;
        const search = req.query.search;
        const query = {};
        if (status) {
            query.status = status;
        }
        else if (!req.admin) {
            query.status = 'published';
        }
        if (category) {
            query.category = category;
        }
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { content: { $regex: search, $options: 'i' } },
                { highlightedQuote: { $regex: search, $options: 'i' } },
            ];
        }
        const skip = (page - 1) * limit;
        const blogs = await Blog_js_1.default.find(query)
            .populate('author', 'name email')
            .sort({ publishedAt: -1, createdAt: -1 })
            .skip(skip)
            .limit(limit);
        const total = await Blog_js_1.default.countDocuments(query);
        const formattedBlogs = blogs.map(responseFormatter_js_1.formatBlogForList);
        res.status(200).json({
            success: true,
            data: {
                blogs: formattedBlogs,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit),
                    hasNext: page < Math.ceil(total / limit),
                    hasPrev: page > 1,
                },
            },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch blogs',
        });
    }
};
exports.getBlogs = getBlogs;
const getBlog = async (req, res) => {
    try {
        const { id } = req.params;
        const query = id.match(/^[0-9a-fA-F]{24}$/)
            ? { _id: id }
            : { slug: id };
        const blog = await Blog_js_1.default.findOne(query).populate('author', 'name email');
        if (!blog) {
            res.status(404).json({
                success: false,
                message: 'Blog not found',
            });
            return;
        }
        if (blog.status !== 'published' && !req.admin) {
            res.status(404).json({
                success: false,
                message: 'Blog not found',
            });
            return;
        }
        blog.views += 1;
        await blog.save();
        res.status(200).json({
            success: true,
            data: (0, responseFormatter_js_1.formatBlogForDetail)(blog),
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch blog',
        });
    }
};
exports.getBlog = getBlog;
const updateBlog = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, highlightedQuote, category, tags, publishDate, status } = req.body;
        const file = req.file;
        const query = id.match(/^[0-9a-fA-F]{24}$/) ? { _id: id } : { slug: id };
        const blog = await Blog_js_1.default.findOne(query);
        if (!blog) {
            res.status(404).json({ success: false, message: 'Blog not found' });
            return;
        }
        if (title)
            blog.title = title;
        if (content)
            blog.content = content;
        if (highlightedQuote !== undefined)
            blog.highlightedQuote = highlightedQuote;
        if (category !== undefined)
            blog.category = category;
        if (tags) {
            blog.tags = typeof tags === 'string' ? JSON.parse(tags) : tags;
        }
        if (publishDate !== undefined)
            blog.publishDate = publishDate;
        if (status)
            blog.status = status;
        if (file) {
            if (blog.featuredImage?.publicId) {
                await (0, cloudinary_js_1.deleteImage)(blog.featuredImage.publicId);
            }
            const imageResult = await (0, cloudinary_js_1.uploadImage)(file.buffer, 'khuza/uploads/blogs');
            blog.featuredImage = {
                url: imageResult.url,
                publicId: imageResult.publicId,
            };
        }
        await blog.save();
        const updatedBlog = await Blog_js_1.default.findById(blog._id).populate('author', 'name email');
        res.status(200).json({
            success: true,
            message: 'Blog updated successfully',
            data: (0, responseFormatter_js_1.formatBlogForDetail)(updatedBlog),
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Failed to update blog' });
    }
};
exports.updateBlog = updateBlog;
const deleteBlog = async (req, res) => {
    try {
        const { id } = req.params;
        const query = id.match(/^[0-9a-fA-F]{24}$/) ? { _id: id } : { slug: id };
        const blog = await Blog_js_1.default.findOne(query);
        if (!blog) {
            res.status(404).json({ success: false, message: 'Blog not found' });
            return;
        }
        if (blog.featuredImage?.publicId) {
            await (0, cloudinary_js_1.deleteImage)(blog.featuredImage.publicId);
        }
        await blog.deleteOne();
        res.status(200).json({ success: true, message: 'Blog deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to delete blog' });
    }
};
exports.deleteBlog = deleteBlog;
const getBlogsByCategory = async (req, res) => {
    try {
        const { category } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const query = {
            category: { $regex: new RegExp(category, 'i') },
            status: 'published',
        };
        const skip = (page - 1) * limit;
        const blogs = await Blog_js_1.default.find(query)
            .populate('author', 'name email')
            .sort({ publishedAt: -1 })
            .skip(skip)
            .limit(limit);
        const total = await Blog_js_1.default.countDocuments(query);
        const formattedBlogs = blogs.map(responseFormatter_js_1.formatBlogForList);
        res.status(200).json({
            success: true,
            data: {
                category,
                blogs: formattedBlogs,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit),
                },
            },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch blogs by category',
        });
    }
};
exports.getBlogsByCategory = getBlogsByCategory;
const getRecentBlogs = async (req, res) => {
    try {
        const limit = parseInt(req.params.limit) || 5;
        const blogs = await Blog_js_1.default.find({ status: 'published' })
            .populate('author', 'name email')
            .sort({ publishedAt: -1 })
            .limit(limit);
        const formattedBlogs = blogs.map(responseFormatter_js_1.formatBlogForList);
        res.status(200).json({
            success: true,
            data: formattedBlogs,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch recent blogs',
        });
    }
};
exports.getRecentBlogs = getRecentBlogs;
//# sourceMappingURL=blogController.js.map