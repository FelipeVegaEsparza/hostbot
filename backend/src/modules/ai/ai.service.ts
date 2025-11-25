import { Injectable, BadRequestException, Logger, ServiceUnavailableException } from '@nestjs/common';
import { OpenAIProvider } from './providers/openai.provider';
import { AnthropicProvider } from './providers/anthropic.provider';
import { GroqProvider } from './providers/groq.provider';
import { GoogleProvider } from './providers/google.provider';
import { MistralProvider } from './providers/mistral.provider';
import { CohereProvider } from './providers/cohere.provider';
import { LlamaProvider } from './providers/llama.provider';
import { CircuitBreakerService } from './circuit-breaker.service';
import { AIProvider, AIRequestParams, AIResponse, AIStreamChunk } from './interfaces/ai-provider.interface';

@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);
  private providers: Map<string, AIProvider>;

  constructor(
    private openaiProvider: OpenAIProvider,
    private anthropicProvider: AnthropicProvider,
    private groqProvider: GroqProvider,
    private googleProvider: GoogleProvider,
    private mistralProvider: MistralProvider,
    private cohereProvider: CohereProvider,
    private llamaProvider: LlamaProvider,
    private circuitBreakerService: CircuitBreakerService,
  ) {
    this.providers = new Map<string, AIProvider>([
      ['openai', this.openaiProvider],
      ['anthropic', this.anthropicProvider],
      ['groq', this.groqProvider],
      ['google', this.googleProvider],
      ['mistral', this.mistralProvider],
      ['cohere', this.cohereProvider],
      ['llama', this.llamaProvider],
    ]);
  }

  /**
   * Get a provider by name
   */
  private getProvider(providerName: string): AIProvider {
    const provider = this.providers.get(providerName.toLowerCase());
    if (!provider) {
      throw new BadRequestException(
        `Unknown AI provider: ${providerName}. Available providers: ${Array.from(this.providers.keys()).join(', ')}`
      );
    }
    return provider;
  }

  /**
   * Generate a response from the specified AI provider
   */
  async generateResponse(providerName: string, params: AIRequestParams): Promise<AIResponse> {
    const provider = this.getProvider(providerName);
    
    // Check if provider is configured (for OpenAI)
    if (providerName.toLowerCase() === 'openai' && 'isProviderConfigured' in provider) {
      const isConfigured = (provider as any).isProviderConfigured();
      if (!isConfigured) {
        this.logger.error(`❌ Provider ${providerName} is not properly configured`);
        throw new BadRequestException(
          `Provider "${providerName}" is not configured. Please check your API key configuration.`
        );
      }
    }
    
    // Validate configuration
    if (!provider.validateConfig({ model: params.model })) {
      this.logger.error(`❌ Invalid model "${params.model}" for provider "${providerName}"`);
      throw new BadRequestException(
        `Invalid model "${params.model}" for provider "${providerName}". Please check the model name.`
      );
    }

    // Check circuit breaker
    if (!this.circuitBreakerService.canExecute(providerName)) {
      const fallbackMessage = this.circuitBreakerService.getFallbackResponse(providerName);
      this.logger.warn(`⚠️  Circuit breaker is OPEN for ${providerName}, returning fallback response`);
      
      throw new ServiceUnavailableException({
        message: fallbackMessage,
        provider: providerName,
        circuitState: 'OPEN',
      });
    }

    this.logger.log(`🚀 Generating response with ${providerName} using model ${params.model}`);
    
    try {
      const response = await provider.generateResponse(params);
      this.circuitBreakerService.recordSuccess(providerName);
      this.logger.log(`✅ Successfully generated response with ${providerName}`);
      return response;
    } catch (error) {
      this.logger.error(
        `❌ Failed to generate response with ${providerName}: ${error.message}`,
        error.stack
      );
      this.circuitBreakerService.recordFailure(providerName, error);
      throw error;
    }
  }

  /**
   * Stream a response from the specified AI provider
   */
  async *streamResponse(providerName: string, params: AIRequestParams): AsyncGenerator<AIStreamChunk> {
    const provider = this.getProvider(providerName);
    
    // Validate configuration
    if (!provider.validateConfig({ model: params.model })) {
      throw new BadRequestException(
        `Invalid model "${params.model}" for provider "${providerName}"`
      );
    }

    // Check circuit breaker
    if (!this.circuitBreakerService.canExecute(providerName)) {
      const fallbackMessage = this.circuitBreakerService.getFallbackResponse(providerName);
      this.logger.warn(`Circuit breaker is OPEN for ${providerName}, returning fallback response`);
      
      throw new ServiceUnavailableException({
        message: fallbackMessage,
        provider: providerName,
        circuitState: 'OPEN',
      });
    }

    this.logger.log(`Streaming response with ${providerName} using model ${params.model}`);
    
    try {
      yield* provider.streamResponse(params);
      this.circuitBreakerService.recordSuccess(providerName);
    } catch (error) {
      this.logger.error(
        `Failed to stream response with ${providerName}: ${error.message}`,
        error.stack
      );
      this.circuitBreakerService.recordFailure(providerName, error);
      throw error;
    }
  }

  /**
   * Validate if a provider and model combination is valid
   */
  validateProviderConfig(providerName: string, model: string): boolean {
    try {
      const provider = this.getProvider(providerName);
      return provider.validateConfig({ model });
    } catch {
      return false;
    }
  }

  /**
   * Get list of available providers
   */
  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Estimate tokens for a given text
   */
  estimateTokens(text: string): number {
    // Use a generic estimation (can be overridden by specific provider)
    return Math.ceil(text.length / 4);
  }

  /**
   * Get circuit breaker status for a provider
   */
  getCircuitStatus(providerName: string) {
    return this.circuitBreakerService.getCircuitStatus(providerName);
  }

  /**
   * Get all circuit breaker statuses
   */
  getAllCircuitStatuses() {
    return this.circuitBreakerService.getAllCircuitStatuses();
  }

  /**
   * Reset circuit breaker for a provider (admin function)
   */
  resetCircuit(providerName: string): void {
    this.circuitBreakerService.resetCircuit(providerName);
  }
}
