import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import Admin from '../models/Admin.js';
import { AuthRequest } from '../middleware/auth.js';

const generateToken = (id: string): string => {
  return jwt.sign({ id }, config.jwt.secret as string, {
    expiresIn: config.jwt.expiresIn as any,
  });
};

export const createAdmin = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, password, name, role } = req.body;

    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      res.status(400).json({ success: false, message: 'Admin already exists' });
      return;
    }

    const admin = await Admin.create({
      email,
      password,
      name,
      role: role || 'admin',
      isActive: true,
    });

    res.status(201).json({
      success: true,
      message: 'Admin account created successfully',
      data: { id: admin._id, email: admin.email, name: admin.name, role: admin.role },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Please provide email and password' });
      return;
    }

    const admin = await Admin.findOne({ email }).select('+password');
    if (!admin || !(await admin.comparePassword(password))) {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
      return;
    }

    if (!admin.isActive) {
      res.status(403).json({ success: false, message: 'Account is inactive' });
      return;
    }

    const token = generateToken(admin._id.toString());
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        admin: { id: admin._id, email: admin.email, name: admin.name, role: admin.role },
        token,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Login failed' });
  }
};

export const getAllAdmins = async (req: Request, res: Response): Promise<void> => {
  try {
    const admins = await Admin.find({}).select('-password').sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: admins });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch admins' });
  }
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    res.status(200).json({ success: true, data: { admin: req.admin } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to get profile' });
  }
};

// ADD THIS NEW FUNCTION
export const deleteAdmin = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Prevent self-deletion
    if (req.admin?._id.toString() === id) {
      res.status(400).json({ success: false, message: 'You cannot delete your own account' });
      return;
    }

    const admin = await Admin.findById(id);
    
    if (!admin) {
      res.status(404).json({ success: false, message: 'Admin not found' });
      return;
    }

    // Prevent deleting super_admin (optional - for extra security)
    if (admin.role === 'super_admin') {
      res.status(403).json({ success: false, message: 'Cannot delete super admin account' });
      return;
    }

    await Admin.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Admin deleted successfully',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to delete admin' });
  }
};