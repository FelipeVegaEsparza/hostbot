import { Injectable, CanActivate, ExecutionContext, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';

export const OWNERSHIP_KEY = 'ownership';

export interface OwnershipConfig {
  model: string;
  idParam: string;
  ownerField: string;
}

@Injectable()
export class OwnershipGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const config = this.reflector.get<OwnershipConfig>(OWNERSHIP_KEY, context.getHandler());

    if (!config) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const resourceId = request.params[config.idParam];

    if (!resourceId) {
      throw new ForbiddenException('Resource ID not provided');
    }

    // Get the resource from database
    const resource = await (this.prisma as any)[config.model].findUnique({
      where: { id: resourceId },
    });

    if (!resource) {
      throw new NotFoundException(`${config.model} not found`);
    }

    // Check ownership
    const ownerId = resource[config.ownerField];
    
    // Get customer ID from user
    const customer = await this.prisma.customer.findUnique({
      where: { userId: user.id },
    });

    if (!customer || customer.id !== ownerId) {
      throw new ForbiddenException('You do not have permission to access this resource');
    }

    return true;
  }
}
