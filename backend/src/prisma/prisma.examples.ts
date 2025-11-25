/**
 * Prisma Service Usage Examples
 * 
 * This file contains examples of how to use the PrismaService
 * in your NestJS services and controllers.
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class PrismaExamplesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Example 1: Create a new user with customer
   */
  async createUserWithCustomer(email: string, password: string, name: string) {
    return await this.prisma.user.create({
      data: {
        email,
        password, // Should be hashed before storing
        name,
        customer: {
          create: {
            companyName: name,
          },
        },
      },
      include: {
        customer: true,
      },
    });
  }

  /**
   * Example 2: Create a chatbot with widget settings
   */
  async createChatbot(customerId: string, name: string, aiProvider: string) {
    return await this.prisma.chatbot.create({
      data: {
        customerId,
        name,
        aiProvider,
        aiModel: 'gpt-4',
        aiConfig: {
          temperature: 0.7,
          maxTokens: 1000,
        },
        widgetSettings: {
          create: {
            theme: 'light',
            primaryColor: '#3B82F6',
            position: 'bottom-right',
            welcomeMessage: 'Hello! How can I help you today?',
          },
        },
      },
      include: {
        widgetSettings: true,
      },
    });
  }

  /**
   * Example 3: Create a conversation with messages
   */
  async createConversationWithMessage(
    chatbotId: string,
    externalUserId: string,
    messageContent: string,
  ) {
    return await this.prisma.conversation.create({
      data: {
        chatbotId,
        externalUserId,
        channel: 'WIDGET',
        messages: {
          create: {
            content: messageContent,
            role: 'USER',
            deliveryStatus: 'SENT',
          },
        },
      },
      include: {
        messages: true,
      },
    });
  }

  /**
   * Example 4: Query conversations with pagination
   */
  async getConversations(chatbotId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [conversations, total] = await Promise.all([
      this.prisma.conversation.findMany({
        where: { chatbotId },
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1, // Get last message
          },
        },
        orderBy: { lastMessageAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.conversation.count({
        where: { chatbotId },
      }),
    ]);

    return {
      data: conversations,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Example 5: Full-text search in knowledge base
   */
  async searchKnowledgeBase(knowledgeBaseId: string, query: string) {
    return await this.prisma.knowledgeItem.findMany({
      where: {
        knowledgeBaseId,
        OR: [
          {
            title: {
              search: query,
            },
          },
          {
            content: {
              search: query,
            },
          },
        ],
      },
      take: 10,
    });
  }

  /**
   * Example 6: Create subscription with plan
   */
  async createSubscription(customerId: string, planId: string) {
    const plan = await this.prisma.plan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      throw new Error('Plan not found');
    }

    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    return await this.prisma.subscription.create({
      data: {
        customerId,
        planId,
        status: 'ACTIVE',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
      include: {
        plan: true,
        customer: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  /**
   * Example 7: Track usage
   */
  async trackUsage(customerId: string, type: 'MESSAGE' | 'AI_REQUEST' | 'WHATSAPP_MESSAGE') {
    return await this.prisma.usageLog.create({
      data: {
        customerId,
        type,
        quantity: 1,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      },
    });
  }

  /**
   * Example 8: Get monthly usage
   */
  async getMonthlyUsage(customerId: string) {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const usage = await this.prisma.usageLog.groupBy({
      by: ['type'],
      where: {
        customerId,
        createdAt: {
          gte: startOfMonth,
        },
      },
      _sum: {
        quantity: true,
      },
    });

    return usage.reduce((acc, item) => {
      acc[item.type] = item._sum.quantity || 0;
      return acc;
    }, {} as Record<string, number>);
  }

  /**
   * Example 9: Create invoice with transaction
   */
  async createInvoiceWithTransaction(
    customerId: string,
    amount: number,
    currency: 'USD' | 'CLP',
    paymentMethod: string,
  ) {
    return await this.prisma.$transaction(async (tx) => {
      // Create invoice
      const invoice = await tx.invoice.create({
        data: {
          invoiceNumber: `INV-${Date.now()}`,
          customerId,
          amount,
          currency,
          status: 'PENDING',
          paymentMethod: paymentMethod as any,
          paymentProvider: 'paypal',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      });

      // Create transaction
      const transaction = await tx.paymentTransaction.create({
        data: {
          customerId,
          invoiceId: invoice.id,
          amount,
          currency,
          status: 'PENDING',
          provider: 'paypal',
          paymentMethod: paymentMethod as any,
        },
      });

      return { invoice, transaction };
    });
  }

  /**
   * Example 10: Update conversation with new message
   */
  async addMessageToConversation(
    conversationId: string,
    content: string,
    role: 'USER' | 'ASSISTANT' | 'SYSTEM',
  ) {
    return await this.prisma.$transaction(async (tx) => {
      // Create message
      const message = await tx.message.create({
        data: {
          conversationId,
          content,
          role,
          deliveryStatus: 'SENT',
        },
      });

      // Update conversation lastMessageAt
      await tx.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: new Date() },
      });

      return message;
    });
  }

  /**
   * Example 11: Get chatbot with all relations
   */
  async getChatbotWithRelations(chatbotId: string) {
    return await this.prisma.chatbot.findUnique({
      where: { id: chatbotId },
      include: {
        customer: {
          include: {
            user: true,
            subscription: {
              include: {
                plan: true,
              },
            },
          },
        },
        widgetSettings: true,
        knowledgeBase: {
          include: {
            items: {
              take: 10,
              orderBy: { createdAt: 'desc' },
            },
          },
        },
        whatsappCloudAccount: true,
        whatsappQRSession: true,
        conversations: {
          take: 5,
          orderBy: { lastMessageAt: 'desc' },
          include: {
            messages: {
              take: 1,
              orderBy: { createdAt: 'desc' },
            },
          },
        },
      },
    });
  }

  /**
   * Example 12: Soft delete pattern (using isActive flag)
   */
  async deactivateChatbot(chatbotId: string) {
    return await this.prisma.chatbot.update({
      where: { id: chatbotId },
      data: { isActive: false },
    });
  }

  /**
   * Example 13: Batch operations
   */
  async createMultipleKnowledgeItems(
    knowledgeBaseId: string,
    items: Array<{ title: string; content: string }>,
  ) {
    return await this.prisma.knowledgeItem.createMany({
      data: items.map((item) => ({
        knowledgeBaseId,
        title: item.title,
        content: item.content,
      })),
    });
  }

  /**
   * Example 14: Complex filtering
   */
  async getActiveChatsWithRecentActivity(customerId: string, hoursAgo: number = 24) {
    const cutoffTime = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);

    return await this.prisma.chatbot.findMany({
      where: {
        customerId,
        isActive: true,
        conversations: {
          some: {
            lastMessageAt: {
              gte: cutoffTime,
            },
            status: 'ACTIVE',
          },
        },
      },
      include: {
        _count: {
          select: {
            conversations: {
              where: {
                lastMessageAt: {
                  gte: cutoffTime,
                },
              },
            },
          },
        },
      },
    });
  }

  /**
   * Example 15: Aggregations
   */
  async getChatbotStatistics(chatbotId: string) {
    const [totalConversations, totalMessages, activeConversations] = await Promise.all([
      this.prisma.conversation.count({
        where: { chatbotId },
      }),
      this.prisma.message.count({
        where: {
          conversation: {
            chatbotId,
          },
        },
      }),
      this.prisma.conversation.count({
        where: {
          chatbotId,
          status: 'ACTIVE',
        },
      }),
    ]);

    return {
      totalConversations,
      totalMessages,
      activeConversations,
      averageMessagesPerConversation:
        totalConversations > 0 ? totalMessages / totalConversations : 0,
    };
  }
}
