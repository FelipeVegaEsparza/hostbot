import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];

    if (!apiKey) {
      throw new UnauthorizedException('API Key is required');
    }

    const apiKeyRecord = await this.prisma.aPIKey.findUnique({
      where: { key: apiKey },
      include: { customer: true },
    });

    if (!apiKeyRecord || !apiKeyRecord.isActive) {
      throw new UnauthorizedException('Invalid or inactive API Key');
    }

    // Update last used timestamp
    await this.prisma.aPIKey.update({
      where: { id: apiKeyRecord.id },
      data: { lastUsedAt: new Date() },
    });

    // Attach customer to request
    request.customer = apiKeyRecord.customer;
    request.apiKey = apiKeyRecord;

    return true;
  }
}
