import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ConversationsService } from './conversations.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('conversations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) { }

  @Post()
  @ApiOperation({ summary: 'Create a new conversation' })
  @ApiResponse({
    status: 201,
    description: 'Conversation created successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Chatbot not found',
  })
  create(@Body() createConversationDto: CreateConversationDto) {
    return this.conversationsService.create(createConversationDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all conversations for the authenticated customer' })
  @ApiResponse({
    status: 200,
    description: 'List of conversations',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 20)',
  })
  findAll(
    @CurrentUser() user: any,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.conversationsService.findAllByCustomer(
      user.customer.id,
      page,
      limit,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a conversation by ID' })
  @ApiResponse({
    status: 200,
    description: 'Conversation details',
  })
  @ApiResponse({
    status: 404,
    description: 'Conversation not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied',
  })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.conversationsService.findOne(id, user.customer.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a conversation' })
  @ApiResponse({
    status: 200,
    description: 'Conversation updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Conversation not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied',
  })
  update(
    @Param('id') id: string,
    @Body() updateConversationDto: UpdateConversationDto,
    @CurrentUser() user: any,
  ) {
    return this.conversationsService.update(
      id,
      user.customer.id,
      updateConversationDto,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a conversation' })
  @ApiResponse({
    status: 200,
    description: 'Conversation deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Conversation not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied',
  })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.conversationsService.remove(id, user.customer.id);
  }

  @Post(':id/takeover')
  @ApiOperation({ summary: 'Takeover conversation - Switch to human agent mode' })
  @ApiResponse({
    status: 200,
    description: 'Conversation taken over by human agent',
  })
  @ApiResponse({
    status: 404,
    description: 'Conversation not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied',
  })
  takeover(@Param('id') id: string, @CurrentUser() user: any) {
    return this.conversationsService.takeover(id, user.customer.id);
  }

  @Post(':id/release')
  @ApiOperation({ summary: 'Release conversation - Return to AI control' })
  @ApiResponse({
    status: 200,
    description: 'Conversation released back to AI',
  })
  @ApiResponse({
    status: 404,
    description: 'Conversation not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied',
  })
  release(@Param('id') id: string, @CurrentUser() user: any) {
    return this.conversationsService.release(id, user.customer.id);
  }
}
