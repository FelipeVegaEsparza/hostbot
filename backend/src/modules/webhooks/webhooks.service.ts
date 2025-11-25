import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { QueueService } from '../queues/queue.service';
import { WebhookStatus } from '@prisma/client';

export interface WebhookConfig {
  customerId: string;
  url: string;
  events: string[];
}

export interface WebhookEventData {
  event: string;
  payload: any;
  url: string;
}

/**
 * Service for managing webhook configurations and delivery
 */
@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly queueService: QueueService,
  ) {}

  /**
   * Trigger a webhook event
   * This will enqueue the webhook for delivery with retries
   */
  async triggerWebhook(
    customerId: string,
    event: string,
    payload: any,
  ): Promise<void> {
    try {
      // Get webhook configurations for this customer and event
      const webhookConfigs = await this.getWebhookConfigsForEvent(
        customerId,
        event,
      );

      if (webhookConfigs.length === 0) {
        this.logger.debug(
          `No webhook configurations found for customer ${customerId} and event ${event}`,
        );
        return;
      }

      // Create webhook event records and enqueue for delivery
      for (const config of webhookConfigs) {
        const webhookEvent = await this.prisma.webhookEvent.create({
          data: {
            url: config.url,
            event,
            payload,
            status: WebhookStatus.PENDING,
            attempts: 0,
          },
        });

        // Enqueue for delivery
        await this.queueService.enqueueWebhookDelivery({
          webhookEventId: webhookEvent.id,
          url: config.url,
          event,
          payload,
        });

        this.logger.log(
          `Webhook event ${webhookEvent.id} enqueued for delivery to ${config.url}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to trigger webhook for event ${event}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Get webhook configurations for a specific customer and event
   * In a real implementation, this would query a WebhookConfig table
   * For now, we'll use a simple in-memory approach or customer metadata
   */
  private async getWebhookConfigsForEvent(
    customerId: string,
    event: string,
  ): Promise<WebhookConfig[]> {
    // TODO: Implement webhook configuration storage
    // For now, return empty array
    // In production, you would query a WebhookConfig table or customer settings
    return [];
  }

  /**
   * Record webhook delivery attempt
   */
  async recordWebhookAttempt(
    webhookEventId: string,
    success: boolean,
    error?: string,
  ): Promise<void> {
    try {
      const webhookEvent = await this.prisma.webhookEvent.findUnique({
        where: { id: webhookEventId },
      });

      if (!webhookEvent) {
        this.logger.warn(`Webhook event ${webhookEventId} not found`);
        return;
      }

      const newAttempts = webhookEvent.attempts + 1;
      const newStatus = success
        ? WebhookStatus.SENT
        : newAttempts >= 3
          ? WebhookStatus.FAILED
          : WebhookStatus.PENDING;

      await this.prisma.webhookEvent.update({
        where: { id: webhookEventId },
        data: {
          attempts: newAttempts,
          status: newStatus,
          lastError: error || null,
          processedAt: success ? new Date() : null,
        },
      });

      this.logger.log(
        `Webhook event ${webhookEventId} attempt ${newAttempts}: ${success ? 'success' : 'failed'}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to record webhook attempt: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Get webhook event by ID
   */
  async getWebhookEvent(id: string) {
    return this.prisma.webhookEvent.findUnique({
      where: { id },
    });
  }

  /**
   * Get webhook events with pagination
   */
  async getWebhookEvents(params: {
    skip?: number;
    take?: number;
    status?: WebhookStatus;
    event?: string;
  }) {
    const { skip = 0, take = 20, status, event } = params;

    const where: any = {};
    if (status) where.status = status;
    if (event) where.event = event;

    const [events, total] = await Promise.all([
      this.prisma.webhookEvent.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.webhookEvent.count({ where }),
    ]);

    return {
      events,
      total,
      page: Math.floor(skip / take) + 1,
      pageSize: take,
      totalPages: Math.ceil(total / take),
    };
  }
}
