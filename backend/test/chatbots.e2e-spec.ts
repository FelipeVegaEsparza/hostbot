import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { setupTestDatabase, teardownTestDatabase, prisma } from './test-setup';

describe('Chatbots (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let customerId: string;
  let chatbotId: string;
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
        maxMessagesPerMonth: 1000,
        aiProviders: ['openai', 'anthropic', 'groq'],
        features: {},
      },
    });
    planId = plan.id;

    // Register and login a test user
    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'chatbot-test@example.com',
        password: 'Test123456!',
        name: 'Chatbot Test User',
      });

    authToken = registerResponse.body.access_token;
    customerId = registerResponse.body.user.customer.id;

    // Create a subscription for the user
    await prisma.subscription.create({
      data: {
        customerId: customerId,
        planId: planId,
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

  describe('/chatbots (POST)', () => {
    it('should create a new chatbot', async () => {
      const response = await request(app.getHttpServer())
        .post('/chatbots')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Chatbot',
          description: 'A test chatbot for e2e testing',
          aiProvider: 'openai',
          aiModel: 'gpt-4o-mini',
          systemPrompt: 'You are a helpful assistant.',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('Test Chatbot');
      expect(response.body.aiProvider).toBe('openai');
      expect(response.body.aiModel).toBe('gpt-4o-mini');
      expect(response.body.customerId).toBe(customerId);
      expect(response.body.isActive).toBe(true);

      chatbotId = response.body.id;
    });

    it('should fail to create chatbot without authentication', async () => {
      await request(app.getHttpServer())
        .post('/chatbots')
        .send({
          name: 'Unauthorized Chatbot',
          aiProvider: 'openai',
          aiModel: 'gpt-4o-mini',
        })
        .expect(401);
    });

    it('should fail to create chatbot with invalid AI provider', async () => {
      await request(app.getHttpServer())
        .post('/chatbots')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Invalid Provider Chatbot',
          aiProvider: 'invalid-provider',
          aiModel: 'some-model',
        })
        .expect(400);
    });

    it('should fail to create chatbot without required fields', async () => {
      await request(app.getHttpServer())
        .post('/chatbots')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Incomplete Chatbot',
        })
        .expect(400);
    });
  });

  describe('/chatbots (GET)', () => {
    it('should get all chatbots for authenticated user', async () => {
      const response = await request(app.getHttpServer())
        .get('/chatbots')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('name');
      expect(response.body[0].customerId).toBe(customerId);
    });

    it('should fail to get chatbots without authentication', async () => {
      await request(app.getHttpServer())
        .get('/chatbots')
        .expect(401);
    });
  });

  describe('/chatbots/:id (GET)', () => {
    it('should get a specific chatbot by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/chatbots/${chatbotId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.id).toBe(chatbotId);
      expect(response.body.name).toBe('Test Chatbot');
      expect(response.body.customerId).toBe(customerId);
    });

    it('should fail to get non-existent chatbot', async () => {
      await request(app.getHttpServer())
        .get('/chatbots/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('/chatbots/:id (PATCH)', () => {
    it('should update chatbot configuration', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/chatbots/${chatbotId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Chatbot Name',
          description: 'Updated description',
          systemPrompt: 'You are an updated assistant.',
        })
        .expect(200);

      expect(response.body.id).toBe(chatbotId);
      expect(response.body.name).toBe('Updated Chatbot Name');
      expect(response.body.description).toBe('Updated description');
      expect(response.body.systemPrompt).toBe('You are an updated assistant.');
    });

    it('should update chatbot AI model', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/chatbots/${chatbotId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          aiModel: 'gpt-4o',
        })
        .expect(200);

      expect(response.body.aiModel).toBe('gpt-4o');
    });

    it('should fail to update non-existent chatbot', async () => {
      await request(app.getHttpServer())
        .patch('/chatbots/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Should Fail',
        })
        .expect(404);
    });
  });

  describe('/chatbots/:id (DELETE)', () => {
    it('should delete a chatbot', async () => {
      // Create a chatbot to delete
      const createResponse = await request(app.getHttpServer())
        .post('/chatbots')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Chatbot to Delete',
          aiProvider: 'openai',
          aiModel: 'gpt-4o-mini',
        });

      const deleteId = createResponse.body.id;

      await request(app.getHttpServer())
        .delete(`/chatbots/${deleteId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify it's deleted
      await request(app.getHttpServer())
        .get(`/chatbots/${deleteId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should fail to delete non-existent chatbot', async () => {
      await request(app.getHttpServer())
        .delete('/chatbots/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('Plan Limits Validation', () => {
    it('should enforce chatbot creation limits based on plan', async () => {
      // Create chatbots up to the limit (already have 1, limit is 5)
      for (let i = 0; i < 4; i++) {
        await request(app.getHttpServer())
          .post('/chatbots')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            name: `Chatbot ${i + 2}`,
            aiProvider: 'openai',
            aiModel: 'gpt-4o-mini',
          })
          .expect(201);
      }

      // Try to create one more (should fail)
      await request(app.getHttpServer())
        .post('/chatbots')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Chatbot Over Limit',
          aiProvider: 'openai',
          aiModel: 'gpt-4o-mini',
        })
        .expect(403);
    });
  });
});
