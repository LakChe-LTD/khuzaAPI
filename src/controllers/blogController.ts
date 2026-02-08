import { Response } from 'express';
import { AuthRequest } from "../middleware/auth.js";
import Blog from "../models/Blog.js";
import { deleteImage, uploadImage } from "../utils/cloudinary.js";
import { formatBlogForDetail, formatBlogForList } from "../utils/responseFormatter.js";

/**
 * @route   POST /api/blogs
 * @desc    Create a new blog post
 * @access  Private
 */
export const createBlog = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
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

    // Upload image to Cloudinary
    const imageResult = await uploadImage(file.buffer, 'khuza/uploads/blogs');

    // Create blog
    const blog = await Blog.create({
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

    const populatedBlog = await Blog.findById(blog._id).populate('author', 'name email');

    res.status(201).json({
      success: true,
      message: 'Blog created successfully',
      data: formatBlogForDetail(populatedBlog!),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create blog',
    });
  }
};

/**
 * @route   GET /api/blogs
 * @desc    Get all blogs with pagination and filters (Frontend friendly format)
 * @access  Public
 */
export const getBlogs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;
    const category = req.query.category as string;
    const search = req.query.search as string;

    const query: any = {};

    // Filter by status (default to published for public view)
    if (status) {
      query.status = status;
    } else if (!req.admin) {
      // Only show published blogs to non-authenticated users
      query.status = 'published';
    }

    // Filter by category
    if (category) {
      query.category = category;
    }

    // Search in title and content
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { highlightedQuote: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;

    const blogs = await Blog.find(query)
      .populate('author', 'name email')
      .sort({ publishedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Blog.countDocuments(query);

    // Format blogs for frontend
    const formattedBlogs = blogs.map(formatBlogForList);

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
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch blogs',
    });
  }
};

/**
 * @route   GET /api/blogs/:id
 * @desc    Get a single blog by ID or slug (Frontend friendly format)
 * @access  Public
 */
export const getBlog = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Support both ObjectId and slug
    const query: any = id.match(/^[0-9a-fA-F]{24}$/)
      ? { _id: id }
      : { slug: id };

    const blog = await Blog.findOne(query).populate('author', 'name email');

    if (!blog) {
      res.status(404).json({
        success: false,
        message: 'Blog not found',
      });
      return;
    }

    // Only show published blogs to non-authenticated users
    if (blog.status !== 'published' && !req.admin) {
      res.status(404).json({
        success: false,
        message: 'Blog not found',
      });
      return;
    }

    // Increment views
    blog.views += 1;
    await blog.save();

    res.status(200).json({
      success: true,
      data: formatBlogForDetail(blog),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch blog',
    });
  }
};

/**
 * @route   PUT /api/blogs/:id
 * @desc    Update a blog
 * @access  Private
 */
export const updateBlog = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, content, highlightedQuote, category, tags, publishDate, status } = req.body;
    const file = req.file;

    const blog = await Blog.findById(id);

    if (!blog) {
      res.status(404).json({
        success: false,
        message: 'Blog not found',
      });
      return;
    }

    // Update fields
    if (title) blog.title = title;
    if (content) blog.content = content;
    if (highlightedQuote !== undefined) blog.highlightedQuote = highlightedQuote;
    if (category !== undefined) blog.category = category;
    if (tags) blog.tags = typeof tags === 'string' ? JSON.parse(tags) : tags;
    if (publishDate !== undefined) blog.publishDate = publishDate;
    if (status) blog.status = status;

    // Update featured image if provided
    if (file) {
      // Delete old image
      await deleteImage(blog.featuredImage.publicId);

      // Upload new image
      const imageResult = await uploadImage(file.buffer, 'khuza/uploads/blogs');
      blog.featuredImage = {
        url: imageResult.url,
        publicId: imageResult.publicId,
      };
    }

    await blog.save();

    const updatedBlog = await Blog.findById(blog._id).populate('author', 'name email');

    res.status(200).json({
      success: true,
      message: 'Blog updated successfully',
      data: formatBlogForDetail(updatedBlog!),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update blog',
    });
  }
};

/**
 * @route   DELETE /api/blogs/:id
 * @desc    Delete a blog
 * @access  Private
 */
export const deleteBlog = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const blog = await Blog.findById(id);

    if (!blog) {
      res.status(404).json({
        success: false,
        message: 'Blog not found',
      });
      return;
    }

    // Delete image from Cloudinary
    await deleteImage(blog.featuredImage.publicId);

    // Delete blog
    await blog.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Blog deleted successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete blog',
    });
  }
};

/**
 * @route   GET /api/blogs/category/:category
 * @desc    Get blogs by category
 * @access  Public
 */
export const getBlogsByCategory = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { category } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const query: any = {
      category: { $regex: new RegExp(category, 'i') },
      status: 'published',
    };

    const skip = (page - 1) * limit;

    const blogs = await Blog.find(query)
      .populate('author', 'name email')
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Blog.countDocuments(query);
    const formattedBlogs = blogs.map(formatBlogForList);

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
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch blogs by category',
    });
  }
};

/**
 * @route   GET /api/blogs/recent/:limit
 * @desc    Get recent blogs
 * @access  Public
 */
export const getRecentBlogs = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const limit = parseInt(req.params.limit) || 5;

    const blogs = await Blog.find({ status: 'published' })
      .populate('author', 'name email')
      .sort({ publishedAt: -1 })
      .limit(limit);

    const formattedBlogs = blogs.map(formatBlogForList);

    res.status(200).json({
      success: true,
      data: formattedBlogs,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch recent blogs',
    });
  }
};