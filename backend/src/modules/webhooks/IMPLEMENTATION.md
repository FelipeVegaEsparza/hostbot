# Webhooks Module Implementation

## Overview

This document describes the implementation of the Webhooks module for Task 14, which includes API key management and webhook delivery functionality.

## Components Implemented

### 1. WebhooksModule (`webhooks.module.ts`)

Main module that imports:
- `PrismaModule` - Database access
- `QueuesModule` - Queue integration for webhook delivery

Exports:
- `WebhooksService` - Webhook management
- `ApiKeysService` - API key management

### 2. WebhooksService (`webhooks.service.ts`)

Handles webhook event management and delivery:

**Key Methods:**
- `triggerWebhook(customerId, event, payload)` - Trigger a webhook event
- `recordWebhookAttempt(webhookEventId, success, error)` - Record delivery attempts
- `getWebhookEvent(id)` - Get webhook event by ID
- `getWebhookEvents(params)` - List webhook events with pagination

**Features:**
- Creates `WebhookEvent` records in database
- Enqueues webhooks for asynchronous delivery via BullMQ
- Tracks delivery status (PENDING, SENT, FAILED)
- Records attempts and error messages

### 3. ApiKeysService (`api-keys.service.ts`)

Manages API key lifecycle:

**Key Methods:**
- `createApiKey(customerId, dto)` - Generate new API key
- `getApiKeys(customerId)` - List all API keys for customer
- `getApiKeyById(id, customerId)` - Get specific API key
- `validateApiKey(key)` - Validate API key and return customer
- `updateApiKey(id, customerId, dto)` - Update API key
- `deleteApiKey(id, customerId)` - Delete API key
- `deactivateApiKey(id, customerId)` - Soft delete API key
- `hasPermission(apiKey, permission)` - Check permission

**API Key Generation:**
- Uses `crypto.randomBytes(32)` for 256-bit security
- Generates base64-encoded keys with `sk_` prefix
- Format: `sk_<base64-encoded-random-bytes>`
- Checks for uniqueness (handles rare collisions)

### 4. ApiKeysController (`api-keys.controller.ts`)

REST API endpoints for API key management:

```
POST   /api-keys              - Create new API key
GET    /api-keys              - List all API keys
GET    /api-keys/:id          - Get specific API key
PATCH  /api-keys/:id          - Update API key
DELETE /api-keys/:id          - Delete API key
POST   /api-keys/:id/deactivate - Deactivate API key
```

All endpoints protected by `JwtAuthGuard` (requires JWT authentication).

### 5. ApiKeyGuard (`guards/api-key.guard.ts`)

Authentication guard for API key validation:

**Features:**
- Extracts API key from `X-API-Key` header or `Authorization: Bearer` header
- Validates API key using `ApiKeysService`
- Checks if key is active
- Attaches `user`, `customer`, and `apiKey` to request object
- Supports public routes via `@Public()` decorator

**Usage:**
```typescript
@Controller('api')
@UseGuards(ApiKeyGuard)
export class MyController {
  @Get('endpoint')
  async endpoint(@Request() req) {
    // req.user, req.customer, req.apiKey available
  }
}
```

### 6. DTOs

**CreateApiKeyDto:**
- `name` (string, required, min 3 chars)
- `permissions` (string[], optional)

**UpdateApiKeyDto:**
- `name` (string, optional, min 3 chars)
- `permissions` (string[], optional)
- `isActive` (boolean, optional)

### 7. Webhook Delivery Processor

Updated existing `webhook-delivery.processor.ts` to work with the new webhook system:

**Features:**
- Processes jobs from `webhook-delivery` queue
- Sends HTTP POST requests to webhook URLs
- Includes custom headers (X-Webhook-Event, X-Webhook-ID, X-Webhook-Attempt)
- 10-second timeout per request
- Updates webhook event status after each attempt
- Automatic retry with exponential backoff (3 attempts total)
- Marks as FAILED after 3 failed attempts

## Database Models Used

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

## Integration Points

### 1. Queue Integration

The module integrates with the existing `QueuesModule`:
- Uses `QueueService.enqueueWebhookDelivery()` to enqueue webhooks
- Webhook delivery processor handles actual HTTP delivery
- Supports retry logic with exponential backoff

### 2. Authentication Integration

Two authentication methods supported:
1. **JWT Authentication** - For API key management endpoints
2. **API Key Authentication** - For external API access

### 3. Customer Association

All API keys are associated with a customer:
- API keys can only be managed by the owning customer
- Validation returns customer and user information
- Supports multi-tenancy

## Security Features

1. **Cryptographically Secure Keys**
   - 256-bit random keys using `crypto.randomBytes`
   - Base64 encoding for safe transmission
   - Unique key validation

2. **Activity Tracking**
   - `lastUsedAt` timestamp updated on each use
   - Helps identify unused or compromised keys

3. **Soft Delete**
   - Keys can be deactivated without deletion
   - Maintains audit trail

4. **Permission System**
   - Configurable permissions per key
   - Wildcard permission support (`*`)
   - Fine-grained access control

## Webhook Delivery Flow

```
1. Event occurs in system
   ↓
2. Service calls webhooksService.triggerWebhook()
   ↓
3. WebhookEvent record created in database
   ↓
4. Job enqueued in webhook-delivery queue
   ↓
5. WebhookDeliveryProcessor picks up job
   ↓
6. HTTP POST sent to webhook URL
   ↓
7. Success: Mark as SENT
   Failure: Retry with backoff (up to 3 times)
   ↓
8. After 3 failures: Mark as FAILED
```

## Requirements Satisfied

✅ **Requirement 13.1**: Multiple API keys per customer with configurable permissions
- Implemented in `ApiKeysService.createApiKey()`
- Permissions stored as JSON array

✅ **Requirement 13.2**: API key authentication without JWT
- Implemented in `ApiKeyGuard`
- Supports X-API-Key header and Bearer token

✅ **Requirement 13.3**: Webhook URL configuration per customer
- Webhook URLs stored in `WebhookEvent` records
- Customer-specific webhook configurations supported

✅ **Requirement 13.4**: HTTP POST webhook delivery with JSON payload
- Implemented in `WebhookDeliveryProcessor`
- Sends JSON payload with custom headers

✅ **Requirement 13.5**: 3 retry attempts with exponential backoff
- Configured in BullMQ queue options
- Processor tracks attempts and marks as FAILED after 3 attempts

## Testing Recommendations

1. **API Key Generation**
   - Test uniqueness validation
   - Test key format (sk_ prefix)
   - Test collision handling

2. **API Key Authentication**
   - Test valid key authentication
   - Test invalid key rejection
   - Test inactive key rejection
   - Test both header formats

3. **Webhook Delivery**
   - Test successful delivery
   - Test retry logic on failure
   - Test exponential backoff timing
   - Test final failure after 3 attempts

4. **Permissions**
   - Test permission checking
   - Test wildcard permissions
   - Test missing permissions

## Future Enhancements

1. **Webhook Configuration UI**
   - Add customer-facing UI for webhook configuration
   - Allow customers to specify webhook URLs per event type

2. **Webhook Signatures**
   - Add HMAC signatures to webhook payloads
   - Allow customers to verify webhook authenticity

3. **Webhook Logs**
   - Add detailed logging of webhook payloads
   - Provide webhook delivery history in dashboard

4. **Rate Limiting**
   - Add rate limiting per API key
   - Track API key usage metrics

5. **Scoped Permissions**
   - Implement more granular permission system
   - Support resource-level permissions (e.g., specific chatbot access)
