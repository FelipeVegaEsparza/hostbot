export const AI_PROVIDERS = {
  OPENAI: 'openai',
  ANTHROPIC: 'anthropic',
  GROQ: 'groq',
  GOOGLE: 'google',
  MISTRAL: 'mistral',
  COHERE: 'cohere',
  LLAMA: 'llama',
} as const;

export const AI_MODELS = {
  [AI_PROVIDERS.OPENAI]: [
    'gpt-4',
    'gpt-4-turbo',
    'gpt-4-turbo-preview',
    'gpt-4o',
    'gpt-4o-mini',
    'gpt-3.5-turbo',
  ],
  [AI_PROVIDERS.ANTHROPIC]: [
    'claude-3-opus',
    'claude-3-sonnet',
    'claude-3-haiku',
    'claude-2.1',
    'claude-2',
  ],
  [AI_PROVIDERS.GROQ]: [
    'llama3-70b',
    'llama3-8b',
    'mixtral-8x7b',
    'gemma-7b',
  ],
  [AI_PROVIDERS.GOOGLE]: [
    'gemini-pro',
    'gemini-pro-vision',
  ],
  [AI_PROVIDERS.MISTRAL]: [
    'mistral-tiny',
    'mistral-small',
    'mistral-medium',
    'mistral-large',
  ],
  [AI_PROVIDERS.COHERE]: [
    'command',
    'command-light',
    'command-nightly',
  ],
  [AI_PROVIDERS.LLAMA]: [
    'llama-2-7b',
    'llama-2-13b',
    'llama-2-70b',
  ],
} as const;

export const VALID_PROVIDERS = Object.values(AI_PROVIDERS);
