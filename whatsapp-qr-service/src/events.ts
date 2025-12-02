// Event notification system to communicate with backend

import axios from 'axios';
import { BackendNotification } from './types';
import { logger } from './logger';

const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://localhost:3000';

export class EventNotifier {
  /**
   * Send notification to backend API
   */
  async notifyBackend(notification: BackendNotification): Promise<void> {
    try {
      const url = `${BACKEND_API_URL}/whatsapp-qr/webhook`;
      
      logger.info(`Sending notification to backend: ${notification.type}`, {
        sessionId: notification.sessionId,
        url,
      });

      await axios.post(url, notification, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 5000,
      });

      logger.info(`Notification sent successfully: ${notification.type}`);
    } catch (error) {
      logger.error('Failed to notify backend', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        url: `${BACKEND_API_URL}/whatsapp-qr/webhook`,
        notification,
      });
      // Don't throw - we don't want to break the service if backend is down
    }
  }

  /**
   * Notify backend about QR code generation
   */
  async notifyQRCode(sessionId: string, qrCode: string): Promise<void> {
    await this.notifyBackend({
      type: 'qr',
      sessionId,
      data: { qrCode },
    });
  }

  /**
   * Notify backend about connection status
   */
  async notifyConnected(sessionId: string, phoneNumber?: string): Promise<void> {
    await this.notifyBackend({
      type: 'connected',
      sessionId,
      data: { phoneNumber, connectedAt: new Date().toISOString() },
    });
  }

  /**
   * Notify backend about disconnection
   */
  async notifyDisconnected(sessionId: string): Promise<void> {
    await this.notifyBackend({
      type: 'disconnected',
      sessionId,
      data: { disconnectedAt: new Date().toISOString() },
    });
  }

  /**
   * Send incoming message to backend
   */
  async sendIncomingMessage(
    sessionId: string,
    from: string,
    message: string,
    messageId: string,
    timestamp: number
  ): Promise<void> {
    try {
      const url = `${BACKEND_API_URL}/whatsapp-qr/incoming`;
      
      logger.info('Sending incoming message to backend', {
        sessionId,
        from,
        messageId,
      });

      await axios.post(
        url,
        {
          sessionId,
          from,
          message,
          messageId,
          timestamp,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 5000,
        }
      );

      logger.info('Incoming message sent to backend successfully');
    } catch (error) {
      logger.error('Failed to send incoming message to backend', {
        error: error instanceof Error ? error.message : 'Unknown error',
        sessionId,
        from,
      });
    }
  }
}

export const eventNotifier = new EventNotifier();
