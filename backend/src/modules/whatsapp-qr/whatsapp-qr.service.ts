import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import axios from 'axios';
import {
  InitSessionDto,
  SendWhatsAppQRMessageDto,
  WebhookNotificationDto,
  IncomingMessageDto,
  DisconnectSessionDto,
} from './dto';
import { MessageLogger } from '../../common/logger/message-logger.service';

@Injectable()
export class WhatsAppQRService {
  private readonly logger = new Logger(WhatsAppQRService.name);
  private readonly messageLogger = new MessageLogger();
  private readonly WHATSAPP_QR_SERVICE_URL = process.env.WHATSAPP_QR_SERVICE_URL || 'http://whatsapp-qr-service:3002';

  constructor(
    private prisma: PrismaService,
    @InjectQueue('whatsapp-qr-send') private whatsappQRQueue: Queue,
    @InjectQueue('incoming-messages') private incomingMessagesQueue: Queue,
  ) {
    this.validateConfiguration();
    this.checkMicroserviceHealth();
  }

  /**
   * Validate WhatsApp QR service configuration
   */
  private validateConfiguration(): void {
    this.logger.log('Validating WhatsApp QR service configuration...');
    
    if (!this.WHATSAPP_QR_SERVICE_URL) {
      this.logger.error('❌ WHATSAPP_QR_SERVICE_URL is not configured in environment variables');
      throw new Error('WHATSAPP_QR_SERVICE_URL is required');
    }

    // Check if URL includes protocol
    if (!this.WHATSAPP_QR_SERVICE_URL.startsWith('http://') && 
        !this.WHATSAPP_QR_SERVICE_URL.startsWith('https://')) {
      this.logger.error(
        `❌ WHATSAPP_QR_SERVICE_URL must include protocol (http:// or https://). ` +
        `Current value: ${this.WHATSAPP_QR_SERVICE_URL}`
      );
      throw new Error('WHATSAPP_QR_SERVICE_URL must include protocol (http:// or https://)');
    }

    this.logger.log(`✅ WhatsApp QR Service URL configured: ${this.WHATSAPP_QR_SERVICE_URL}`);
  }

  /**
   * Check if WhatsApp QR microservice is accessible
   */
  private async checkMicroserviceHealth(): Promise<void> {
    try {
      this.logger.log(`Checking WhatsApp QR microservice health at: ${this.WHATSAPP_QR_SERVICE_URL}`);
      
      const response = await axios.get(
        `${this.WHATSAPP_QR_SERVICE_URL}/health`,
        {
          timeout: 5000,
        }
      );

      if (response.status === 200) {
        this.logger.log('✅ WhatsApp QR microservice is accessible and healthy');
      } else {
        this.logger.warn(`⚠️ WhatsApp QR microservice returned unexpected status: ${response.status}`);
      }
    } catch (error) {
      this.logger.error(
        `❌ Failed to connect to WhatsApp QR microservice at ${this.WHATSAPP_QR_SERVICE_URL}`,
        error.message
      );
      this.logger.error('Please ensure the WhatsApp QR microservice is running and the URL is correct');
    }
  }

  /**
   * Get health status of WhatsApp QR microservice
   */
  async getMicroserviceHealth(): Promise<any> {
    try {
      const response = await axios.get(
        `${this.WHATSAPP_QR_SERVICE_URL}/health`,
        {
          timeout: 5000,
        }
      );

      return {
        accessible: true,
        status: response.status,
        data: response.data,
        url: this.WHATSAPP_QR_SERVICE_URL,
      };
    } catch (error) {
      return {
        accessible: false,
        error: error.message,
        url: this.WHATSAPP_QR_SERVICE_URL,
      };
    }
  }

  /**
   * Initialize a new WhatsApp QR session
   */
  async initSession(dto: InitSessionDto): Promise<any> {
    try {
      this.logger.log(`Initializing WhatsApp QR session for chatbot: ${dto.chatbotId}`);

      // Verify chatbot exists
      const chatbot = await this.prisma.chatbot.findUnique({
        where: { id: dto.chatbotId },
      });

      if (!chatbot) {
        throw new NotFoundException(`Chatbot not found: ${dto.chatbotId}`);
      }

      // Check if session already exists
      let session = await this.prisma.whatsAppQRSession.findUnique({
        where: { chatbotId: dto.chatbotId },
      });

      // Generate or reuse session ID
      const sessionId = session?.sessionId || `session_${dto.chatbotId}_${Date.now()}`;

      // Call microservice to initialize session
      this.logger.log(`Calling WhatsApp QR microservice at: ${this.WHATSAPP_QR_SERVICE_URL}/init`);
      
      const response = await axios.post(
        `${this.WHATSAPP_QR_SERVICE_URL}/init`,
        {
          sessionId,
          chatbotId: dto.chatbotId,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );

      this.logger.log(`✅ Microservice responded with status: ${response.status}`);

      if (!response.data.success) {
        this.logger.error('❌ Microservice returned success=false');
        throw new BadRequestException('Failed to initialize session in microservice');
      }

      // Create or update session in database
      if (session) {
        session = await this.prisma.whatsAppQRSession.update({
          where: { chatbotId: dto.chatbotId },
          data: {
            status: 'CONNECTING',
            qrCode: null,
            updatedAt: new Date(),
          },
        });
      } else {
        session = await this.prisma.whatsAppQRSession.create({
          data: {
            chatbotId: dto.chatbotId,
            sessionId,
            status: 'CONNECTING',
          },
        });
      }

      this.logger.log(`Session initialized successfully: ${sessionId}`);

      return {
        success: true,
        sessionId,
        status: session.status,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNREFUSED') {
          this.logger.error(
            `❌ Connection refused to WhatsApp QR microservice at ${this.WHATSAPP_QR_SERVICE_URL}. ` +
            'Please ensure the microservice is running.'
          );
        } else if (error.code === 'ETIMEDOUT') {
          this.logger.error(
            `❌ Connection timeout to WhatsApp QR microservice at ${this.WHATSAPP_QR_SERVICE_URL}`
          );
        } else {
          this.logger.error(
            `❌ Failed to connect to WhatsApp QR microservice: ${error.message}`,
            error.stack
          );
        }
      } else {
        this.logger.error('Error initializing session', error);
      }
      throw error;
    }
  }

  /**
   * Get QR code for a session
   */
  async getQRCode(sessionId: string): Promise<any> {
    try {
      this.logger.log(`Getting QR code for session: ${sessionId}`);

      // Get session from database
      const session = await this.prisma.whatsAppQRSession.findUnique({
        where: { sessionId },
      });

      if (!session) {
        throw new NotFoundException(`Session not found: ${sessionId}`);
      }

      // Call microservice to get QR code
      const response = await axios.get(
        `${this.WHATSAPP_QR_SERVICE_URL}/qr-code/${sessionId}`,
        {
          timeout: 5000,
        }
      );

      if (!response.data.success) {
        throw new BadRequestException('QR code not available');
      }

      return {
        success: true,
        sessionId,
        qrCode: response.data.qrCode,
        status: session.status,
      };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        throw new NotFoundException('QR code not available. Session may not exist or already connected.');
      }
      this.logger.error('Error getting QR code', error);
      throw error;
    }
  }

  /**
   * Get session status
   */
  async getStatus(sessionId: string): Promise<any> {
    try {
      this.logger.log(`Getting status for session: ${sessionId}`);

      // Get session from database
      const session = await this.prisma.whatsAppQRSession.findUnique({
        where: { sessionId },
        include: { chatbot: true },
      });

      if (!session) {
        throw new NotFoundException(`Session not found: ${sessionId}`);
      }

      // Call microservice to get current status
      try {
        const response = await axios.get(
          `${this.WHATSAPP_QR_SERVICE_URL}/status/${sessionId}`,
          {
            timeout: 5000,
          }
        );

        if (response.data.success) {
          return {
            success: true,
            session: {
              sessionId: session.sessionId,
              chatbotId: session.chatbotId,
              status: session.status,
              lastConnectedAt: session.lastConnectedAt,
              microserviceStatus: response.data.session,
            },
          };
        }
      } catch (error) {
        this.logger.warn('Microservice not available, returning database status');
      }

      // Return database status if microservice is not available
      return {
        success: true,
        session: {
          sessionId: session.sessionId,
          chatbotId: session.chatbotId,
          status: session.status,
          lastConnectedAt: session.lastConnectedAt,
        },
      };
    } catch (error) {
      this.logger.error('Error getting session status', error);
      throw error;
    }
  }

  /**
   * Send message via WhatsApp QR
   */
  async sendMessage(dto: SendWhatsAppQRMessageDto): Promise<void> {
    try {
      this.logger.log(`Enqueueing WhatsApp QR message for chatbot: ${dto.chatbotId}`);

      // Validate chatbot has WhatsApp QR session
      const session = await this.prisma.whatsAppQRSession.findUnique({
        where: { chatbotId: dto.chatbotId },
      });

      if (!session) {
        throw new NotFoundException(`WhatsApp QR session not found for chatbot: ${dto.chatbotId}`);
      }

      if (session.status !== 'CONNECTED') {
        throw new BadRequestException(`WhatsApp QR session is not connected for chatbot: ${dto.chatbotId}`);
      }

      // Find or create conversation
      let conversation = await this.prisma.conversation.findFirst({
        where: {
          chatbotId: dto.chatbotId,
          externalUserId: dto.to,
          channel: 'WHATSAPP_QR',
        },
      });

      if (!conversation) {
        conversation = await this.prisma.conversation.create({
          data: {
            chatbotId: dto.chatbotId,
            externalUserId: dto.to,
            channel: 'WHATSAPP_QR',
            status: 'ACTIVE',
          },
        });
      }

      // Create message record
      const message = await this.prisma.message.create({
        data: {
          conversationId: conversation.id,
          content: dto.message,
          role: 'ASSISTANT',
          deliveryStatus: 'PENDING',
          metadata: dto.metadata || {},
        },
      });

      // Enqueue message for sending
      await this.whatsappQRQueue.add(
        'send-whatsapp-qr-message',
        {
          sessionId: session.sessionId,
          to: dto.to,
          message: dto.message,
          messageId: message.id,
          conversationId: conversation.id,
        },
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        }
      );

      this.logger.log(`Message enqueued successfully for ${dto.to}`);
    } catch (error) {
      this.logger.error('Error enqueueing message', error);
      throw error;
    }
  }

  /**
   * Send message directly via WhatsApp QR microservice (used by processor)
   */
  async sendMessageDirect(sessionId: string, to: string, message: string): Promise<any> {
    try {
      // First, validate session status in database
      const session = await this.prisma.whatsAppQRSession.findUnique({
        where: { sessionId },
      });

      if (!session) {
        this.logger.error(`❌ Session not found in database: ${sessionId}`);
        throw new NotFoundException(`WhatsApp QR session not found: ${sessionId}`);
      }

      this.logger.log(
        `📋 Session status check:\n` +
        `  Session ID: ${sessionId}\n` +
        `  Status: ${session.status}\n` +
        `  Last connected: ${session.lastConnectedAt || 'Never'}`
      );

      if (session.status !== 'CONNECTED') {
        this.logger.error(
          `❌ Cannot send message - session is not connected\n` +
          `  Session ID: ${sessionId}\n` +
          `  Current status: ${session.status}\n` +
          `  Expected status: CONNECTED\n` +
          `  Please ensure the WhatsApp QR session is connected before sending messages.`
        );
        throw new BadRequestException(
          `WhatsApp QR session is not connected. Current status: ${session.status}. ` +
          'Please scan the QR code to connect the session.'
        );
      }

      this.logger.log(
        `📤 Calling WhatsApp QR microservice to send message\n` +
        `  URL: ${this.WHATSAPP_QR_SERVICE_URL}/send\n` +
        `  Session: ${sessionId}\n` +
        `  To: ${to}\n` +
        `  Message length: ${message.length} chars`
      );

      const payload = {
        sessionId,
        to,
        message,
      };

      this.logger.debug(`Request payload: ${JSON.stringify(payload)}`);

      const response = await axios.post(
        `${this.WHATSAPP_QR_SERVICE_URL}/send`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );

      this.logger.log(`✅ Microservice responded with status: ${response.status}`);
      this.logger.debug(`Response data: ${JSON.stringify(response.data)}`);

      if (!response.data.success) {
        this.logger.error('❌ Microservice returned success=false');
        throw new BadRequestException('Failed to send message via microservice');
      }

      this.logger.log(`✅ Message sent successfully to ${to} via session ${sessionId}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNREFUSED') {
          this.logger.error(
            `❌ Connection refused to WhatsApp QR microservice at ${this.WHATSAPP_QR_SERVICE_URL}. ` +
            'Please ensure the microservice is running.'
          );
        } else if (error.code === 'ETIMEDOUT') {
          this.logger.error(
            `❌ Connection timeout to WhatsApp QR microservice at ${this.WHATSAPP_QR_SERVICE_URL}`
          );
        } else if (error.response) {
          this.logger.error(
            `❌ Microservice returned error status ${error.response.status}: ${JSON.stringify(error.response.data)}`
          );
        } else {
          this.logger.error(
            `❌ Failed to connect to WhatsApp QR microservice: ${error.message}`,
            error.stack
          );
        }
      } else {
        this.logger.error('Error sending message via WhatsApp QR microservice', error);
      }
      throw error;
    }
  }

  /**
   * Disconnect a session
   */
  async disconnect(dto: DisconnectSessionDto): Promise<any> {
    try {
      this.logger.log(`Disconnecting WhatsApp QR session for chatbot: ${dto.chatbotId}`);

      // Get session from database
      const session = await this.prisma.whatsAppQRSession.findUnique({
        where: { chatbotId: dto.chatbotId },
      });

      if (!session) {
        throw new NotFoundException(`Session not found for chatbot: ${dto.chatbotId}`);
      }

      // Call microservice to disconnect
      try {
        await axios.post(
          `${this.WHATSAPP_QR_SERVICE_URL}/disconnect`,
          {
            sessionId: session.sessionId,
          },
          {
            headers: {
              'Content-Type': 'application/json',
            },
            timeout: 5000,
          }
        );
      } catch (error) {
        this.logger.warn('Failed to disconnect from microservice, updating database only');
      }

      // Update session status in database
      const updatedSession = await this.prisma.whatsAppQRSession.update({
        where: { chatbotId: dto.chatbotId },
        data: {
          status: 'DISCONNECTED',
          qrCode: null,
        },
      });

      this.logger.log(`Session disconnected successfully: ${session.sessionId}`);

      return {
        success: true,
        sessionId: session.sessionId,
        status: updatedSession.status,
      };
    } catch (error) {
      this.logger.error('Error disconnecting session', error);
      throw error;
    }
  }

  /**
   * Handle webhook notification from microservice
   */
  async handleWebhook(notification: WebhookNotificationDto): Promise<void> {
    try {
      this.logger.log(`Received webhook notification: ${notification.type} for session ${notification.sessionId}`);
      this.logger.log(`Webhook data: ${JSON.stringify(notification.data)}`);

      // Find session in database
      const session = await this.prisma.whatsAppQRSession.findUnique({
        where: { sessionId: notification.sessionId },
      });

      // Validate sessionId exists before updating
      if (!session) {
        this.logger.warn(`Session not found for webhook: ${notification.sessionId}. Ignoring notification.`);
        return;
      }

      this.logger.log(`Session found: ${session.id}, current status: ${session.status}`);

      // Handle different notification types
      switch (notification.type) {
        case 'qr':
          this.logger.log(`Handling QR notification for session: ${session.sessionId}`);
          await this.handleQRNotification(session, notification.data);
          this.logger.log(`QR notification handled successfully`);
          break;
        case 'connected':
          await this.handleConnectedNotification(session, notification.data);
          break;
        case 'disconnected':
          await this.handleDisconnectedNotification(session, notification.data);
          break;
        default:
          this.logger.warn(`Unknown notification type: ${notification.type}`);
      }
    } catch (error) {
      this.logger.error('Error handling webhook notification', error);
      this.logger.error(`Error stack: ${error.stack}`);
      // Don't rethrow - we want to handle errors gracefully to prevent retries
    }
  }

  /**
   * Handle QR code notification
   */
  private async handleQRNotification(session: any, data: any): Promise<void> {
    await this.prisma.whatsAppQRSession.update({
      where: { id: session.id },
      data: {
        status: 'QR_READY',
        qrCode: data.qrCode,
      },
    });
    this.logger.log(`QR code updated for session: ${session.sessionId}`);
  }

  /**
   * Handle connected notification
   */
  private async handleConnectedNotification(session: any, data: any): Promise<void> {
    await this.prisma.whatsAppQRSession.update({
      where: { id: session.id },
      data: {
        status: 'CONNECTED',
        qrCode: null,
        lastConnectedAt: new Date(),
      },
    });
    this.logger.log(`Session connected: ${session.sessionId}`);
  }

  /**
   * Handle disconnected notification
   */
  private async handleDisconnectedNotification(session: any, data: any): Promise<void> {
    await this.prisma.whatsAppQRSession.update({
      where: { id: session.id },
      data: {
        status: 'DISCONNECTED',
        qrCode: null,
      },
    });
    this.logger.log(`Session disconnected: ${session.sessionId}`);
  }

  /**
   * Handle incoming message from microservice
   */
  async handleIncomingMessage(dto: IncomingMessageDto): Promise<void> {
    try {
      this.logger.log(`Processing incoming WhatsApp QR message: ${dto.messageId}`);

      // Find session in database
      const session = await this.prisma.whatsAppQRSession.findUnique({
        where: { sessionId: dto.sessionId },
        include: { chatbot: true },
      });

      if (!session) {
        this.logger.warn(`Session not found for incoming message: ${dto.sessionId}`);
        return;
      }

      // Find or create conversation
      let conversation = await this.prisma.conversation.findFirst({
        where: {
          chatbotId: session.chatbotId,
          externalUserId: dto.from,
          channel: 'WHATSAPP_QR',
        },
      });

      if (!conversation) {
        conversation = await this.prisma.conversation.create({
          data: {
            chatbotId: session.chatbotId,
            externalUserId: dto.from,
            channel: 'WHATSAPP_QR',
            status: 'ACTIVE',
          },
        });
      }

      // Save incoming message
      const savedMessage = await this.prisma.message.create({
        data: {
          conversationId: conversation.id,
          content: dto.message,
          role: 'USER',
          deliveryStatus: 'DELIVERED',
          metadata: {
            whatsappMessageId: dto.messageId,
            timestamp: dto.timestamp,
          },
        },
      });

      // Log message received
      this.messageLogger.logMessageReceived(
        savedMessage.id,
        conversation.id,
        'WHATSAPP_QR',
        dto.message,
        dto.from,
      );

      // Update conversation last message timestamp
      await this.prisma.conversation.update({
        where: { id: conversation.id },
        data: { lastMessageAt: new Date() },
      });

      // Enqueue message for processing
      const job = await this.incomingMessagesQueue.add('process-incoming-message', {
        conversationId: conversation.id,
        messageId: savedMessage.id,
        content: dto.message,
        chatbotId: session.chatbotId,
        externalUserId: dto.from,
        channel: 'WHATSAPP_QR',
        metadata: {
          whatsappMessageId: dto.messageId,
          timestamp: dto.timestamp,
        },
      });

      // Log message queued
      this.messageLogger.logMessageQueued(
        savedMessage.id,
        conversation.id,
        'incoming-messages',
        job.id,
      );

      this.logger.log(`Message ${dto.messageId} enqueued for processing`);
    } catch (error) {
      this.logger.error('Error processing incoming message', error);
      throw error;
    }
  }

  /**
   * Get session by chatbot ID
   */
  async getSessionByChatbotId(chatbotId: string): Promise<any> {
    const session = await this.prisma.whatsAppQRSession.findUnique({
      where: { chatbotId },
      include: { chatbot: true },
    });

    if (!session) {
      return null;
    }

    // Clear qrCode field when status is CONNECTED or DISCONNECTED
    if (session.status === 'CONNECTED' || session.status === 'DISCONNECTED') {
      return {
        ...session,
        qrCode: null,
      };
    }

    // If status is CONNECTING and no QR code in DB, try to fetch from microservice
    if (session.status === 'CONNECTING' && !session.qrCode) {
      try {
        this.logger.log(`Fetching QR code from microservice for session: ${session.sessionId}`);
        const response = await axios.get(
          `${this.WHATSAPP_QR_SERVICE_URL}/qr-code/${session.sessionId}`,
          { timeout: 3000 }
        );
        
        if (response.data.success && response.data.qrCode) {
          this.logger.log(`QR code fetched from microservice, updating database`);
          // Update database with QR code
          const updatedSession = await this.prisma.whatsAppQRSession.update({
            where: { id: session.id },
            data: {
              status: 'QR_READY',
              qrCode: response.data.qrCode,
            },
          });
          return updatedSession;
        }
      } catch (error) {
        this.logger.warn('Could not fetch QR from microservice, returning session as is');
      }
    }

    // Return session with qrCode for QR_READY and CONNECTING statuses
    return session;
  }
}
