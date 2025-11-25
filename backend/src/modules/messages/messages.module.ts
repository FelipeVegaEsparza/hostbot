import { Module } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { MessagesGateway } from './messages.gateway';
import { PrismaModule } from '../../prisma/prisma.module';
import { QueuesModule } from '../queues/queues.module';
import { ConversationsModule } from '../conversations/conversations.module';

@Module({
  imports: [PrismaModule, QueuesModule, ConversationsModule],
  controllers: [MessagesController],
  providers: [
    MessagesService,
    MessagesGateway,
    {
      provide: 'MessagesGateway',
      useExisting: MessagesGateway,
    },
  ],
  exports: [MessagesService, MessagesGateway, 'MessagesGateway'],
})
export class MessagesModule {}
