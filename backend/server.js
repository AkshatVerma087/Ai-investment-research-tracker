// Entry point for the backend API.
// Starts the Express server and binds it to a port. Also sets up a global
// handler for unhandled promise rejections to prevent silent crashes.

import './src/config/env.js'; // Validate environment variables before starting
import app from './src/app.js';
import { env } from './src/config/env.js';
import { logger } from './src/utils/logger.js';

const PORT = env.PORT;

// Start the Express server.
const server = app.listen(PORT, () => {
  logger.info(`Server listening on port ${PORT} in ${env.NODE_ENV} mode`);
});

// Handle unhandled promise rejections globally to prevent the Node.js process
// from crashing unexpectedly. Logs the error and gracefully shuts down.
process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});
