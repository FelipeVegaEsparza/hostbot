import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { CustomLogger } from '../../common/logger/custom-logger.service';
import { RedisConnectionService } from '../../common/redis/redis-connection.service';
import { QUEUE_NAMES } from '../queues/queue-names.constant';

export interface HealthCheckResult {
  status: 'ok' | 'error';
  info: Record<string, any>;
  error: Record<string, any>;
  details: Record<string, any>;
}

export interface ComponentHealth {
  status: 'up' | 'down';
  message?: string;
  details?: any;
}

export interface QueueHealthStatus {
  name: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: boolean;
}

export interface WebSocketHealthStatus {
  connected: number;
  rooms: Record<string, number>;
}

export interface AIProviderHealthStatus {
  provider: string;
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failureCount: number;
  lastFailureTime: Date | null;
  nextAttemptTime: Date | null;
  successCount: number;
}

export interface TestMessageStage {
  stage: string;
  timestamp: Date;
  status: 'success' | 'failed';
  details?: any;
  error?: string;
}

export interface TestMessageResponse {
  success: boolean;
  messageId: string;
  conversationId: string;
  stages: TestMessageStage[];
  error?: string;
}

@Injectable()
export class HealthService {
  private readonly logger: CustomLogger;
  private messagesGateway: any; // Will be injected lazily to avoid circular dependency
  private aiService: any; // Will be injected lazily to avoid circular dependency
  private messagesService: any; // Will be injected lazily to avoid circular dependency

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisConnection: RedisConnectionService,
    @InjectQueue(QUEUE_NAMES.INCOMING_MESSAGES) private incomingQueue: Queue,
    @InjectQueue(QUEUE_NAMES.OUTGOING_MESSAGES) private outgoingQueue: Queue,
    @InjectQueue(QUEUE_NAMES.AI_PROCESSING) private aiQueue: Queue,
    @InjectQueue(QUEUE_NAMES.WHATSAPP_CLOUD_SEND) private whatsappCloudQueue: Queue,
    @InjectQueue(QUEUE_NAMES.WHATSAPP_QR_SEND) private whatsappQRQueue: Queue,
    @InjectQueue(QUEUE_NAMES.WEBHOOK_DELIVERY) private webhookQueue: Queue,
  ) {
    this.logger = new CustomLogger();
    this.logger.setContext('HealthService');
  }

  /**
   * Set MessagesGateway instance (called from controller to avoid circular dependency)
   */
  setMessagesGateway(gateway: any) {
    this.messagesGateway = gateway;
  }

  /**
   * Set AIService instance (called from controller to avoid circular dependency)
   */
  setAIService(service: any) {
    this.aiService = service;
  }

  /**
   * Set MessagesService instance (called from controller to avoid circular dependency)
   */
  setMessagesService(service: any) {
    this.messagesService = service;
  }

  async check(): Promise<HealthCheckResult> {
    const checks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkQueues(),
    ]);

    const info: Record<string, any> = {};
    const error: Record<string, any> = {};
    const details: Record<string, any> = {};

    checks.forEach((result, index) => {
      const key = ['database', 'redis', 'queues'][index];
      
      if (result.status === 'fulfilled') {
        const value = result.value;
        details[key] = value;
        
        if (value.status === 'up') {
          info[key] = value;
        } else {
          error[key] = value;
        }
      } else {
        const errorResult = {
          status: 'down' as const,
          message: result.reason?.message || 'Unknown error',
        };
        details[key] = errorResult;
        error[key] = errorResult;
      }
    });

    const status = Object.keys(error).length === 0 ? 'ok' : 'error';

    if (status === 'error') {
      this.logger.error('Health check failed', JSON.stringify(error));
      throw new ServiceUnavailableException({
        status,
        info,
        error,
        details,
      });
    }

    return {
      status,
      info,
      error,
      details,
    };
  }

  async checkDatabase(): Promise<ComponentHealth> {
    try {
      // Execute a simple query to check database connectivity
      await this.prisma.$queryRaw`SELECT 1`;
      
      return {
        status: 'up',
      };
    } catch (error) {
      this.logger.error('Database health check failed', error.message);
      return {
        status: 'down',
        message: error.message,
      };
    }
  }

  async checkRedis(): Promise<ComponentHealth> {
    try {
      const status = await this.redisConnection.getConnectionStatus();
      
      if (!status.connected) {
        throw new Error(`Redis not connected. Status: ${status.status}`);
      }

      return {
        status: 'up',
        details: {
          latency: status.latency,
          connectionStatus: status.status,
        },
      };
    } catch (error) {
      this.logger.error('Redis health check failed', error.message);
      return {
        status: 'down',
        message: error.message,
      };
    }
  }

  async checkQueues(): Promise<ComponentHealth> {
    try {
      const queues = [
        { name: 'incoming-messages', queue: this.incomingQueue },
        { name: 'outgoing-messages', queue: this.outgoingQueue },
        { name: 'ai-processing', queue: this.aiQueue },
      ];

      const queueStats = await Promise.all(
        queues.map(async ({ name, queue }) => {
          const [waiting, active, completed, failed] = await Promise.all([
            queue.getWaitingCount(),
            queue.getActiveCount(),
            queue.getCompletedCount(),
            queue.getFailedCount(),
          ]);

          return {
            name,
            waiting,
            active,
            completed,
            failed,
          };
        }),
      );

      // Check if any queue has too many failed jobs
      const hasIssues = queueStats.some(stat => stat.failed > 100);

      return {
        status: hasIssues ? 'down' : 'up',
        details: {
          queues: queueStats,
        },
        ...(hasIssues && { message: 'Some queues have high failure rates' }),
      };
    } catch (error) {
      this.logger.error('Queues health check failed', error.message);
      return {
        status: 'down',
        message: error.message,
      };
    }
  }

  /**
   * Test message flow by sending a test message and tracking its progress
   */
  async testMessage(
    chatbotId: string,
    channel: string,
    externalUserId: string,
    message: string,
  ): Promise<TestMessageResponse> {
    const stages: TestMessageStage[] = [];
    let messageId: string = '';
    let conversationId: string = '';

    try {
      // Stage 1: Verify chatbot exists
      stages.push({
        stage: 'verify_chatbot',
        timestamp: new Date(),
        status: 'success',
        details: { chatbotId },
      });

      const chatbot = await this.prisma.chatbot.findUnique({
        where: { id: chatbotId },
      });

      if (!chatbot) {
        stages[stages.length - 1].status = 'failed';
        stages[stages.length - 1].error = 'Chatbot not found';
        return {
          success: false,
          messageId: '',
          conversationId: '',
          stages,
          error: 'Chatbot not found',
        };
      }

      // Stage 2: Send message
      if (!this.messagesService) {
        stages.push({
          stage: 'send_message',
          timestamp: new Date(),
          status: 'failed',
          error: 'MessagesService not available',
        });
        return {
          success: false,
          messageId: '',
          conversationId: '',
          stages,
          error: 'MessagesService not available',
        };
      }

      const result = await this.messagesService.send({
        chatbotId,
        channel,
        externalUserId,
        content: message,
      });

      messageId = result.message.id;
      conversationId = result.conversation.id;

      stages.push({
        stage: 'send_message',
        timestamp: new Date(),
        status: 'success',
        details: {
          messageId,
          conversationId,
        },
      });

      // Stage 3: Check if message was enqueued
      const incomingCount = await this.incomingQueue.getWaitingCount();
      stages.push({
        stage: 'check_incoming_queue',
        timestamp: new Date(),
        status: 'success',
        details: {
          waitingCount: incomingCount,
        },
      });

      // Stage 4: Wait a bit and check AI processing queue
      await new Promise(resolve => setTimeout(resolve, 1000));
      const aiCount = await this.aiQueue.getWaitingCount();
      stages.push({
        stage: 'check_ai_queue',
        timestamp: new Date(),
        status: 'success',
        details: {
          waitingCount: aiCount,
        },
      });

      // Stage 5: Check if response message was created
      const messages = await this.prisma.message.findMany({
        where: {
          conversationId,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 2,
      });

      const hasResponse = messages.length > 1 && messages[0].role === 'ASSISTANT';
      stages.push({
        stage: 'check_response',
        timestamp: new Date(),
        status: hasResponse ? 'success' : 'failed',
        details: {
          messageCount: messages.length,
          hasResponse,
        },
      });

      return {
        success: true,
        messageId,
        conversationId,
        stages,
      };
    } catch (error) {
      this.logger.error('Test message failed', error.message);
      stages.push({
        stage: 'error',
        timestamp: new Date(),
        status: 'failed',
        error: error.message,
      });

      return {
        success: false,
        messageId,
        conversationId,
        stages,
        error: error.message,
      };
    }
  }

  /**
   * Get AI providers circuit breaker status
   */
  async getAIProvidersStatus(): Promise<AIProviderHealthStatus[]> {
    if (!this.aiService) {
      this.logger.warn('AIService not available for health check');
      return [];
    }

    try {
      const circuitStatuses = this.aiService.getAllCircuitStatuses();
      const providers: AIProviderHealthStatus[] = [];

      circuitStatuses.forEach((status: any, providerName: string) => {
        providers.push({
          provider: providerName,
          state: status.state,
          failureCount: status.failureCount,
          lastFailureTime: status.lastFailureTime ? new Date(status.lastFailureTime) : null,
          nextAttemptTime: status.nextAttemptTime ? new Date(status.nextAttemptTime) : null,
          successCount: status.successCount,
        });
      });

      return providers;
    } catch (error) {
      this.logger.error('Failed to get AI providers status', error.message);
      return [];
    }
  }

  /**
   * Get WebSocket connection status
   */
  async getWebSocketStatus(): Promise<WebSocketHealthStatus> {
    if (!this.messagesGateway) {
      this.logger.warn('MessagesGateway not available for health check');
      return {
        connected: 0,
        rooms: {},
      };
    }

    try {
      const connected = this.messagesGateway.getConnectedClientsCount();
      const rooms = this.messagesGateway.getRoomsInfo();

      return {
        connected,
        rooms,
      };
    } catch (error) {
      this.logger.error('Failed to get WebSocket status', error.message);
      return {
        connected: 0,
        rooms: {},
      };
    }
  }

  /**
   * Get detailed status of all queues
   */
  async getQueuesStatus(): Promise<QueueHealthStatus[]> {
    const queues = [
      { name: QUEUE_NAMES.INCOMING_MESSAGES, queue: this.incomingQueue },
      { name: QUEUE_NAMES.OUTGOING_MESSAGES, queue: this.outgoingQueue },
      { name: QUEUE_NAMES.AI_PROCESSING, queue: this.aiQueue },
      { name: QUEUE_NAMES.WHATSAPP_CLOUD_SEND, queue: this.whatsappCloudQueue },
      { name: QUEUE_NAMES.WHATSAPP_QR_SEND, queue: this.whatsappQRQueue },
      { name: QUEUE_NAMES.WEBHOOK_DELIVERY, queue: this.webhookQueue },
    ];

    const queueStatuses = await Promise.all(
      queues.map(async ({ name, queue }) => {
        try {
          const [waiting, active, completed, failed, delayed, isPaused] = await Promise.all([
            queue.getWaitingCount(),
            queue.getActiveCount(),
            queue.getCompletedCount(),
            queue.getFailedCount(),
            queue.getDelayedCount(),
            queue.isPaused(),
          ]);

          return {
            name,
            waiting,
            active,
            completed,
            failed,
            delayed,
            paused: isPaused,
          };
        } catch (error) {
          this.logger.error(`Failed to get status for queue ${name}`, error.message);
          return {
            name,
            waiting: -1,
            active: -1,
            completed: -1,
            failed: -1,
            delayed: -1,
            paused: false,
          };
        }
      }),
    );

    return queueStatuses;
  }

  async onModuleDestroy() {
    // Redis connection is managed by RedisConnectionService
  }
}
