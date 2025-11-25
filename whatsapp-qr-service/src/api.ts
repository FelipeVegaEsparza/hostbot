// Express API for WhatsApp QR Service

import express, { Request, Response } from 'express';
import cors from 'cors';
import { sessionManager } from './sessionManager';
import { SendMessageRequest } from './types';
import { logger } from './logger';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    body: req.body,
    query: req.query,
  });
  next();
});

/**
 * Health check endpoint
 */
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

/**
 * Initialize a new WhatsApp session
 * POST /init
 */
app.post('/init', async (req: Request, res: Response) => {
  try {
    const { sessionId, chatbotId } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'sessionId is required',
      });
    }

    await sessionManager.initSession({ sessionId, chatbotId });

    res.json({
      success: true,
      message: 'Session initialization started',
      sessionId,
    });
  } catch (error) {
    logger.error('Error in /init endpoint', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get QR code for a session
 * GET /qr-code/:sessionId
 */
app.get('/qr-code/:sessionId', (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    const qrCode = sessionManager.getQRCode(sessionId);

    if (!qrCode) {
      return res.status(404).json({
        success: false,
        error: 'QR code not available. Session may not exist or already connected.',
      });
    }

    res.json({
      success: true,
      sessionId,
      qrCode,
    });
  } catch (error) {
    logger.error('Error in /qr-code endpoint', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get session status
 * GET /status/:sessionId
 */
app.get('/status/:sessionId', (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    const sessionInfo = sessionManager.getSessionInfo(sessionId);

    if (!sessionInfo) {
      return res.status(404).json({
        success: false,
        error: 'Session not found',
      });
    }

    res.json({
      success: true,
      session: sessionInfo,
    });
  } catch (error) {
    logger.error('Error in /status endpoint', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Send a message through WhatsApp
 * POST /send
 */
app.post('/send', async (req: Request, res: Response) => {
  try {
    const { sessionId, to, message }: SendMessageRequest = req.body;

    if (!sessionId || !to || !message) {
      return res.status(400).json({
        success: false,
        error: 'sessionId, to, and message are required',
      });
    }

    const result = await sessionManager.sendMessage(sessionId, to, message);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    logger.error('Error in /send endpoint', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Disconnect a session
 * POST /disconnect
 */
app.post('/disconnect', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'sessionId is required',
      });
    }

    await sessionManager.disconnect(sessionId);

    res.json({
      success: true,
      message: 'Session disconnected',
      sessionId,
    });
  } catch (error) {
    logger.error('Error in /disconnect endpoint', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get all sessions
 * GET /sessions
 */
app.get('/sessions', (req: Request, res: Response) => {
  try {
    const sessions = sessionManager.getAllSessions();

    res.json({
      success: true,
      sessions,
    });
  } catch (error) {
    logger.error('Error in /sessions endpoint', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: any) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
  });

  res.status(500).json({
    success: false,
    error: 'Internal server error',
  });
});

export default app;
