import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { CacheModule } from './common/cache/cache.module';
import { RedisModule } from './common/redis/redis.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { BillingModule } from './modules/billing/billing.module';
import { AdminModule } from './modules/admin/admin.module';
import { AIModule } from './modules/ai/ai.module';
import { ChatbotsModule } from './modules/chatbots/chatbots.module';
import { KnowledgeModule } from './modules/knowledge/knowledge.module';
import { QueuesModule } from './modules/queues/queues.module';
import { ConversationsModule } from './modules/conversations/conversations.module';
import { MessagesModule } from './modules/messages/messages.module';
import { WhatsAppCloudModule } from './modules/whatsapp-cloud/whatsapp-cloud.module';
import { WhatsAppQRModule } from './modules/whatsapp-qr/whatsapp-qr.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { WidgetModule } from './modules/widget/widget.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    RedisModule, // Global Redis connection with retry logic
    CacheModule, // Global cache module for performance optimization
    AuthModule,
    UsersModule,
    BillingModule,
    AdminModule, // Admin panel for system management
    AIModule,
    ChatbotsModule,
    KnowledgeModule,
    QueuesModule,
    ConversationsModule,
    MessagesModule,
    WhatsAppCloudModule,
    WhatsAppQRModule,
    WebhooksModule,
    WidgetModule,
    HealthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
