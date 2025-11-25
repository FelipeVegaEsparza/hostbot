import {
  Injectable,
  NotFoundException,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { Message, DeliveryStatus } from '@prisma/client';
import { QueueService } from '../queues/queue.service';
import { ConversationsService } from '../conversations/conversations.service';
import { sanitizeMessageContent } from '../../common/utils/sanitizer.util';

@Injectable()
export class MessagesService {
  private readonly logger = new Logger(MessagesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly queueService: QueueService,
    private readonly conversationsService: ConversationsService,
  ) { }

  /**
   * Create a new message
   */
  async create(createMessageDto: CreateMessageDto): Promise<Message> {
    try {
      // Verify conversation exists
      const conversation = await this.prisma.conversation.findUnique({
        where: { id: createMessageDto.conversationId },
      });

      if (!conversation) {
        throw new NotFoundException(
          `Conversation with ID ${createMessageDto.conversationId} not found`,
        );
      }

      // Sanitize and create message
      const sanitizedContent = sanitizeMessageContent(createMessageDto.content);

      const message = await this.prisma.message.create({
        data: {
          conversationId: createMessageDto.conversationId,
          content: sanitizedContent,
          role: createMessageDto.role,
          deliveryStatus: createMessageDto.deliveryStatus || 'PENDING',
          metadata: createMessageDto.metadata || {},
        },
      });

      // Update conversation's lastMessageAt
      await this.conversationsService.updateLastMessageAt(
        createMessageDto.conversationId,
      );

      this.logger.log(`Created message: ${message.id}`);
      return message;
    } catch (error) {
      this.logger.error(`Failed to create message: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Send a message (creates message and enqueues for processing)
   */
  async send(sendMessageDto: SendMessageDto): Promise<{
    message: Message;
    conversation: any;
  }> {
    try {
      // Find or create conversation
      let conversation;
      if (sendMessageDto.conversationId) {
        conversation = await this.prisma.conversation.findUnique({
          where: { id: sendMessageDto.conversationId },
          include: {
            chatbot: true,
          },
        });

        if (!conversation) {
          throw new NotFoundException(
            `Conversation with ID ${sendMessageDto.conversationId} not found`,
          );
        }
      } else {
        conversation = await this.conversationsService.findOrCreate(
          sendMessageDto.chatbotId,
          sendMessageDto.externalUserId,
          sendMessageDto.channel,
        );
      }

      // Sanitize content and create the user message
      const sanitizedContent = sanitizeMessageContent(sendMessageDto.content);

      const message = await this.create({
        conversationId: conversation.id,
        content: sanitizedContent,
        role: 'USER',
        deliveryStatus: 'SENT',
        metadata: sendMessageDto.metadata,
      });

      // Enqueue message for AI processing
      const jobId = await this.queueService.enqueueIncomingMessage({
        conversationId: conversation.id,
        chatbotId: sendMessageDto.chatbotId,
        externalUserId: sendMessageDto.externalUserId,
        content: sendMessageDto.content,
        channel: sendMessageDto.channel,
        metadata: sendMessageDto.metadata,
      });

      this.logger.log(
        `✅ Message sent and enqueued for processing: messageId=${message.id}, jobId=${jobId}, conversationId=${conversation.id}`,
      );

      return {
        message,
        conversation,
      };
    } catch (error) {
      this.logger.error(`Failed to send message: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get messages for a conversation with pagination
   */
  async findByConversation(
    conversationId: string,
    customerId: string,
    page: number = 1,
    limit: number = 50,
  ): Promise<{
    data: Message[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    // Verify conversation exists and user has access
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        chatbot: {
          select: {
            customerId: true,
          },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException(
        `Conversation with ID ${conversationId} not found`,
      );
    }

    if (conversation.chatbot.customerId !== customerId) {
      throw new ForbiddenException('You do not have access to this conversation');
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.message.findMany({
        where: {
          conversationId,
        },
        orderBy: {
          createdAt: 'asc',
        },
        skip,
        take: limit,
      }),
      this.prisma.message.count({
        where: {
          conversationId,
        },
      }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Update message delivery status
   */
  async updateDeliveryStatus(
    messageId: string,
    status: DeliveryStatus,
  ): Promise<Message> {
    const message = await this.prisma.message.update({
      where: { id: messageId },
      data: {
        deliveryStatus: status,
      },
    });

    this.logger.log(`Updated message ${messageId} delivery status to ${status}`);
    return message;
  }

  /**
   * Get a single message by ID
   */
  async findOne(id: string): Promise<Message> {
    const message = await this.prisma.message.findUnique({
      where: { id },
      include: {
        conversation: {
          include: {
            chatbot: {
              select: {
                id: true,
                name: true,
                customerId: true,
              },
            },
          },
        },
      },
    });

    if (!message) {
      throw new NotFoundException(`Message with ID ${id} not found`);
    }

    return message;
  }

  /**
   * Send a message from a human agent (bypasses AI processing)
   */
  async agentSend(
    conversationId: string,
    content: string,
    customerId: string,
    metadata?: Record<string, any>,
  ): Promise<{
    message: Message;
    conversation: any;
  }> {
    try {
      // Verify conversation exists and user has access
      const conversation = await this.prisma.conversation.findUnique({
        where: { id: conversationId },
        include: {
          chatbot: {
            select: {
              id: true,
              customerId: true,
            },
          },
        },
      });

      if (!conversation) {
        throw new NotFoundException(
          `Conversation with ID ${conversationId} not found`,
        );
      }

      if (conversation.chatbot.customerId !== customerId) {
        throw new ForbiddenException('You do not have access to this conversation');
      }

      // Sanitize content and create the agent message
      const sanitizedContent = sanitizeMessageContent(content);

      const message = await this.create({
        conversationId,
        content: sanitizedContent,
        role: 'ASSISTANT',
        deliveryStatus: 'PENDING',
        metadata: {
          ...metadata,
          isHumanAgent: true,
          sentAt: new Date().toISOString(),
        },
      });

      // Enqueue message for delivery to user (WhatsApp/Widget)
      const jobId = await this.queueService.enqueueOutgoingMessage({
        conversationId,
        messageId: message.id,
        externalUserId: conversation.externalUserId,
        content: sanitizedContent,
        channel: conversation.channel,
        chatbotId: conversation.chatbot.id,
        metadata: {
          isHumanAgent: true,
        },
      });

      this.logger.log(
        `✅ Agent message sent and enqueued for delivery: messageId=${message.id}, jobId=${jobId}`,
      );

      return {
        message,
        conversation,
      };
    } catch (error) {
      this.logger.error(`Failed to send agent message: ${error.message}`, error.stack);
      throw error;
    }
  }
}
