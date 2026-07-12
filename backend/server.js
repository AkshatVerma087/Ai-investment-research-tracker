import './src/config/env.js'; // Validate env on startup
import app from './src/app.js';
import { env } from './src/config/env.js';
import { logger } from './src/utils/logger.js';

const PORT = env.PORT;

const server = app.listen(PORT, () => {
  logger.info(`Server listening on port ${PORT} in ${env.NODE_ENV} mode`);
});

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});
