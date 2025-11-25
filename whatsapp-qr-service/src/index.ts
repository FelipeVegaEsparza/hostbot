// Main entry point for WhatsApp QR Service

import dotenv from 'dotenv';
import app from './api';
import { logger } from './logger';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3002;

// Start server
app.listen(PORT, () => {
  logger.info(`WhatsApp QR Service started on port ${PORT}`, {
    nodeEnv: process.env.NODE_ENV,
    backendUrl: process.env.BACKEND_API_URL,
    sessionsDir: process.env.SESSIONS_DIR,
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  process.exit(0);
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', {
    error: error.message,
    stack: error.stack,
  });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection', {
    reason,
    promise,
  });
});
