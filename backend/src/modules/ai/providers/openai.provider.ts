import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { AIProvider, AIRequestParams, AIResponse, AIStreamChunk, AIConfig } from '../interfaces/ai-provider.interface';
import { AI_MODELS, AI_PROVIDERS } from '../../../common/constants/ai-constants';

@Injectable()
export class OpenAIProvider implements AIProvider {
  name = 'openai';
  private client: OpenAI;
  private readonly logger = new Logger(OpenAIProvider.name);
  private isConfigured: boolean = false;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey || apiKey === '' || apiKey === 'dummy-key') {
      this.logger.warn('⚠️  OPENAI_API_KEY not configured - OpenAI provider will not work');
      this.isConfigured = false;
      this.client = new OpenAI({
        apiKey: 'dummy-key',
      });
    } else {
      this.logger.log('✅ OpenAI provider initialized successfully');
      this.isConfigured = true;
      this.client = new OpenAI({
        apiKey: apiKey,
      });
      // Test the API key on initialization
      this.testConnection();
    }
  }

  /**
   * Test the OpenAI API connection
   */
  private async testConnection(): Promise<void> {
    try {
      this.logger.log('🔍 Testing OpenAI API connection...');
      // Make a minimal API call to verify the key works
      await this.client.models.list();
      this.logger.log('✅ OpenAI API connection test successful');
    } catch (error) {
      this.logger.error(
        `❌ OpenAI API connection test failed: ${error.message}`,
        error.stack
      );
      this.isConfigured = false;
    }
  }

  /**
   * Check if the provider is properly configured
   */
  isProviderConfigured(): boolean {
    return this.isConfigured;
  }

  async generateResponse(params: AIRequestParams): Promise<AIResponse> {
    if (!this.isConfigured) {
      const error = new Error('OpenAI provider is not configured. Please set OPENAI_API_KEY in environment variables.');
      this.logger.error(`❌ ${error.message}`);
      throw error;
    }

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

      this.logger.log(`📤 Sending request to OpenAI: model=${params.model}, messages=${messages.length}`);

      const response = await this.client.chat.completions.create({
        model: params.model,
        messages,
        temperature: params.temperature ?? 0.7,
        max_tokens: params.maxTokens ?? 1000,
      });

      this.logger.log(`📥 Received response from OpenAI: tokens=${response.usage?.total_tokens}, finish_reason=${response.choices[0].finish_reason}`);

      return {
        content: response.choices[0].message.content || '',
        tokensUsed: response.usage?.total_tokens || 0,
        model: response.model,
        finishReason: response.choices[0].finish_reason || 'stop',
      };
    } catch (error) {
      this.logger.error(`❌ OpenAI API error: ${error.message}`, error.stack);
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
      this.logger.error(`OpenAI streaming error: ${error.message}`, error.stack);
      throw error;
    }
  }

  validateConfig(config: AIConfig): boolean {
    const validModels = AI_MODELS[AI_PROVIDERS.OPENAI];
    return validModels.includes(config.model as any);
  }

  estimateTokens(text: string): number {
    // Rough estimation: ~4 characters per token
    return Math.ceil(text.length / 4);
  }
}
