// Core Express application configuration.
// Sets up all global middlewares such as security headers (Helmet),
// CORS, JSON parsing, cookie parsing, and HTTP request logging (Pino).
// Also defines the base error handler and 404 fallback.

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import cookieParser from 'cookie-parser';
import { logger } from './utils/logger.js';
import { errorHandler } from './middlewares/errorHandler.js';
import authRoutes from './routes/auth.routes.js';
import researchRoutes from './routes/research.routes.js';

const app = express();

// Helmet helps secure Express apps by setting various HTTP headers
app.use(helmet());

// CORS configuration to allow requests from the frontend and support HTTP-only cookies
app.use(
  cors({
    origin: function (origin, callback) {
      // Explicitly allowing localhost and your exact live Render URL
      const allowedOrigins = [
        'http://localhost:3000',
        'https://quantix-frontend-21jy.onrender.com'
      ];
      
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true, // required for httpOnly cookies in cross-origin requests
  })
);

// Body parsers
app.use(express.json()); // Parse incoming JSON payloads
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded payloads

// Parse Cookie header and populate req.cookies
app.use(cookieParser());

// HTTP request logger middleware
app.use(pinoHttp({ 
  logger,
  // Use custom serializers to strip out sensitive headers (like cookies/tokens) and keep logs clean
  serializers: {
    req: (req) => ({
      method: req.method,
      url: req.url,
      remoteAddress: req.remoteAddress,
    }),
    res: (res) => ({
      statusCode: res.statusCode,
    })
  }
}));

// --- Routes ---

app.use('/api/auth', authRoutes);
app.use('/api/research', researchRoutes);

// Healthcheck / Ping route.
// Used to verify that the server is up and running.
app.get('/api/ping', (req, res) => {
  res.status(200).json({ success: true, message: 'pong' });
});

// 404 Fallback Handler.
// Catches any requests that don't match existing routes.
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Global Error Handler.
// Catches all errors passed to next(err) and formats a standard JSON response.
app.use(errorHandler);

export default app;
