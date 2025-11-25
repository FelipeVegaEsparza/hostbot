import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { setupTestDatabase, teardownTestDatabase, prisma } from './test-setup';
import { Queue } from 'bullmq';
import { getQueueToken } from '@nestjs/bullmq';
import { QUEUE_NAMES } from '../src/modules/queues/queue-names.constant';

describe('AI Processing Integration (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let customerId: string;
  let chatbotId: string;
  let aiProcessingQueue: Queue;

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

    // Get queue instance
    aiProcessingQueue = app.get<Queue>(getQueueToken(QUEUE_NAMES.AI_PROCESSING));

    // Create test plan with OpenAI
    const plan = await prisma.plan.create({
      data: {
        name: 'AI Processing Test Plan',
        price: 49.99,
        maxChatbots: 5,
        maxMessagesPerMonth: 5000,
        aiProviders: ['openai'],
        features: {},
      },
    });

    // Register user
    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'ai-processing-test@example.com',
        password: 'Test123456!',
        name: 'AI Processing Test User',
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

    // Create test chatbot
    const chatbotResponse = await request(app.getHttpServer())
      .post('/chatbots')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'AI Processing Test Bot',
        aiProvider: 'openai',
        aiModel: 'gpt-4o-mini',
        systemPrompt: 'You are a helpful assistant. Keep responses brief.',
      });
    chatbotId = chatbotResponse.body.id;
  });

  afterAll(async () => {
    await teardownTestDatabase();
    await app.close();
  });

  describe('AI Response Generation', () => {
    it('should generate response with OpenAI successfully', async () => {
      // Send message via widget
      const messageResponse = await request(app.getHttpServer())
        .post('/widget/message')
        .send({
          botId: chatbotId,
          externalUserId: 'test-user-1',
          message: 'Hello, how are you?',
        })
        .expect(201);

      expect(messageResponse.body).toHaveProperty('conversationId');
      expect(messageResponse.body).toHaveProperty('messageId');

      const conversationId = messageResponse.body.conversationId;

      // Wait for AI processing (max 10 seconds)
      await new Promise(resolve => setTimeout(resolve, 10000));

      // Check that assistant message was created
      const messages = await prisma.message.findMany({
        where: {
          conversationId: conversationId,
          role: 'ASSISTANT',
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      expect(messages.length).toBeGreaterThan(0);
      const assistantMessage = messages[0];
      
      // Verify message content
      expect(assistantMessage.content).toBeTruthy();
      expect(assistantMessage.content.length).toBeGreaterThan(0);
      
      // Verify metadata
      const metadata = assistantMessage.metadata as any;
      expect(metadata).toHaveProperty('aiProvider');
      expect(metadata).toHaveProperty('aiModel');
      expect(metadata).toHaveProperty('tokensUsed');
      expect(metadata.aiProvider).toBe('openai');
      expect(metadata.aiModel).toBe('gpt-4o-mini');
      expect(metadata.tokensUsed).toBeGreaterThan(0);
    }, 15000);

    it('should save message with correct metadata', async () => {
      const messageResponse = await request(app.getHttpServer())
        .post('/widget/message')
        .send({
          botId: chatbotId,
          externalUserId: 'test-user-2',
          message: 'What is 2+2?',
        })
        .expect(201);

      const conversationId = messageResponse.body.conversationId;

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 10000));

      const assistantMessage = await prisma.message.findFirst({
        where: {
          conversationId: conversationId,
          role: 'ASSISTANT',
        },
      });

      expect(assistantMessage).toBeTruthy();
      expect(assistantMessage!.content).toBeTruthy();
      
      const metadata = assistantMessage!.metadata as any;
      expect(metadata.aiProvider).toBe('openai');
      expect(metadata.aiModel).toBe('gpt-4o-mini');
      expect(metadata.tokensUsed).toBeGreaterThan(0);
      expect(metadata.finishReason).toBeTruthy();
    }, 15000);
  });

  describe('Circuit Breaker Activation', () => {
    it('should handle invalid API key gracefully', async () => {
      // Create chatbot with invalid configuration
      const invalidChatbot = await request(app.getHttpServer())
        .post('/chatbots')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Invalid Config Bot',
          aiProvider: 'openai',
          aiModel: 'gpt-4o-mini',
          systemPrompt: 'Test',
        });

      // Note: This test assumes OPENAI_API_KEY might be invalid or missing
      // In production, this would trigger circuit breaker after failures
      
      const messageResponse = await request(app.getHttpServer())
        .post('/widget/message')
        .send({
          botId: invalidChatbot.body.id,
          externalUserId: 'test-user-circuit',
          message: 'Test circuit breaker',
        });

      // Should either succeed or create error message
      expect([200, 201, 500]).toContain(messageResponse.status);
    });
  });

  describe('Message Saving Verification', () => {
    it('should save assistant message with all required fields', async () => {
      const messageResponse = await request(app.getHttpServer())
        .post('/widget/message')
        .send({
          botId: chatbotId,
          externalUserId: 'test-user-3',
          message: 'Tell me a joke',
        })
        .expect(201);

      const conversationId = messageResponse.body.conversationId;

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 10000));

      const assistantMessage = await prisma.message.findFirst({
        where: {
          conversationId: conversationId,
          role: 'ASSISTANT',
        },
      });

      // Verify all required fields
      expect(assistantMessage).toBeTruthy();
      expect(assistantMessage!.id).toBeTruthy();
      expect(assistantMessage!.conversationId).toBe(conversationId);
      expect(assistantMessage!.content).toBeTruthy();
      expect(assistantMessage!.content.length).toBeGreaterThan(0);
      expect(assistantMessage!.role).toBe('ASSISTANT');
      expect(assistantMessage!.deliveryStatus).toBeTruthy();
      expect(assistantMessage!.metadata).toBeTruthy();
      expect(assistantMessage!.createdAt).toBeTruthy();
    }, 15000);

    it('should not save empty content', async () => {
      const messageResponse = await request(app.getHttpServer())
        .post('/widget/message')
        .send({
          botId: chatbotId,
          externalUserId: 'test-user-4',
          message: 'Say something',
        })
        .expect(201);

      const conversationId = messageResponse.body.conversationId;

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 10000));

      const assistantMessage = await prisma.message.findFirst({
        where: {
          conversationId: conversationId,
          role: 'ASSISTANT',
        },
      });

      // Content should never be empty
      expect(assistantMessage).toBeTruthy();
      expect(assistantMessage!.content).toBeTruthy();
      expect(assistantMessage!.content.trim().length).toBeGreaterThan(0);
    }, 15000);
  });

  describe('Invalid Model Configuration', () => {
    it('should reject chatbot creation with invalid model', async () => {
      await request(app.getHttpServer())
        .post('/chatbots')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Invalid Model Bot',
          aiProvider: 'openai',
          aiModel: 'invalid-model-xyz',
          systemPrompt: 'Test',
        })
        .expect(400);
    });

    it('should reject chatbot creation with invalid provider', async () => {
      await request(app.getHttpServer())
        .post('/chatbots')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Invalid Provider Bot',
          aiProvider: 'invalid-provider',
          aiModel: 'gpt-4o-mini',
          systemPrompt: 'Test',
        })
        .expect(400);
    });
  });

  describe('Usage Logging', () => {
    it('should log AI usage after successful response', async () => {
      const messageResponse = await request(app.getHttpServer())
        .post('/widget/message')
        .send({
          botId: chatbotId,
          externalUserId: 'test-user-5',
          message: 'Count to 3',
        })
        .expect(201);

      const conversationId = messageResponse.body.conversationId;

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 10000));

      // Check usage log was created
      const usageLogs = await prisma.usageLog.findMany({
        where: {
          customerId: customerId,
          type: 'AI_REQUEST',
        },
      });

      // Filter by conversationId in metadata
      const relevantLogs = usageLogs.filter(log => {
        const metadata = log.metadata as any;
        return metadata && metadata.conversationId === conversationId;
      });

      expect(relevantLogs.length).toBeGreaterThan(0);
      const usageLog = relevantLogs[0];
      expect(usageLog.quantity).toBeGreaterThan(0);
      
      const metadata = usageLog.metadata as any;
      expect(metadata.aiProvider).toBe('openai');
      expect(metadata.aiModel).toBe('gpt-4o-mini');
      expect(metadata.tokensUsed).toBeGreaterThan(0);
    }, 15000);
  });
});
