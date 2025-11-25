import { Module } from '@nestjs/common';
import { WhatsAppQRController } from './whatsapp-qr.controller';
import { WhatsAppQRService } from './whatsapp-qr.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    PrismaModule,
    BullModule.registerQueue({
      name: 'whatsapp-qr-send',
    }),
    BullModule.registerQueue({
      name: 'incoming-messages',
    }),
  ],
  controllers: [WhatsAppQRController],
  providers: [WhatsAppQRService],
  exports: [WhatsAppQRService],
})
export class WhatsAppQRModule {}
