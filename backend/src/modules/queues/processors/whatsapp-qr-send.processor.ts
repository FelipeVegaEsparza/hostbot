import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../../prisma/prisma.service';
import { QUEUE_NAMES } from '../queue-names.constant';
import { WhatsAppQRSendJob } from '../interfaces/queue-job.interface';
import { WhatsAppQRService } from '../../whatsapp-qr/whatsapp-qr.service';

@Processor(QUEUE_NAMES.WHATSAPP_QR_SEND)
export class WhatsAppQRSendProcessor extends WorkerHost {
  private readonly logger = new Logger(WhatsAppQRSendProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly whatsappQRService: WhatsAppQRService,
  ) {
    super();
    this.logger.log(`✅ WhatsAppQRSendProcessor registered for queue: ${QUEUE_NAMES.WHATSAPP_QR_SEND}`);
  }

  async process(job: Job<WhatsAppQRSendJob>): Promise<void> {
    this.logger.log(
      `📨 Processing WhatsApp QR send job\n` +
      `  Job ID: ${job.id}\n` +
      `  Attempt: ${job.attemptsMade + 1}/3`
    );
    
    const { sessionId, to, message, messageId, conversationId } = job.data;

    this.logger.log(
      `📋 Job details:\n` +
      `  Session ID: ${sessionId}\n` +
      `  To: ${to}\n` +
      `  Message ID: ${messageId}\n` +
      `  Conversation ID: ${conversationId}\n` +
      `  Message preview: ${message.substring(0, 50)}${message.length > 50 ? '...' : ''}`
    );

    try {
      // Send message via WhatsApp QR microservice
      this.logger.log('Calling WhatsAppQRService.sendMessageDirect()...');
      const response = await this.whatsappQRService.sendMessageDirect(sessionId, to, message);

      this.logger.log(
        `✅ WhatsApp QR message sent successfully\n` +
        `  Response: ${JSON.stringify(response)}`
      );

      // Update message status to sent
      this.logger.log(`Updating message ${messageId} status to SENT...`);
      await this.prisma.message.update({
        where: { id: messageId },
        data: {
          deliveryStatus: 'SENT',
          metadata: {
            whatsappMessageId: response.messageId,
            sentAt: new Date().toISOString(),
          },
        },
      });
      this.logger.log(`✅ Message status updated to SENT`);

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
              channel: 'WHATSAPP_QR',
              whatsappMessageId: response.messageId,
            },
          },
        });
        this.logger.log('✅ Usage logged');
      }

      this.logger.log(`✅ WhatsApp QR send job ${job.id} completed successfully`);
    } catch (error) {
      this.logger.error(
        `❌ Error sending WhatsApp QR message\n` +
        `  Job ID: ${job.id}\n` +
        `  Message ID: ${messageId}\n` +
        `  Attempt: ${job.attemptsMade + 1}/3\n` +
        `  Error: ${error.message}`,
        error.stack
      );

      // Update message status to failed
      this.logger.log(`Updating message ${messageId} status to FAILED...`);
      await this.prisma.message.update({
        where: { id: messageId },
        data: {
          deliveryStatus: 'FAILED',
          metadata: {
            error: error.message,
            failedAt: new Date().toISOString(),
            attempt: job.attemptsMade + 1,
          },
        },
      });

      // If this is the last attempt, log the failure
      if (job.attemptsMade >= 2) {
        this.logger.error(
          `❌ WhatsApp QR message failed after ${job.attemptsMade + 1} attempts\n` +
          `  Message ID: ${messageId}\n` +
          `  Final error: ${error.message}`
        );
      } else {
        this.logger.warn(
          `⚠️ WhatsApp QR message failed, will retry\n` +
          `  Attempt: ${job.attemptsMade + 1}/3\n` +
          `  Next retry in: ${Math.pow(2, job.attemptsMade + 1) * 2}s`
        );
      }

      throw error; // Will trigger retry with exponential backoff
    }
  }
}
