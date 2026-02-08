import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
 // Ensure .js extension
import Admin, { IAdmin } from '../models/Admin.js'; 
import { config } from '../config/env.js';

export interface AuthRequest extends Request {
  admin?: IAdmin;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'No token provided. Authentication required.',
      });
      return;
    }
    
    const token = authHeader.split(' ')[1];
    
    // CORRECTION: Cast as { id: string } to fix TypeScript error
    const decoded = jwt.verify(token, config.jwt.secret as string) as { id: string };
    
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
    
    req.admin = admin as IAdmin;
    next();
  } catch (error: any) {
    res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.admin || !roles.includes(req.admin.role)) {
      res.status(403).json({
        success: false,
        message: 'You do not have permission to perform this action.',
      });
      return;
    }
    next();
  };
};