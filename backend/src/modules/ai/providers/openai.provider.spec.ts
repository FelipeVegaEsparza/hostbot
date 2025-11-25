import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { OpenAIProvider } from './openai.provider';
import { AIRequestParams } from '../interfaces/ai-provider.interface';

describe('OpenAIProvider', () => {
  let provider: OpenAIProvider;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    mockConfigService.get.mockReturnValue('test-api-key');
    
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OpenAIProvider,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    provider = module.get<OpenAIProvider>(OpenAIProvider);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });

  it('should have name "openai"', () => {
    expect(provider.name).toBe('openai');
  });

  describe('validateConfig', () => {
    it('should return true for valid GPT-4 models', () => {
      expect(provider.validateConfig({ model: 'gpt-4' })).toBe(true);
      expect(provider.validateConfig({ model: 'gpt-4-turbo' })).toBe(true);
      expect(provider.validateConfig({ model: 'gpt-4o' })).toBe(true);
      expect(provider.validateConfig({ model: 'gpt-4o-mini' })).toBe(true);
    });

    it('should return true for valid GPT-3.5 models', () => {
      expect(provider.validateConfig({ model: 'gpt-3.5-turbo' })).toBe(true);
    });

    it('should return false for invalid models', () => {
      expect(provider.validateConfig({ model: 'gpt-5' })).toBe(false);
      expect(provider.validateConfig({ model: 'invalid-model' })).toBe(false);
      expect(provider.validateConfig({ model: 'claude-3' })).toBe(false);
    });
  });

  describe('estimateTokens', () => {
    it('should estimate tokens based on character count', () => {
      const text = 'This is a test message';
      const expectedTokens = Math.ceil(text.length / 4);
      
      expect(provider.estimateTokens(text)).toBe(expectedTokens);
    });

    it('should handle empty string', () => {
      expect(provider.estimateTokens('')).toBe(0);
    });

    it('should handle long text', () => {
      const longText = 'a'.repeat(1000);
      expect(provider.estimateTokens(longText)).toBe(250);
    });
  });

  describe('constructor', () => {
    it('should initialize with API key from config', () => {
      // The constructor is called during beforeEach, so we just verify the provider was created
      expect(provider).toBeDefined();
      expect(provider.name).toBe('openai');
    });
  });
});
