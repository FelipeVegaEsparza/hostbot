import { Controller, Post, Body, UseGuards, Get, Sse, MessageEvent } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { AIService } from './ai.service';
import { AIRequestDto } from './dto/ai-request.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('AI')
@Controller('ai')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AIController {
  constructor(private readonly aiService: AIService) {}

  @Post('generate')
  @ApiOperation({ summary: 'Generate AI response' })
  @ApiResponse({ status: 200, description: 'AI response generated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid provider or model' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async generateResponse(@Body() dto: AIRequestDto) {
    const response = await this.aiService.generateResponse(dto.provider, {
      prompt: dto.prompt,
      context: dto.context,
      systemPrompt: dto.systemPrompt,
      temperature: dto.temperature,
      maxTokens: dto.maxTokens,
      model: dto.model,
    });

    return {
      success: true,
      data: response,
    };
  }

  @Post('stream')
  @ApiOperation({ summary: 'Stream AI response (SSE)' })
  @ApiResponse({ status: 200, description: 'AI response stream started' })
  @ApiResponse({ status: 400, description: 'Invalid provider or model' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Sse()
  async streamResponse(@Body() dto: AIRequestDto): Promise<Observable<MessageEvent>> {
    return new Observable((subscriber) => {
      (async () => {
        try {
          const stream = this.aiService.streamResponse(dto.provider, {
            prompt: dto.prompt,
            context: dto.context,
            systemPrompt: dto.systemPrompt,
            temperature: dto.temperature,
            maxTokens: dto.maxTokens,
            model: dto.model,
          });

          for await (const chunk of stream) {
            subscriber.next({
              data: JSON.stringify(chunk),
            } as MessageEvent);

            if (chunk.done) {
              subscriber.complete();
              break;
            }
          }
        } catch (error) {
          subscriber.error(error);
        }
      })();
    });
  }

  @Get('providers')
  @ApiOperation({ summary: 'Get list of available AI providers' })
  @ApiResponse({ status: 200, description: 'List of providers retrieved' })
  getProviders() {
    return {
      success: true,
      data: {
        providers: this.aiService.getAvailableProviders(),
      },
    };
  }

  @Post('validate')
  @ApiOperation({ summary: 'Validate provider and model combination' })
  @ApiResponse({ status: 200, description: 'Validation result' })
  validateConfig(@Body() dto: { provider: string; model: string }) {
    const isValid = this.aiService.validateProviderConfig(dto.provider, dto.model);
    return {
      success: true,
      data: {
        valid: isValid,
        provider: dto.provider,
        model: dto.model,
      },
    };
  }

  @Get('circuit-breaker/status')
  @ApiOperation({ summary: 'Get circuit breaker status for all providers' })
  @ApiResponse({ status: 200, description: 'Circuit breaker statuses retrieved' })
  getCircuitBreakerStatus() {
    const statuses = this.aiService.getAllCircuitStatuses();
    const statusObject: Record<string, any> = {};
    
    statuses.forEach((status, provider) => {
      statusObject[provider] = status;
    });

    return {
      success: true,
      data: statusObject,
    };
  }

  @Get('circuit-breaker/status/:provider')
  @ApiOperation({ summary: 'Get circuit breaker status for a specific provider' })
  @ApiResponse({ status: 200, description: 'Circuit breaker status retrieved' })
  getProviderCircuitStatus(@Body() dto: { provider: string }) {
    const status = this.aiService.getCircuitStatus(dto.provider);
    return {
      success: true,
      data: {
        provider: dto.provider,
        status: status || { message: 'No circuit breaker data available' },
      },
    };
  }

  @Post('circuit-breaker/reset/:provider')
  @ApiOperation({ summary: 'Reset circuit breaker for a specific provider (admin only)' })
  @ApiResponse({ status: 200, description: 'Circuit breaker reset successfully' })
  resetCircuitBreaker(@Body() dto: { provider: string }) {
    this.aiService.resetCircuit(dto.provider);
    return {
      success: true,
      message: `Circuit breaker reset for provider: ${dto.provider}`,
    };
  }
}
