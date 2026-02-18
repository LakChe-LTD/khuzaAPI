"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteEvent = exports.updateEvent = exports.getEvent = exports.getEvents = exports.createEvent = void 0;
const Event_js_1 = __importDefault(require("../models/Event.js"));
const cloudinary_js_1 = require("../utils/cloudinary.js");
const responseFormatter_js_1 = require("../utils/responseFormatter.js");
const createEvent = async (req, res) => {
    try {
        const { title, description, location, startDate, endDate, category, tags, price, status, isFeatured } = req.body;
        const files = req.files;
        if (!files || files.length === 0) {
            res.status(400).json({ success: false, message: 'At least one image (cover image) is required' });
            return;
        }
        const coverImageResult = await (0, cloudinary_js_1.uploadImage)(files[0].buffer, 'khuza/uploads/events');
        let additionalImages = [];
        if (files.length > 1) {
            const additionalFiles = files.slice(1);
            const uploadResults = await (0, cloudinary_js_1.uploadMultipleImages)(additionalFiles, 'khuza/uploads/events');
            additionalImages = uploadResults.map(r => ({ url: r.url, publicId: r.publicId }));
        }
        const event = await Event_js_1.default.create({
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
        res.status(201).json({ success: true, message: 'Event created successfully', data: (0, responseFormatter_js_1.formatEventForDetail)(populated) });
    }
    catch (error) {
        console.error('Create Event Error:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to create event' });
    }
};
exports.createEvent = createEvent;
const getEvents = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const { status, category, isFeatured, search } = req.query;
        const query = {};
        if (status)
            query.status = status;
        if (category)
            query.category = { $regex: new RegExp(category, 'i') };
        if (isFeatured === 'true')
            query.isFeatured = true;
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }
        const skip = (page - 1) * limit;
        const events = await Event_js_1.default.find(query)
            .populate('organizer', 'name email')
            .sort({ startDate: -1 })
            .skip(skip)
            .limit(limit);
        const total = await Event_js_1.default.countDocuments(query);
        res.status(200).json({
            success: true,
            data: {
                events: events.map(responseFormatter_js_1.formatEventForList),
                pagination: { page, limit, total, pages: Math.ceil(total / limit) }
            }
        });
    }
    catch (error) {
        console.error('Get Events Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch events' });
    }
};
exports.getEvents = getEvents;
const getEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const query = id.match(/^[0-9a-fA-F]{24}$/) ? { _id: id } : { slug: id };
        const event = await Event_js_1.default.findOne(query).populate('organizer', 'name email');
        if (!event) {
            res.status(404).json({ success: false, message: 'Event not found' });
            return;
        }
        event.views += 1;
        await event.save();
        res.status(200).json({ success: true, data: (0, responseFormatter_js_1.formatEventForDetail)(event) });
    }
    catch (error) {
        console.error('Get Event Error:', error);
        res.status(500).json({ success: false, message: 'Error retrieving event' });
    }
};
exports.getEvent = getEvent;
const updateEvent = async (req, res) => {
    try {
        const { id } = req.params;
        console.log('UPDATE EVENT - ID received:', id);
        if (!id || id === 'undefined') {
            res.status(400).json({ success: false, message: 'Invalid event ID' });
            return;
        }
        const event = await Event_js_1.default.findById(id);
        if (!event) {
            res.status(404).json({ success: false, message: 'Event not found' });
            return;
        }
        const updates = { ...req.body };
        const files = req.files;
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
            if (event.coverImage?.publicId)
                await (0, cloudinary_js_1.deleteImage)(event.coverImage.publicId);
            if (event.images?.length > 0)
                await (0, cloudinary_js_1.deleteMultipleImages)(event.images.map(img => img.publicId));
            const coverRes = await (0, cloudinary_js_1.uploadImage)(files[0].buffer, 'khuza/uploads/events');
            updates.coverImage = { url: coverRes.url, publicId: coverRes.publicId };
            if (files.length > 1) {
                const galleryRes = await (0, cloudinary_js_1.uploadMultipleImages)(files.slice(1), 'khuza/uploads/events');
                updates.images = galleryRes.map(r => ({ url: r.url, publicId: r.publicId }));
            }
            else {
                updates.images = [];
            }
        }
        const updatedEvent = await Event_js_1.default.findByIdAndUpdate(event._id, updates, { new: true, runValidators: true }).populate('organizer', 'name email');
        res.status(200).json({
            success: true,
            message: 'Event updated successfully',
            data: (0, responseFormatter_js_1.formatEventForDetail)(updatedEvent)
        });
    }
    catch (error) {
        console.error("Update Error:", error);
        res.status(500).json({ success: false, message: error.message || 'Update failed' });
    }
};
exports.updateEvent = updateEvent;
const deleteEvent = async (req, res) => {
    try {
        const { id } = req.params;
        console.log('=== DELETE EVENT ===');
        console.log('ID:', id);
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            res.status(400).json({ success: false, message: 'Invalid event ID format' });
            return;
        }
        const event = await Event_js_1.default.findById(id);
        if (!event) {
            console.log('Event not found');
            res.status(404).json({ success: false, message: 'Event not found' });
            return;
        }
        console.log('Deleting event:', event.title);
        if (event.coverImage?.publicId) {
            console.log('Deleting cover image');
            await (0, cloudinary_js_1.deleteImage)(event.coverImage.publicId);
        }
        if (event.images?.length > 0) {
            console.log('Deleting gallery images');
            await (0, cloudinary_js_1.deleteMultipleImages)(event.images.map(img => img.publicId));
        }
        await event.deleteOne();
        console.log('Event deleted successfully');
        res.status(200).json({
            success: true,
            message: 'Event deleted successfully'
        });
    }
    catch (error) {
        console.error('Delete Error:', error);
        res.status(500).json({
            success: false,
            message: 'Deletion failed'
        });
    }
};
exports.deleteEvent = deleteEvent;
//# sourceMappingURL=eventController.js.map