// Session Manager for Baileys WhatsApp connections

import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  WASocket,
  ConnectionState,
  fetchLatestBaileysVersion,
} from '@whiskeysockets/baileys';
import QRCode from 'qrcode';
import * as fs from 'fs';
import * as path from 'path';
import { Boom } from '@hapi/boom';
import { SessionConfig, SessionStatus, SessionInfo } from './types';
import { eventNotifier } from './events';
import { messageHandler } from './messageHandler';
import { logger } from './logger';

const SESSIONS_DIR = process.env.SESSIONS_DIR || './sessions';

export class SessionManager {
  private sessions: Map<string, WASocket> = new Map();
  private sessionStatus: Map<string, SessionStatus> = new Map();
  private qrCodes: Map<string, string> = new Map();
  private reconnectAttempts: Map<string, number> = new Map();
  private readonly MAX_RECONNECT_ATTEMPTS = 5;

  constructor() {
    // Ensure sessions directory exists
    if (!fs.existsSync(SESSIONS_DIR)) {
      fs.mkdirSync(SESSIONS_DIR, { recursive: true });
      logger.info(`Created sessions directory: ${SESSIONS_DIR}`);
    }
  }

  /**
   * Initialize a new WhatsApp session
   */
  async initSession(config: SessionConfig): Promise<void> {
    const { sessionId } = config;

    if (this.sessions.has(sessionId)) {
      logger.warn(`Session ${sessionId} already exists`);
      return;
    }

    logger.info(`Initializing session: ${sessionId}`);
    this.sessionStatus.set(sessionId, SessionStatus.CONNECTING);
    this.reconnectAttempts.set(sessionId, 0);

    try {
      await this.createConnection(sessionId);
    } catch (error) {
      logger.error(`Failed to initialize session ${sessionId}`, {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      this.sessionStatus.set(sessionId, SessionStatus.DISCONNECTED);
      throw error;
    }
  }

  /**
   * Create WhatsApp connection using Baileys
   */
  private async createConnection(sessionId: string): Promise<void> {
    const sessionPath = path.join(SESSIONS_DIR, sessionId);

    // Ensure session directory exists
    if (!fs.existsSync(sessionPath)) {
      fs.mkdirSync(sessionPath, { recursive: true });
    }

    // Load auth state
    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

    // Get latest Baileys version
    const { version } = await fetchLatestBaileysVersion();

    // Create socket connection
    const socket = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: false,
      logger: logger.child({ sessionId }),
      browser: ['WhatsApp QR Service', 'Chrome', '1.0.0'],
      defaultQueryTimeoutMs: 60000,
    });

    this.sessions.set(sessionId, socket);

    // Handle credentials update
    socket.ev.on('creds.update', saveCreds);

    // Handle connection updates
    socket.ev.on('connection.update', async (update) => {
      await this.handleConnectionUpdate(sessionId, update);
    });

    // Handle incoming messages
    socket.ev.on('messages.upsert', async ({ messages }) => {
      for (const message of messages) {
        await messageHandler.handleIncomingMessage(sessionId, message);
      }
    });

    logger.info(`Socket created for session: ${sessionId}`);
  }

  /**
   * Handle connection state updates
   */
  private async handleConnectionUpdate(
    sessionId: string,
    update: Partial<ConnectionState>
  ): Promise<void> {
    const { connection, lastDisconnect, qr } = update;

    // Handle QR code generation
    if (qr) {
      logger.info(`QR code generated for session: ${sessionId}`);
      
      try {
        // Convert QR to data URL
        const qrDataUrl = await QRCode.toDataURL(qr);
        this.qrCodes.set(sessionId, qrDataUrl);
        this.sessionStatus.set(sessionId, SessionStatus.QR_READY);

        // Notify backend
        await eventNotifier.notifyQRCode(sessionId, qrDataUrl);
      } catch (error) {
        logger.error(`Failed to generate QR code for session ${sessionId}`, {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Handle connection state changes
    if (connection === 'close') {
      logger.warn(`Connection closed for session: ${sessionId}`);
      
      const shouldReconnect = this.shouldReconnect(lastDisconnect);
      const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;

      logger.info(`Connection close reason`, {
        sessionId,
        statusCode,
        shouldReconnect,
      });

      if (shouldReconnect) {
        await this.handleReconnection(sessionId);
      } else {
        // Logout - delete session
        if (statusCode === DisconnectReason.loggedOut) {
          logger.info(`Session logged out, cleaning up: ${sessionId}`);
          await this.cleanupSession(sessionId);
        }
        
        this.sessionStatus.set(sessionId, SessionStatus.DISCONNECTED);
        await eventNotifier.notifyDisconnected(sessionId);
      }
    } else if (connection === 'open') {
      logger.info(`Connection opened for session: ${sessionId}`);
      
      this.sessionStatus.set(sessionId, SessionStatus.CONNECTED);
      this.reconnectAttempts.set(sessionId, 0);
      this.qrCodes.delete(sessionId); // Clear QR code once connected

      // Get phone number
      const socket = this.sessions.get(sessionId);
      const phoneNumber = socket?.user?.id?.split(':')[0];

      await eventNotifier.notifyConnected(sessionId, phoneNumber);
    } else if (connection === 'connecting') {
      logger.info(`Connecting session: ${sessionId}`);
      this.sessionStatus.set(sessionId, SessionStatus.CONNECTING);
    }
  }

  /**
   * Determine if should reconnect based on disconnect reason
   */
  private shouldReconnect(lastDisconnect: any): boolean {
    const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;

    // Don't reconnect if logged out
    if (statusCode === DisconnectReason.loggedOut) {
      return false;
    }

    // Don't reconnect if connection replaced
    if (statusCode === DisconnectReason.connectionReplaced) {
      return false;
    }

    // Reconnect for other reasons
    return true;
  }

  /**
   * Handle automatic reconnection
   */
  private async handleReconnection(sessionId: string): Promise<void> {
    const attempts = this.reconnectAttempts.get(sessionId) || 0;

    if (attempts >= this.MAX_RECONNECT_ATTEMPTS) {
      logger.error(
        `Max reconnection attempts reached for session: ${sessionId}`
      );
      this.sessionStatus.set(sessionId, SessionStatus.DISCONNECTED);
      await eventNotifier.notifyDisconnected(sessionId);
      return;
    }

    this.reconnectAttempts.set(sessionId, attempts + 1);
    
    // Exponential backoff
    const delay = Math.min(1000 * Math.pow(2, attempts), 30000);
    
    logger.info(`Reconnecting session ${sessionId} in ${delay}ms (attempt ${attempts + 1}/${this.MAX_RECONNECT_ATTEMPTS})`);

    setTimeout(async () => {
      try {
        // Remove old socket
        this.sessions.delete(sessionId);
        
        // Create new connection
        await this.createConnection(sessionId);
      } catch (error) {
        logger.error(`Reconnection failed for session ${sessionId}`, {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }, delay);
  }

  /**
   * Send message through WhatsApp
   */
  async sendMessage(
    sessionId: string,
    to: string,
    message: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const socket = this.sessions.get(sessionId);

    if (!socket) {
      return {
        success: false,
        error: 'Session not found',
      };
    }

    const status = this.sessionStatus.get(sessionId);
    if (status !== SessionStatus.CONNECTED) {
      return {
        success: false,
        error: `Session not connected. Current status: ${status}`,
      };
    }

    try {
      // Format phone number (ensure it has @s.whatsapp.net)
      const jid = to.includes('@') ? to : `${to}@s.whatsapp.net`;

      logger.info(`Sending message`, {
        sessionId,
        to: jid,
        messageLength: message.length,
      });

      const result = await socket.sendMessage(jid, { text: message });

      logger.info(`Message sent successfully`, {
        sessionId,
        messageId: result?.key?.id,
      });

      return {
        success: true,
        messageId: result?.key?.id || undefined,
      };
    } catch (error) {
      logger.error(`Failed to send message`, {
        sessionId,
        to,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get session information
   */
  getSessionInfo(sessionId: string): SessionInfo | null {
    const status = this.sessionStatus.get(sessionId);
    
    if (!status) {
      return null;
    }

    const socket = this.sessions.get(sessionId);
    const qrCode = this.qrCodes.get(sessionId);

    return {
      sessionId,
      status,
      qrCode,
      phoneNumber: socket?.user?.id?.split(':')[0],
    };
  }

  /**
   * Get QR code for session
   */
  getQRCode(sessionId: string): string | null {
    return this.qrCodes.get(sessionId) || null;
  }

  /**
   * Disconnect session
   */
  async disconnect(sessionId: string): Promise<void> {
    logger.info(`Disconnecting session: ${sessionId}`);

    const socket = this.sessions.get(sessionId);
    
    if (socket) {
      try {
        await socket.logout();
      } catch (error) {
        logger.error(`Error during logout for session ${sessionId}`, {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    await this.cleanupSession(sessionId);
    this.sessionStatus.set(sessionId, SessionStatus.DISCONNECTED);
    await eventNotifier.notifyDisconnected(sessionId);
  }

  /**
   * Clean up session data
   */
  private async cleanupSession(sessionId: string): Promise<void> {
    // Remove from memory
    this.sessions.delete(sessionId);
    this.qrCodes.delete(sessionId);
    this.reconnectAttempts.delete(sessionId);

    // Delete session files
    const sessionPath = path.join(SESSIONS_DIR, sessionId);
    
    if (fs.existsSync(sessionPath)) {
      try {
        fs.rmSync(sessionPath, { recursive: true, force: true });
        logger.info(`Deleted session files: ${sessionPath}`);
      } catch (error) {
        logger.error(`Failed to delete session files: ${sessionPath}`, {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  }

  /**
   * Get all active sessions
   */
  getAllSessions(): SessionInfo[] {
    const sessions: SessionInfo[] = [];

    for (const [sessionId, status] of this.sessionStatus.entries()) {
      const info = this.getSessionInfo(sessionId);
      if (info) {
        sessions.push(info);
      }
    }

    return sessions;
  }
}

export const sessionManager = new SessionManager();
