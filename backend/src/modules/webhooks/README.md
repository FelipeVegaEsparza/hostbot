# Webhooks Module

This module handles API key management and webhook delivery for the chatbot SaaS platform.

## Features

### API Keys Management

- **Generate API Keys**: Create secure API keys using `crypto.randomBytes` (256-bit)
- **CRUD Operations**: Full create, read, update, delete operations for API keys
- **Permissions**: Configurable permissions per API key
- **Authentication**: API key-based authentication via `ApiKeyGuard`
- **Activity Tracking**: Track last used timestamp for each API key

### Webhook Delivery

- **Event Triggering**: Trigger webhooks for various system events
- **Queue-based Delivery**: Asynchronous webhook delivery using BullMQ
- **Retry Logic**: Automatic retries with exponential backoff (3 attempts)
- **Status Tracking**: Track webhook delivery status (PENDING, SENT, FAILED)
- **Error Logging**: Record delivery attempts and error messages

## API Endpoints

### API Keys

```
POST   /api-keys              - Create a new API key
GET    /api-keys              - List all API keys for customer
GET    /api-keys/:id          - Get specific API key
PATCH  /api-keys/:id          - Update API key
DELETE /api-keys/:id          - Delete API key
POST   /api-keys/:id/deactivate - Deactivate API key
```

### Authentication

API keys can be provided in two ways:

1. **X-API-Key header**:
```bash
curl -H "X-API-Key: sk_xxxxx" https://api.example.com/endpoint
```

2. **Authorization Bearer token**:
```bash
curl -H "Authorization: Bearer sk_xxxxx" https://api.example.com/endpoint
```

## Usage Examples

### Creating an API Key

```typescript
POST /api-keys
{
  "name": "Production API Key",
  "permissions": ["messages:send", "conversations:read"]
}

Response:
{
  "id": "uuid",
  "key": "sk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "name": "Production API Key",
  "permissions": ["messages:send", "conversations:read"],
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

### Triggering a Webhook

```typescript
import { WebhooksService } from './webhooks.service';

// Inject the service
constructor(private readonly webhooksService: WebhooksService) {}

// Trigger a webhook event
await this.webhooksService.triggerWebhook(
  customerId,
  'message.received',
  {
    conversationId: 'uuid',
    messageId: 'uuid',
    content: 'Hello!',
    timestamp: new Date(),
  }
);
```

### Using ApiKeyGuard

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiKeyGuard } from './guards/api-key.guard';

@Controller('api')
@UseGuards(ApiKeyGuard)
export class MyController {
  @Get('protected')
  async protectedEndpoint(@Request() req) {
    // req.user contains the user
    // req.customer contains the customer
    // req.apiKey contains the API key details
    return { message: 'Authenticated with API key' };
  }
}
```

## Webhook Events

The system supports the following webhook events:

- `message.received` - New message received
- `message.sent` - Message sent successfully
- `conversation.created` - New conversation created
- `conversation.closed` - Conversation closed
- `chatbot.created` - New chatbot created
- `chatbot.updated` - Chatbot configuration updated

## Webhook Payload Format

All webhooks are sent as HTTP POST requests with JSON payload:

```json
{
  "event": "message.received",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "data": {
    // Event-specific data
  }
}
```

Headers included:
- `Content-Type: application/json`
- `User-Agent: ChatbotSaaS-Webhook/1.0`
- `X-Webhook-Event: <event-name>`
- `X-Webhook-ID: <webhook-event-id>`
- `X-Webhook-Attempt: <attempt-number>`

## Retry Logic

Webhooks are retried automatically on failure:

1. **First attempt**: Immediate delivery
2. **Second attempt**: After 1 second (exponential backoff)
3. **Third attempt**: After 2 seconds (exponential backoff)
4. **After 3 failures**: Marked as FAILED

## Security

- API keys are generated using cryptographically secure random bytes
- Keys are 256-bit (32 bytes) encoded in base64
- Keys are prefixed with `sk_` for easy identification
- Inactive keys are rejected during authentication
- Last used timestamp is tracked for security auditing

## Database Models

### APIKey
```prisma
model APIKey {
  id          String    @id @default(uuid())
  customerId  String
  key         String    @unique
  name        String
  permissions Json
  isActive    Boolean   @default(true)
  lastUsedAt  DateTime?
  createdAt   DateTime  @default(now())
}
```

### WebhookEvent
```prisma
model WebhookEvent {
  id          String        @id @default(uuid())
  url         String
  event       String
  payload     Json
  status      WebhookStatus @default(PENDING)
  attempts    Int           @default(0)
  lastError   String?
  createdAt   DateTime      @default(now())
  processedAt DateTime?
}
```

## Requirements Satisfied

This module satisfies **Requirement 13**:

- ✅ 13.1: Multiple API keys per customer with configurable permissions
- ✅ 13.2: API key authentication without JWT requirement
- ✅ 13.3: Webhook URL configuration per customer
- ✅ 13.4: HTTP POST webhook delivery with JSON payload
- ✅ 13.5: 3 retry attempts with exponential backoff
