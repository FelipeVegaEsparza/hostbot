import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger, Inject, Optional } from '@nestjs/common';
import { Job } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../../prisma/prisma.service';
import { QUEUE_NAMES } from '../queue-names.constant';
import { IncomingMessageJob, AIProcessingJob } from '../interfaces/queue-job.interface';
import { MessagesGateway } from '../../messages/messages.gateway';
import { MessageLogger } from '../../../common/logger/message-logger.service';

@Processor(QUEUE_NAMES.INCOMING_MESSAGES)
export class IncomingMessagesProcessor extends WorkerHost {
  private readonly logger = new Logger(IncomingMessagesProcessor.name);
  private readonly messageLogger = new MessageLogger();

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(QUEUE_NAMES.AI_PROCESSING)
    private readonly aiProcessingQueue: Queue,
    @Optional() @Inject('MessagesGateway')
    private readonly messagesGateway?: MessagesGateway,
  ) {
    super();
    this.logger.log(`✅ IncomingMessagesProcessor registered for queue: ${QUEUE_NAMES.INCOMING_MESSAGES}`);
  }

  async process(job: Job<IncomingMessageJob>): Promise<void> {
    const startTime = Date.now();
    const { conversationId, chatbotId, externalUserId, content, channel, metadata } = job.data;

    // Log processor start
    this.messageLogger.logProcessorStart(
      'IncomingMessagesProcessor',
      job.id,
      { conversationId, chatbotId, channel },
    );

    this.logger.log(`Processing incoming message: ${job.id}`);

    try {
      // 1. Get or create conversation
      let conversation = await this.prisma.conversation.findUnique({
        where: { id: conversationId },
        include: {
          chatbot: {
            include: {
              knowledgeBase: true,
            },
          },
        },
      });

      if (!conversation) {
        // Create new conversation
        conversation = await this.prisma.conversation.create({
          data: {
            id: conversationId,
            chatbotId,
            externalUserId,
            channel,
            status: 'ACTIVE',
          },
          include: {
            chatbot: {
              include: {
                knowledgeBase: true,
              },
            },
          },
        });
        this.logger.log(`Created new conversation: ${conversationId}`);
      }

      // 2. Save user message to database
      const userMessage = await this.prisma.message.create({
        data: {
          conversationId,
          content,
          role: 'USER',
          metadata: metadata || {},
          deliveryStatus: 'DELIVERED',
        },
      });

      this.logger.log(`Saved user message: ${userMessage.id}`);

      // Emit message via WebSocket if gateway is available
      if (this.messagesGateway) {
        this.messagesGateway.emitNewMessage(conversationId, userMessage);
      }

      // 3. Update conversation lastMessageAt
      await this.prisma.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: new Date() },
      });

      // 4. Get conversation context (last 10 messages)
      const recentMessages = await this.prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });

      const context = recentMessages
        .reverse()
        .map((msg) => `${msg.role}: ${msg.content}`);

      // 5. Check if conversation is in HUMAN_AGENT mode
      if (conversation.status === 'HUMAN_AGENT') {
        this.logger.log(`⚠️  Conversation ${conversationId} is in HUMAN_AGENT mode. Skipping AI processing.`);

        // Log processor completion without AI processing
        const duration = Date.now() - startTime;
        this.messageLogger.logProcessorComplete(
          'IncomingMessagesProcessor',
          job.id,
          duration,
        );

        return; // Exit early, don't enqueue AI processing
      }

      // 6. Enqueue AI processing job (only if not in HUMAN_AGENT mode)
      const aiJob: AIProcessingJob = {
        conversationId,
        chatbotId,
        messageId: userMessage.id,
        prompt: content,
        context,
        systemPrompt: conversation.chatbot.systemPrompt || undefined,
        aiProvider: conversation.chatbot.aiProvider,
        aiModel: conversation.chatbot.aiModel,
        aiConfig: conversation.chatbot.aiConfig as Record<string, any>,
        knowledgeBaseId: conversation.chatbot.knowledgeBaseId || undefined,
      };

      const priority = await this.getPriority(conversation.chatbot.customerId);
      const aiJobResult = await this.aiProcessingQueue.add('process-ai-request', aiJob, {
        priority,
      });

      // Log message queued for AI processing
      this.messageLogger.logMessageQueued(
        userMessage.id,
        conversationId,
        'ai-processing',
        aiJobResult.id,
      );

      this.logger.log(`Enqueued AI processing job for message: ${userMessage.id}`);

      // 6. Log usage
      await this.prisma.usageLog.create({
        data: {
          customerId: conversation.chatbot.customerId,
          type: 'MESSAGE',
          quantity: 1,
          metadata: {
            conversationId,
            messageId: userMessage.id,
            channel,
          },
        },
      });

      // Log processor completion
      const duration = Date.now() - startTime;
      this.messageLogger.logProcessorComplete(
        'IncomingMessagesProcessor',
        job.id,
        duration,
      );
    } catch (error) {
      this.logger.error(`Error processing incoming message: ${error.message}`, error.stack);

      // Log processor error
      this.messageLogger.logProcessorError(
        'IncomingMessagesProcessor',
        job.id,
        error,
      );

      // Log message failed (using conversationId as identifier since messageId isn't available yet)
      this.messageLogger.logMessageFailed(
        conversationId, // Using conversationId as identifier
        conversationId,
        channel,
        'processing',
        error,
      );

      throw error; // Will trigger retry
    }
  }

  private async getPriority(customerId: string): Promise<number> {
    // Get customer's subscription to determine priority
    try {
      const customer = await this.prisma.customer.findUnique({
        where: { id: customerId },
        include: {
          subscription: {
            include: {
              plan: true,
            },
          },
        },
      });

      if (!customer?.subscription) {
        return 5; // Default priority
      }

      // Higher tier plans get higher priority (lower number = higher priority)
      const planPrice = Number(customer.subscription.plan.price);
      if (planPrice >= 100) return 1; // Premium
      if (planPrice >= 50) return 3; // Pro
      return 5; // Basic
    } catch (error) {
      this.logger.warn(`Could not determine priority for customer ${customerId}`);
      return 5;
    }
  }
}
