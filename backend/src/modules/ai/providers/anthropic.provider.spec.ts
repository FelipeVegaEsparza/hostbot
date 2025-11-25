import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AnthropicProvider } from './anthropic.provider';

describe('AnthropicProvider', () => {
  let provider: AnthropicProvider;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnthropicProvider,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    provider = module.get<AnthropicProvider>(AnthropicProvider);
    configService = module.get<ConfigService>(ConfigService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });

  it('should have name "anthropic"', () => {
    expect(provider.name).toBe('anthropic');
  });

  describe('validateConfig', () => {
    it('should return true for valid Claude 3.5 Sonnet models', () => {
      expect(provider.validateConfig({ model: 'claude-3-5-sonnet-20241022' })).toBe(true);
      expect(provider.validateConfig({ model: 'claude-3-5-sonnet-20240620' })).toBe(true);
    });

    it('should return true for valid Claude 3 models', () => {
      expect(provider.validateConfig({ model: 'claude-3-opus-20240229' })).toBe(true);
      expect(provider.validateConfig({ model: 'claude-3-sonnet-20240229' })).toBe(true);
      expect(provider.validateConfig({ model: 'claude-3-haiku-20240307' })).toBe(true);
    });

    it('should return false for invalid models', () => {
      expect(provider.validateConfig({ model: 'claude-2' })).toBe(false);
      expect(provider.validateConfig({ model: 'gpt-4' })).toBe(false);
      expect(provider.validateConfig({ model: 'invalid-model' })).toBe(false);
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
});
