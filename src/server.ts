import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

// Update these lines to match your actual file extensions in the src folder
import { config, validateEnv } from './config/env.js';
import { connectDatabase } from './config/database.js';
// import { errorHandler, notFound } from './middleware/errorHandlers.ts';

// Do the same for routes
import authRoutes from './routes/auth.js';
import blogRoutes from './routes/blog.js';
import eventRoutes from './routes/event.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
// 1. Validate environment variables before doing anything else
validateEnv();

// 2. Initialize express app
const app: Application = express();

// 3. Connect to database
connectDatabase();

// --- Middleware Stack ---

app.use(helmet()); // Security headers
app.use(
  cors({
    origin: config.cors.origin,
    credentials: true,
  })
); 

app.use(morgan('dev')); // Logging
app.use(compression()); // Gzip compression
app.use(express.json({ limit: '10mb' })); // Body parser
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 4. Rate limiting to prevent brute force/DoS
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, 
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api', limiter);

// 5. Health check route
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Khuza API is running',
    timestamp: new Date().toISOString(),
  });
});

// 6. API Routes
app.use('/api/auth', authRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/events', eventRoutes);

// 7. Error handling middleware (Must be last)
app.use(notFound);
app.use(errorHandler);

// --- Server Start ---

// Cast to number to satisfy TypeScript's app.listen requirements
const PORT = Number(config.port) || 3000;

app.listen(PORT, () => {
  console.log(`
🚀 Server is running!
📡 Port: ${PORT}
🌍 Environment: ${config.nodeEnv}
🔗 URL: http://localhost:${PORT}
  `);
});

// 8. Handle unhandled promise rejections (e.g. Database connection issues)
process.on('unhandledRejection', (reason: unknown) => {
  console.error('❌ Unhandled Rejection:', reason instanceof Error ? reason.message : reason);
  // Graceful shutdown
  process.exit(1);
});