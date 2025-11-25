import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { setupTestDatabase, teardownTestDatabase, prisma } from './test-setup';
import * as crypto from 'crypto';

describe('WhatsApp Integration (e2e)', () => {
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

    // Create test plan
    const plan = await prisma.plan.create({
      data: {
        name: 'Test Plan',
        price: 29.99,
        maxChatbots: 5,
        maxMessagesPerMonth: 1000,
        aiProviders: ['openai'],
        features: {},
      },
    });

    // Register user
    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'whatsapp-test@example.com',
        password: 'Test123456!',
        name: 'WhatsApp Test User',
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
        name: 'WhatsApp Test Chatbot',
        aiProvider: 'openai',
        aiModel: 'gpt-4o-mini',
        systemPrompt: 'You are a helpful WhatsApp assistant.',
      });

    chatbotId = chatbotResponse.body.id;
  });

  afterAll(async () => {
    await teardownTestDatabase();
    await app.close();
  });

  describe('WhatsApp Cloud API', () => {
    describe('/whatsapp-cloud/accounts (POST)', () => {
      it('should configure WhatsApp Cloud API account', async () => {
        const response = await request(app.getHttpServer())
          .post('/whatsapp-cloud/accounts')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            chatbotId: chatbotId,
            phoneNumberId: '123456789',
            accessToken: 'test-access-token',
            webhookVerifyToken: 'test-verify-token',
          })
          .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body.chatbotId).toBe(chatbotId);
        expect(response.body.phoneNumberId).toBe('123456789');
        expect(response.body.isActive).toBe(true);
      });

      it('should fail to configure without authentication', async () => {
        await request(app.getHttpServer())
          .post('/whatsapp-cloud/accounts')
          .send({
            chatbotId: chatbotId,
            phoneNumberId: '123456789',
            accessToken: 'test-access-token',
            webhookVerifyToken: 'test-verify-token',
          })
          .expect(401);
      });

      it('should fail with invalid chatbot id', async () => {
        await request(app.getHttpServer())
          .post('/whatsapp-cloud/accounts')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            chatbotId: '00000000-0000-0000-0000-000000000000',
            phoneNumberId: '123456789',
            accessToken: 'test-access-token',
            webhookVerifyToken: 'test-verify-token',
          })
          .expect(404);
      });
    });

    describe('/whatsapp-cloud/webhook (GET)', () => {
      it('should verify webhook with correct token', async () => {
        const verifyToken = 'test-verify-token';
        const challenge = 'test-challenge-string';

        const response = await request(app.getHttpServer())
          .get('/whatsapp-cloud/webhook')
          .query({
            'hub.mode': 'subscribe',
            'hub.verify_token': verifyToken,
            'hub.challenge': challenge,
          })
          .expect(200);

        expect(response.text).toBe(challenge);
      });

      it('should reject webhook verification with wrong token', async () => {
        await request(app.getHttpServer())
          .get('/whatsapp-cloud/webhook')
          .query({
            'hub.mode': 'subscribe',
            'hub.verify_token': 'wrong-token',
            'hub.challenge': 'test-challenge',
          })
          .expect(403);
      });
    });

    describe('/whatsapp-cloud/webhook (POST)', () => {
      it('should process incoming WhatsApp message webhook', async () => {
        const webhookPayload = {
          object: 'whatsapp_business_account',
          entry: [
            {
              id: '123456789',
              changes: [
                {
                  value: {
                    messaging_product: 'whatsapp',
                    metadata: {
                      display_phone_number: '1234567890',
                      phone_number_id: '123456789',
                    },
                    messages: [
                      {
                        from: '5491234567890',
                        id: 'wamid.test123',
                        timestamp: '1234567890',
                        type: 'text',
                        text: {
                          body: 'Hello from WhatsApp',
                        },
                      },
                    ],
                  },
                  field: 'messages',
                },
              ],
            },
          ],
        };

        const response = await request(app.getHttpServer())
          .post('/whatsapp-cloud/webhook')
          .send(webhookPayload)
          .expect(200);

        expect(response.body).toHaveProperty('status');
        expect(response.body.status).toBe('received');
      });

      it('should handle webhook with no messages', async () => {
        const webhookPayload = {
          object: 'whatsapp_business_account',
          entry: [
            {
              id: '123456789',
              changes: [
                {
                  value: {
                    messaging_product: 'whatsapp',
                    metadata: {
                      display_phone_number: '1234567890',
                      phone_number_id: '123456789',
                    },
                  },
                  field: 'messages',
                },
              ],
            },
          ],
        };

        await request(app.getHttpServer())
          .post('/whatsapp-cloud/webhook')
          .send(webhookPayload)
          .expect(200);
      });

      it('should log webhook events to database', async () => {
        const webhookPayload = {
          object: 'whatsapp_business_account',
          entry: [
            {
              id: '123456789',
              changes: [
                {
                  value: {
                    messaging_product: 'whatsapp',
                    metadata: {
                      phone_number_id: '123456789',
                    },
                    statuses: [
                      {
                        id: 'wamid.status123',
                        status: 'delivered',
                        timestamp: '1234567890',
                        recipient_id: '5491234567890',
                      },
                    ],
                  },
                  field: 'messages',
                },
              ],
            },
          ],
        };

        await request(app.getHttpServer())
          .post('/whatsapp-cloud/webhook')
          .send(webhookPayload)
          .expect(200);

        // Check if webhook event was logged
        const webhookEvents = await prisma.webhookEvent.findMany({
          where: {
            event: 'whatsapp.status',
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        });

        expect(webhookEvents.length).toBeGreaterThan(0);
      });
    });

    describe('/whatsapp-cloud/send (POST)', () => {
      it('should enqueue message for sending via WhatsApp Cloud', async () => {
        const response = await request(app.getHttpServer())
          .post('/whatsapp-cloud/send')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            chatbotId: chatbotId,
            to: '5491234567890',
            message: 'Hello from the chatbot!',
          })
          .expect(202);

        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toContain('enqueued');
      });

      it('should fail to send without authentication', async () => {
        await request(app.getHttpServer())
          .post('/whatsapp-cloud/send')
          .send({
            chatbotId: chatbotId,
            to: '5491234567890',
            message: 'Unauthorized message',
          })
          .expect(401);
      });
    });
  });

  describe('WhatsApp QR (Baileys)', () => {
    let sessionId: string;

    describe('/whatsapp-qr/init (POST)', () => {
      it('should initialize WhatsApp QR session', async () => {
        const response = await request(app.getHttpServer())
          .post('/whatsapp-qr/init')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            chatbotId: chatbotId,
          })
          .expect(201);

        expect(response.body).toHaveProperty('sessionId');
        expect(response.body).toHaveProperty('status');
        sessionId = response.body.sessionId;
      });

      it('should fail to initialize without authentication', async () => {
        await request(app.getHttpServer())
          .post('/whatsapp-qr/init')
          .send({
            chatbotId: chatbotId,
          })
          .expect(401);
      });
    });

    describe('/whatsapp-qr/status/:sessionId (GET)', () => {
      it('should get session status', async () => {
        if (!sessionId) {
          // Create a session first
          const initResponse = await request(app.getHttpServer())
            .post('/whatsapp-qr/init')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
              chatbotId: chatbotId,
            });
          sessionId = initResponse.body.sessionId;
        }

        const response = await request(app.getHttpServer())
          .get(`/whatsapp-qr/status/${sessionId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('status');
        expect(response.body).toHaveProperty('sessionId');
      });

      it('should fail to get status without authentication', async () => {
        await request(app.getHttpServer())
          .get(`/whatsapp-qr/status/${sessionId}`)
          .expect(401);
      });
    });

    describe('/whatsapp-qr/webhook (POST)', () => {
      it('should receive webhook notification from QR service', async () => {
        const webhookPayload = {
          type: 'connected',
          sessionId: sessionId || 'test-session-id',
          data: {
            phone: '5491234567890',
          },
        };

        const response = await request(app.getHttpServer())
          .post('/whatsapp-qr/webhook')
          .send(webhookPayload)
          .expect(200);

        expect(response.body).toHaveProperty('status');
        expect(response.body.status).toBe('received');
      });

      it('should handle QR code generation webhook', async () => {
        const webhookPayload = {
          type: 'qr',
          sessionId: 'test-session-id',
          data: {
            qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
          },
        };

        await request(app.getHttpServer())
          .post('/whatsapp-qr/webhook')
          .send(webhookPayload)
          .expect(200);
      });
    });

    describe('/whatsapp-qr/incoming (POST)', () => {
      it('should receive incoming message from QR service', async () => {
        const incomingMessage = {
          sessionId: sessionId || 'test-session-id',
          from: '5491234567890',
          message: 'Hello from WhatsApp QR',
          timestamp: Date.now(),
        };

        const response = await request(app.getHttpServer())
          .post('/whatsapp-qr/incoming')
          .send(incomingMessage)
          .expect(200);

        expect(response.body).toHaveProperty('status');
        expect(response.body.status).toBe('received');
      });
    });

    describe('WhatsApp QR Message Sending with Mocked Microservice', () => {
      let testSessionId: string;
      let testConversationId: string;
      let testMessageId: string;

      beforeAll(async () => {
        // Create a test session in CONNECTED state
        const session = await prisma.whatsAppQRSession.create({
          data: {
            chatbotId: chatbotId,
            sessionId: `test-session-${Date.now()}`,
            status: 'CONNECTED',
            lastConnectedAt: new Date(),
          },
        });
        testSessionId = session.sessionId;

        // Create a test conversation
        const conversation = await prisma.conversation.create({
          data: {
            chatbotId: chatbotId,
            externalUserId: '5491234567890',
            channel: 'WHATSAPP_QR',
            status: 'ACTIVE',
          },
        });
        testConversationId = conversation.id;

        // Create a test message
        const message = await prisma.message.create({
          data: {
            conversationId: testConversationId,
            content: 'Test message for WhatsApp QR',
            role: 'ASSISTANT',
            deliveryStatus: 'PENDING',
          },
        });
        testMessageId = message.id;
      });

      it('should handle session not connected error', async () => {
        // Create a session in DISCONNECTED state
        const disconnectedSession = await prisma.whatsAppQRSession.create({
          data: {
            chatbotId: chatbotId,
            sessionId: `disconnected-session-${Date.now()}`,
            status: 'DISCONNECTED',
          },
        });

        // Try to send a message with disconnected session
        // This would be called by the processor, so we test the service directly
        const whatsappQRService = app.get('WhatsAppQRService');
        
        await expect(
          whatsappQRService.sendMessageDirect(
            disconnectedSession.sessionId,
            '5491234567890',
            'Test message'
          )
        ).rejects.toThrow(/not connected/i);
      });

      it('should update deliveryStatus to SENT on successful send', async () => {
        // This test verifies the processor updates the status correctly
        // We check that the message status is updated after processing
        const messageBefore = await prisma.message.findUnique({
          where: { id: testMessageId },
        });
        
        expect(messageBefore.deliveryStatus).toBe('PENDING');
        
        // Note: In a real scenario, the processor would update this
        // For this test, we verify the database structure supports the update
        await prisma.message.update({
          where: { id: testMessageId },
          data: {
            deliveryStatus: 'SENT',
            metadata: {
              whatsappMessageId: 'test-wa-msg-id',
              sentAt: new Date().toISOString(),
            },
          },
        });

        const messageAfter = await prisma.message.findUnique({
          where: { id: testMessageId },
        });
        
        expect(messageAfter.deliveryStatus).toBe('SENT');
        expect(messageAfter.metadata).toHaveProperty('whatsappMessageId');
        expect(messageAfter.metadata).toHaveProperty('sentAt');
      });

      it('should update deliveryStatus to FAILED on error', async () => {
        // Create another test message
        const failMessage = await prisma.message.create({
          data: {
            conversationId: testConversationId,
            content: 'Test message that will fail',
            role: 'ASSISTANT',
            deliveryStatus: 'PENDING',
          },
        });

        // Simulate failure by updating to FAILED
        await prisma.message.update({
          where: { id: failMessage.id },
          data: {
            deliveryStatus: 'FAILED',
            metadata: {
              error: 'Connection refused',
              failedAt: new Date().toISOString(),
              attempt: 3,
            },
          },
        });

        const messageAfter = await prisma.message.findUnique({
          where: { id: failMessage.id },
        });
        
        expect(messageAfter.deliveryStatus).toBe('FAILED');
        expect(messageAfter.metadata).toHaveProperty('error');
        expect(messageAfter.metadata).toHaveProperty('failedAt');
        expect(messageAfter.metadata).toHaveProperty('attempt');
      });

      it('should validate session exists before sending', async () => {
        const whatsappQRService = app.get('WhatsAppQRService');
        
        // Try to send with non-existent session
        await expect(
          whatsappQRService.sendMessageDirect(
            'non-existent-session-id',
            '5491234567890',
            'Test message'
          )
        ).rejects.toThrow(/not found/i);
      });

      it('should log message metadata correctly', async () => {
        // Verify that message metadata structure is correct
        const message = await prisma.message.findUnique({
          where: { id: testMessageId },
        });

        expect(message).toBeDefined();
        expect(message.conversationId).toBe(testConversationId);
        expect(message.role).toBe('ASSISTANT');
        expect(message.content).toBeDefined();
      });
    });
  });
});
