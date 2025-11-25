import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { CreateSubscriptionAdminDto } from './dto/create-subscription-admin.dto';
import { UpdateSubscriptionAdminDto } from './dto/update-subscription-admin.dto';
import { PaginationDto, PaginatedResponseDto, getPaginationParams } from '../../common/dto/pagination.dto';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  // ============================================
  // User Management
  // ============================================

  async getAllUsers(paginationDto: PaginationDto = {}) {
    const { page = 1, limit = 10 } = paginationDto;
    const { skip, take } = getPaginationParams(page, limit);

    const total = await this.prisma.user.count();

    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        customer: {
          select: {
            id: true,
            companyName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take,
    });

    return new PaginatedResponseDto(users, total, page, limit);
  }

  async getUserById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        customer: {
          include: {
            subscription: {
              include: {
                plan: true,
              },
            },
            _count: {
              select: {
                chatbots: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return user;
  }

  async updateUserRole(userId: string, updateUserRoleDto: UpdateUserRoleDto, requestingUserId: string) {
    // Prevent self-role-change
    if (userId === requestingUserId) {
      throw new ForbiddenException('You cannot change your own role');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        role: updateUserRoleDto.role,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updatedUser;
  }

  // ============================================
  // Customer Management
  // ============================================

  async getAllCustomers(paginationDto: PaginationDto = {}) {
    const { page = 1, limit = 10 } = paginationDto;
    const { skip, take } = getPaginationParams(page, limit);

    const total = await this.prisma.customer.count();

    const customers = await this.prisma.customer.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
        subscription: {
          include: {
            plan: true,
          },
        },
        _count: {
          select: {
            chatbots: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take,
    });

    return new PaginatedResponseDto(customers, total, page, limit);
  }

  async getCustomerById(customerId: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
        subscription: {
          include: {
            plan: true,
          },
        },
        chatbots: {
          select: {
            id: true,
            name: true,
            isActive: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            chatbots: true,
            usageLogs: true,
          },
        },
      },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${customerId} not found`);
    }

    // Get usage statistics
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const monthlyMessages = await this.prisma.usageLog.aggregate({
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

    return {
      ...customer,
      stats: {
        totalChatbots: customer._count.chatbots,
        totalUsageLogs: customer._count.usageLogs,
        monthlyMessages: monthlyMessages._sum.quantity || 0,
      },
    };
  }

  async updateCustomer(customerId: string, data: { companyName?: string }) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${customerId} not found`);
    }

    return this.prisma.customer.update({
      where: { id: customerId },
      data,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });
  }

  // ============================================
  // Subscription Management
  // ============================================

  async createSubscription(createSubscriptionDto: CreateSubscriptionAdminDto) {
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
      throw new BadRequestException('Customer already has a subscription. Use update endpoint to change plan.');
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

  async getAllSubscriptions(paginationDto: PaginationDto = {}) {
    const { page = 1, limit = 10 } = paginationDto;
    const { skip, take } = getPaginationParams(page, limit);

    const total = await this.prisma.subscription.count();

    const subscriptions = await this.prisma.subscription.findMany({
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
        plan: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take,
    });

    return new PaginatedResponseDto(subscriptions, total, page, limit);
  }

  async updateSubscription(subscriptionId: string, updateSubscriptionDto: UpdateSubscriptionAdminDto) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      throw new NotFoundException(`Subscription with ID ${subscriptionId} not found`);
    }

    // If changing plan, verify it exists
    if (updateSubscriptionDto.planId) {
      const plan = await this.prisma.plan.findUnique({
        where: { id: updateSubscriptionDto.planId },
      });

      if (!plan) {
        throw new NotFoundException(`Plan with ID ${updateSubscriptionDto.planId} not found`);
      }
    }

    return this.prisma.subscription.update({
      where: { id: subscriptionId },
      data: updateSubscriptionDto,
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

  // ============================================
  // System Stats
  // ============================================

  async getSystemStats() {
    const [
      totalUsers,
      totalCustomers,
      totalSubscriptions,
      activeSubscriptions,
      totalChatbots,
      activeChatbots,
      totalPlans,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.customer.count(),
      this.prisma.subscription.count(),
      this.prisma.subscription.count({ where: { status: 'ACTIVE' } }),
      this.prisma.chatbot.count(),
      this.prisma.chatbot.count({ where: { isActive: true } }),
      this.prisma.plan.count(),
    ]);

    // Get recent users
    const recentUsers = await this.prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    return {
      users: {
        total: totalUsers,
        recent: recentUsers,
      },
      customers: {
        total: totalCustomers,
      },
      subscriptions: {
        total: totalSubscriptions,
        active: activeSubscriptions,
        inactive: totalSubscriptions - activeSubscriptions,
      },
      chatbots: {
        total: totalChatbots,
        active: activeChatbots,
        inactive: totalChatbots - activeChatbots,
      },
      plans: {
        total: totalPlans,
      },
    };
  }
}
