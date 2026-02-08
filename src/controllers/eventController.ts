import { Request, Response } from 'express';
import Event from '../models/Event.js';
import { AuthRequest } from '../middleware/auth.js';
import { 
  uploadImage, 
  uploadMultipleImages, 
  deleteImage, 
  deleteMultipleImages 
} from '../utils/cloudinary.js';
import { formatEventForList, formatEventForDetail } from '../utils/responseFormatter.js';

/**
 * @route   POST /api/events
 * @desc    Create a new event
 * @access  Private (Admin)
 */
export const createEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { 
      title, description, location, startDate, endDate, category, 
      tags, price, status, isFeatured 
    } = req.body;
    
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      res.status(400).json({ success: false, message: 'At least one image (cover image) is required' });
      return;
    }

    // Upload cover image (the first file)
    const coverImageResult = await uploadImage(files[0].buffer, 'khuza/uploads/events');

    // Upload additional gallery images if they exist
    let additionalImages: any[] = [];
    if (files.length > 1) {
      const additionalFiles = files.slice(1);
      const uploadResults = await uploadMultipleImages(additionalFiles, 'khuza/uploads/events');
      additionalImages = uploadResults.map(r => ({ url: r.url, publicId: r.publicId }));
    }

    const event = await Event.create({
      title,
      description,
      coverImage: { url: coverImageResult.url, publicId: coverImageResult.publicId },
      images: additionalImages,
      location: typeof location === 'string' ? JSON.parse(location) : location,
      startDate,
      endDate: endDate || undefined,
      category: category || undefined,
      tags: tags ? (typeof tags === 'string' ? JSON.parse(tags) : tags) : [],
      organizer: req.admin?._id,
      price: price ? (typeof price === 'string' ? JSON.parse(price) : price) : undefined,
      status: status || 'upcoming',
      isFeatured: isFeatured === 'true' || isFeatured === true,
    });

    const populated = await event.populate('organizer', 'name email');
    res.status(201).json({ success: true, message: 'Event created successfully', data: formatEventForDetail(populated) });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to create event' });
  }
};

/**
 * @route   GET /api/events
 * @desc    Get all events with filters & pagination
 * @access  Public
 */
export const getEvents = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const { status, category, isFeatured, search } = req.query;

    const query: any = {};
    if (status) query.status = status;
    if (category) query.category = { $regex: new RegExp(category as string, 'i') };
    if (isFeatured === 'true') query.isFeatured = true;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    const events = await Event.find(query)
      .populate('organizer', 'name email')
      .sort({ startDate: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Event.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        events: events.map(formatEventForList),
        pagination: { page, limit, total, pages: Math.ceil(total / limit) }
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch events' });
  }
};

/**
 * @route   GET /api/events/:id
 * @desc    Get single event by ID or Slug
 * @access  Public
 */
export const getEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const query = id.match(/^[0-9a-fA-F]{24}$/) ? { _id: id } : { slug: id };

    const event = await Event.findOne(query).populate('organizer', 'name email');
    if (!event) {
      res.status(404).json({ success: false, message: 'Event not found' });
      return;
    }

    // Increment view count
    event.views += 1;
    await event.save();

    res.status(200).json({ success: true, data: formatEventForDetail(event) });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error retrieving event' });
  }
};

/**
 * @route   PUT /api/events/:id
 * @desc    Update event (including Cloudinary image swap)
 * @access  Private (Admin)
 */
export const updateEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const event = await Event.findById(id);
    if (!event) {
      res.status(404).json({ success: false, message: 'Event not found' });
      return;
    }

    const updates = { ...req.body };
    const files = req.files as Express.Multer.File[];

    // Parse stringified JSON fields from FormData
    if (updates.location) updates.location = typeof updates.location === 'string' ? JSON.parse(updates.location) : updates.location;
    if (updates.tags) updates.tags = typeof updates.tags === 'string' ? JSON.parse(updates.tags) : updates.tags;
    if (updates.price) updates.price = typeof updates.price === 'string' ? JSON.parse(updates.price) : updates.price;
    
    // Handle Boolean strings
    if (updates.isFeatured !== undefined) updates.isFeatured = updates.isFeatured === 'true';

    // Image logic: If new files uploaded, replace old ones
    if (files && files.length > 0) {
      await deleteImage(event.coverImage.publicId);
      if (event.images.length > 0) await deleteMultipleImages(event.images.map(img => img.publicId));

      const coverRes = await uploadImage(files[0].buffer, 'khuza/uploads/events');
      updates.coverImage = { url: coverRes.url, publicId: coverRes.publicId };

      if (files.length > 1) {
        const galleryRes = await uploadMultipleImages(files.slice(1), 'khuza/uploads/events');
        updates.images = galleryRes.map(r => ({ url: r.url, publicId: r.publicId }));
      }
    }

    const updatedEvent = await Event.findByIdAndUpdate(id, updates, { new: true }).populate('organizer', 'name email');
    res.status(200).json({ success: true, data: formatEventForDetail(updatedEvent!) });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Update failed' });
  }
};

/**
 * @route   DELETE /api/events/:id
 * @desc    Delete event and Cloudinary assets
 * @access  Private (Admin)
 */
export const deleteEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      res.status(404).json({ success: false, message: 'Event not found' });
      return;
    }

    await deleteImage(event.coverImage.publicId);
    if (event.images.length > 0) await deleteMultipleImages(event.images.map(img => img.publicId));

    await event.deleteOne();
    res.status(200).json({ success: true, message: 'Event deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Deletion failed' });
  }
};