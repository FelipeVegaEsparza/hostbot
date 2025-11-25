import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ApiKeysService } from '../api-keys.service';

/**
 * Guard for API Key authentication
 * Checks for X-API-Key header and validates it
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private readonly apiKeysService: ApiKeysService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const apiKey = this.extractApiKey(request);

    if (!apiKey) {
      throw new UnauthorizedException('API key is required');
    }

    const validation = await this.apiKeysService.validateApiKey(apiKey);

    if (!validation) {
      throw new UnauthorizedException('Invalid or inactive API key');
    }

    // Attach user and customer to request for use in controllers
    request.user = validation.user;
    request.customer = validation.customer;
    request.apiKey = validation.apiKey;

    return true;
  }

  /**
   * Extract API key from request headers
   * Supports both X-API-Key and Authorization: Bearer <key>
   */
  private extractApiKey(request: any): string | null {
    // Check X-API-Key header
    const apiKeyHeader = request.headers['x-api-key'];
    if (apiKeyHeader) {
      return apiKeyHeader;
    }

    // Check Authorization header with Bearer token
    const authHeader = request.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      // Check if it's an API key (starts with sk_)
      if (token.startsWith('sk_')) {
        return token;
      }
    }

    return null;
  }
}
