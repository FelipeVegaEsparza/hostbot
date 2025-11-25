import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger, Inject, forwardRef } from '@nestjs/common';
import { Job } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../../prisma/prisma.service';
import { QUEUE_NAMES } from '../queue-names.constant';
import {
  OutgoingMessageJob,
  WhatsAppCloudSendJob,
  WhatsAppQRSendJob,
} from '../interfaces/queue-job.interface';
import { MessageLogger } from '../../../common/logger/message-logger.service';
import { MessagesGateway } from '../../messages/messages.gateway';

@Processor(QUEUE_NAMES.OUTGOING_MESSAGES)
export class OutgoingMessagesProcessor extends WorkerHost {
  private readonly logger = new Logger(OutgoingMessagesProcessor.name);
  private readonly messageLogger = new MessageLogger();

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(QUEUE_NAMES.WHATSAPP_CLOUD_SEND)
    private readonly whatsappCloudQueue: Queue,
    @InjectQueue(QUEUE_NAMES.WHATSAPP_QR_SEND)
    private readonly whatsappQRQueue: Queue,
    @Inject(forwardRef(() => MessagesGateway))
    private readonly messagesGateway: MessagesGateway,
  ) {
    super();
    this.logger.log(`✅ OutgoingMessagesProcessor registered for queue: ${QUEUE_NAMES.OUTGOING_MESSAGES}`);
  }

  async process(job: Job<OutgoingMessageJob>): Promise<void> {
    const startTime = Date.now();
    const { conversationId, messageId, externalUserId, content, channel, chatbotId, metadata } =
      job.data;

    // Log processor start
    this.messageLogger.logProcessorStart(
      'OutgoingMessagesProcessor',
      job.id,
      { conversationId, messageId, channel, externalUserId },
    );

    this.logger.log(`Processing outgoing message: ${job.id}`);

    // Log message sending
    this.messageLogger.logMessageSending(
      messageId,
      conversationId,
      channel,
      externalUserId,
    );

    try {
      // Route message based on channel
      switch (channel) {
        case 'WIDGET':
          await this.handleWidgetMessage(messageId, conversationId, channel);
          break;

        case 'WHATSAPP_CLOUD':
          await this.handleWhatsAppCloudMessage(
            chatbotId,
            messageId,
            externalUserId,
            content,
            conversationId,
            channel,
          );
          break;

        case 'WHATSAPP_QR':
          await this.handleWhatsAppQRMessage(
            chatbotId,
            messageId,
            externalUserId,
            content,
            conversationId,
            channel,
          );
          break;

        default:
          throw new Error(`Unknown channel: ${channel}`);
      }

      this.logger.log(`Successfully processed outgoing message: ${messageId}`);

      // Log processor completion
      const duration = Date.now() - startTime;
      this.messageLogger.logProcessorComplete(
        'OutgoingMessagesProcessor',
        job.id,
        duration,
      );
    } catch (error) {
      this.logger.error(`Error processing outgoing message: ${error.message}`, error.stack);
      
      // Log processor error
      this.messageLogger.logProcessorError(
        'OutgoingMessagesProcessor',
        job.id,
        error,
      );

      // Log message failed
      this.messageLogger.logMessageFailed(
        messageId,
        conversationId,
        channel,
        'sending',
        error,
      );

      // Update message status to failed
      await this.prisma.message.update({
        where: { id: messageId },
        data: { deliveryStatus: 'FAILED' },
      });

      throw error; // Will trigger retry
    }
  }

  private async handleWidgetMessage(messageId: string, conversationId: string, channel: string): Promise<void> {
    this.logger.log(`📱 Handling Widget message: ${messageId} for conversation: ${conversationId}`);
    
    // Get the full message to emit via WebSocket
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new Error(`Message not found: ${messageId}`);
    }

    // Emit message via WebSocket to connected clients
    if (this.messagesGateway) {
      this.logger.log(`📡 Emitting message ${messageId} via WebSocket to conversation ${conversationId}`);
      this.messagesGateway.emitNewMessage(conversationId, message);
    } else {
      this.logger.warn(`⚠️  MessagesGateway not available, cannot emit message ${messageId} via WebSocket`);
    }

    // Mark message as sent
    const updatedMessage = await this.prisma.message.update({
      where: { id: messageId },
      data: { deliveryStatus: 'SENT' },
    });

    this.logger.log(`📝 Updated deliveryStatus for message ${messageId}: ${updatedMessage.deliveryStatus}`);

    // Log message sent
    this.messageLogger.logMessageSent(
      messageId,
      conversationId,
      channel,
      'SENT',
    );

    this.logger.log(`✅ Widget message ${messageId} marked as sent and emitted via WebSocket`);
  }

  private async handleWhatsAppCloudMessage(
    chatbotId: string,
    messageId: string,
    to: string,
    message: string,
    conversationId: string,
    channel: string,
  ): Promise<void> {
    // Get WhatsApp Cloud account credentials
    const account = await this.prisma.whatsAppCloudAccount.findUnique({
      where: { chatbotId },
    });

    if (!account || !account.isActive) {
      throw new Error(`WhatsApp Cloud account not found or inactive for chatbot: ${chatbotId}`);
    }

    // Enqueue WhatsApp Cloud send job
    const cloudJob: WhatsAppCloudSendJob = {
      phoneNumberId: account.phoneNumberId,
      accessToken: account.accessToken,
      to,
      message,
      messageId,
      conversationId,
    };

    const jobResult = await this.whatsappCloudQueue.add('send-whatsapp-cloud', cloudJob);

    // Log message queued
    this.messageLogger.logMessageQueued(
      messageId,
      conversationId,
      'whatsapp-cloud-send',
      jobResult.id,
    );

    this.logger.log(`Enqueued WhatsApp Cloud send job for message: ${messageId}`);
  }

  private async handleWhatsAppQRMessage(
    chatbotId: string,
    messageId: string,
    to: string,
    message: string,
    conversationId: string,
    channel: string,
  ): Promise<void> {
    // Get WhatsApp QR session
    const session = await this.prisma.whatsAppQRSession.findUnique({
      where: { chatbotId },
    });

    if (!session || session.status !== 'CONNECTED') {
      throw new Error(`WhatsApp QR session not connected for chatbot: ${chatbotId}`);
    }

    // Enqueue WhatsApp QR send job
    const qrJob: WhatsAppQRSendJob = {
      sessionId: session.sessionId,
      to,
      message,
      messageId,
      conversationId,
    };

    const jobResult = await this.whatsappQRQueue.add('send-whatsapp-qr', qrJob);

    // Log message queued
    this.messageLogger.logMessageQueued(
      messageId,
      conversationId,
      'whatsapp-qr-send',
      jobResult.id,
    );

    this.logger.log(`Enqueued WhatsApp QR send job for message: ${messageId}`);
  }
}
