import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger, Inject, forwardRef } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../../prisma/prisma.service';
import { QUEUE_NAMES } from '../queue-names.constant';
import { WebhookDeliveryJob } from '../interfaces/queue-job.interface';
import axios from 'axios';

@Processor(QUEUE_NAMES.WEBHOOK_DELIVERY)
export class WebhookDeliveryProcessor extends WorkerHost {
  private readonly logger = new Logger(WebhookDeliveryProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
  ) {
    super();
    this.logger.log(`✅ WebhookDeliveryProcessor registered for queue: ${QUEUE_NAMES.WEBHOOK_DELIVERY}`);
  }

  async process(job: Job<WebhookDeliveryJob>): Promise<void> {
    this.logger.log(`Processing webhook delivery: ${job.id}`);
    const { url, event, payload, webhookEventId } = job.data;

    try {
      // Send webhook HTTP POST request
      const response = await axios.post(url, payload, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'ChatbotSaaS-Webhook/1.0',
          'X-Webhook-Event': event,
          'X-Webhook-ID': webhookEventId,
          'X-Webhook-Attempt': String(job.attemptsMade + 1),
        },
        timeout: 10000, // 10 seconds timeout
        validateStatus: (status) => status >= 200 && status < 300,
      });

      this.logger.log(`Webhook delivered successfully: ${webhookEventId} (Status: ${response.status})`);

      // Update webhook event status to sent
      await this.prisma.webhookEvent.update({
        where: { id: webhookEventId },
        data: {
          status: 'SENT',
          processedAt: new Date(),
          attempts: job.attemptsMade + 1,
        },
      });
    } catch (error) {
      this.logger.error(`Error delivering webhook: ${error.message}`, error.stack);

      const errorMessage = error.response
        ? `HTTP ${error.response.status}: ${error.response.statusText}`
        : error.message;

      // Update webhook event with error
      await this.prisma.webhookEvent.update({
        where: { id: webhookEventId },
        data: {
          status: job.attemptsMade >= 2 ? 'FAILED' : 'PENDING', // Mark as failed after 3 attempts
          attempts: job.attemptsMade + 1,
          lastError: errorMessage,
          processedAt: job.attemptsMade >= 2 ? new Date() : null,
        },
      });

      // If this is the last attempt, log the final failure
      if (job.attemptsMade >= 2) {
        this.logger.error(
          `Webhook delivery failed after ${job.attemptsMade + 1} attempts: ${webhookEventId}`,
        );
      }

      throw error; // Will trigger retry with exponential backoff
    }
  }
}
