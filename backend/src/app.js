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

const app = express();

// Helmet helps secure Express apps by setting various HTTP headers
app.use(helmet());

// CORS configuration to allow requests from the frontend and support HTTP-only cookies
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true, // required for httpOnly cookies in cross-origin requests
  })
);

// Body parsers
app.use(express.json()); // Parse incoming JSON payloads
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded payloads

// Parse Cookie header and populate req.cookies
app.use(cookieParser());

// HTTP request logger middleware
app.use(pinoHttp({ logger }));

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
