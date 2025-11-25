import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { LogUsageDto } from './dto/log-usage.dto';
import { CreateBillingEventDto } from './dto/create-billing-event.dto';
import { Currency, SubscriptionStatus, UsageType, BillingStatus } from '@prisma/client';

@Injectable()
export class BillingService {
  constructor(private prisma: PrismaService) {}

  // ============================================
  // Plan Management
  // ============================================

  async createPlan(createPlanDto: CreatePlanDto) {
    return this.prisma.plan.create({
      data: {
        name: createPlanDto.name,
        price: createPlanDto.price,
        currency: (createPlanDto.currency as Currency) || Currency.USD,
        maxChatbots: createPlanDto.maxChatbots,
        maxMessagesPerMonth: createPlanDto.maxMessagesPerMonth,
        aiProviders: createPlanDto.aiProviders,
        features: createPlanDto.features || {},
      },
    });
  }

  async findAllPlans() {
    return this.prisma.plan.findMany({
      orderBy: { price: 'asc' },
    });
  }

  async findPlanById(id: string) {
    const plan = await this.prisma.plan.findUnique({
      where: { id },
      include: {
        subscriptions: {
          include: {
            customer: {
              include: {
                user: {
                  select: {
                    id: true,
                    email: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!plan) {
      throw new NotFoundException(`Plan with ID ${id} not found`);
    }

    return plan;
  }

  async updatePlan(id: string, updatePlanDto: UpdatePlanDto) {
    await this.findPlanById(id);

    const updateData: any = { ...updatePlanDto };
    if (updatePlanDto.currency) {
      updateData.currency = updatePlanDto.currency as Currency;
    }

    return this.prisma.plan.update({
      where: { id },
      data: updateData,
    });
  }

  async deletePlan(id: string) {
    const plan = await this.findPlanById(id);

    // Check if plan has active subscriptions
    const activeSubscriptions = await this.prisma.subscription.count({
      where: {
        planId: id,
        status: 'ACTIVE',
      },
    });

    if (activeSubscriptions > 0) {
      throw new BadRequestException(
        `Cannot delete plan with ${activeSubscriptions} active subscriptions`,
      );
    }

    return this.prisma.plan.delete({
      where: { id },
    });
  }

  // ============================================
  // Subscription Management
  // ============================================

  async createSubscription(createSubscriptionDto: CreateSubscriptionDto) {
    const { customerId, planId } = createSubscriptionDto;

    // Verify customer exists
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${customerId} not found`);
    }

    // Verify plan exists
    const plan = await this.prisma.plan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      throw new NotFoundException(`Plan with ID ${planId} not found`);
    }

    // Check if customer already has a subscription
    const existingSubscription = await this.prisma.subscription.findUnique({
      where: { customerId },
    });

    if (existingSubscription) {
      throw new BadRequestException('Customer already has an active subscription');
    }

    // Create subscription with 30-day period
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setDate(periodEnd.getDate() + 30);

    return this.prisma.subscription.create({
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
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        },
      },
    });
  }

  async findSubscriptionByCustomerId(customerId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { customerId },
      include: {
        plan: true,
        customer: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!subscription) {
      throw new NotFoundException(`Subscription for customer ${customerId} not found`);
    }

    return subscription;
  }

  async updateSubscriptionStatus(customerId: string, status: string) {
    await this.findSubscriptionByCustomerId(customerId);

    const validStatuses = ['ACTIVE', 'CANCELLED', 'EXPIRED', 'SUSPENDED'];
    if (!validStatuses.includes(status)) {
      throw new BadRequestException(`Invalid status: ${status}`);
    }

    return this.prisma.subscription.update({
      where: { customerId },
      data: { status: status as SubscriptionStatus },
      include: {
        plan: true,
      },
    });
  }

  async cancelSubscription(customerId: string) {
    return this.updateSubscriptionStatus(customerId, 'CANCELLED');
  }

  // ============================================
  // Plan Limit Validation
  // ============================================

  async validateChatbotLimit(customerId: string): Promise<boolean> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { customerId },
      include: { plan: true },
    });

    if (!subscription || subscription.status !== 'ACTIVE') {
      throw new ForbiddenException('No active subscription found');
    }

    const chatbotCount = await this.prisma.chatbot.count({
      where: { customerId },
    });

    if (chatbotCount >= subscription.plan.maxChatbots) {
      throw new ForbiddenException(
        `Chatbot limit reached. Your plan allows ${subscription.plan.maxChatbots} chatbots.`,
      );
    }

    return true;
  }

  async validateMessageLimit(customerId: string): Promise<boolean> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { customerId },
      include: { plan: true },
    });

    if (!subscription || subscription.status !== 'ACTIVE') {
      throw new ForbiddenException('No active subscription found');
    }

    // Calculate current month usage
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const messageCount = await this.prisma.usageLog.aggregate({
      where: {
        customerId,
        type: 'MESSAGE',
        createdAt: {
          gte: startOfMonth,
        },
      },
      _sum: {
        quantity: true,
      },
    });

    const totalMessages = messageCount._sum.quantity || 0;

    if (totalMessages >= subscription.plan.maxMessagesPerMonth) {
      throw new ForbiddenException(
        `Message limit reached. Your plan allows ${subscription.plan.maxMessagesPerMonth} messages per month.`,
      );
    }

    return true;
  }

  async validateAIProvider(customerId: string, aiProvider: string): Promise<boolean> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { customerId },
      include: { plan: true },
    });

    if (!subscription || subscription.status !== 'ACTIVE') {
      throw new ForbiddenException('No active subscription found');
    }

    const allowedProviders = subscription.plan.aiProviders as string[];

    if (!allowedProviders.includes(aiProvider)) {
      throw new ForbiddenException(
        `AI provider ${aiProvider} is not available in your plan. Allowed providers: ${allowedProviders.join(', ')}`,
      );
    }

    return true;
  }

  // ============================================
  // Usage Logging
  // ============================================

  async logUsage(logUsageDto: LogUsageDto) {
    const { customerId, type, quantity, metadata } = logUsageDto;

    // Verify customer exists
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${customerId} not found`);
    }

    return this.prisma.usageLog.create({
      data: {
        customerId,
        type: type as UsageType,
        quantity,
        metadata: metadata || {},
      },
    });
  }

  async getMonthlyUsage(customerId: string, year?: number, month?: number) {
    const now = new Date();
    const targetYear = year || now.getFullYear();
    const targetMonth = month !== undefined ? month : now.getMonth();

    const startOfMonth = new Date(targetYear, targetMonth, 1);
    const endOfMonth = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);

    const usageLogs = await this.prisma.usageLog.findMany({
      where: {
        customerId,
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Aggregate by type
    const aggregated = usageLogs.reduce((acc, log) => {
      const type = log.type;
      if (!acc[type]) {
        acc[type] = 0;
      }
      acc[type] += log.quantity;
      return acc;
    }, {} as Record<string, number>);

    return {
      customerId,
      period: {
        year: targetYear,
        month: targetMonth + 1,
        startDate: startOfMonth,
        endDate: endOfMonth,
      },
      usage: aggregated,
      totalMessages: aggregated.MESSAGE || 0,
      totalAIRequests: aggregated.AI_REQUEST || 0,
      totalWhatsAppMessages: aggregated.WHATSAPP_MESSAGE || 0,
      logs: usageLogs,
    };
  }

  // ============================================
  // Billing Events
  // ============================================

  async createBillingEvent(createBillingEventDto: CreateBillingEventDto) {
    const { customerId, amount, description, status, metadata } = createBillingEventDto;

    // Verify customer exists
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${customerId} not found`);
    }

    return this.prisma.billingEvent.create({
      data: {
        customerId,
        amount,
        description,
        status: (status as BillingStatus) || BillingStatus.PENDING,
        metadata: metadata || {},
      },
    });
  }

  async findBillingEventsByCustomerId(customerId: string) {
    return this.prisma.billingEvent.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateBillingEventStatus(id: string, status: string) {
    const validStatuses = ['PENDING', 'COMPLETED', 'FAILED'];
    if (!validStatuses.includes(status)) {
      throw new BadRequestException(`Invalid status: ${status}`);
    }

    const event = await this.prisma.billingEvent.findUnique({
      where: { id },
    });

    if (!event) {
      throw new NotFoundException(`Billing event with ID ${id} not found`);
    }

    return this.prisma.billingEvent.update({
      where: { id },
      data: { status: status as BillingStatus },
    });
  }
}
