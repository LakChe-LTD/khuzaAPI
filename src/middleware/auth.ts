import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import Admin, { IAdmin } from '../models/Admin'; 

/**
 * Custom Interface to extend the Express Request
 * This allows us to use req.admin in our controllers
 */
export interface AuthRequest extends Request {
  admin?: IAdmin;
}

/**
 * Middleware to authenticate the token
 */
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // 1. Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'No token provided. Authentication required.',
      });
      return;
    }
    
    const token = authHeader.split(' ')[1];
    
    // 2. Verify token (added type casting to fix the red underline)
    const decoded = jwt.verify(token, config.jwt.secret as string) as { id: string };
    
    // 3. Get admin from database 
    // FIXED: Use 'Admin' (Model) instead of 'admin' (variable)
    const admin = await Admin.findById(decoded.id).select('-password');
    
    if (!admin) {
      res.status(401).json({
        success: false,
        message: 'Admin not found. Invalid token.',
      });
      return;
    }
    
    if (!admin.isActive) {
      res.status(403).json({
        success: false,
        message: 'Admin account is inactive.',
      });
      return;
    }
    
    // 4. Attach admin to request
    req.admin = admin;
    next();
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError') {
      res.status(401).json({
        success: false,
        message: 'Invalid token.',
      });
      return;
    }
    
    if (error.name === 'TokenExpiredError') {
      res.status(401).json({
        success: false,
        message: 'Token expired.',
      });
      return;
    }
    
    res.status(500).json({
      success: false,
      message: 'Authentication error.',
    });
  }
};

/**
 * Middleware to authorize specific roles
 */
export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.admin) {
      res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
      return;
    }
    
    if (!roles.includes(req.admin.role)) {
      res.status(403).json({
        success: false,
        message: 'You do not have permission to perform this action.',
      });
      return;
    }
    
    next();
  };
};