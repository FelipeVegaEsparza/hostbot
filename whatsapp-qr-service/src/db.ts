// Database client for direct session updates
import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

const prisma = new PrismaClient();

export class DatabaseClient {
  /**
   * Update session with QR code
   */
  async updateSessionQR(sessionId: string, qrCode: string): Promise<void> {
    try {
      await prisma.whatsAppQRSession.update({
        where: { sessionId },
        data: {
          status: 'QR_READY',
          qrCode,
        },
      });
      logger.info('Session updated with QR code in database', { sessionId });
    } catch (error) {
      logger.error('Failed to update session in database', {
        error: error instanceof Error ? error.message : 'Unknown error',
        sessionId,
      });
    }
  }

  /**
   * Update session status to connected
   */
  async updateSessionConnected(sessionId: string): Promise<void> {
    try {
      await prisma.whatsAppQRSession.update({
        where: { sessionId },
        data: {
          status: 'CONNECTED',
          qrCode: null,
          lastConnectedAt: new Date(),
        },
      });
      logger.info('Session marked as connected in database', { sessionId });
    } catch (error) {
      logger.error('Failed to update session status in database', {
        error: error instanceof Error ? error.message : 'Unknown error',
        sessionId,
      });
    }
  }

  /**
   * Update session status to disconnected
   */
  async updateSessionDisconnected(sessionId: string): Promise<void> {
    try {
      await prisma.whatsAppQRSession.update({
        where: { sessionId },
        data: {
          status: 'DISCONNECTED',
          qrCode: null,
        },
      });
      logger.info('Session marked as disconnected in database', { sessionId });
    } catch (error) {
      logger.error('Failed to update session status in database', {
        error: error instanceof Error ? error.message : 'Unknown error',
        sessionId,
      });
    }
  }
}

export const dbClient = new DatabaseClient();
