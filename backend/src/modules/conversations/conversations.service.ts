import {
  Injectable,
  NotFoundException,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { Conversation, Prisma } from '@prisma/client';

@Injectable()
export class ConversationsService {
  private readonly logger = new Logger(ConversationsService.name);

  constructor(private readonly prisma: PrismaService) { }

  /**
   * Create a new conversation
   */
  async create(createConversationDto: CreateConversationDto): Promise<Conversation> {
    try {
      // Verify chatbot exists
      const chatbot = await this.prisma.chatbot.findUnique({
        where: { id: createConversationDto.chatbotId },
      });

      if (!chatbot) {
        throw new NotFoundException(
          `Chatbot with ID ${createConversationDto.chatbotId} not found`,
        );
      }

      // Check if conversation already exists
      const existingConversation = await this.prisma.conversation.findFirst({
        where: {
          chatbotId: createConversationDto.chatbotId,
          externalUserId: createConversationDto.externalUserId,
          channel: createConversationDto.channel,
          status: 'ACTIVE',
        },
      });

      if (existingConversation) {
        this.logger.log(
          `Returning existing conversation: ${existingConversation.id}`,
        );
        return existingConversation;
      }

      // Create new conversation
      const conversation = await this.prisma.conversation.create({
        data: {
          chatbotId: createConversationDto.chatbotId,
          externalUserId: createConversationDto.externalUserId,
          channel: createConversationDto.channel,
        },
        include: {
          chatbot: {
            select: {
              id: true,
              name: true,
              customerId: true,
            },
          },
        },
      });

      this.logger.log(`Created new conversation: ${conversation.id}`);
      return conversation;
    } catch (error) {
      this.logger.error(`Failed to create conversation: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Find or create a conversation
   */
  async findOrCreate(
    chatbotId: string,
    externalUserId: string,
    channel: 'WIDGET' | 'WHATSAPP_CLOUD' | 'WHATSAPP_QR',
  ): Promise<Conversation> {
    // Try to find existing active conversation
    const existingConversation = await this.prisma.conversation.findFirst({
      where: {
        chatbotId,
        externalUserId,
        channel,
        status: 'ACTIVE',
      },
      include: {
        chatbot: {
          select: {
            id: true,
            name: true,
            customerId: true,
          },
        },
      },
    });

    if (existingConversation) {
      return existingConversation;
    }

    // Create new conversation
    return this.create({
      chatbotId,
      externalUserId,
      channel,
    });
  }

  /**
   * Get all conversations for a customer
   */
  async findAllByCustomer(
    customerId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    data: Conversation[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.conversation.findMany({
        where: {
          chatbot: {
            customerId,
          },
        },
        include: {
          chatbot: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              messages: true,
            },
          },
        },
        orderBy: {
          lastMessageAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.conversation.count({
        where: {
          chatbot: {
            customerId,
          },
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
   * Get a single conversation by ID
   */
  async findOne(id: string, customerId: string): Promise<Conversation> {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id },
      include: {
        chatbot: {
          select: {
            id: true,
            name: true,
            customerId: true,
          },
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException(`Conversation with ID ${id} not found`);
    }

    // Verify ownership
    if (conversation.chatbot.customerId !== customerId) {
      throw new ForbiddenException('You do not have access to this conversation');
    }

    return conversation;
  }

  /**
   * Update a conversation
   */
  async update(
    id: string,
    customerId: string,
    updateConversationDto: UpdateConversationDto,
  ): Promise<Conversation> {
    // Verify ownership
    await this.findOne(id, customerId);

    const conversation = await this.prisma.conversation.update({
      where: { id },
      data: updateConversationDto,
      include: {
        chatbot: {
          select: {
            id: true,
            name: true,
            customerId: true,
          },
        },
      },
    });

    this.logger.log(`Updated conversation: ${id}`);
    return conversation;
  }

  /**
   * Update lastMessageAt timestamp
   */
  async updateLastMessageAt(conversationId: string): Promise<void> {
    try {
      await this.prisma.conversation.update({
        where: { id: conversationId },
        data: {
          lastMessageAt: new Date(),
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to update lastMessageAt for conversation ${conversationId}: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Delete a conversation
   */
  async remove(id: string, customerId: string): Promise<void> {
    // Verify ownership
    await this.findOne(id, customerId);

    await this.prisma.conversation.delete({
      where: { id },
    });

    this.logger.log(`Deleted conversation: ${id}`);
  }

  /**
   * Takeover conversation - Switch to HUMAN_AGENT mode
   */
  async takeover(id: string, customerId: string): Promise<Conversation> {
    // Verify ownership
    await this.findOne(id, customerId);

    const conversation = await this.prisma.conversation.update({
      where: { id },
      data: { status: 'HUMAN_AGENT' },
      include: {
        chatbot: {
          select: {
            id: true,
            name: true,
            customerId: true,
          },
        },
      },
    });

    this.logger.log(`Conversation ${id} taken over by human agent`);
    return conversation;
  }

  /**
   * Release conversation - Return to ACTIVE mode (AI control)
   */
  async release(id: string, customerId: string): Promise<Conversation> {
    // Verify ownership
    await this.findOne(id, customerId);

    const conversation = await this.prisma.conversation.update({
      where: { id },
      data: { status: 'ACTIVE' },
      include: {
        chatbot: {
          select: {
            id: true,
            name: true,
            customerId: true,
          },
        },
      },
    });

    this.logger.log(`Conversation ${id} released back to AI`);
    return conversation;
  }
}
