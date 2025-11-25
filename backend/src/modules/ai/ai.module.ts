import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AIController } from './ai.controller';
import { AIService } from './ai.service';
import { CircuitBreakerService } from './circuit-breaker.service';
import { OpenAIProvider } from './providers/openai.provider';
import { AnthropicProvider } from './providers/anthropic.provider';
import { GroqProvider } from './providers/groq.provider';
import { GoogleProvider } from './providers/google.provider';
import { MistralProvider } from './providers/mistral.provider';
import { CohereProvider } from './providers/cohere.provider';
import { LlamaProvider } from './providers/llama.provider';

@Module({
  imports: [ConfigModule],
  controllers: [AIController],
  providers: [
    AIService,
    CircuitBreakerService,
    OpenAIProvider,
    AnthropicProvider,
    GroqProvider,
    GoogleProvider,
    MistralProvider,
    CohereProvider,
    LlamaProvider,
  ],
  exports: [AIService],
})
export class AIModule {}
