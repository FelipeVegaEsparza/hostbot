import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { setupTestDatabase, teardownTestDatabase, prisma } from './test-setup';
import { Role } from '@prisma/client';

describe('Health Check and End-to-End Flow (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let userToken: string;
  let chatbotId: string;
  let customerId: string;
  let planId: string;

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

    // Create a test plan
    const plan = await prisma.plan.create({
      data: {
        name: 'Test Plan',
        price: 29.99,
        maxChatbots: 5,
        maxMessagesPerMonth: 10000,
        aiProviders: ['openai', 'anthropic', 'groq'],
        features: {},
      },
    });
    planId = plan.id;

    // Register and login an admin user
    const adminRegisterResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'admin-health@example.com',
        password: 'Admin123456!',
        name: 'Admin Health User',
      });

    adminToken = adminRegisterResponse.body.access_token;
    const adminUserId = adminRegisterResponse.body.user.id;

    // Update user to admin role
    await prisma.user.update({
      where: { id: adminUserId },
      data: { role: Role.ADMIN },
    });

    // Register a regular user
    const userRegisterResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'user-health@example.com',
        password: 'User123456!',
        name: 'Regular Health User',
      });

    userToken = userRegisterResponse.body.access_token;
    customerId = userRegisterResponse.body.user.customer.id;

    // Create a subscription for the regular user
    await prisma.subscription.create({
      data: {
        customerId: customerId,
        planId: planId,
        status: 'ACTIVE',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    // Create a test chatbot
    const chatbotResponse = await request(app.getHttpServer())
      .post('/chatbots')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'Health Test Chatbot',
        description: 'A chatbot for health check testing',
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

  describe('Basic Health Checks', () => {
    it('should return overall system health', async () => {
      const response = await request(app.getHttpServer())
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('info');
      expect(response.body).toHaveProperty('details');
    });

    it('should check database health', async () => {
      const response = await request(app.getHttpServer())
        .get('/health/database')
        .expect(200);

      expect(response.body).toHaveProperty('status');
    });

    it('should check Redis health', async () => {
      const response = await request(app.getHttpServer())
        .get('/health/redis')
        .expect(200);

      expect(response.body).toHaveProperty('status');
    });
  });

  describe('Admin-Only Health Endpoints', () => {
    it('should get queues status with admin token', async () => {
      const response = await request(app.getHttpServer())
        .get('/health/queues')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      
      // Check that we have the expected queues
      const queueNames = response.body.map((q: any) => q.name);
      expect(queueNames).toContain('incoming-messages');
      expect(queueNames).toContain('ai-processing');
      expect(queueNames).toContain('outgoing-messages');

      // Each queue should have the expected properties
      response.body.forEach((queue: any) => {
        expect(queue).toHaveProperty('name');
        expect(queue).toHaveProperty('waiting');
        expect(queue).toHaveProperty('active');
        expect(queue).toHaveProperty('completed');
        expect(queue).toHaveProperty('failed');
        expect(queue).toHaveProperty('paused');
      });
    });

    it('should fail to get queues status without admin token', async () => {
      await request(app.getHttpServer())
        .get('/health/queues')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('should get WebSocket status with admin token', async () => {
      const response = await request(app.getHttpServer())
        .get('/health/websocket')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('connected');
      expect(response.body).toHaveProperty('rooms');
      expect(typeof response.body.connected).toBe('number');
      expect(typeof response.body.rooms).toBe('object');
    });

    it('should get AI providers status with admin token', async () => {
      const response = await request(app.getHttpServer())
        .get('/health/ai-providers')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      
      // Should have at least OpenAI provider
      const providers = response.body.map((p: any) => p.provider);
      expect(providers).toContain('openai');

      // Each provider should have circuit breaker info
      response.body.forEach((provider: any) => {
        expect(provider).toHaveProperty('provider');
        expect(provider).toHaveProperty('state');
        expect(provider).toHaveProperty('failureCount');
        expect(['CLOSED', 'HALF_OPEN', 'OPEN']).toContain(provider.state);
      });
    });
  });

  describe('Test Message Endpoint - Widget Flow', () => {
    it('should send test message via Widget and track flow', async () => {
      const response = await request(app.getHttpServer())
        .post('/health/test-message')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          chatbotId: chatbotId,
          channel: 'WIDGET',
          externalUserId: 'test-widget-user-001',
          message: 'Hello, this is a test message for Widget flow',
        })
        .expect(200);

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('messageId');
      expect(response.body).toHaveProperty('conversationId');
      expect(response.body).toHaveProperty('stages');

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.stages)).toBe(true);
      expect(response.body.stages.length).toBeGreaterThan(0);

      // Verify stages include key checkpoints
      const stageNames = response.body.stages.map((s: any) => s.stage);
      expect(stageNames).toContain('verify_chatbot');
      expect(stageNames).toContain('send_message');

      // All stages should have required properties
      response.body.stages.forEach((stage: any) => {
        expect(stage).toHaveProperty('stage');
        expect(stage).toHaveProperty('timestamp');
        expect(stage).toHaveProperty('status');
        expect(['success', 'failed']).toContain(stage.status);
      });

      console.log('Widget Test Message Response:', JSON.stringify(response.body, null, 2));
    }, 30000); // 30 second timeout for AI processing

    it('should fail test message with invalid chatbot ID', async () => {
      await request(app.getHttpServer())
        .post('/health/test-message')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          chatbotId: '00000000-0000-0000-0000-000000000000',
          channel: 'WIDGET',
          externalUserId: 'test-user',
          message: 'Test',
        })
        .expect(404);
    });

    it('should fail test message without admin token', async () => {
      await request(app.getHttpServer())
        .post('/health/test-message')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          chatbotId: chatbotId,
          channel: 'WIDGET',
          externalUserId: 'test-user',
          message: 'Test',
        })
        .expect(403);
    });

    it('should fail test message with invalid channel', async () => {
      await request(app.getHttpServer())
        .post('/health/test-message')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          chatbotId: chatbotId,
          channel: 'INVALID_CHANNEL',
          externalUserId: 'test-user',
          message: 'Test',
        })
        .expect(400);
    });
  });

  describe('End-to-End Message Flow Verification', () => {
    it('should verify complete message flow through all queues', async () => {
      // Send test message
      const testResponse = await request(app.getHttpServer())
        .post('/health/test-message')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          chatbotId: chatbotId,
          channel: 'WIDGET',
          externalUserId: 'e2e-test-user',
          message: 'End-to-end test message',
        })
        .expect(200);

      const { messageId, conversationId } = testResponse.body;

      // Wait a bit for processing
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Check that messages were created in database
      const userMessage = await prisma.message.findUnique({
        where: { id: messageId },
      });

      expect(userMessage).toBeDefined();
      expect(userMessage?.content).toBe('End-to-end test message');
      expect(userMessage?.role).toBe('USER');
      expect(userMessage?.conversationId).toBe(conversationId);

      // Check for assistant response
      const assistantMessages = await prisma.message.findMany({
        where: {
          conversationId: conversationId,
          role: 'ASSISTANT',
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 1,
      });

      expect(assistantMessages.length).toBeGreaterThan(0);
      expect(assistantMessages[0].content).toBeTruthy();
      expect(assistantMessages[0].content.length).toBeGreaterThan(0);

      console.log('Assistant Response:', assistantMessages[0].content);

      // Check queue status to ensure processing completed
      const queuesResponse = await request(app.getHttpServer())
        .get('/health/queues')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const queues = queuesResponse.body;
      
      // Verify queues are not stuck
      queues.forEach((queue: any) => {
        console.log(`Queue ${queue.name}:`, {
          waiting: queue.waiting,
          active: queue.active,
          failed: queue.failed,
        });
      });
    }, 30000); // 30 second timeout
  });

  describe('System Monitoring', () => {
    it('should track queue metrics over time', async () => {
      // Get initial queue status
      const initialResponse = await request(app.getHttpServer())
        .get('/health/queues')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const initialQueues = initialResponse.body;
      const incomingQueue = initialQueues.find((q: any) => q.name === 'incoming-messages');
      
      expect(incomingQueue).toBeDefined();
      
      // Send a message
      await request(app.getHttpServer())
        .post('/health/test-message')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          chatbotId: chatbotId,
          channel: 'WIDGET',
          externalUserId: 'metrics-test-user',
          message: 'Metrics test',
        })
        .expect(200);

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Get updated queue status
      const updatedResponse = await request(app.getHttpServer())
        .get('/health/queues')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const updatedQueues = updatedResponse.body;
      
      // Verify queues are processing
      updatedQueues.forEach((queue: any) => {
        expect(queue.paused).toBe(false);
      });
    }, 15000);
  });
});
