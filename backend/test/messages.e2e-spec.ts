import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { setupTestDatabase, teardownTestDatabase, prisma } from './test-setup';

describe('Messages and Conversations (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let customerId: string;
  let chatbotId: string;
  let conversationId: string;

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

    // Create test plan
    const plan = await prisma.plan.create({
      data: {
        name: 'Test Plan',
        price: 29.99,
        maxChatbots: 5,
        maxMessagesPerMonth: 1000,
        aiProviders: ['openai', 'anthropic'],
        features: {},
      },
    });

    // Register user
    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'messages-test@example.com',
        password: 'Test123456!',
        name: 'Messages Test User',
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

    // Create chatbot
    const chatbotResponse = await request(app.getHttpServer())
      .post('/chatbots')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Test Chatbot',
        aiProvider: 'openai',
        aiModel: 'gpt-4o-mini',
        systemPrompt: 'You are a helpful assistant.',
      });

    chatbotId = chatbotResponse.body.id;
  });

  afterAll(async () => {
    await teardownTestDatabase();
    await app.close();
  });

  describe('/messages/send (POST)', () => {
    it('should send a message and create conversation automatically', async () => {
      const response = await request(app.getHttpServer())
        .post('/messages/send')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          chatbotId: chatbotId,
          externalUserId: 'user-123',
          content: 'Hello, this is a test message',
          channel: 'WIDGET',
        })
        .expect(202);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('enqueued');
    });

    it('should fail to send message without authentication', async () => {
      await request(app.getHttpServer())
        .post('/messages/send')
        .send({
          chatbotId: chatbotId,
          externalUserId: 'user-123',
          content: 'Unauthorized message',
          channel: 'WIDGET',
        })
        .expect(401);
    });

    it('should fail to send message with invalid chatbot', async () => {
      await request(app.getHttpServer())
        .post('/messages/send')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          chatbotId: '00000000-0000-0000-0000-000000000000',
          externalUserId: 'user-123',
          content: 'Message to invalid chatbot',
          channel: 'WIDGET',
        })
        .expect(404);
    });

    it('should fail to send empty message', async () => {
      await request(app.getHttpServer())
        .post('/messages/send')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          chatbotId: chatbotId,
          externalUserId: 'user-123',
          content: '',
          channel: 'WIDGET',
        })
        .expect(400);
    });
  });

  describe('/conversations (GET)', () => {
    beforeAll(async () => {
      // Create a conversation with messages
      const conversation = await prisma.conversation.create({
        data: {
          chatbotId: chatbotId,
          externalUserId: 'user-456',
          channel: 'WIDGET',
          status: 'ACTIVE',
        },
      });
      conversationId = conversation.id;

      // Create some messages
      await prisma.message.createMany({
        data: [
          {
            conversationId: conversationId,
            content: 'Hello',
            role: 'USER',
            deliveryStatus: 'DELIVERED',
          },
          {
            conversationId: conversationId,
            content: 'Hi! How can I help you?',
            role: 'ASSISTANT',
            deliveryStatus: 'DELIVERED',
          },
        ],
      });
    });

    it('should get all conversations for authenticated user', async () => {
      const response = await request(app.getHttpServer())
        .get('/conversations')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('chatbotId');
      expect(response.body[0]).toHaveProperty('externalUserId');
    });

    it('should filter conversations by chatbot', async () => {
      const response = await request(app.getHttpServer())
        .get(`/conversations?chatbotId=${chatbotId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach((conv: any) => {
        expect(conv.chatbotId).toBe(chatbotId);
      });
    });

    it('should fail to get conversations without authentication', async () => {
      await request(app.getHttpServer())
        .get('/conversations')
        .expect(401);
    });
  });

  describe('/conversations/:id/messages (GET)', () => {
    it('should get all messages in a conversation', async () => {
      const response = await request(app.getHttpServer())
        .get(`/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
      expect(response.body[0]).toHaveProperty('content');
      expect(response.body[0]).toHaveProperty('role');
      expect(response.body[0]).toHaveProperty('deliveryStatus');
    });

    it('should support pagination for messages', async () => {
      const response = await request(app.getHttpServer())
        .get(`/conversations/${conversationId}/messages?page=1&limit=1`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeLessThanOrEqual(1);
    });

    it('should fail to get messages from non-existent conversation', async () => {
      await request(app.getHttpServer())
        .get('/conversations/00000000-0000-0000-0000-000000000000/messages')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should fail to get messages without authentication', async () => {
      await request(app.getHttpServer())
        .get(`/conversations/${conversationId}/messages`)
        .expect(401);
    });
  });

  describe('/conversations/:id (GET)', () => {
    it('should get a specific conversation by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/conversations/${conversationId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.id).toBe(conversationId);
      expect(response.body.chatbotId).toBe(chatbotId);
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('lastMessageAt');
    });

    it('should include message count in conversation details', async () => {
      const response = await request(app.getHttpServer())
        .get(`/conversations/${conversationId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('_count');
      expect(response.body._count.messages).toBe(2);
    });
  });

  describe('Message Flow Integration', () => {
    it('should create conversation and message when sending first message', async () => {
      const newUserId = 'new-user-789';
      
      await request(app.getHttpServer())
        .post('/messages/send')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          chatbotId: chatbotId,
          externalUserId: newUserId,
          content: 'First message from new user',
          channel: 'WIDGET',
        })
        .expect(202);

      // Wait a bit for async processing
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check if conversation was created
      const conversations = await prisma.conversation.findMany({
        where: {
          chatbotId: chatbotId,
          externalUserId: newUserId,
        },
      });

      expect(conversations.length).toBeGreaterThan(0);
    });
  });
});
