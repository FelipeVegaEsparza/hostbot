import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { WidgetService } from './widget.service';
import { SendWidgetMessageDto } from './dto/send-widget-message.dto';

@ApiTags('widget')
@Controller('widget')
export class WidgetController {
  constructor(private readonly widgetService: WidgetService) {}

  @Post('message')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Send a message from the widget',
    description:
      'Receives a message from the widget, creates a conversation if needed, and enqueues for asynchronous AI processing',
  })
  @ApiResponse({
    status: 202,
    description: 'Message accepted for processing',
    schema: {
      type: 'object',
      properties: {
        conversationId: {
          type: 'string',
          example: '123e4567-e89b-12d3-a456-426614174000',
        },
        messageId: {
          type: 'string',
          example: '123e4567-e89b-12d3-a456-426614174001',
        },
        status: {
          type: 'string',
          example: 'accepted',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request data or chatbot is not active',
  })
  @ApiResponse({
    status: 404,
    description: 'Chatbot not found',
  })
  async sendMessage(@Body() sendWidgetMessageDto: SendWidgetMessageDto) {
    return await this.widgetService.sendMessage(sendWidgetMessageDto);
  }

  @Get('config/:botId')
  @ApiOperation({
    summary: 'Get widget configuration',
    description:
      'Returns the public configuration for the widget including theme, colors, and welcome message',
  })
  @ApiParam({
    name: 'botId',
    description: 'ID of the chatbot',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Widget configuration',
    schema: {
      type: 'object',
      properties: {
        botId: {
          type: 'string',
          example: '123e4567-e89b-12d3-a456-426614174000',
        },
        botName: {
          type: 'string',
          example: 'Customer Support Bot',
        },
        widgetSettings: {
          type: 'object',
          properties: {
            theme: {
              type: 'string',
              example: 'light',
            },
            primaryColor: {
              type: 'string',
              example: '#3B82F6',
            },
            position: {
              type: 'string',
              example: 'bottom-right',
            },
            welcomeMessage: {
              type: 'string',
              nullable: true,
              example: 'Hello! How can I help you today?',
            },
            placeholder: {
              type: 'string',
              example: 'Type a message...',
            },
            customCss: {
              type: 'string',
              nullable: true,
              example: null,
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Chatbot is not active',
  })
  @ApiResponse({
    status: 404,
    description: 'Chatbot not found',
  })
  async getConfig(@Param('botId') botId: string) {
    return await this.widgetService.getConfig(botId);
  }
}
