import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from '../../prisma/prisma.module';
import { AIModule } from '../ai/ai.module';
import { WhatsAppQRModule } from '../whatsapp-qr/whatsapp-qr.module';
import { KnowledgeModule } from '../knowledge/knowledge.module';

// Processors
import { IncomingMessagesProcessor } from './processors/incoming-messages.processor';
import { AIProcessingProcessor } from './processors/ai-processing.processor';
import { OutgoingMessagesProcessor } from './processors/outgoing-messages.processor';
import { WhatsAppCloudSendProcessor } from './processors/whatsapp-cloud-send.processor';
import { WhatsAppQRSendProcessor } from './processors/whatsapp-qr-send.processor';
import { WebhookDeliveryProcessor } from './processors/webhook-delivery.processor';

// Services
import { QueueService } from './queue.service';

// Queue names - import and re-export from constants file
import { QUEUE_NAMES } from './queue-names.constant';
export { QUEUE_NAMES };

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    AIModule,
    WhatsAppQRModule,
    KnowledgeModule,
    forwardRef(() => require('../messages/messages.module').MessagesModule),
    // Configure BullMQ with Redis
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get('REDIS_HOST') || 'localhost',
          port: configService.get('REDIS_PORT') || 6379,
          password: configService.get('REDIS_PASSWORD'),
        },
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
          removeOnComplete: {
            age: 3600, // Keep completed jobs for 1 hour
            count: 1000,
          },
          removeOnFail: {
            age: 86400, // Keep failed jobs for 24 hours
          },
        },
        // Rate limiting: 10 jobs per second per queue
        limiter: {
          max: 10,
          duration: 1000,
        },
      }),
      inject: [ConfigService],
    }),
    // Register all queues with priority support
    BullModule.registerQueue(
      { 
        name: QUEUE_NAMES.INCOMING_MESSAGES,
        defaultJobOptions: {
          priority: 5, // Default priority (1 = highest, 10 = lowest)
        },
      },
      { 
        name: QUEUE_NAMES.OUTGOING_MESSAGES,
        defaultJobOptions: {
          priority: 5,
        },
      },
      { 
        name: QUEUE_NAMES.AI_PROCESSING,
        defaultJobOptions: {
          priority: 5,
        },
      },
      { 
        name: QUEUE_NAMES.WHATSAPP_CLOUD_SEND,
        defaultJobOptions: {
          priority: 5,
        },
      },
      { 
        name: QUEUE_NAMES.WHATSAPP_QR_SEND,
        defaultJobOptions: {
          priority: 5,
        },
      },
      { 
        name: QUEUE_NAMES.WEBHOOK_DELIVERY,
        defaultJobOptions: {
          priority: 7, // Lower priority for webhooks
        },
      },
    ),
  ],
  providers: [
    IncomingMessagesProcessor,
    AIProcessingProcessor,
    OutgoingMessagesProcessor,
    WhatsAppCloudSendProcessor,
    WhatsAppQRSendProcessor,
    WebhookDeliveryProcessor,
    QueueService,
  ],
  exports: [BullModule, QueueService],
})
export class QueuesModule {}
