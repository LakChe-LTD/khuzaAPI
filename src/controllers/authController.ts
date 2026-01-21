import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import Admin from '../models/Admin';
import { config } from '../config/env';
import { AuthRequest } from '../middleware/auth';

/**
 * Generate JWT token
 */
const generateToken = (id: string): string => {
  return jwt.sign({ id }, config.jwt.secret as string, {
    expiresIn: config.jwt.expiresIn as any, 
  });
};

/**
 * @route   POST /api/auth/register
 * @desc    Register a new admin
 * @access  Public (should be restricted in production)
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name, role } = req.body;

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      res.status(400).json({
        success: false,
        message: 'Admin with this email already exists',
      });
      return;
    }

    // Create admin
    const admin = await Admin.create({
      email,
      password,
      name,
      role: role || 'admin',
    });

    // Generate token
    const token = generateToken(admin._id.toString());

    res.status(201).json({
      success: true,
      message: 'Admin registered successfully',
      data: {
        admin: {
          id: admin._id,
          email: admin.email,
          name: admin.name,
          role: admin.role,
        },
        token,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Registration failed',
    });
  }
};

/**
 * @route   POST /api/auth/login
 * @desc    Login admin
 * @access  Public
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
      return;
    }

    // Find admin with password
    const admin = await Admin.findOne({ email }).select('+password');
    if (!admin) {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
      return;
    }

    // Check if admin is active
    if (!admin.isActive) {
      res.status(403).json({
        success: false,
        message: 'Admin account is inactive',
      });
      return;
    }

    // Check password
    const isPasswordCorrect = await admin.comparePassword(password);
    if (!isPasswordCorrect) {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
      return;
    }

    // Generate token
    const token = generateToken(admin._id.toString());

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        admin: {
          id: admin._id,
          email: admin.email,
          name: admin.name,
          role: admin.role,
        },
        token,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Login failed',
    });
  }
};

/**
 * @route   GET /api/auth/me
 * @desc    Get current admin profile
 * @access  Private
 */
export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const admin = req.admin;

    res.status(200).json({
      success: true,
      data: {
        admin: {
          id: admin?._id,
          email: admin?.email,
          name: admin?.name,
          role: admin?.role,
          isActive: admin?.isActive,
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get profile',
    });
  }
};