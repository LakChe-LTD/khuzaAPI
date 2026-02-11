import express from 'express';
import { login, getMe, createAdmin, getAllAdmins, deleteAdmin } from '../controllers/authController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.post('/login', login);
router.post('/create-admin', authenticate, authorize('super_admin', 'admin'), createAdmin);
router.get('/users', authenticate, authorize('super_admin', 'admin'), getAllAdmins);
router.get('/me', authenticate, getMe);
router.delete('/users/:id', authenticate, authorize('super_admin', 'admin'), deleteAdmin); // ADD THIS LINE

export default router;