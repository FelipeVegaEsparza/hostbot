import {
  Injectable,
  NotFoundException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MessagesService } from '../messages/messages.service';
import { SendWidgetMessageDto } from './dto/send-widget-message.dto';
import { MessageLogger } from '../../common/logger/message-logger.service';

@Injectable()
export class WidgetService {
  private readonly logger = new Logger(WidgetService.name);
  private readonly messageLogger = new MessageLogger();

  constructor(
    private readonly prisma: PrismaService,
    private readonly messagesService: MessagesService,
  ) {}

  /**
   * Send a message from the widget
   * Creates conversation if it doesn't exist and enqueues message for AI processing
   */
  async sendMessage(sendWidgetMessageDto: SendWidgetMessageDto): Promise<{
    conversationId: string;
    messageId: string;
    status: string;
  }> {
    try {
      // Verify chatbot exists and is active
      const chatbot = await this.prisma.chatbot.findUnique({
        where: { id: sendWidgetMessageDto.botId },
        select: {
          id: true,
          isActive: true,
          name: true,
          customerId: true,
        },
      });

      if (!chatbot) {
        throw new NotFoundException(
          `Chatbot with ID ${sendWidgetMessageDto.botId} not found`,
        );
      }

      if (!chatbot.isActive) {
        throw new BadRequestException('Chatbot is not active');
      }

      // Send message using MessagesService (handles conversation creation and queueing)
      const result = await this.messagesService.send({
        chatbotId: sendWidgetMessageDto.botId,
        externalUserId: sendWidgetMessageDto.externalUserId,
        content: sendWidgetMessageDto.message,
        channel: 'WIDGET',
        conversationId: sendWidgetMessageDto.conversationId,
        metadata: {
          ...sendWidgetMessageDto.metadata,
          source: 'widget',
        },
      });

      // Log message received
      this.messageLogger.logMessageReceived(
        result.message.id,
        result.conversation.id,
        'WIDGET',
        sendWidgetMessageDto.message,
        sendWidgetMessageDto.externalUserId,
      );

      // Log message queued
      this.messageLogger.logMessageQueued(
        result.message.id,
        result.conversation.id,
        'incoming-messages',
        result.message.id, // Using messageId as jobId reference
      );

      this.logger.log(
        `Widget message sent for chatbot ${sendWidgetMessageDto.botId}, conversation ${result.conversation.id}`,
      );

      return {
        conversationId: result.conversation.id,
        messageId: result.message.id,
        status: 'accepted',
      };
    } catch (error) {
      this.logger.error(
        `Failed to send widget message: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Get widget configuration for a chatbot
   * Returns public configuration needed by the widget
   */
  async getConfig(botId: string): Promise<{
    botId: string;
    botName: string;
    widgetSettings: {
      theme: string;
      primaryColor: string;
      position: string;
      welcomeMessage: string | null;
      placeholder: string;
      customCss: string | null;
    };
  }> {
    try {
      // Get chatbot with widget settings
      const chatbot = await this.prisma.chatbot.findUnique({
        where: { id: botId },
        select: {
          id: true,
          name: true,
          isActive: true,
          widgetSettings: {
            select: {
              theme: true,
              primaryColor: true,
              position: true,
              welcomeMessage: true,
              placeholder: true,
              customCss: true,
            },
          },
        },
      });

      if (!chatbot) {
        throw new NotFoundException(`Chatbot with ID ${botId} not found`);
      }

      if (!chatbot.isActive) {
        throw new BadRequestException('Chatbot is not active');
      }

      // Return widget configuration with defaults if settings don't exist
      return {
        botId: chatbot.id,
        botName: chatbot.name,
        widgetSettings: chatbot.widgetSettings || {
          theme: 'light',
          primaryColor: '#3B82F6',
          position: 'bottom-right',
          welcomeMessage: null,
          placeholder: 'Type a message...',
          customCss: null,
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to get widget config for bot ${botId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
