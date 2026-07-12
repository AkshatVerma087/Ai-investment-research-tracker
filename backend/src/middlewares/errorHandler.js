// Global error handling middleware for Express.
// It intercepts all errors thrown in routes or other middlewares,
// logs them using Pino, and sends a standardized JSON response to the client.

import { logger } from '../utils/logger.js';

// Express error handling middleware function.
export const errorHandler = (err, req, res, next) => {
  // Log the full error object for debugging purposes
  logger.error(err);

  // Determine the HTTP status code (default to 500 Internal Server Error)
  const statusCode = err.statusCode || 500;
  
  // Provide a safe fallback message
  const message = err.message || 'Internal Server Error';

  // Send the structured error response
  // In development mode, include the stack trace for easier debugging
  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
};
