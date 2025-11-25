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
} from '@nestjs/swagger';
import { ChatbotsService } from './chatbots.service';
import { CreateChatbotDto } from './dto/create-chatbot.dto';
import { UpdateChatbotDto } from './dto/update-chatbot.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OwnershipGuard } from '../../common/guards/ownership.guard';
import { CheckOwnership } from '../../common/decorators/ownership.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('chatbots')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('chatbots')
export class ChatbotsController {
  constructor(private readonly chatbotsService: ChatbotsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new chatbot' })
  @ApiResponse({
    status: 201,
    description: 'Chatbot created successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Chatbot limit reached or AI provider not allowed in plan',
  })
  @ApiResponse({
    status: 404,
    description: 'Customer not found',
  })
  async create(@Request() req, @Body() createChatbotDto: CreateChatbotDto) {
    const customerId = req.user.customer.id;
    return this.chatbotsService.create(customerId, createChatbotDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all chatbots for the authenticated customer' })
  @ApiResponse({
    status: 200,
    description: 'List of chatbots retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Customer not found',
  })
  async findAll(@Request() req, @Query() paginationDto: PaginationDto) {
    const customerId = req.user.customer.id;
    return this.chatbotsService.findAll(customerId, paginationDto);
  }

  @Get(':id')
  @UseGuards(OwnershipGuard)
  @CheckOwnership({ model: 'chatbot', idParam: 'id', ownerField: 'customerId' })
  @ApiOperation({ summary: 'Get a specific chatbot by ID' })
  @ApiParam({
    name: 'id',
    description: 'Chatbot ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Chatbot retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Chatbot not found or does not belong to customer',
  })
  async findOne(@Param('id') id: string, @Request() req) {
    const customerId = req.user.customer.id;
    return this.chatbotsService.findOne(id, customerId);
  }

  @Patch(':id')
  @UseGuards(OwnershipGuard)
  @CheckOwnership({ model: 'chatbot', idParam: 'id', ownerField: 'customerId' })
  @ApiOperation({ summary: 'Update a chatbot' })
  @ApiParam({
    name: 'id',
    description: 'Chatbot ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Chatbot updated successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'AI provider not allowed in plan',
  })
  @ApiResponse({
    status: 404,
    description: 'Chatbot not found or does not belong to customer',
  })
  async update(
    @Param('id') id: string,
    @Request() req,
    @Body() updateChatbotDto: UpdateChatbotDto,
  ) {
    const customerId = req.user.customer.id;
    return this.chatbotsService.update(id, customerId, updateChatbotDto);
  }

  @Delete(':id')
  @UseGuards(OwnershipGuard)
  @CheckOwnership({ model: 'chatbot', idParam: 'id', ownerField: 'customerId' })
  @ApiOperation({ summary: 'Delete a chatbot' })
  @ApiParam({
    name: 'id',
    description: 'Chatbot ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Chatbot deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Chatbot not found or does not belong to customer',
  })
  async remove(@Param('id') id: string, @Request() req) {
    const customerId = req.user.customer.id;
    return this.chatbotsService.remove(id, customerId);
  }

  @Get(':id/stats')
  @UseGuards(OwnershipGuard)
  @CheckOwnership({ model: 'chatbot', idParam: 'id', ownerField: 'customerId' })
  @ApiOperation({ summary: 'Get chatbot statistics' })
  @ApiParam({
    name: 'id',
    description: 'Chatbot ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Chatbot statistics retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Chatbot not found or does not belong to customer',
  })
  async getStats(@Param('id') id: string, @Request() req) {
    const customerId = req.user.customer.id;
    return this.chatbotsService.getStats(id, customerId);
  }
}
