import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CohereClient } from 'cohere-ai';
import { AIProvider, AIRequestParams, AIResponse, AIStreamChunk, AIConfig } from '../interfaces/ai-provider.interface';

@Injectable()
export class CohereProvider implements AIProvider {
  name = 'cohere';
  private client: CohereClient;
  private readonly logger = new Logger(CohereProvider.name);

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('COHERE_API_KEY');
    if (!apiKey) {
      this.logger.warn('COHERE_API_KEY not configured');
    }
    this.client = new CohereClient({
      token: apiKey || 'dummy-key',
    });
  }

  async generateResponse(params: AIRequestParams): Promise<AIResponse> {
    try {
      const chatHistory: any[] = [];
      
      if (params.context && params.context.length > 0) {
        params.context.forEach((ctx, idx) => {
          chatHistory.push({ 
            role: idx % 2 === 0 ? 'USER' : 'CHATBOT', 
            message: ctx 
          });
        });
      }

      const response = await this.client.chat({
        model: params.model,
        message: params.prompt,
        chatHistory: chatHistory.length > 0 ? chatHistory : undefined,
        preamble: params.systemPrompt,
        temperature: params.temperature ?? 0.7,
        maxTokens: params.maxTokens ?? 1000,
      });

      return {
        content: response.text,
        tokensUsed: response.meta?.tokens?.inputTokens + response.meta?.tokens?.outputTokens || 0,
        model: params.model,
        finishReason: response.finishReason || 'COMPLETE',
      };
    } catch (error) {
      this.logger.error(`Cohere API error: ${error.message}`, error.stack);
      throw error;
    }
  }

  async *streamResponse(params: AIRequestParams): AsyncGenerator<AIStreamChunk> {
    try {
      const chatHistory: any[] = [];
      
      if (params.context && params.context.length > 0) {
        params.context.forEach((ctx, idx) => {
          chatHistory.push({ 
            role: idx % 2 === 0 ? 'USER' : 'CHATBOT', 
            message: ctx 
          });
        });
      }

      const stream = await this.client.chatStream({
        model: params.model,
        message: params.prompt,
        chatHistory: chatHistory.length > 0 ? chatHistory : undefined,
        preamble: params.systemPrompt,
        temperature: params.temperature ?? 0.7,
        maxTokens: params.maxTokens ?? 1000,
      });

      for await (const chunk of stream) {
        if (chunk.eventType === 'text-generation') {
          yield { content: chunk.text || '', done: false };
        } else if (chunk.eventType === 'stream-end') {
          yield { content: '', done: true };
        }
      }
    } catch (error) {
      this.logger.error(`Cohere streaming error: ${error.message}`, error.stack);
      throw error;
    }
  }

  validateConfig(config: AIConfig): boolean {
    const validModels = [
      'command-r-plus',
      'command-r',
      'command',
      'command-light',
      'command-nightly',
    ];
    return validModels.includes(config.model);
  }

  estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }
}
