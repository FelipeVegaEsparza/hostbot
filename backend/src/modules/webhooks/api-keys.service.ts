import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { randomBytes } from 'crypto';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { UpdateApiKeyDto } from './dto/update-api-key.dto';

/**
 * Service for managing API Keys
 */
@Injectable()
export class ApiKeysService {
  private readonly logger = new Logger(ApiKeysService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate a secure API key using crypto.randomBytes
   */
  private generateApiKey(): string {
    // Generate 32 bytes (256 bits) of random data
    const buffer = randomBytes(32);
    // Convert to base64 and make it URL-safe
    return `sk_${buffer.toString('base64').replace(/[+/=]/g, (char) => {
      switch (char) {
        case '+':
          return '-';
        case '/':
          return '_';
        case '=':
          return '';
        default:
          return char;
      }
    })}`;
  }

  /**
   * Create a new API key for a customer
   */
  async createApiKey(customerId: string, dto: CreateApiKeyDto) {
    try {
      // Generate unique API key
      const key = this.generateApiKey();

      // Ensure key is unique (very unlikely collision, but check anyway)
      const existing = await this.prisma.aPIKey.findUnique({
        where: { key },
      });

      if (existing) {
        // Extremely rare, but regenerate if collision occurs
        return this.createApiKey(customerId, dto);
      }

      const apiKey = await this.prisma.aPIKey.create({
        data: {
          customerId,
          key,
          name: dto.name,
          permissions: dto.permissions || [],
          isActive: true,
        },
      });

      this.logger.log(`API key created for customer ${customerId}: ${apiKey.name}`);

      return apiKey;
    } catch (error) {
      this.logger.error(
        `Failed to create API key: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Get all API keys for a customer
   */
  async getApiKeys(customerId: string) {
    return this.prisma.aPIKey.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        key: true,
        permissions: true,
        isActive: true,
        lastUsedAt: true,
        createdAt: true,
      },
    });
  }

  /**
   * Get a specific API key by ID
   */
  async getApiKeyById(id: string, customerId: string) {
    const apiKey = await this.prisma.aPIKey.findFirst({
      where: {
        id,
        customerId,
      },
    });

    if (!apiKey) {
      throw new NotFoundException(`API key with ID ${id} not found`);
    }

    return apiKey;
  }

  /**
   * Validate an API key and return associated customer
   * This is used by the ApiKeyGuard
   */
  async validateApiKey(key: string) {
    const apiKey = await this.prisma.aPIKey.findUnique({
      where: { key },
      include: {
        customer: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!apiKey) {
      return null;
    }

    if (!apiKey.isActive) {
      return null;
    }

    // Update last used timestamp
    await this.prisma.aPIKey.update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() },
    });

    return {
      apiKey,
      customer: apiKey.customer,
      user: apiKey.customer.user,
    };
  }

  /**
   * Update an API key
   */
  async updateApiKey(
    id: string,
    customerId: string,
    dto: UpdateApiKeyDto,
  ) {
    const apiKey = await this.getApiKeyById(id, customerId);

    const updated = await this.prisma.aPIKey.update({
      where: { id: apiKey.id },
      data: {
        name: dto.name,
        permissions: dto.permissions,
        isActive: dto.isActive,
      },
    });

    this.logger.log(`API key ${id} updated for customer ${customerId}`);

    return updated;
  }

  /**
   * Delete an API key
   */
  async deleteApiKey(id: string, customerId: string) {
    const apiKey = await this.getApiKeyById(id, customerId);

    await this.prisma.aPIKey.delete({
      where: { id: apiKey.id },
    });

    this.logger.log(`API key ${id} deleted for customer ${customerId}`);

    return { message: 'API key deleted successfully' };
  }

  /**
   * Deactivate an API key (soft delete)
   */
  async deactivateApiKey(id: string, customerId: string) {
    const apiKey = await this.getApiKeyById(id, customerId);

    const updated = await this.prisma.aPIKey.update({
      where: { id: apiKey.id },
      data: { isActive: false },
    });

    this.logger.log(`API key ${id} deactivated for customer ${customerId}`);

    return updated;
  }

  /**
   * Check if API key has specific permission
   */
  hasPermission(apiKey: any, permission: string): boolean {
    if (!apiKey.permissions) return false;
    
    const permissions = Array.isArray(apiKey.permissions) 
      ? apiKey.permissions 
      : [];
    
    return permissions.includes(permission) || permissions.includes('*');
  }
}
