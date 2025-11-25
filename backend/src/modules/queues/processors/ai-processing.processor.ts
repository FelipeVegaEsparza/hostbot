import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger, Inject, Optional } from '@nestjs/common';
import { Job } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../../prisma/prisma.service';
import { AIService } from '../../ai/ai.service';
import { KnowledgeService } from '../../knowledge/knowledge.service';
import { QUEUE_NAMES } from '../queue-names.constant';
import { AIProcessingJob, OutgoingMessageJob } from '../interfaces/queue-job.interface';
import { MessagesGateway } from '../../messages/messages.gateway';
import { MessageLogger } from '../../../common/logger/message-logger.service';

@Processor(QUEUE_NAMES.AI_PROCESSING)
export class AIProcessingProcessor extends WorkerHost {
  private readonly logger = new Logger(AIProcessingProcessor.name);
  private readonly messageLogger = new MessageLogger();

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AIService,
    private readonly knowledgeService: KnowledgeService,
    @InjectQueue(QUEUE_NAMES.OUTGOING_MESSAGES)
    private readonly outgoingMessagesQueue: Queue,
    @Optional() @Inject('MessagesGateway')
    private readonly messagesGateway?: MessagesGateway,
  ) {
    super();
    this.logger.log(`✅ AIProcessingProcessor registered for queue: ${QUEUE_NAMES.AI_PROCESSING}`);
  }

  async process(job: Job<AIProcessingJob>): Promise<void> {
    const startTime = Date.now();
    const {
      conversationId,
      chatbotId,
      messageId,
      prompt,
      context,
      systemPrompt,
      aiProvider,
      aiModel,
      aiConfig,
      knowledgeBaseId,
    } = job.data;

    // Log processor start
    this.messageLogger.logProcessorStart(
      'AIProcessingProcessor',
      job.id,
      { conversationId, chatbotId, aiProvider, aiModel },
    );

    this.logger.log(`Processing AI request: ${job.id}`);

    try {
      // Log AI processing start
      this.messageLogger.logAIProcessing(
        messageId,
        conversationId,
        aiProvider,
        aiModel,
        prompt.length,
      );

      // 1. Get knowledge base context if available
      let knowledgeContext: string[] = [];
      if (knowledgeBaseId) {
        knowledgeContext = await this.getKnowledgeContext(knowledgeBaseId, prompt);
      }

      // 2. Prepare full context with knowledge base
      const fullContext = [...knowledgeContext, ...context];

      // 3. Request AI response
      this.logger.log(`Requesting AI response from ${aiProvider}/${aiModel}`);
      const aiStartTime = Date.now();
      const aiResponse = await this.aiService.generateResponse(aiProvider, {
        model: aiModel,
        prompt,
        context: fullContext,
        systemPrompt,
        temperature: aiConfig.temperature || 0.7,
        maxTokens: aiConfig.maxTokens || 1000,
      });
      const aiProcessingTime = Date.now() - aiStartTime;

      this.logger.log(`Received AI response: ${aiResponse.content.substring(0, 100)}...`);

      // Log AI response
      this.messageLogger.logAIResponse(
        messageId,
        conversationId,
        aiProvider,
        aiModel,
        aiResponse.tokensUsed || 0,
        aiResponse.content.length,
        aiProcessingTime,
      );

      // 4. Save assistant message to database
      this.logger.log(`💾 Saving assistant message to database...`);
      const assistantMessage = await this.prisma.message.create({
        data: {
          conversationId,
          content: aiResponse.content,
          role: 'ASSISTANT',
          metadata: {
            aiProvider,
            aiModel,
            tokensUsed: aiResponse.tokensUsed,
            finishReason: aiResponse.finishReason,
          },
          deliveryStatus: 'PENDING',
        },
      });

      this.logger.log(
        `✅ Saved assistant message: ${assistantMessage.id} ` +
        `(content length: ${aiResponse.content.length}, tokens: ${aiResponse.tokensUsed})`
      );

      // Verify the message was saved correctly
      if (!assistantMessage.content || assistantMessage.content.length === 0) {
        this.logger.error(`❌ Assistant message saved with empty content!`);
        throw new Error('Assistant message content is empty');
      }

      // Verify metadata was saved
      const metadata = assistantMessage.metadata as any;
      if (!metadata || !metadata.aiProvider || !metadata.aiModel) {
        this.logger.warn(`⚠️  Assistant message metadata incomplete: ${JSON.stringify(metadata)}`);
      } else {
        this.logger.log(
          `✅ Message metadata saved: provider=${metadata.aiProvider}, ` +
          `model=${metadata.aiModel}, tokens=${metadata.tokensUsed}`
        );
      }

      // Emit message via WebSocket if gateway is available
      if (this.messagesGateway) {
        this.messagesGateway.emitNewMessage(conversationId, assistantMessage);
      }

      // 5. Update conversation lastMessageAt
      await this.prisma.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: new Date() },
      });

      // 6. Get conversation details for routing
      const conversation = await this.prisma.conversation.findUnique({
        where: { id: conversationId },
        include: {
          chatbot: true,
        },
      });

      if (!conversation) {
        throw new Error(`Conversation ${conversationId} not found`);
      }

      // 7. Enqueue outgoing message job
      const outgoingJob: OutgoingMessageJob = {
        conversationId,
        messageId: assistantMessage.id,
        externalUserId: conversation.externalUserId,
        content: aiResponse.content,
        channel: conversation.channel,
        chatbotId,
        metadata: {
          aiProvider,
          aiModel,
        },
      };

      const outgoingJobResult = await this.outgoingMessagesQueue.add('send-message', outgoingJob);

      // Log message queued for outgoing
      this.messageLogger.logMessageQueued(
        assistantMessage.id,
        conversationId,
        'outgoing-messages',
        outgoingJobResult.id,
      );

      this.logger.log(`Enqueued outgoing message job: ${assistantMessage.id}`);

      // 8. Log AI usage
      await this.prisma.usageLog.create({
        data: {
          customerId: conversation.chatbot.customerId,
          type: 'AI_REQUEST',
          quantity: aiResponse.tokensUsed || 1,
          metadata: {
            conversationId,
            messageId: assistantMessage.id,
            aiProvider,
            aiModel,
            tokensUsed: aiResponse.tokensUsed,
          },
        },
      });

      // Log processor completion
      const duration = Date.now() - startTime;
      this.messageLogger.logProcessorComplete(
        'AIProcessingProcessor',
        job.id,
        duration,
      );
    } catch (error) {
      // Determine error type and create appropriate error message
      let errorMessage = 'Lo siento, hubo un error al procesar tu mensaje. Por favor, intenta nuevamente.';
      let shouldRetry = true;

      if (error.message?.includes('not configured') || error.message?.includes('API key')) {
        errorMessage = 'Lo siento, el servicio de IA no está configurado correctamente. Por favor, contacta al administrador.';
        shouldRetry = false;
        this.logger.error(`❌ Configuration error for ${aiProvider}: ${error.message}`);
      } else if (error.message?.includes('Invalid model')) {
        errorMessage = `Lo siento, el modelo de IA "${aiModel}" no es válido para el proveedor "${aiProvider}". Por favor, contacta al administrador.`;
        shouldRetry = false;
        this.logger.error(`❌ Invalid model error: ${error.message}`);
      } else if (error.status === 503 || error.message?.includes('Circuit breaker')) {
        errorMessage = `Lo siento, el servicio de IA está temporalmente no disponible. Por favor, intenta nuevamente en unos momentos.`;
        shouldRetry = true;
        this.logger.error(`❌ Circuit breaker OPEN for ${aiProvider}: ${error.message}`);
      } else if (error.message?.includes('rate limit') || error.status === 429) {
        errorMessage = 'Lo siento, hemos alcanzado el límite de solicitudes. Por favor, intenta nuevamente en unos momentos.';
        shouldRetry = true;
        this.logger.error(`❌ Rate limit error for ${aiProvider}: ${error.message}`);
      } else {
        this.logger.error(`❌ Unexpected error processing AI request: ${error.message}`, error.stack);
      }
      
      // Log processor error
      this.messageLogger.logProcessorError(
        'AIProcessingProcessor',
        job.id,
        error,
      );

      // Log message failed
      this.messageLogger.logMessageFailed(
        messageId,
        conversationId,
        'N/A',
        'ai_response',
        error,
      );

      // Save error message
      await this.prisma.message.create({
        data: {
          conversationId,
          content: errorMessage,
          role: 'ASSISTANT',
          metadata: {
            error: error.message,
            errorType: error.constructor.name,
            aiProvider,
            aiModel,
            isErrorMessage: true,
          },
          deliveryStatus: 'FAILED',
        },
      });

      // Only throw error if we should retry
      if (shouldRetry) {
        throw error; // Will trigger retry
      }
    }
  }

  private async getKnowledgeContext(
    knowledgeBaseId: string,
    query: string,
  ): Promise<string[]> {
    try {
      // Use KnowledgeService to get context with full-text search
      return await this.knowledgeService.getKnowledgeContext(
        knowledgeBaseId,
        query,
        5,
      );
    } catch (error) {
      this.logger.warn(`Could not fetch knowledge context: ${error.message}`);
      return [];
    }
  }
}
