import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { HealthService } from './health.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { TestMessageDto } from './dto/test-message.dto';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly healthService: HealthService,
  ) {}

  // Lazy inject MessagesGateway and AIService to avoid circular dependency
  private messagesGateway: any;
  private aiService: any;

  setMessagesGateway(gateway: any) {
    this.messagesGateway = gateway;
    this.healthService.setMessagesGateway(gateway);
  }

  setAIService(service: any) {
    this.aiService = service;
    this.healthService.setAIService(service);
  }

  setMessagesService(service: any) {
    this.healthService.setMessagesService(service);
  }

  @Get()
  @ApiOperation({ summary: 'Check overall system health' })
  @ApiResponse({ 
    status: 200, 
    description: 'System is healthy',
    schema: {
      example: {
        status: 'ok',
        info: {
          database: { status: 'up' },
          redis: { status: 'up' },
          queues: { status: 'up' }
        },
        error: {},
        details: {
          database: { status: 'up' },
          redis: { status: 'up' },
          queues: { status: 'up' }
        }
      }
    }
  })
  @ApiResponse({ 
    status: 503, 
    description: 'System is unhealthy',
    schema: {
      example: {
        status: 'error',
        info: {},
        error: {
          database: { status: 'down', message: 'Connection failed' }
        },
        details: {
          database: { status: 'down', message: 'Connection failed' },
          redis: { status: 'up' },
          queues: { status: 'up' }
        }
      }
    }
  })
  async check() {
    return await this.healthService.check();
  }

  @Get('database')
  @ApiOperation({ summary: 'Check database health' })
  @ApiResponse({ status: 200, description: 'Database is healthy' })
  @ApiResponse({ status: 503, description: 'Database is unhealthy' })
  async checkDatabase() {
    return await this.healthService.checkDatabase();
  }

  @Get('redis')
  @ApiOperation({ summary: 'Check Redis health' })
  @ApiResponse({ status: 200, description: 'Redis is healthy' })
  @ApiResponse({ status: 503, description: 'Redis is unhealthy' })
  async checkRedis() {
    return await this.healthService.checkRedis();
  }

  @Get('ai-providers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get AI providers circuit breaker status (Admin only)' })
  @ApiResponse({ 
    status: 200, 
    description: 'AI providers status retrieved successfully',
    schema: {
      example: [
        {
          provider: 'openai',
          state: 'CLOSED',
          failureCount: 0,
          lastFailureTime: null,
          nextAttemptTime: null,
          successCount: 42
        },
        {
          provider: 'anthropic',
          state: 'OPEN',
          failureCount: 5,
          lastFailureTime: '2024-01-15T10:30:00Z',
          nextAttemptTime: '2024-01-15T10:31:00Z',
          successCount: 15
        }
      ]
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  async getAIProvidersStatus() {
    return await this.healthService.getAIProvidersStatus();
  }

  @Post('test-message')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send a test message and track its flow (Admin only)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Test message sent successfully',
    schema: {
      example: {
        success: true,
        messageId: '123e4567-e89b-12d3-a456-426614174000',
        conversationId: '987fcdeb-51a2-43f7-b890-123456789abc',
        stages: [
          {
            stage: 'verify_chatbot',
            timestamp: '2024-01-15T10:30:00Z',
            status: 'success',
            details: { chatbotId: '123e4567-e89b-12d3-a456-426614174000' }
          },
          {
            stage: 'send_message',
            timestamp: '2024-01-15T10:30:01Z',
            status: 'success',
            details: {
              messageId: '123e4567-e89b-12d3-a456-426614174000',
              conversationId: '987fcdeb-51a2-43f7-b890-123456789abc'
            }
          },
          {
            stage: 'check_incoming_queue',
            timestamp: '2024-01-15T10:30:02Z',
            status: 'success',
            details: { waitingCount: 1 }
          }
        ]
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  async testMessage(@Body() testMessageDto: TestMessageDto) {
    return await this.healthService.testMessage(
      testMessageDto.chatbotId,
      testMessageDto.channel,
      testMessageDto.externalUserId,
      testMessageDto.message,
    );
  }

  @Get('websocket')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get WebSocket connection status (Admin only)' })
  @ApiResponse({ 
    status: 200, 
    description: 'WebSocket status retrieved successfully',
    schema: {
      example: {
        connected: 5,
        rooms: {
          'conversation:123e4567-e89b-12d3-a456-426614174000': 2,
          'conversation:987fcdeb-51a2-43f7-b890-123456789abc': 1
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  async getWebSocketStatus() {
    return await this.healthService.getWebSocketStatus();
  }

  @Get('queues')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get detailed status of all queues (Admin only)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Queue status retrieved successfully',
    schema: {
      example: [
        {
          name: 'incoming-messages',
          waiting: 5,
          active: 2,
          completed: 1234,
          failed: 3,
          delayed: 0,
          paused: false
        }
      ]
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  async getQueuesStatus() {
    return await this.healthService.getQueuesStatus();
  }
}
