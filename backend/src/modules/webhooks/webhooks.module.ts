import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { QueuesModule } from '../queues/queues.module';
import { WebhooksService } from './webhooks.service';
import { ApiKeysController } from './api-keys.controller';
import { ApiKeysService } from './api-keys.service';

@Module({
  imports: [PrismaModule, QueuesModule],
  controllers: [ApiKeysController],
  providers: [WebhooksService, ApiKeysService],
  exports: [WebhooksService, ApiKeysService],
})
export class WebhooksModule {}
