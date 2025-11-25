import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import axios from 'axios';
import { SendWhatsAppMessageDto, CreateWhatsAppCloudAccountDto, WhatsAppMessageDto } from './dto';
import { validateWhatsAppSignature } from '../../common/utils/webhook-signature.util';
import { sanitizeMessageContent } from '../../common/utils/sanitizer.util';

@Injectable()
export class WhatsAppCloudService {
  private readonly logger = new Logger(WhatsAppCloudService.name);
  private readonly WHATSAPP_API_URL = 'https://graph.facebook.com/v18.0';

  constructor(
    private prisma: PrismaService,
    @InjectQueue('whatsapp-cloud-send') private whatsappCloudQueue: Queue,
    @InjectQueue('incoming-messages') private incomingMessagesQueue: Queue,
  ) {}

  /**
   * Validate webhook signature from Meta
   */
  validateWebhookSignature(payload: string, signature: string): boolean {
    try {
      const appSecret = process.env.WHATSAPP_APP_SECRET;
      
      if (!appSecret) {
        this.logger.error('WHATSAPP_APP_SECRET not configured');
        return false;
      }

      return validateWhatsAppSignature(payload, signature, appSecret);
    } catch (error) {
      this.logger.error('Error validating webhook signature', error);
      return false;
    }
  }

  /**
   * Process incoming message from WhatsApp webhook
   */
  async processIncomingMessage(message: WhatsAppMessageDto, phoneNumberId: string): Promise<void> {
    try {
      this.logger.log(`Processing incoming WhatsApp message: ${message.id}`);

      // Find chatbot by phone number ID
      const account = await this.prisma.whatsAppCloudAccount.findFirst({
        where: { phoneNumberId, isActive: true },
        include: { chatbot: true },
      });

      if (!account) {
        this.logger.warn(`No active WhatsApp Cloud account found for phone number: ${phoneNumberId}`);
        return;
      }

      // Extract and sanitize message content
      const rawContent = message.text?.body || '';
      const content = sanitizeMessageContent(rawContent);
      const from = message.from;

      // Find or create conversation
      let conversation = await this.prisma.conversation.findFirst({
        where: {
          chatbotId: account.chatbotId,
          externalUserId: from,
          channel: 'WHATSAPP_CLOUD',
        },
      });

      if (!conversation) {
        conversation = await this.prisma.conversation.create({
          data: {
            chatbotId: account.chatbotId,
            externalUserId: from,
            channel: 'WHATSAPP_CLOUD',
            status: 'ACTIVE',
          },
        });
      }

      // Save incoming message
      const savedMessage = await this.prisma.message.create({
        data: {
          conversationId: conversation.id,
          content,
          role: 'USER',
          deliveryStatus: 'DELIVERED',
          metadata: {
            whatsappMessageId: message.id,
            timestamp: message.timestamp,
          },
        },
      });

      // Update conversation last message timestamp
      await this.prisma.conversation.update({
        where: { id: conversation.id },
        data: { lastMessageAt: new Date() },
      });

      // Enqueue message for processing
      await this.incomingMessagesQueue.add('process-incoming-message', {
        conversationId: conversation.id,
        messageId: savedMessage.id,
        content,
        chatbotId: account.chatbotId,
        externalUserId: from,
        channel: 'WHATSAPP_CLOUD',
        metadata: {
          whatsappMessageId: message.id,
          timestamp: message.timestamp,
        },
      });

      this.logger.log(`Message ${message.id} enqueued for processing`);
    } catch (error) {
      this.logger.error('Error processing incoming message', error);
      throw error;
    }
  }

  /**
   * Send message via WhatsApp Cloud API
   */
  async sendMessage(dto: SendWhatsAppMessageDto): Promise<void> {
    try {
      this.logger.log(`Enqueueing WhatsApp message for chatbot: ${dto.chatbotId}`);

      // Validate chatbot has WhatsApp Cloud account
      const account = await this.prisma.whatsAppCloudAccount.findUnique({
        where: { chatbotId: dto.chatbotId },
      });

      if (!account) {
        throw new NotFoundException(`WhatsApp Cloud account not found for chatbot: ${dto.chatbotId}`);
      }

      if (!account.isActive) {
        throw new BadRequestException(`WhatsApp Cloud account is not active for chatbot: ${dto.chatbotId}`);
      }

      // Find or create conversation
      let conversation = await this.prisma.conversation.findFirst({
        where: {
          chatbotId: dto.chatbotId,
          externalUserId: dto.to,
          channel: 'WHATSAPP_CLOUD',
        },
      });

      if (!conversation) {
        conversation = await this.prisma.conversation.create({
          data: {
            chatbotId: dto.chatbotId,
            externalUserId: dto.to,
            channel: 'WHATSAPP_CLOUD',
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
      await this.whatsappCloudQueue.add(
        'send-whatsapp-message',
        {
          phoneNumberId: account.phoneNumberId,
          accessToken: account.accessToken,
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
   * Send message directly via WhatsApp Cloud API (used by processor)
   */
  async sendMessageDirect(
    phoneNumberId: string,
    accessToken: string,
    to: string,
    message: string
  ): Promise<any> {
    try {
      const url = `${this.WHATSAPP_API_URL}/${phoneNumberId}/messages`;

      const response = await axios.post(
        url,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: to.replace(/\D/g, ''), // Remove non-numeric characters
          type: 'text',
          text: {
            body: message,
          },
        },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      this.logger.log(`Message sent successfully to ${to}: ${response.data.messages[0].id}`);
      return response.data;
    } catch (error) {
      this.logger.error('Error sending message via WhatsApp Cloud API', error.response?.data || error);
      throw error;
    }
  }

  /**
   * Create or update WhatsApp Cloud account
   */
  async createOrUpdateAccount(dto: CreateWhatsAppCloudAccountDto): Promise<any> {
    try {
      // Verify chatbot exists
      const chatbot = await this.prisma.chatbot.findUnique({
        where: { id: dto.chatbotId },
      });

      if (!chatbot) {
        throw new NotFoundException(`Chatbot not found: ${dto.chatbotId}`);
      }

      // Check if account already exists
      const existingAccount = await this.prisma.whatsAppCloudAccount.findUnique({
        where: { chatbotId: dto.chatbotId },
      });

      if (existingAccount) {
        // Update existing account
        return await this.prisma.whatsAppCloudAccount.update({
          where: { chatbotId: dto.chatbotId },
          data: {
            phoneNumberId: dto.phoneNumberId,
            accessToken: dto.accessToken,
            webhookVerifyToken: dto.webhookVerifyToken,
            isActive: true,
          },
        });
      } else {
        // Create new account
        return await this.prisma.whatsAppCloudAccount.create({
          data: {
            chatbotId: dto.chatbotId,
            phoneNumberId: dto.phoneNumberId,
            accessToken: dto.accessToken,
            webhookVerifyToken: dto.webhookVerifyToken,
            isActive: true,
          },
        });
      }
    } catch (error) {
      this.logger.error('Error creating/updating WhatsApp Cloud account', error);
      throw error;
    }
  }

  /**
   * Get WhatsApp Cloud account by chatbot ID
   */
  async getAccountByChatbotId(chatbotId: string): Promise<any> {
    return await this.prisma.whatsAppCloudAccount.findUnique({
      where: { chatbotId },
      include: { chatbot: true },
    });
  }

  /**
   * Deactivate WhatsApp Cloud account
   */
  async deactivateAccount(chatbotId: string): Promise<any> {
    return await this.prisma.whatsAppCloudAccount.update({
      where: { chatbotId },
      data: { isActive: false },
    });
  }

  /**
   * Register webhook event in database
   */
  async registerWebhookEvent(event: string, payload: any, status: 'PENDING' | 'SENT' | 'FAILED' = 'SENT'): Promise<void> {
    try {
      await this.prisma.webhookEvent.create({
        data: {
          url: 'whatsapp-cloud-webhook',
          event,
          payload,
          status,
          attempts: 1,
        },
      });
    } catch (error) {
      this.logger.error('Error registering webhook event', error);
    }
  }
}
