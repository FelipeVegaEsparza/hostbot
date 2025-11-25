import { Module, forwardRef, OnModuleInit } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ModuleRef } from '@nestjs/core';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { QUEUE_NAMES } from '../queues/queue-names.constant';

@Module({
  imports: [
    PrismaModule,
    BullModule.registerQueue(
      { name: QUEUE_NAMES.INCOMING_MESSAGES },
      { name: QUEUE_NAMES.OUTGOING_MESSAGES },
      { name: QUEUE_NAMES.AI_PROCESSING },
      { name: QUEUE_NAMES.WHATSAPP_CLOUD_SEND },
      { name: QUEUE_NAMES.WHATSAPP_QR_SEND },
      { name: QUEUE_NAMES.WEBHOOK_DELIVERY },
    ),
    // Import MessagesModule to access MessagesGateway
    forwardRef(() => require('../messages/messages.module').MessagesModule),
    // Import AIModule to access AIService
    forwardRef(() => require('../ai/ai.module').AIModule),
  ],
  controllers: [HealthController],
  providers: [HealthService],
  exports: [HealthService],
})
export class HealthModule implements OnModuleInit {
  constructor(
    private moduleRef: ModuleRef,
  ) { }

  async onModuleInit() {
    // Get HealthController from ModuleRef
    const healthController = this.moduleRef.get(HealthController, { strict: false });

    if (!healthController) {
      return;
    }

    // Lazy inject MessagesGateway to avoid circular dependency
    try {
      const messagesGateway = this.moduleRef.get('MessagesGateway', { strict: false });
      if (messagesGateway) {
        healthController.setMessagesGateway(messagesGateway);
      }
    } catch (error) {
      // MessagesGateway might not be available yet, that's okay
    }

    // Lazy inject AIService to avoid circular dependency
    try {
      const { AIService } = await import('../ai/ai.service');
      const aiService = this.moduleRef.get(AIService, { strict: false });
      if (aiService) {
        healthController.setAIService(aiService);
      }
    } catch (error) {
      // AIService might not be available yet, that's okay
    }

    // Lazy inject MessagesService to avoid circular dependency
    try {
      const { MessagesService } = await import('../messages/messages.service');
      const messagesService = this.moduleRef.get(MessagesService, { strict: false });
      if (messagesService) {
        healthController.setMessagesService(messagesService);
      }
    } catch (error) {
      // MessagesService might not be available yet, that's okay
    }
  }
}
