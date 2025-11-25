import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { io, Socket } from 'socket.io-client';
import { AppModule } from '../src/app.module';
import { setupTestDatabase, teardownTestDatabase, prisma } from './test-setup';

describe('WebSocket Gateway (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let customerId: string;
  let chatbotId: string;
  let conversationId: string;
  let clientSocket: Socket;
  let serverUrl: string;

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
    await app.listen(0); // Listen on random port

    const address = app.getHttpServer().address();
    const port = address.port;
    serverUrl = `http://localhost:${port}`;

    // Create test plan
    const plan = await prisma.plan.create({
      data: {
        name: 'WebSocket Test Plan',
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
        email: 'websocket-test@example.com',
        password: 'Test123456!',
        name: 'WebSocket Test User',
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
        name: 'WebSocket Test Chatbot',
        aiProvider: 'openai',
        aiModel: 'gpt-4o-mini',
        systemPrompt: 'You are a helpful assistant.',
      });

    chatbotId = chatbotResponse.body.id;

    // Create a conversation
    const conversation = await prisma.conversation.create({
      data: {
        chatbotId: chatbotId,
        externalUserId: 'ws-test-user',
        channel: 'WIDGET',
        status: 'ACTIVE',
      },
    });
    conversationId = conversation.id;
  });

  afterAll(async () => {
    if (clientSocket && clientSocket.connected) {
      clientSocket.disconnect();
    }
    await teardownTestDatabase();
    await app.close();
  });

  afterEach(() => {
    if (clientSocket && clientSocket.connected) {
      clientSocket.disconnect();
    }
  });

  describe('WebSocket Connection', () => {
    it('should connect to WebSocket server on /messages namespace', (done) => {
      clientSocket = io(`${serverUrl}/messages`, {
        auth: { token: authToken },
        transports: ['websocket'],
      });

      clientSocket.on('connect', () => {
        expect(clientSocket.connected).toBe(true);
        expect(clientSocket.id).toBeDefined();
        done();
      });

      clientSocket.on('connect_error', (error) => {
        done(error);
      });
    });

    it('should reject connection without authentication', (done) => {
      const unauthSocket = io(`${serverUrl}/messages`, {
        transports: ['websocket'],
      });

      unauthSocket.on('connect', () => {
        // Should not connect
        unauthSocket.disconnect();
        done(new Error('Should not have connected without auth'));
      });

      unauthSocket.on('connect_error', (error) => {
        expect(error).toBeDefined();
        unauthSocket.disconnect();
        done();
      });
    });
  });

  describe('Room Subscription', () => {
    beforeEach((done) => {
      clientSocket = io(`${serverUrl}/messages`, {
        auth: { token: authToken },
        transports: ['websocket'],
      });

      clientSocket.on('connect', () => {
        done();
      });
    });

    it('should subscribe to a conversation room', (done) => {
      clientSocket.emit('subscribe', { conversationId });

      clientSocket.on('subscribed', (data) => {
        expect(data.data.conversationId).toBe(conversationId);
        expect(data.data.clientCount).toBeGreaterThanOrEqual(1);
        done();
      });
    });

    it('should unsubscribe from a conversation room', (done) => {
      // First subscribe
      clientSocket.emit('subscribe', { conversationId });

      clientSocket.once('subscribed', () => {
        // Then unsubscribe
        clientSocket.emit('unsubscribe', { conversationId });

        clientSocket.on('unsubscribed', (data) => {
          expect(data.data.conversationId).toBe(conversationId);
          done();
        });
      });
    });
  });

  describe('Message Reception', () => {
    beforeEach((done) => {
      clientSocket = io(`${serverUrl}/messages`, {
        auth: { token: authToken },
        transports: ['websocket'],
      });

      clientSocket.on('connect', () => {
        // Subscribe to conversation
        clientSocket.emit('subscribe', { conversationId });
        clientSocket.once('subscribed', () => {
          done();
        });
      });
    });

    it('should receive new messages in subscribed conversation', (done) => {
      // Listen for message event
      clientSocket.on('message', (message) => {
        expect(message).toBeDefined();
        expect(message.conversationId).toBe(conversationId);
        expect(message.content).toBe('Test message via WebSocket');
        expect(message.role).toBe('USER');
        done();
      });

      // Create a message directly in the database and emit it
      // In real scenario, this would come from the message flow
      setTimeout(async () => {
        const message = await prisma.message.create({
          data: {
            conversationId: conversationId,
            content: 'Test message via WebSocket',
            role: 'USER',
            deliveryStatus: 'PENDING',
          },
        });

        // Get the gateway and emit the message
        const messagesModule = app.get('MessagesModule');
        const gateway = messagesModule.get('MessagesGateway');
        if (gateway) {
          gateway.emitNewMessage(conversationId, message);
        }
      }, 100);
    }, 10000);

    it('should not receive messages from unsubscribed conversations', (done) => {
      // Create another conversation
      prisma.conversation.create({
        data: {
          chatbotId: chatbotId,
          externalUserId: 'other-user',
          channel: 'WIDGET',
          status: 'ACTIVE',
        },
      }).then(async (otherConversation) => {
        let messageReceived = false;

        // Listen for messages
        clientSocket.on('message', (message) => {
          if (message.conversationId === otherConversation.id) {
            messageReceived = true;
          }
        });

        // Create message in other conversation
        const message = await prisma.message.create({
          data: {
            conversationId: otherConversation.id,
            content: 'Message in other conversation',
            role: 'USER',
            deliveryStatus: 'PENDING',
          },
        });

        // Try to emit (should not be received)
        const messagesModule = app.get('MessagesModule');
        const gateway = messagesModule.get('MessagesGateway');
        if (gateway) {
          gateway.emitNewMessage(otherConversation.id, message);
        }

        // Wait and verify no message was received
        setTimeout(() => {
          expect(messageReceived).toBe(false);
          done();
        }, 1000);
      });
    }, 10000);
  });

  describe('Health Check Integration', () => {
    it('should report WebSocket status via health endpoint', async () => {
      // Connect a client
      clientSocket = io(`${serverUrl}/messages`, {
        auth: { token: authToken },
        transports: ['websocket'],
      });

      await new Promise<void>((resolve) => {
        clientSocket.on('connect', () => {
          clientSocket.emit('subscribe', { conversationId });
          clientSocket.once('subscribed', () => resolve());
        });
      });

      // Check health endpoint
      const response = await request(app.getHttpServer())
        .get('/health/websocket')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.connected).toBeGreaterThanOrEqual(1);
      expect(response.body.rooms).toBeDefined();
      expect(response.body.rooms[`conversation:${conversationId}`]).toBeGreaterThanOrEqual(1);
    });
  });
});
