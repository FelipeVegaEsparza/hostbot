export interface AIProvider {
  name: string;
  
  generateResponse(params: AIRequestParams): Promise<AIResponse>;
  streamResponse(params: AIRequestParams): AsyncGenerator<AIStreamChunk>;
  validateConfig(config: AIConfig): boolean;
  estimateTokens(text: string): number;
}

export interface AIRequestParams {
  prompt: string;
  context?: string[];
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  model: string;
}

export interface AIResponse {
  content: string;
  tokensUsed: number;
  model: string;
  finishReason: string;
}

export interface AIStreamChunk {
  content: string;
  done: boolean;
}

export interface AIConfig {
  model: string;
  temperature?: number;
  maxTokens?: number;
  [key: string]: any;
}
