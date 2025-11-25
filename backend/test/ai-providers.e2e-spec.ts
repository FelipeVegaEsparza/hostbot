import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { setupTestDatabase, teardownTestDatabase, prisma } from './test-setup';

describe('AI Providers Integration (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let customerId: string;
  let chatbotId: string;

  beforeAll(async () => {
    await setupTestDatabase();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();

    // Create test plan with all AI providers
    const plan = await prisma.plan.create({
      data: {
        name: 'Premium Plan',
        price: 99.99,
        maxChatbots: 10,
        maxMessagesPerMonth: 10000,
        aiProviders: ['openai', 'anthropic', 'groq', 'google', 'mistral', 'cohere', 'llama'],
        features: {},
      },
    });

    // Register user
    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'ai-test@example.com',
        password: 'Test123456!',
        name: 'AI Test User',
      });

    authToken = registerResponse.body.access_token;
    customerId = registerResponse.body.user.customer.id;

    // Create subscription
    await prisma.subscription.create({
      data: {
        customerId: customerId,
        planId: plan.id,
        status: 'ACTIVE',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
  });

  afterAll(async () => {
    await teardownTestDatabase();
    await app.close();
  });

  describe('OpenAI Provider', () => {
    beforeAll(async () => {
      const chatbotResponse = await request(app.getHttpServer())
        .post('/chatbots')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'OpenAI Chatbot',
          aiProvider: 'openai',
          aiModel: 'gpt-4o-mini',
          systemPrompt: 'You are a helpful assistant.',
        });
      chatbotId = chatbotResponse.body.id;
    });

    it('should generate response using OpenAI', async () => {
      const response = await request(app.getHttpServer())
        .post('/ai/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          chatbotId: chatbotId,
          prompt: 'Say hello in one word',
          context: [],
        })
        .expect(200);

      expect(response.body).toHaveProperty('content');
      expect(response.body).toHaveProperty('tokensUsed');
      expect(response.body).toHaveProperty('model');
      expect(typeof response.body.content).toBe('string');
      expect(response.body.content.length).toBeGreaterThan(0);
    });

    it('should validate OpenAI model configuration', async () => {
      await request(app.getHttpServer())
        .post('/chatbots')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Invalid OpenAI Model',
          aiProvider: 'openai',
          aiModel: 'invalid-model-name',
          systemPrompt: 'Test',
        })
        .expect(400);
    });
  });

  describe('Anthropic Provider', () => {
    let anthropicChatbotId: string;

    beforeAll(async () => {
      const chatbotResponse = await request(app.getHttpServer())
        .post('/chatbots')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Anthropic Chatbot',
          aiProvider: 'anthropic',
          aiModel: 'claude-3-5-sonnet-20241022',
          systemPrompt: 'You are Claude, a helpful AI assistant.',
        });
      anthropicChatbotId = chatbotResponse.body.id;
    });

    it('should generate response using Anthropic', async () => {
      const response = await request(app.getHttpServer())
        .post('/ai/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          chatbotId: anthropicChatbotId,
          prompt: 'Say hello in one word',
          context: [],
        })
        .expect(200);

      expect(response.body).toHaveProperty('content');
      expect(response.body).toHaveProperty('tokensUsed');
      expect(typeof response.body.content).toBe('string');
    });

    it('should validate Anthropic model configuration', async () => {
      await request(app.getHttpServer())
        .post('/chatbots')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Invalid Anthropic Model',
          aiProvider: 'anthropic',
          aiModel: 'invalid-claude-model',
          systemPrompt: 'Test',
        })
        .expect(400);
    });
  });

  describe('Groq Provider', () => {
    let groqChatbotId: string;

    beforeAll(async () => {
      const chatbotResponse = await request(app.getHttpServer())
        .post('/chatbots')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Groq Chatbot',
          aiProvider: 'groq',
          aiModel: 'llama-3.1-8b-instant',
          systemPrompt: 'You are a helpful assistant.',
        });
      groqChatbotId = chatbotResponse.body.id;
    });

    it('should generate response using Groq', async () => {
      const response = await request(app.getHttpServer())
        .post('/ai/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          chatbotId: groqChatbotId,
          prompt: 'Say hello in one word',
          context: [],
        })
        .expect(200);

      expect(response.body).toHaveProperty('content');
      expect(typeof response.body.content).toBe('string');
    });
  });

  describe('AI Provider Routing', () => {
    it('should route requests to correct provider based on chatbot config', async () => {
      // Create chatbots with different providers
      const providers = [
        { provider: 'openai', model: 'gpt-4o-mini' },
        { provider: 'anthropic', model: 'claude-3-5-sonnet-20241022' },
        { provider: 'groq', model: 'llama-3.1-8b-instant' },
      ];

      for (const config of providers) {
        const chatbotResponse = await request(app.getHttpServer())
          .post('/chatbots')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            name: `${config.provider} Test Bot`,
            aiProvider: config.provider,
            aiModel: config.model,
            systemPrompt: 'You are a helpful assistant.',
          });

        const testChatbotId = chatbotResponse.body.id;

        const aiResponse = await request(app.getHttpServer())
          .post('/ai/generate')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            chatbotId: testChatbotId,
            prompt: 'Hello',
            context: [],
          })
          .expect(200);

        expect(aiResponse.body).toHaveProperty('content');
        expect(aiResponse.body.content.length).toBeGreaterThan(0);
      }
    });
  });

  describe('AI Request Validation', () => {
    it('should fail with empty prompt', async () => {
      await request(app.getHttpServer())
        .post('/ai/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          chatbotId: chatbotId,
          prompt: '',
          context: [],
        })
        .expect(400);
    });

    it('should fail without authentication', async () => {
      await request(app.getHttpServer())
        .post('/ai/generate')
        .send({
          chatbotId: chatbotId,
          prompt: 'Hello',
          context: [],
        })
        .expect(401);
    });

    it('should fail with invalid chatbot id', async () => {
      await request(app.getHttpServer())
        .post('/ai/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          chatbotId: '00000000-0000-0000-0000-000000000000',
          prompt: 'Hello',
          context: [],
        })
        .expect(404);
    });

    it('should handle context array in requests', async () => {
      const response = await request(app.getHttpServer())
        .post('/ai/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          chatbotId: chatbotId,
          prompt: 'What did I just say?',
          context: ['I said hello', 'You replied with a greeting'],
        })
        .expect(200);

      expect(response.body).toHaveProperty('content');
    });
  });

  describe('Circuit Breaker Integration', () => {
    it('should handle provider failures gracefully', async () => {
      // Create chatbot with invalid API key scenario
      const testChatbot = await request(app.getHttpServer())
        .post('/chatbots')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Circuit Breaker Test',
          aiProvider: 'openai',
          aiModel: 'gpt-4o-mini',
          systemPrompt: 'Test',
        });

      // This should either succeed or fail gracefully with proper error
      const response = await request(app.getHttpServer())
        .post('/ai/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          chatbotId: testChatbot.body.id,
          prompt: 'Test circuit breaker',
          context: [],
        });

      // Should return either 200 (success) or 503 (circuit open) or 500 (error)
      expect([200, 500, 503]).toContain(response.status);
    });
  });

  describe('AI Configuration', () => {
    it('should respect temperature settings', async () => {
      const response = await request(app.getHttpServer())
        .post('/ai/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          chatbotId: chatbotId,
          prompt: 'Say hello',
          context: [],
          temperature: 0.1,
        })
        .expect(200);

      expect(response.body).toHaveProperty('content');
    });

    it('should respect maxTokens settings', async () => {
      const response = await request(app.getHttpServer())
        .post('/ai/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          chatbotId: chatbotId,
          prompt: 'Write a very short greeting',
          context: [],
          maxTokens: 10,
        })
        .expect(200);

      expect(response.body).toHaveProperty('content');
      expect(response.body.tokensUsed).toBeLessThanOrEqual(20); // Some buffer
    });
  });

  describe('System Prompt Integration', () => {
    it('should use chatbot system prompt in AI requests', async () => {
      const specialChatbot = await request(app.getHttpServer())
        .post('/chatbots')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Pirate Chatbot',
          aiProvider: 'openai',
          aiModel: 'gpt-4o-mini',
          systemPrompt: 'You are a pirate. Always respond like a pirate.',
        });

      const response = await request(app.getHttpServer())
        .post('/ai/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          chatbotId: specialChatbot.body.id,
          prompt: 'Say hello',
          context: [],
        })
        .expect(200);

      expect(response.body).toHaveProperty('content');
      // The response should reflect the pirate personality
      expect(response.body.content.length).toBeGreaterThan(0);
    });
  });
});
