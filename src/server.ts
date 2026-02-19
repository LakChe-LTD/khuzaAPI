import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

import { config, validateEnv } from './config/env';
import { connectDatabase } from './config/database';
import authRoutes from './routes/auth';
import blogRoutes from './routes/blog';
import eventRoutes from './routes/event';
import { errorHandler, notFound } from './middleware/errorHandler';

// Validate environment variables before starting
validateEnv();

const app: Application = express();

// Connect to MongoDB
connectDatabase();

// IMPORTANT: Trust proxy for rate limiting on hosting platforms (Render/Railway/Vercel)
app.set('trust proxy', 1);

// Standard Middlewares
app.use(helmet());
app.use(cors({ 
  origin: config.cors.origin, // Ensure this matches your frontend URL in .env
  credentials: true 
}));
app.use(morgan('dev'));
app.use(compression());

// Body Parsers (Increased limit to handle larger base64 images if needed)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Health Check Route
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ 
    success: true, 
    message: 'Khuza API is active and healthy',
    timestamp: new Date().toISOString()
  });
});

// Base API Route
app.get('/api', (req: Request, res: Response) => {
  res.status(200).json({ 
    success: true, 
    message: 'Welcome to KhuzaAPI!',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      blogs: '/api/blogs',
      events: '/api/events'
    }
  });
});

// Use Rate Limiter on all API routes
app.use('/api', limiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/events', eventRoutes);

// Error Handling (Must be last)
app.use(notFound);
app.use(errorHandler);

const PORT = Number(config.port) || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
});