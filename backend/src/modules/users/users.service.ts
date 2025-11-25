import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const { email, password, name, role, companyName } = createUserDto;

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // Hash password with bcrypt factor 10
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user and customer in a transaction
    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: role || 'USER',
        customer: {
          create: {
            companyName,
          },
        },
      },
      include: {
        customer: true,
      },
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return userWithoutPassword;
  }

  async findAll() {
    const users = await this.prisma.user.findMany({
      include: {
        customer: {
          include: {
            subscription: {
              include: {
                plan: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Remove passwords from response
    return users.map(({ password, ...user }) => user);
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        customer: {
          include: {
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
              },
            },
            knowledgeBases: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Remove password from response
    const { password, ...userWithoutPassword } = user;

    return userWithoutPassword;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    const { password, ...otherFields } = updateUserDto;

    // Prepare update data
    const updateData: any = { ...otherFields };

    // Hash password if provided
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    // Update user
    const user = await this.prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        customer: true,
      },
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return userWithoutPassword;
  }

  async remove(id: string) {
    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    // Delete user (cascade will delete customer)
    await this.prisma.user.delete({
      where: { id },
    });

    return { message: 'User deleted successfully' };
  }

  async getCustomerProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        customer: {
          include: {
            subscription: {
              include: {
                plan: true,
              },
            },
            chatbots: {
              select: {
                id: true,
                name: true,
                description: true,
                aiProvider: true,
                aiModel: true,
                isActive: true,
                createdAt: true,
              },
              orderBy: {
                createdAt: 'desc',
              },
            },
            knowledgeBases: {
              select: {
                id: true,
                name: true,
                description: true,
                createdAt: true,
              },
              orderBy: {
                createdAt: 'desc',
              },
            },
            usageLogs: {
              where: {
                createdAt: {
                  gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                },
              },
              select: {
                type: true,
                quantity: true,
                createdAt: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.customer) {
      throw new BadRequestException('User does not have a customer profile');
    }

    // Remove password from response
    const { password, ...userWithoutPassword } = user;

    return userWithoutPassword;
  }

  async updateCustomerProfile(userId: string, updateCustomerDto: UpdateCustomerDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        customer: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.customer) {
      throw new BadRequestException('User does not have a customer profile');
    }

    // Update customer
    const customer = await this.prisma.customer.update({
      where: { id: user.customer.id },
      data: updateCustomerDto,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        subscription: {
          include: {
            plan: true,
          },
        },
      },
    });

    return customer;
  }
}
