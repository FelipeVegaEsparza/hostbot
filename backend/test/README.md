# E2E Tests

This directory contains end-to-end (e2e) integration tests for the SaaS Chatbot API.

## Overview

The e2e tests validate the complete functionality of the API by testing real HTTP endpoints with a test database. These tests cover:

- **Authentication Flow**: Registration, login, JWT validation
- **Chatbot CRUD**: Creating, reading, updating, and deleting chatbots
- **Messages & Conversations**: Sending messages, creating conversations, retrieving message history
- **WhatsApp Integration**: Cloud API webhooks, QR session management
- **AI Providers**: Integration with multiple AI providers (OpenAI, Anthropic, Groq, etc.)

## Test Structure

```
test/
├── jest-e2e.json           # Jest configuration for e2e tests
├── test-setup.ts           # Database setup and teardown utilities
├── auth.e2e-spec.ts        # Authentication tests
├── chatbots.e2e-spec.ts    # Chatbot CRUD tests
├── messages.e2e-spec.ts    # Messages and conversations tests
├── whatsapp.e2e-spec.ts    # WhatsApp integration tests
└── ai-providers.e2e-spec.ts # AI provider integration tests
```

## Prerequisites

1. **Database**: Ensure you have a test database configured
2. **Environment Variables**: Set up `.env` file with test database URL
3. **Dependencies**: Install all dependencies with `npm install`

## Running Tests

### Run all e2e tests
```bash
npm run test:e2e
```

### Run specific test file
```bash
npm run test:e2e -- auth.e2e-spec.ts
```

### Run with coverage
```bash
npm run test:e2e -- --coverage
```

### Run in watch mode (for development)
```bash
npm run test:e2e -- --watch
```

## Environment Configuration

Create a `.env.test` file or use environment variables:

```env
DATABASE_URL="mysql://user:password@localhost:3306/chatbot_test"
DATABASE_URL_TEST="mysql://user:password@localhost:3306/chatbot_test"
JWT_SECRET="test-jwt-secret"
REDIS_URL="redis://localhost:6379"

# AI Provider API Keys (optional for basic tests)
OPENAI_API_KEY="your-test-key"
ANTHROPIC_API_KEY="your-test-key"
GROQ_API_KEY="your-test-key"
```

## Test Database Setup

The tests automatically clean up the database before each test suite runs. The `test-setup.ts` file handles:

- Database cleanup before tests
- Database disconnection after tests
- Transaction management

## Writing New Tests

When adding new e2e tests:

1. Create a new file with `.e2e-spec.ts` extension
2. Import the test setup utilities
3. Follow the existing test structure
4. Use `supertest` for HTTP requests
5. Clean up any test data in `afterAll` hooks

Example:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { setupTestDatabase, teardownTestDatabase } from './test-setup';

describe('Feature (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    await setupTestDatabase();
    
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });

  afterAll(async () => {
    await teardownTestDatabase();
    await app.close();
  });

  it('should test something', async () => {
    const response = await request(app.getHttpServer())
      .get('/endpoint')
      .expect(200);
    
    expect(response.body).toHaveProperty('data');
  });
});
```

## Test Coverage

The e2e tests focus on:

- ✅ Complete user flows (registration → login → create chatbot → send message)
- ✅ API endpoint validation
- ✅ Authentication and authorization
- ✅ Database operations
- ✅ External service integrations
- ✅ Error handling and edge cases

## Troubleshooting

### Tests fail with database connection error
- Ensure MySQL is running
- Check DATABASE_URL in .env
- Verify database exists and is accessible

### Tests timeout
- Increase Jest timeout in jest-e2e.json
- Check if external services (Redis, AI APIs) are accessible
- Ensure no long-running processes are blocking

### Tests fail intermittently
- Use `--runInBand` flag to run tests sequentially
- Check for race conditions in async operations
- Ensure proper cleanup in afterAll hooks

## CI/CD Integration

For continuous integration:

```yaml
# Example GitHub Actions workflow
- name: Run E2E Tests
  run: |
    npm run prisma:generate
    npm run test:e2e
  env:
    DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
    JWT_SECRET: ${{ secrets.TEST_JWT_SECRET }}
```

## Notes

- Tests run sequentially (`--runInBand`) to avoid database conflicts
- Each test suite creates its own test data
- Database is cleaned before each test suite
- External API calls may require valid API keys
- Some tests may be skipped if API keys are not configured
