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
    console.error('Create Event Error:', error);
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
    console.error('Get Events Error:', error);
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
    console.error('Get Event Error:', error);
    res.status(500).json({ success: false, message: 'Error retrieving event' });
  }
};

export const updateEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    console.log('UPDATE EVENT - ID received:', id);
    
    if (!id || id === 'undefined') {
      res.status(400).json({ success: false, message: 'Invalid event ID' });
      return;
    }

    const event = await Event.findById(id);

    if (!event) {
      res.status(404).json({ success: false, message: 'Event not found' });
      return;
    }

    const updates = { ...req.body };
    const files = req.files as Express.Multer.File[];

    if (updates.location && typeof updates.location === 'string') {
      updates.location = JSON.parse(updates.location);
    }
    if (updates.tags && typeof updates.tags === 'string') {
      updates.tags = JSON.parse(updates.tags);
    }
    if (updates.price && typeof updates.price === 'string') {
      updates.price = JSON.parse(updates.price);
    }
    if (updates.isFeatured !== undefined) {
      updates.isFeatured = String(updates.isFeatured) === 'true';
    }

    if (files && files.length > 0) {
      if (event.coverImage?.publicId) await deleteImage(event.coverImage.publicId);
      if (event.images?.length > 0) await deleteMultipleImages(event.images.map(img => img.publicId));

      const coverRes = await uploadImage(files[0].buffer, 'khuza/uploads/events');
      updates.coverImage = { url: coverRes.url, publicId: coverRes.publicId };

      if (files.length > 1) {
        const galleryRes = await uploadMultipleImages(files.slice(1), 'khuza/uploads/events');
        updates.images = galleryRes.map(r => ({ url: r.url, publicId: r.publicId }));
      } else {
        updates.images = [];
      }
    }

    const updatedEvent = await Event.findByIdAndUpdate(
      event._id, 
      updates, 
      { new: true, runValidators: true }
    ).populate('organizer', 'name email');

    res.status(200).json({ 
      success: true, 
      message: 'Event updated successfully',
      data: formatEventForDetail(updatedEvent!) 
    });
  } catch (error: any) {
    console.error("Update Error:", error);
    res.status(500).json({ success: false, message: error.message || 'Update failed' });
  }
};

/**
 * @route   DELETE /api/events/:id
 * @desc    Delete an event
 * @access  Private (Admin)
 */
export const deleteEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    console.log('=== DELETE EVENT ===');
    console.log('ID:', id);
    
    // Check if ID is valid ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      res.status(400).json({ success: false, message: 'Invalid event ID format' });
      return;
    }
    
    const event = await Event.findById(id);
    
    if (!event) {
      console.log('Event not found');
      res.status(404).json({ success: false, message: 'Event not found' });
      return;
    }

    console.log('Deleting event:', event.title);

    // Delete assets from Cloudinary
    if (event.coverImage?.publicId) {
      console.log('Deleting cover image');
      await deleteImage(event.coverImage.publicId);
    }
    
    if (event.images?.length > 0) {
      console.log('Deleting gallery images');
      await deleteMultipleImages(event.images.map(img => img.publicId));
    }

    await event.deleteOne();
    
    console.log('Event deleted successfully');
    
    res.status(200).json({ 
      success: true, 
      message: 'Event deleted successfully' 
    });
  } catch (error: any) {
    console.error('Delete Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Deletion failed' 
    });
  }
};