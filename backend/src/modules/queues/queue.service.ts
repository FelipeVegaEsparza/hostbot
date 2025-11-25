import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QUEUE_NAMES } from './queue-names.constant';
import {
  IncomingMessageJob,
  WebhookDeliveryJob,
  OutgoingMessageJob,
} from './interfaces/queue-job.interface';

/**
 * Service for enqueuing jobs to various queues
 * This service can be injected into other modules to add jobs to queues
 */
@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(
    @InjectQueue(QUEUE_NAMES.INCOMING_MESSAGES)
    private readonly incomingMessagesQueue: Queue,
    @InjectQueue(QUEUE_NAMES.WEBHOOK_DELIVERY)
    private readonly webhookDeliveryQueue: Queue,
    @InjectQueue(QUEUE_NAMES.OUTGOING_MESSAGES)
    private readonly outgoingMessagesQueue: Queue,
  ) { }

  /**
   * Enqueue an incoming message for processing
   */
  async enqueueIncomingMessage(data: IncomingMessageJob): Promise<string> {
    try {
      this.logger.log(`📥 Enqueuing incoming message for conversation: ${data.conversationId}`);
      this.logger.debug(`Message data: ${JSON.stringify({
        conversationId: data.conversationId,
        chatbotId: data.chatbotId,
        channel: data.channel,
        contentLength: data.content.length,
      })}`);

      const job = await this.incomingMessagesQueue.add('process-message', data);

      this.logger.log(`✅ Successfully enqueued incoming message with jobId: ${job.id}`);
      this.logger.debug(`Job details: ${JSON.stringify({
        jobId: job.id,
        queueName: QUEUE_NAMES.INCOMING_MESSAGES,
        timestamp: new Date().toISOString(),
      })}`);

      return job.id;
    } catch (error) {
      this.logger.error(`❌ Failed to enqueue incoming message: ${error.message}`, error.stack);
      this.logger.error(`Failed data: ${JSON.stringify({
        conversationId: data.conversationId,
        chatbotId: data.chatbotId,
        channel: data.channel,
      })}`);
      throw error;
    }
  }

  /**
   * Enqueue an outgoing message for delivery
   */
  async enqueueOutgoingMessage(data: OutgoingMessageJob): Promise<string> {
    try {
      this.logger.log(`📤 Enqueuing outgoing message for conversation: ${data.conversationId}`);
      this.logger.debug(`Message data: ${JSON.stringify({
        conversationId: data.conversationId,
        messageId: data.messageId,
        channel: data.channel,
        contentLength: data.content.length,
      })}`);

      const job = await this.outgoingMessagesQueue.add('send-message', data);

      this.logger.log(`✅ Successfully enqueued outgoing message with jobId: ${job.id}`);

      return job.id;
    } catch (error) {
      this.logger.error(`❌ Failed to enqueue outgoing message: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Enqueue a webhook delivery
   */
  async enqueueWebhookDelivery(data: WebhookDeliveryJob): Promise<string> {
    try {
      this.logger.log(`📥 Enqueuing webhook delivery: ${data.event}`);
      this.logger.debug(`Webhook data: ${JSON.stringify({
        event: data.event,
        url: data.url,
        webhookEventId: data.webhookEventId,
      })}`);

      const job = await this.webhookDeliveryQueue.add('deliver-webhook', data);

      this.logger.log(`✅ Successfully enqueued webhook delivery with jobId: ${job.id}`);

      return job.id;
    } catch (error) {
      this.logger.error(`❌ Failed to enqueue webhook delivery: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(queueName: string): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    let queue: Queue;

    switch (queueName) {
      case QUEUE_NAMES.INCOMING_MESSAGES:
        queue = this.incomingMessagesQueue;
        break;
      case QUEUE_NAMES.WEBHOOK_DELIVERY:
        queue = this.webhookDeliveryQueue;
        break;
      default:
        throw new Error(`Unknown queue: ${queueName}`);
    }

    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
    ]);

    return { waiting, active, completed, failed, delayed };
  }
}
