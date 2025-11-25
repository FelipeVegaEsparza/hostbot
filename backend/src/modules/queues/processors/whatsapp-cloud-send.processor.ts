import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../../prisma/prisma.service';
import { QUEUE_NAMES } from '../queue-names.constant';
import { WhatsAppCloudSendJob } from '../interfaces/queue-job.interface';
import axios from 'axios';

@Processor(QUEUE_NAMES.WHATSAPP_CLOUD_SEND)
export class WhatsAppCloudSendProcessor extends WorkerHost {
  private readonly logger = new Logger(WhatsAppCloudSendProcessor.name);
  private readonly WHATSAPP_API_URL = 'https://graph.facebook.com/v18.0';

  constructor(private readonly prisma: PrismaService) {
    super();
    this.logger.log(`✅ WhatsAppCloudSendProcessor registered for queue: ${QUEUE_NAMES.WHATSAPP_CLOUD_SEND}`);
  }

  async process(job: Job<WhatsAppCloudSendJob>): Promise<void> {
    this.logger.log(`Processing WhatsApp Cloud send: ${job.id}`);
    const { phoneNumberId, accessToken, to, message, messageId, conversationId } = job.data;

    try {
      // Send message via WhatsApp Cloud API
      const response = await axios.post(
        `${this.WHATSAPP_API_URL}/${phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: to,
          type: 'text',
          text: {
            preview_url: false,
            body: message,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000, // 10 seconds timeout
        },
      );

      this.logger.log(`WhatsApp Cloud message sent successfully: ${response.data.messages[0].id}`);

      // Update message status to sent
      await this.prisma.message.update({
        where: { id: messageId },
        data: {
          deliveryStatus: 'SENT',
          metadata: {
            whatsappMessageId: response.data.messages[0].id,
            sentAt: new Date().toISOString(),
          },
        },
      });

      // Log usage
      const conversation = await this.prisma.conversation.findUnique({
        where: { id: conversationId },
        include: {
          chatbot: true,
        },
      });

      if (conversation) {
        await this.prisma.usageLog.create({
          data: {
            customerId: conversation.chatbot.customerId,
            type: 'WHATSAPP_MESSAGE',
            quantity: 1,
            metadata: {
              conversationId,
              messageId,
              channel: 'WHATSAPP_CLOUD',
              whatsappMessageId: response.data.messages[0].id,
            },
          },
        });
      }
    } catch (error) {
      this.logger.error(`Error sending WhatsApp Cloud message: ${error.message}`, error.stack);

      // Update message status to failed
      await this.prisma.message.update({
        where: { id: messageId },
        data: {
          deliveryStatus: 'FAILED',
          metadata: {
            error: error.message,
            failedAt: new Date().toISOString(),
            attempt: job.attemptsMade,
          },
        },
      });

      // If this is the last attempt, log the failure
      if (job.attemptsMade >= 3) {
        this.logger.error(
          `WhatsApp Cloud message failed after ${job.attemptsMade} attempts: ${messageId}`,
        );
      }

      throw error; // Will trigger retry with exponential backoff
    }
  }
}
