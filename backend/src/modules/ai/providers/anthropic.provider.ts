import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { AIProvider, AIRequestParams, AIResponse, AIStreamChunk, AIConfig } from '../interfaces/ai-provider.interface';

@Injectable()
export class AnthropicProvider implements AIProvider {
  name = 'anthropic';
  private client: any;
  private readonly logger = new Logger(AnthropicProvider.name);

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
    if (!apiKey) {
      this.logger.warn('ANTHROPIC_API_KEY not configured');
    }
    this.client = new Anthropic({
      apiKey: apiKey || 'dummy-key',
    });
  }

  async generateResponse(params: AIRequestParams): Promise<AIResponse> {
    try {
      const messages: any[] = [];
      
      if (params.context && params.context.length > 0) {
        params.context.forEach((ctx, idx) => {
          messages.push({ 
            role: idx % 2 === 0 ? 'user' : 'assistant', 
            content: ctx 
          });
        });
      }
      
      messages.push({ role: 'user', content: params.prompt });

      const response = await this.client.messages.create({
        model: params.model,
        max_tokens: params.maxTokens ?? 1000,
        system: params.systemPrompt || 'You are a helpful assistant.',
        messages,
        temperature: params.temperature ?? 0.7,
      });

      return {
        content: response.content[0].type === 'text' ? response.content[0].text : '',
        tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
        model: response.model,
        finishReason: response.stop_reason || 'end_turn',
      };
    } catch (error) {
      this.logger.error(`Anthropic API error: ${error.message}`, error.stack);
      throw error;
    }
  }

  async *streamResponse(params: AIRequestParams): AsyncGenerator<AIStreamChunk> {
    try {
      const messages: any[] = [];
      
      if (params.context && params.context.length > 0) {
        params.context.forEach((ctx, idx) => {
          messages.push({ 
            role: idx % 2 === 0 ? 'user' : 'assistant', 
            content: ctx 
          });
        });
      }
      
      messages.push({ role: 'user', content: params.prompt });

      const stream = await this.client.messages.create({
        model: params.model,
        max_tokens: params.maxTokens ?? 1000,
        system: params.systemPrompt || 'You are a helpful assistant.',
        messages,
        temperature: params.temperature ?? 0.7,
        stream: true,
      });

      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          yield { content: chunk.delta.text, done: false };
        } else if (chunk.type === 'message_stop') {
          yield { content: '', done: true };
        }
      }
    } catch (error) {
      this.logger.error(`Anthropic streaming error: ${error.message}`, error.stack);
      throw error;
    }
  }

  validateConfig(config: AIConfig): boolean {
    const validModels = [
      'claude-3-5-sonnet-20241022',
      'claude-3-5-sonnet-20240620',
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229',
      'claude-3-haiku-20240307',
    ];
    return validModels.includes(config.model);
  }

  estimateTokens(text: string): number {
    // Rough estimation: ~4 characters per token
    return Math.ceil(text.length / 4);
  }
}
