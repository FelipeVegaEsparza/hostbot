import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import MistralClient from '@mistralai/mistralai';
import { AIProvider, AIRequestParams, AIResponse, AIStreamChunk, AIConfig } from '../interfaces/ai-provider.interface';

@Injectable()
export class MistralProvider implements AIProvider {
  name = 'mistral';
  private client: MistralClient;
  private readonly logger = new Logger(MistralProvider.name);

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('MISTRAL_API_KEY');
    if (!apiKey) {
      this.logger.warn('MISTRAL_API_KEY not configured');
    }
    this.client = new MistralClient(apiKey || 'dummy-key');
  }

  async generateResponse(params: AIRequestParams): Promise<AIResponse> {
    try {
      const messages: any[] = [];
      
      if (params.systemPrompt) {
        messages.push({ role: 'system', content: params.systemPrompt });
      }
      
      if (params.context && params.context.length > 0) {
        params.context.forEach((ctx, idx) => {
          messages.push({ 
            role: idx % 2 === 0 ? 'user' : 'assistant', 
            content: ctx 
          });
        });
      }
      
      messages.push({ role: 'user', content: params.prompt });

      const response = await this.client.chat({
        model: params.model,
        messages,
        temperature: params.temperature ?? 0.7,
        maxTokens: params.maxTokens ?? 1000,
      });

      return {
        content: response.choices[0].message.content || '',
        tokensUsed: response.usage?.total_tokens || 0,
        model: response.model,
        finishReason: response.choices[0].finish_reason || 'stop',
      };
    } catch (error) {
      this.logger.error(`Mistral API error: ${error.message}`, error.stack);
      throw error;
    }
  }

  async *streamResponse(params: AIRequestParams): AsyncGenerator<AIStreamChunk> {
    try {
      const messages: any[] = [];
      
      if (params.systemPrompt) {
        messages.push({ role: 'system', content: params.systemPrompt });
      }
      
      if (params.context && params.context.length > 0) {
        params.context.forEach((ctx, idx) => {
          messages.push({ 
            role: idx % 2 === 0 ? 'user' : 'assistant', 
            content: ctx 
          });
        });
      }
      
      messages.push({ role: 'user', content: params.prompt });

      const stream = await this.client.chatStream({
        model: params.model,
        messages,
        temperature: params.temperature ?? 0.7,
        maxTokens: params.maxTokens ?? 1000,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        const done = chunk.choices[0]?.finish_reason !== null;
        yield { content, done };
      }
    } catch (error) {
      this.logger.error(`Mistral streaming error: ${error.message}`, error.stack);
      throw error;
    }
  }

  validateConfig(config: AIConfig): boolean {
    const validModels = [
      'mistral-large-latest',
      'mistral-large-2402',
      'mistral-small-latest',
      'mistral-small-2402',
      'mistral-medium-latest',
      'open-mistral-7b',
      'open-mixtral-8x7b',
    ];
    return validModels.includes(config.model);
  }

  estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }
}
