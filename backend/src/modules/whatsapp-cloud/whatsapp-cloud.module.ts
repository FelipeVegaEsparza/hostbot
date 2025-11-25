import { Module } from '@nestjs/common';
import { WhatsAppCloudController } from './whatsapp-cloud.controller';
import { WhatsAppCloudService } from './whatsapp-cloud.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    PrismaModule,
    BullModule.registerQueue({
      name: 'whatsapp-cloud-send',
    }),
    BullModule.registerQueue({
      name: 'incoming-messages',
    }),
  ],
  controllers: [WhatsAppCloudController],
  providers: [WhatsAppCloudService],
  exports: [WhatsAppCloudService],
})
export class WhatsAppCloudModule {}
