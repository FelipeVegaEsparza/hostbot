# AI Module

This module provides a multi-vendor AI system that supports multiple AI providers through a unified interface.

## Supported Providers

1. **OpenAI** - GPT-4, GPT-4o, GPT-4o-mini, GPT-3.5-turbo
2. **Anthropic** - Claude 3.5 Sonnet, Claude 3 Opus, Claude 3 Sonnet, Claude 3 Haiku
3. **Groq** - Llama 3.1 8B, Llama 3.1 70B, Mixtral 8x7B
4. **Google AI** - Gemini 1.5 Flash, Gemini 1.5 Pro
5. **Mistral AI** - Mistral Large, Mistral Small, Mistral Medium
6. **Cohere** - Command R+, Command R, Command Light
7. **Llama API** - Llama 3.2 1B, Llama 3.2 3B, Llama 3.1

## Environment Variables

Configure API keys in your `.env` file:

```env
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
GROQ_API_KEY=your_groq_key
GOOGLE_AI_API_KEY=your_google_key
MISTRAL_API_KEY=your_mistral_key
COHERE_API_KEY=your_cohere_key
LLAMA_API_KEY=your_llama_key
LLAMA_API_URL=https://api.llama-api.com
```

## API Endpoints

### Generate Response

```http
POST /ai/generate
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "provider": "openai",
  "model": "gpt-4o",
  "prompt": "Hello, how are you?",
  "systemPrompt": "You are a helpful assistant.",
  "context": ["Previous message 1", "Previous message 2"],
  "temperature": 0.7,
  "maxTokens": 1000
}
```

### Stream Response (SSE)

```http
POST /ai/stream
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "provider": "anthropic",
  "model": "claude-3-5-sonnet-20241022",
  "prompt": "Tell me a story",
  "temperature": 0.8
}
```

### Get Available Providers

```http
GET /ai/providers
Authorization: Bearer <jwt_token>
```

### Validate Provider Configuration

```http
POST /ai/validate
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "provider": "openai",
  "model": "gpt-4o"
}
```

## Usage in Code

```typescript
import { AIService } from './modules/ai/ai.service';

// Inject the service
constructor(private aiService: AIService) {}

// Generate a response
const response = await this.aiService.generateResponse('openai', {
  prompt: 'What is the capital of France?',
  model: 'gpt-4o',
  temperature: 0.7,
});

console.log(response.content); // "The capital of France is Paris."

// Stream a response
const stream = this.aiService.streamResponse('anthropic', {
  prompt: 'Write a poem about the ocean',
  model: 'claude-3-5-sonnet-20241022',
});

for await (const chunk of stream) {
  if (!chunk.done) {
    process.stdout.write(chunk.content);
  }
}
```

## Architecture

The module uses the Strategy pattern to support multiple AI providers:

- **AIProvider Interface**: Defines the contract all providers must implement
- **Provider Implementations**: Each provider (OpenAI, Anthropic, etc.) implements the interface
- **AIService**: Central router that delegates requests to the appropriate provider
- **AIModule**: NestJS module that registers all providers and exports the service

## Adding a New Provider

1. Create a new provider class in `providers/` that implements `AIProvider`
2. Register the provider in `ai.module.ts`
3. Add the provider to the `AIService` constructor and providers map
4. Add environment variables for API keys
5. Update this README with supported models
