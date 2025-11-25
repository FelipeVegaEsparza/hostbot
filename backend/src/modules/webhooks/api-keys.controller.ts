import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiKeysService } from './api-keys.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { UpdateApiKeyDto } from './dto/update-api-key.dto';

/**
 * Controller for managing API Keys
 */
@ApiTags('api-keys')
@Controller('api-keys')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  /**
   * Create a new API key
   * POST /api-keys
   */
  @Post()
  @ApiOperation({ summary: 'Create a new API key' })
  @ApiResponse({ status: 201, description: 'API key created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createApiKey(@Request() req, @Body() dto: CreateApiKeyDto) {
    const customerId = req.user.customer.id;
    return this.apiKeysService.createApiKey(customerId, dto);
  }

  /**
   * Get all API keys for the authenticated customer
   * GET /api-keys
   */
  @Get()
  @ApiOperation({ summary: 'Get all API keys for authenticated customer' })
  @ApiResponse({ status: 200, description: 'List of API keys retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getApiKeys(@Request() req) {
    const customerId = req.user.customer.id;
    return this.apiKeysService.getApiKeys(customerId);
  }

  /**
   * Get a specific API key by ID
   * GET /api-keys/:id
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get API key by ID' })
  @ApiParam({ name: 'id', description: 'API key ID' })
  @ApiResponse({ status: 200, description: 'API key retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'API key not found' })
  async getApiKeyById(@Request() req, @Param('id') id: string) {
    const customerId = req.user.customer.id;
    return this.apiKeysService.getApiKeyById(id, customerId);
  }

  /**
   * Update an API key
   * PATCH /api-keys/:id
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Update API key' })
  @ApiParam({ name: 'id', description: 'API key ID' })
  @ApiResponse({ status: 200, description: 'API key updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'API key not found' })
  async updateApiKey(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: UpdateApiKeyDto,
  ) {
    const customerId = req.user.customer.id;
    return this.apiKeysService.updateApiKey(id, customerId, dto);
  }

  /**
   * Delete an API key
   * DELETE /api-keys/:id
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Delete API key' })
  @ApiParam({ name: 'id', description: 'API key ID' })
  @ApiResponse({ status: 200, description: 'API key deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'API key not found' })
  async deleteApiKey(@Request() req, @Param('id') id: string) {
    const customerId = req.user.customer.id;
    return this.apiKeysService.deleteApiKey(id, customerId);
  }

  /**
   * Deactivate an API key (soft delete)
   * POST /api-keys/:id/deactivate
   */
  @Post(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate API key (soft delete)' })
  @ApiParam({ name: 'id', description: 'API key ID' })
  @ApiResponse({ status: 200, description: 'API key deactivated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'API key not found' })
  async deactivateApiKey(@Request() req, @Param('id') id: string) {
    const customerId = req.user.customer.id;
    return this.apiKeysService.deactivateApiKey(id, customerId);
  }
}
