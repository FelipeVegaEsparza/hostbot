import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Groq from 'groq-sdk';
import { AIProvider, AIRequestParams, AIResponse, AIStreamChunk, AIConfig } from '../interfaces/ai-provider.interface';

@Injectable()
export class GroqProvider implements AIProvider {
  name = 'groq';
  private client: Groq;
  private readonly logger = new Logger(GroqProvider.name);

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GROQ_API_KEY');
    if (!apiKey) {
      this.logger.warn('GROQ_API_KEY not configured');
    }
    this.client = new Groq({
      apiKey: apiKey || 'dummy-key',
    });
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

      const response = await this.client.chat.completions.create({
        model: params.model,
        messages,
        temperature: params.temperature ?? 0.7,
        max_tokens: params.maxTokens ?? 1000,
      });

      return {
        content: response.choices[0].message.content || '',
        tokensUsed: response.usage?.total_tokens || 0,
        model: response.model,
        finishReason: response.choices[0].finish_reason || 'stop',
      };
    } catch (error) {
      this.logger.error(`Groq API error: ${error.message}`, error.stack);
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

      const stream = await this.client.chat.completions.create({
        model: params.model,
        messages,
        temperature: params.temperature ?? 0.7,
        max_tokens: params.maxTokens ?? 1000,
        stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        const done = chunk.choices[0]?.finish_reason !== null;
        yield { content, done };
      }
    } catch (error) {
      this.logger.error(`Groq streaming error: ${error.message}`, error.stack);
      throw error;
    }
  }

  validateConfig(config: AIConfig): boolean {
    const validModels = [
      'llama-3.1-8b-instant',
      'llama-3.1-70b-versatile',
      'llama3-8b-8192',
      'llama3-70b-8192',
      'mixtral-8x7b-32768',
      'gemma-7b-it',
    ];
    return validModels.includes(config.model);
  }

  estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }
}
