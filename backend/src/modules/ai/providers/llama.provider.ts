import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { AIProvider, AIRequestParams, AIResponse, AIStreamChunk, AIConfig } from '../interfaces/ai-provider.interface';

@Injectable()
export class LlamaProvider implements AIProvider {
  name = 'llama';
  private client: AxiosInstance;
  private readonly logger = new Logger(LlamaProvider.name);
  private readonly baseUrl: string;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('LLAMA_API_KEY');
    this.baseUrl = this.configService.get<string>('LLAMA_API_URL') || 'https://api.llama-api.com';
    
    if (!apiKey) {
      this.logger.warn('LLAMA_API_KEY not configured');
    }

    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Authorization': `Bearer ${apiKey || 'dummy-key'}`,
        'Content-Type': 'application/json',
      },
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

      const response = await this.client.post('/chat/completions', {
        model: params.model,
        messages,
        temperature: params.temperature ?? 0.7,
        max_tokens: params.maxTokens ?? 1000,
      });

      const data = response.data;

      return {
        content: data.choices[0].message.content || '',
        tokensUsed: data.usage?.total_tokens || 0,
        model: data.model,
        finishReason: data.choices[0].finish_reason || 'stop',
      };
    } catch (error) {
      this.logger.error(`Llama API error: ${error.message}`, error.stack);
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

      const response = await this.client.post('/chat/completions', {
        model: params.model,
        messages,
        temperature: params.temperature ?? 0.7,
        max_tokens: params.maxTokens ?? 1000,
        stream: true,
      }, {
        responseType: 'stream',
      });

      for await (const chunk of response.data) {
        const lines = chunk.toString().split('\n').filter(line => line.trim() !== '');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              yield { content: '', done: true };
              return;
            }
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices[0]?.delta?.content || '';
              const done = parsed.choices[0]?.finish_reason !== null;
              yield { content, done };
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      this.logger.error(`Llama streaming error: ${error.message}`, error.stack);
      throw error;
    }
  }

  validateConfig(config: AIConfig): boolean {
    const validModels = [
      'llama3.2-1b',
      'llama3.2-3b',
      'llama3.1-8b',
      'llama3.1-70b',
      'llama3-8b',
      'llama3-70b',
    ];
    return validModels.includes(config.model);
  }

  estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }
}
