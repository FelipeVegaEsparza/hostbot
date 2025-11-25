import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { AIService } from './ai.service';
import { OpenAIProvider } from './providers/openai.provider';
import { AnthropicProvider } from './providers/anthropic.provider';
import { GroqProvider } from './providers/groq.provider';
import { GoogleProvider } from './providers/google.provider';
import { MistralProvider } from './providers/mistral.provider';
import { CohereProvider } from './providers/cohere.provider';
import { LlamaProvider } from './providers/llama.provider';
import { CircuitBreakerService } from './circuit-breaker.service';
import { AIRequestParams, AIResponse } from './interfaces/ai-provider.interface';

describe('AIService', () => {
  let service: AIService;
  let circuitBreakerService: CircuitBreakerService;
  let openaiProvider: OpenAIProvider;
  let anthropicProvider: AnthropicProvider;

  const mockOpenAIProvider = {
    name: 'openai',
    generateResponse: jest.fn(),
    streamResponse: jest.fn(),
    validateConfig: jest.fn(),
    estimateTokens: jest.fn(),
  };

  const mockAnthropicProvider = {
    name: 'anthropic',
    generateResponse: jest.fn(),
    streamResponse: jest.fn(),
    validateConfig: jest.fn(),
    estimateTokens: jest.fn(),
  };

  const mockGroqProvider = {
    name: 'groq',
    generateResponse: jest.fn(),
    streamResponse: jest.fn(),
    validateConfig: jest.fn(),
    estimateTokens: jest.fn(),
  };

  const mockGoogleProvider = {
    name: 'google',
    generateResponse: jest.fn(),
    streamResponse: jest.fn(),
    validateConfig: jest.fn(),
    estimateTokens: jest.fn(),
  };

  const mockMistralProvider = {
    name: 'mistral',
    generateResponse: jest.fn(),
    streamResponse: jest.fn(),
    validateConfig: jest.fn(),
    estimateTokens: jest.fn(),
  };

  const mockCohereProvider = {
    name: 'cohere',
    generateResponse: jest.fn(),
    streamResponse: jest.fn(),
    validateConfig: jest.fn(),
    estimateTokens: jest.fn(),
  };

  const mockLlamaProvider = {
    name: 'llama',
    generateResponse: jest.fn(),
    streamResponse: jest.fn(),
    validateConfig: jest.fn(),
    estimateTokens: jest.fn(),
  };

  const mockCircuitBreakerService = {
    canExecute: jest.fn(),
    recordSuccess: jest.fn(),
    recordFailure: jest.fn(),
    getFallbackResponse: jest.fn(),
    getCircuitStatus: jest.fn(),
    getAllCircuitStatuses: jest.fn(),
    resetCircuit: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AIService,
        {
          provide: OpenAIProvider,
          useValue: mockOpenAIProvider,
        },
        {
          provide: AnthropicProvider,
          useValue: mockAnthropicProvider,
        },
        {
          provide: GroqProvider,
          useValue: mockGroqProvider,
        },
        {
          provide: GoogleProvider,
          useValue: mockGoogleProvider,
        },
        {
          provide: MistralProvider,
          useValue: mockMistralProvider,
        },
        {
          provide: CohereProvider,
          useValue: mockCohereProvider,
        },
        {
          provide: LlamaProvider,
          useValue: mockLlamaProvider,
        },
        {
          provide: CircuitBreakerService,
          useValue: mockCircuitBreakerService,
        },
      ],
    }).compile();

    service = module.get<AIService>(AIService);
    circuitBreakerService = module.get<CircuitBreakerService>(CircuitBreakerService);
    openaiProvider = module.get<OpenAIProvider>(OpenAIProvider);
    anthropicProvider = module.get<AnthropicProvider>(AnthropicProvider);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateResponse', () => {
    const params: AIRequestParams = {
      prompt: 'Hello, how are you?',
      context: [],
      model: 'gpt-4',
      temperature: 0.7,
      maxTokens: 1000,
    };

    it('should route request to correct provider', async () => {
      const mockResponse: AIResponse = {
        content: 'I am doing well, thank you!',
        tokensUsed: 50,
        model: 'gpt-4',
        finishReason: 'stop',
      };

      mockOpenAIProvider.validateConfig.mockReturnValue(true);
      mockCircuitBreakerService.canExecute.mockReturnValue(true);
      mockOpenAIProvider.generateResponse.mockResolvedValue(mockResponse);

      const result = await service.generateResponse('openai', params);

      expect(mockOpenAIProvider.validateConfig).toHaveBeenCalledWith({ model: params.model });
      expect(mockCircuitBreakerService.canExecute).toHaveBeenCalledWith('openai');
      expect(mockOpenAIProvider.generateResponse).toHaveBeenCalledWith(params);
      expect(mockCircuitBreakerService.recordSuccess).toHaveBeenCalledWith('openai');
      expect(result).toEqual(mockResponse);
    });

    it('should throw BadRequestException for unknown provider', async () => {
      await expect(service.generateResponse('unknown-provider', params)).rejects.toThrow(
        BadRequestException
      );
    });

    it('should throw BadRequestException for invalid model', async () => {
      mockOpenAIProvider.validateConfig.mockReturnValue(false);

      await expect(service.generateResponse('openai', params)).rejects.toThrow(
        BadRequestException
      );
      expect(mockOpenAIProvider.generateResponse).not.toHaveBeenCalled();
    });

    it('should throw ServiceUnavailableException when circuit is open', async () => {
      mockOpenAIProvider.validateConfig.mockReturnValue(true);
      mockCircuitBreakerService.canExecute.mockReturnValue(false);
      mockCircuitBreakerService.getFallbackResponse.mockReturnValue('Service unavailable');

      await expect(service.generateResponse('openai', params)).rejects.toThrow(
        ServiceUnavailableException
      );
      expect(mockOpenAIProvider.generateResponse).not.toHaveBeenCalled();
    });

    it('should record failure when provider throws error', async () => {
      const error = new Error('API Error');
      
      mockOpenAIProvider.validateConfig.mockReturnValue(true);
      mockCircuitBreakerService.canExecute.mockReturnValue(true);
      mockOpenAIProvider.generateResponse.mockRejectedValue(error);

      await expect(service.generateResponse('openai', params)).rejects.toThrow(error);
      expect(mockCircuitBreakerService.recordFailure).toHaveBeenCalledWith('openai', error);
    });

    it('should work with anthropic provider', async () => {
      const mockResponse: AIResponse = {
        content: 'Response from Claude',
        tokensUsed: 60,
        model: 'claude-3-5-sonnet-20241022',
        finishReason: 'end_turn',
      };

      mockAnthropicProvider.validateConfig.mockReturnValue(true);
      mockCircuitBreakerService.canExecute.mockReturnValue(true);
      mockAnthropicProvider.generateResponse.mockResolvedValue(mockResponse);

      const result = await service.generateResponse('anthropic', {
        ...params,
        model: 'claude-3-5-sonnet-20241022',
      });

      expect(mockAnthropicProvider.generateResponse).toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });
  });

  describe('streamResponse', () => {
    const params: AIRequestParams = {
      prompt: 'Tell me a story',
      context: [],
      model: 'gpt-4',
    };

    it('should stream response from provider', async () => {
      const mockChunks = [
        { content: 'Once ', done: false },
        { content: 'upon ', done: false },
        { content: 'a time', done: true },
      ];

      async function* mockGenerator() {
        for (const chunk of mockChunks) {
          yield chunk;
        }
      }

      mockOpenAIProvider.validateConfig.mockReturnValue(true);
      mockCircuitBreakerService.canExecute.mockReturnValue(true);
      mockOpenAIProvider.streamResponse.mockReturnValue(mockGenerator());

      const generator = service.streamResponse('openai', params);
      const chunks = [];
      
      for await (const chunk of generator) {
        chunks.push(chunk);
      }

      expect(chunks).toEqual(mockChunks);
      expect(mockCircuitBreakerService.recordSuccess).toHaveBeenCalledWith('openai');
    });

    it('should throw when circuit is open', async () => {
      mockOpenAIProvider.validateConfig.mockReturnValue(true);
      mockCircuitBreakerService.canExecute.mockReturnValue(false);
      mockCircuitBreakerService.getFallbackResponse.mockReturnValue('Service unavailable');

      const generator = service.streamResponse('openai', params);

      await expect(generator.next()).rejects.toThrow(ServiceUnavailableException);
    });

    it('should record failure on streaming error', async () => {
      const error = new Error('Streaming error');

      async function* mockGenerator() {
        throw error;
      }

      mockOpenAIProvider.validateConfig.mockReturnValue(true);
      mockCircuitBreakerService.canExecute.mockReturnValue(true);
      mockOpenAIProvider.streamResponse.mockReturnValue(mockGenerator());

      const generator = service.streamResponse('openai', params);

      await expect(generator.next()).rejects.toThrow(error);
      expect(mockCircuitBreakerService.recordFailure).toHaveBeenCalledWith('openai', error);
    });
  });

  describe('validateProviderConfig', () => {
    it('should return true for valid provider and model', () => {
      mockOpenAIProvider.validateConfig.mockReturnValue(true);

      const result = service.validateProviderConfig('openai', 'gpt-4');

      expect(result).toBe(true);
      expect(mockOpenAIProvider.validateConfig).toHaveBeenCalledWith({ model: 'gpt-4' });
    });

    it('should return false for invalid model', () => {
      mockOpenAIProvider.validateConfig.mockReturnValue(false);

      const result = service.validateProviderConfig('openai', 'invalid-model');

      expect(result).toBe(false);
    });

    it('should return false for unknown provider', () => {
      const result = service.validateProviderConfig('unknown', 'model');

      expect(result).toBe(false);
    });
  });

  describe('getAvailableProviders', () => {
    it('should return list of all available providers', () => {
      const providers = service.getAvailableProviders();

      expect(providers).toEqual([
        'openai',
        'anthropic',
        'groq',
        'google',
        'mistral',
        'cohere',
        'llama',
      ]);
    });
  });

  describe('estimateTokens', () => {
    it('should estimate tokens for text', () => {
      const text = 'This is a test message';
      const result = service.estimateTokens(text);

      expect(result).toBe(Math.ceil(text.length / 4));
    });
  });

  describe('getCircuitStatus', () => {
    it('should return circuit status for provider', () => {
      const mockStatus = {
        state: 'CLOSED',
        failureCount: 0,
        lastFailureTime: null,
        nextAttemptTime: null,
        successCount: 10,
      };

      mockCircuitBreakerService.getCircuitStatus.mockReturnValue(mockStatus);

      const result = service.getCircuitStatus('openai');

      expect(result).toEqual(mockStatus);
      expect(mockCircuitBreakerService.getCircuitStatus).toHaveBeenCalledWith('openai');
    });
  });

  describe('getAllCircuitStatuses', () => {
    it('should return all circuit statuses', () => {
      const mockStatuses = new Map([
        ['openai', { state: 'CLOSED', failureCount: 0 }],
        ['anthropic', { state: 'OPEN', failureCount: 5 }],
      ]);

      mockCircuitBreakerService.getAllCircuitStatuses.mockReturnValue(mockStatuses);

      const result = service.getAllCircuitStatuses();

      expect(result).toEqual(mockStatuses);
    });
  });

  describe('resetCircuit', () => {
    it('should reset circuit for provider', () => {
      service.resetCircuit('openai');

      expect(mockCircuitBreakerService.resetCircuit).toHaveBeenCalledWith('openai');
    });
  });
});
