import express from 'express';
import {
  createEvent,
  getEvents,
  getEvent,
  updateEvent,
  deleteEvent,
  getFeaturedEvents,
  getUpcomingEvents,
} from '../controllers/eventController';
import { authenticate } from '../middleware/auth';
import { uploadMultiple } from '../middleware/upload';

const router = express.Router();

// Public routes
router.get('/', getEvents);
router.get('/featured/:limit?', getFeaturedEvents); // Get featured events
router.get('/upcoming/:limit?', getUpcomingEvents); // Get upcoming events
router.get('/:id', getEvent); // Must be last to avoid conflicts

// Protected routes (Admin only)
router.post('/', authenticate, uploadMultiple, createEvent);
router.put('/:id', authenticate, uploadMultiple, updateEvent);
router.delete('/:id', authenticate, deleteEvent);

export default router;