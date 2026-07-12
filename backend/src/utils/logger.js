// Configures and exports the Pino logger instance for the application.
// In development, it uses 'pino-pretty' to format logs in a human-readable way in the terminal.
// In production, it defaults to standard JSON logging, which is highly performant.

import pino from 'pino';

// The configured Pino logger instance.
// Use this throughout the application instead of console.log.
export const logger = pino({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  transport:
    process.env.NODE_ENV === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true, // Colorize output for better readability
            translateTime: 'SYS:standard', // Format timestamps in a human-readable standard format
            ignore: 'pid,hostname', // Omit unnecessary metadata in development logs
          },
        }
      : undefined,
});
