import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIProvider, AIRequestParams, AIResponse, AIStreamChunk, AIConfig } from '../interfaces/ai-provider.interface';

@Injectable()
export class GoogleProvider implements AIProvider {
  name = 'google';
  private client: GoogleGenerativeAI;
  private readonly logger = new Logger(GoogleProvider.name);

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GOOGLE_AI_API_KEY');
    if (!apiKey) {
      this.logger.warn('GOOGLE_AI_API_KEY not configured');
    }
    this.client = new GoogleGenerativeAI(apiKey || 'dummy-key');
  }

  async generateResponse(params: AIRequestParams): Promise<AIResponse> {
    try {
      const model = this.client.getGenerativeModel({ model: params.model });
      
      let prompt = params.prompt;
      if (params.systemPrompt) {
        prompt = `${params.systemPrompt}\n\n${prompt}`;
      }
      if (params.context && params.context.length > 0) {
        prompt = `Context:\n${params.context.join('\n')}\n\n${prompt}`;
      }

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: params.temperature ?? 0.7,
          maxOutputTokens: params.maxTokens ?? 1000,
        },
      });

      const response = result.response;
      const text = response.text();

      return {
        content: text,
        tokensUsed: this.estimateTokens(prompt + text),
        model: params.model,
        finishReason: 'stop',
      };
    } catch (error) {
      this.logger.error(`Google AI API error: ${error.message}`, error.stack);
      throw error;
    }
  }

  async *streamResponse(params: AIRequestParams): AsyncGenerator<AIStreamChunk> {
    try {
      const model = this.client.getGenerativeModel({ model: params.model });
      
      let prompt = params.prompt;
      if (params.systemPrompt) {
        prompt = `${params.systemPrompt}\n\n${prompt}`;
      }
      if (params.context && params.context.length > 0) {
        prompt = `Context:\n${params.context.join('\n')}\n\n${prompt}`;
      }

      const result = await model.generateContentStream({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: params.temperature ?? 0.7,
          maxOutputTokens: params.maxTokens ?? 1000,
        },
      });

      for await (const chunk of result.stream) {
        const text = chunk.text();
        yield { content: text, done: false };
      }
      
      yield { content: '', done: true };
    } catch (error) {
      this.logger.error(`Google AI streaming error: ${error.message}`, error.stack);
      throw error;
    }
  }

  validateConfig(config: AIConfig): boolean {
    const validModels = [
      'gemini-1.5-flash',
      'gemini-1.5-flash-latest',
      'gemini-1.5-pro',
      'gemini-1.5-pro-latest',
      'gemini-pro',
    ];
    return validModels.includes(config.model);
  }

  estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }
}
