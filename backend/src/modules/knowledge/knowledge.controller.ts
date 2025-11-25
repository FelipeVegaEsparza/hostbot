import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { KnowledgeService } from './knowledge.service';
import { CreateKnowledgeBaseDto } from './dto/create-knowledge-base.dto';
import { UpdateKnowledgeBaseDto } from './dto/update-knowledge-base.dto';
import { CreateKnowledgeItemDto } from './dto/create-knowledge-item.dto';
import { UpdateKnowledgeItemDto } from './dto/update-knowledge-item.dto';
import { SearchKnowledgeDto } from './dto/search-knowledge.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('knowledge')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('knowledge')
export class KnowledgeController {
  constructor(private readonly knowledgeService: KnowledgeService) {}

  // ==================== Knowledge Base Endpoints ====================

  @Post('bases')
  @ApiOperation({ summary: 'Create a new knowledge base' })
  @ApiResponse({
    status: 201,
    description: 'Knowledge base created successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Customer not found',
  })
  async createKnowledgeBase(
    @Request() req,
    @Body() createKnowledgeBaseDto: CreateKnowledgeBaseDto,
  ) {
    const customerId = req.user.customer.id;
    return this.knowledgeService.createKnowledgeBase(
      customerId,
      createKnowledgeBaseDto,
    );
  }

  @Get('bases')
  @ApiOperation({
    summary: 'Get all knowledge bases for the authenticated customer',
  })
  @ApiResponse({
    status: 200,
    description: 'List of knowledge bases retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Customer not found',
  })
  async findAllKnowledgeBases(@Request() req, @Query() paginationDto: PaginationDto) {
    const customerId = req.user.customer.id;
    return this.knowledgeService.findAllKnowledgeBases(customerId, paginationDto);
  }

  @Get('bases/:id')
  @ApiOperation({ summary: 'Get a specific knowledge base by ID' })
  @ApiParam({
    name: 'id',
    description: 'Knowledge base ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Knowledge base retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Knowledge base not found or does not belong to customer',
  })
  async findOneKnowledgeBase(@Param('id') id: string, @Request() req) {
    const customerId = req.user.customer.id;
    return this.knowledgeService.findOneKnowledgeBase(id, customerId);
  }

  @Patch('bases/:id')
  @ApiOperation({ summary: 'Update a knowledge base' })
  @ApiParam({
    name: 'id',
    description: 'Knowledge base ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Knowledge base updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Knowledge base not found or does not belong to customer',
  })
  async updateKnowledgeBase(
    @Param('id') id: string,
    @Request() req,
    @Body() updateKnowledgeBaseDto: UpdateKnowledgeBaseDto,
  ) {
    const customerId = req.user.customer.id;
    return this.knowledgeService.updateKnowledgeBase(
      id,
      customerId,
      updateKnowledgeBaseDto,
    );
  }

  @Delete('bases/:id')
  @ApiOperation({ summary: 'Delete a knowledge base' })
  @ApiParam({
    name: 'id',
    description: 'Knowledge base ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Knowledge base deleted successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Knowledge base is associated with chatbots',
  })
  @ApiResponse({
    status: 404,
    description: 'Knowledge base not found or does not belong to customer',
  })
  async removeKnowledgeBase(@Param('id') id: string, @Request() req) {
    const customerId = req.user.customer.id;
    return this.knowledgeService.removeKnowledgeBase(id, customerId);
  }

  // ==================== Knowledge Item Endpoints ====================

  @Post('items')
  @ApiOperation({ summary: 'Create a new knowledge item' })
  @ApiResponse({
    status: 201,
    description: 'Knowledge item created successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Knowledge base not found or does not belong to customer',
  })
  async createKnowledgeItem(
    @Request() req,
    @Body() createKnowledgeItemDto: CreateKnowledgeItemDto,
  ) {
    const customerId = req.user.customer.id;
    return this.knowledgeService.createKnowledgeItem(
      customerId,
      createKnowledgeItemDto,
    );
  }

  @Get('bases/:knowledgeBaseId/items')
  @ApiOperation({ summary: 'Get all items in a knowledge base' })
  @ApiParam({
    name: 'knowledgeBaseId',
    description: 'Knowledge base ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'List of knowledge items retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Knowledge base not found or does not belong to customer',
  })
  async findAllKnowledgeItems(
    @Param('knowledgeBaseId') knowledgeBaseId: string,
    @Request() req,
    @Query() paginationDto: PaginationDto,
  ) {
    const customerId = req.user.customer.id;
    return this.knowledgeService.findAllKnowledgeItems(
      knowledgeBaseId,
      customerId,
      paginationDto,
    );
  }

  @Get('items/:id')
  @ApiOperation({ summary: 'Get a specific knowledge item by ID' })
  @ApiParam({
    name: 'id',
    description: 'Knowledge item ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Knowledge item retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Knowledge item not found or does not belong to customer',
  })
  async findOneKnowledgeItem(@Param('id') id: string, @Request() req) {
    const customerId = req.user.customer.id;
    return this.knowledgeService.findOneKnowledgeItem(id, customerId);
  }

  @Patch('items/:id')
  @ApiOperation({ summary: 'Update a knowledge item' })
  @ApiParam({
    name: 'id',
    description: 'Knowledge item ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Knowledge item updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Knowledge item not found or does not belong to customer',
  })
  async updateKnowledgeItem(
    @Param('id') id: string,
    @Request() req,
    @Body() updateKnowledgeItemDto: UpdateKnowledgeItemDto,
  ) {
    const customerId = req.user.customer.id;
    return this.knowledgeService.updateKnowledgeItem(
      id,
      customerId,
      updateKnowledgeItemDto,
    );
  }

  @Delete('items/:id')
  @ApiOperation({ summary: 'Delete a knowledge item' })
  @ApiParam({
    name: 'id',
    description: 'Knowledge item ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Knowledge item deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Knowledge item not found or does not belong to customer',
  })
  async removeKnowledgeItem(@Param('id') id: string, @Request() req) {
    const customerId = req.user.customer.id;
    return this.knowledgeService.removeKnowledgeItem(id, customerId);
  }

  // ==================== Search Endpoint ====================

  @Get('bases/:knowledgeBaseId/search')
  @ApiOperation({ summary: 'Search knowledge items using full-text search' })
  @ApiParam({
    name: 'knowledgeBaseId',
    description: 'Knowledge base ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiQuery({
    name: 'query',
    description: 'Search query',
    example: 'password reset',
  })
  @ApiQuery({
    name: 'limit',
    description: 'Maximum number of results',
    required: false,
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Search results retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Knowledge base not found or does not belong to customer',
  })
  async searchKnowledgeItems(
    @Param('knowledgeBaseId') knowledgeBaseId: string,
    @Request() req,
    @Query() searchDto: SearchKnowledgeDto,
  ) {
    const customerId = req.user.customer.id;
    return this.knowledgeService.searchKnowledgeItems(
      knowledgeBaseId,
      customerId,
      searchDto,
    );
  }
}
