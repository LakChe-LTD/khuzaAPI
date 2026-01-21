import { Response } from 'express';
import Event from '../models/Event';
import { AuthRequest } from '../middleware/auth';
import {
  uploadImage,
  uploadMultipleImages,
  deleteImage,
  deleteMultipleImages,
} from '../utils/cloudinary';
import { formatEventForList, formatEventForDetail } from '../utils/responseFormatter';

/**
 * @route   POST /api/events
 * @desc    Create a new event
 * @access  Private
 */
export const createEvent = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const {
      title,
      description,
      location,
      startDate,
      endDate,
      category,
      tags,
      capacity,
      registrationRequired,
      registrationDeadline,
      price,
      status,
      isFeatured,
    } = req.body;

    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      res.status(400).json({
        success: false,
        message: 'At least one image (cover image) is required',
      });
      return;
    }

    // Upload cover image (first image)
    const coverImageResult = await uploadImage(
      files[0].buffer,
      'khuza/uploads/events'
    );

    // Upload additional images if any
    let additionalImages: any[] = [];
    if (files.length > 1) {
      const additionalFiles = files.slice(1);
      const uploadResults = await uploadMultipleImages(
        additionalFiles,
        'khuza/uploads/events'
      );
      additionalImages = uploadResults.map((result) => ({
        url: result.url,
        publicId: result.publicId,
      }));
    }

    // Create event
    const event = await Event.create({
      title,
      description,
      coverImage: {
        url: coverImageResult.url,
        publicId: coverImageResult.publicId,
      },
      images: additionalImages,
      location: typeof location === 'string' ? JSON.parse(location) : location,
      startDate,
      endDate,
      category,
      tags: tags ? (typeof tags === 'string' ? JSON.parse(tags) : tags) : [],
      organizer: req.admin?._id,
      capacity: capacity ? parseInt(capacity) : undefined,
      registrationRequired: registrationRequired === 'true' || registrationRequired === true,
      registrationDeadline: registrationDeadline || undefined,
      price: price ? (typeof price === 'string' ? JSON.parse(price) : price) : undefined,
      status: status || 'upcoming',
      isFeatured: isFeatured === 'true' || isFeatured === true,
    });

    const populatedEvent = await Event.findById(event._id).populate('organizer', 'name email');

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: formatEventForDetail(populatedEvent!),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create event',
    });
  }
};

/**
 * @route   GET /api/events
 * @desc    Get all events with pagination and filters (Frontend friendly format)
 * @access  Public
 */
export const getEvents = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;
    const category = req.query.category as string;
    const isFeatured = req.query.isFeatured as string;
    const search = req.query.search as string;

    const query: any = {};

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by category
    if (category) {
      query.category = { $regex: new RegExp(category, 'i') };
    }

    // Filter by featured
    if (isFeatured === 'true') {
      query.isFeatured = true;
    }

    // Search in title and description
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;

    const events = await Event.find(query)
      .populate('organizer', 'name email')
      .sort({ startDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Event.countDocuments(query);

    // Format events for frontend
    const formattedEvents = events.map(formatEventForList);

    res.status(200).json({
      success: true,
      data: {
        events: formattedEvents,
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
      message: error.message || 'Failed to fetch events',
    });
  }
};

/**
 * @route   GET /api/events/:id
 * @desc    Get a single event by ID or slug (Frontend friendly format)
 * @access  Public
 */
export const getEvent = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    // Support both ObjectId and slug
    const query: any = id.match(/^[0-9a-fA-F]{24}$/)
      ? { _id: id }
      : { slug: id };

    const event = await Event.findOne(query).populate('organizer', 'name email');

    if (!event) {
      res.status(404).json({
        success: false,
        message: 'Event not found',
      });
      return;
    }

    // Increment views
    event.views += 1;
    await event.save();

    res.status(200).json({
      success: true,
      data: formatEventForDetail(event),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch event',
    });
  }
};

/**
 * @route   PUT /api/events/:id
 * @desc    Update an event
 * @access  Private
 */
export const updateEvent = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      location,
      startDate,
      endDate,
      category,
      tags,
      capacity,
      registrationRequired,
      registrationDeadline,
      price,
      status,
      isFeatured,
    } = req.body;

    const files = req.files as Express.Multer.File[];

    const event = await Event.findById(id);

    if (!event) {
      res.status(404).json({
        success: false,
        message: 'Event not found',
      });
      return;
    }

    // Update fields
    if (title) event.title = title;
    if (description) event.description = description;
    if (location) event.location = typeof location === 'string' ? JSON.parse(location) : location;
    if (startDate) event.startDate = startDate;
    if (endDate) event.endDate = endDate;
    if (category) event.category = category;
    if (tags) event.tags = typeof tags === 'string' ? JSON.parse(tags) : tags;
    if (capacity) event.capacity = parseInt(capacity);
    if (registrationRequired !== undefined)
      event.registrationRequired = registrationRequired === 'true' || registrationRequired === true;
    if (registrationDeadline) event.registrationDeadline = registrationDeadline;
    if (price) event.price = typeof price === 'string' ? JSON.parse(price) : price;
    if (status) event.status = status;
    if (isFeatured !== undefined) event.isFeatured = isFeatured === 'true' || isFeatured === true;

    // Update images if provided
    if (files && files.length > 0) {
      // Delete old cover image
      await deleteImage(event.coverImage.publicId);

      // Delete old additional images
      if (event.images.length > 0) {
        const publicIds = event.images.map((img) => img.publicId);
        await deleteMultipleImages(publicIds);
      }

      // Upload new cover image
      const coverImageResult = await uploadImage(
        files[0].buffer,
        'khuza/uploads/events'
      );
      event.coverImage = {
        url: coverImageResult.url,
        publicId: coverImageResult.publicId,
      };

      // Upload new additional images
      if (files.length > 1) {
        const additionalFiles = files.slice(1);
        const uploadResults = await uploadMultipleImages(
          additionalFiles,
          'khuza/uploads/events'
        );
        event.images = uploadResults.map((result) => ({
          url: result.url,
          publicId: result.publicId,
        }));
      } else {
        event.images = [];
      }
    }

    await event.save();

    const updatedEvent = await Event.findById(event._id).populate('organizer', 'name email');

    res.status(200).json({
      success: true,
      message: 'Event updated successfully',
      data: formatEventForDetail(updatedEvent!),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update event',
    });
  }
};

/**
 * @route   DELETE /api/events/:id
 * @desc    Delete an event
 * @access  Private
 */
export const deleteEvent = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const event = await Event.findById(id);

    if (!event) {
      res.status(404).json({
        success: false,
        message: 'Event not found',
      });
      return;
    }

    // Delete cover image from Cloudinary
    await deleteImage(event.coverImage.publicId);

    // Delete additional images
    if (event.images.length > 0) {
      const publicIds = event.images.map((img) => img.publicId);
      await deleteMultipleImages(publicIds);
    }

    // Delete event
    await event.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Event deleted successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete event',
    });
  }
};

/**
 * @route   GET /api/events/featured/:limit
 * @desc    Get featured events
 * @access  Public
 */
export const getFeaturedEvents = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const limit = parseInt(req.params.limit) || 5;

    const events = await Event.find({ isFeatured: true, status: 'upcoming' })
      .populate('organizer', 'name email')
      .sort({ startDate: 1 })
      .limit(limit);

    const formattedEvents = events.map(formatEventForList);

    res.status(200).json({
      success: true,
      data: formattedEvents,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch featured events',
    });
  }
};

/**
 * @route   GET /api/events/upcoming/:limit
 * @desc    Get upcoming events
 * @access  Public
 */
export const getUpcomingEvents = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const limit = parseInt(req.params.limit) || 10;

    const events = await Event.find({ status: 'upcoming' })
      .populate('organizer', 'name email')
      .sort({ startDate: 1 })
      .limit(limit);

    const formattedEvents = events.map(formatEventForList);

    res.status(200).json({
      success: true,
      data: formattedEvents,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch upcoming events',
    });
  }
};