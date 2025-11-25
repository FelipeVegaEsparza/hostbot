import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { MessagesService } from './messages.service';
import { SendMessageDto } from './dto/send-message.dto';
import { AgentSendMessageDto } from './dto/agent-send-message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('messages')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) { }

  @Post('send')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Send a message (creates message and enqueues for AI processing)',
  })
  @ApiResponse({
    status: 202,
    description: 'Message accepted for processing',
  })
  @ApiResponse({
    status: 404,
    description: 'Chatbot or conversation not found',
  })
  async send(@Body() sendMessageDto: SendMessageDto) {
    const result = await this.messagesService.send(sendMessageDto);
    return {
      message: 'Message accepted for processing',
      data: result,
    };
  }

  @Get('conversation/:conversationId')
  @ApiOperation({ summary: 'Get messages for a conversation with pagination' })
  @ApiResponse({
    status: 200,
    description: 'List of messages',
  })
  @ApiResponse({
    status: 404,
    description: 'Conversation not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied',
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
    description: 'Items per page (default: 50)',
  })
  findByConversation(
    @Param('conversationId') conversationId: string,
    @CurrentUser() user: any,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ) {
    return this.messagesService.findByConversation(
      conversationId,
      user.customer.id,
      page,
      limit,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a message by ID' })
  @ApiResponse({
    status: 200,
    description: 'Message details',
  })
  @ApiResponse({
    status: 404,
    description: 'Message not found',
  })
  findOne(@Param('id') id: string) {
    return this.messagesService.findOne(id);
  }

  @Post('agent-send')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Send a message from a human agent (bypasses AI processing)',
  })
  @ApiResponse({
    status: 202,
    description: 'Agent message accepted for delivery',
  })
  @ApiResponse({
    status: 404,
    description: 'Conversation not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied',
  })
  async agentSend(
    @Body() agentSendMessageDto: AgentSendMessageDto,
    @CurrentUser() user: any,
  ) {
    const result = await this.messagesService.agentSend(
      agentSendMessageDto.conversationId,
      agentSendMessageDto.content,
      user.customer.id,
      agentSendMessageDto.metadata,
    );
    return {
      message: 'Agent message accepted for delivery',
      data: result,
    };
  }
}
