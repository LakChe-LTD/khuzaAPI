import express from 'express';
import { createEvent, getEvents, getEvent, updateEvent, deleteEvent } from '../controllers/eventController.js';
import { authenticate } from '../middleware/auth.js';
import { uploadMultiple } from '../middleware/upload.js';

const router = express.Router();

router.get('/', getEvents);
router.get('/:id', getEvent);
router.post('/', authenticate, uploadMultiple, createEvent); 
router.put('/:id', authenticate, uploadMultiple, updateEvent);
router.delete('/:id', authenticate, deleteEvent);

export default router;