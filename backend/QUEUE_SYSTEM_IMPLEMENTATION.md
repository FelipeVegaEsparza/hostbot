# Queue System Implementation Summary

## Overview

Successfully implemented a complete message processing queue system using BullMQ and Redis for asynchronous processing of messages, AI requests, and webhook deliveries.

## Implemented Components

### 1. Queue Module (`queues.module.ts`)

Main module that configures BullMQ with Redis and registers all 6 queues:

- **incoming-messages**: Processes incoming user messages
- **outgoing-messages**: Routes outgoing messages to delivery channels
- **ai-processing**: Handles AI response generation
- **whatsapp-cloud-send**: Sends messages via WhatsApp Cloud API
- **whatsapp-qr-send**: Sends messages via WhatsApp QR microservice
- **webhook-delivery**: Delivers webhook events to customer URLs

**Configuration:**
- Redis connection with host, port, and password support
- Default job options: 3 retry attempts with exponential backoff (1s initial delay)
- Automatic job cleanup: completed jobs kept for 1 hour, failed jobs for 24 hours

### 2. Queue Processors

#### IncomingMessagesProcessor
**Responsibilities:**
- Creates or retrieves conversation
- Saves user message to database
- Updates conversation timestamp
- Fetches last 10 messages for context
- Enqueues AI processing job with priority based on customer plan
- Logs message usage metrics

**Priority System:**
- Premium plans (≥$100): Priority 1
- Pro plans ($50-$99): Priority 3
- Basic plans (<$50): Priority 5

#### AIProcessingProcessor
**Responsibilities:**
- Fetches knowledge base context if available (top 5 relevant items)
- Requests AI response from configured provider
- Saves assistant message to database
- Enqueues outgoing message job
- Logs AI usage with token count
- Handles errors with fallback error messages

**Error Handling:**
- Returns user-friendly error message on AI failure
- Logs detailed error information
- Triggers retry with exponential backoff

#### OutgoingMessagesProcessor
**Responsibilities:**
- Routes messages based on channel (Widget, WhatsApp Cloud, WhatsApp QR)
- Enqueues channel-specific delivery jobs
- Updates message delivery status
- Handles routing errors

**Channel Routing:**
- Widget: Marks as sent (WebSocket delivery handled separately)
- WhatsApp Cloud: Enqueues to whatsapp-cloud-send queue
- WhatsApp QR: Enqueues to whatsapp-qr-send queue

#### WhatsAppCloudSendProcessor
**Responsibilities:**
- Sends messages via WhatsApp Cloud API (Meta Graph API v18.0)
- Updates message delivery status
- Logs WhatsApp usage metrics
- Handles API errors with retries

**Features:**
- 10-second timeout for API requests
- Stores WhatsApp message ID in metadata
- Tracks delivery attempts
- Logs usage per customer

#### WhatsAppQRSendProcessor
**Responsibilities:**
- Sends messages to WhatsApp QR microservice
- Updates message delivery status
- Logs WhatsApp usage metrics
- Handles connection errors with retries

**Features:**
- Configurable microservice URL via environment variable
- 10-second timeout for requests
- Stores WhatsApp message ID in metadata
- Tracks delivery attempts

#### WebhookDeliveryProcessor
**Responsibilities:**
- Sends HTTP POST requests to customer webhook URLs
- Updates webhook event status
- Logs delivery attempts and errors
- Retries failed deliveries with exponential backoff

**Features:**
- Custom headers: X-Webhook-Event, X-Webhook-ID, X-Webhook-Attempt
- 10-second timeout for requests
- Validates HTTP 2xx status codes
- Marks as failed after 3 attempts

### 3. Queue Service (`queue.service.ts`)

Helper service for enqueuing jobs from other modules:

**Methods:**
- `enqueueIncomingMessage()`: Add incoming message to queue
- `enqueueWebhookDelivery()`: Add webhook delivery to queue
- `getQueueStats()`: Get queue statistics (waiting, active, completed, failed, delayed)

### 4. Job Interfaces (`queue-job.interface.ts`)

TypeScript interfaces for all job types:

- `IncomingMessageJob`: User message data
- `AIProcessingJob`: AI request parameters
- `OutgoingMessageJob`: Outgoing message data
- `WhatsAppCloudSendJob`: WhatsApp Cloud API parameters
- `WhatsAppQRSendJob`: WhatsApp QR microservice parameters
- `WebhookDeliveryJob`: Webhook delivery parameters

## Configuration

### Environment Variables

Added to `.env.example`:

```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

### Module Integration

Updated `app.module.ts` to import `QueuesModule`.

## Message Flow

```
User Message
    ↓
incoming-messages queue
    ↓
Save to DB + Get context
    ↓
ai-processing queue
    ↓
Generate AI response
    ↓
outgoing-messages queue
    ↓
Route by channel
    ↓
whatsapp-cloud-send / whatsapp-qr-send / widget
    ↓
Deliver message
```

## Error Handling

### Retry Strategy

All queues use exponential backoff:
1. First retry: 1 second delay
2. Second retry: 2 seconds delay
3. Third retry: 4 seconds delay

After 3 failed attempts, jobs are moved to dead-letter queue.

### Fallback Behavior

- **AI Processing**: Returns error message to user
- **Message Delivery**: Marks message as FAILED in database
- **Webhook Delivery**: Marks webhook event as FAILED after 3 attempts

### Error Logging

All processors log errors with:
- Error message and stack trace
- Job attempt number
- Job data for debugging

## Database Integration

### Tables Used

- **Conversation**: Stores conversation metadata
- **Message**: Stores all messages with delivery status
- **UsageLog**: Tracks message and AI usage per customer
- **WebhookEvent**: Tracks webhook delivery attempts
- **WhatsAppCloudAccount**: Stores WhatsApp Cloud credentials
- **WhatsAppQRSession**: Stores WhatsApp QR session info
- **Chatbot**: Stores chatbot configuration and AI settings
- **KnowledgeBase/KnowledgeItem**: Stores knowledge base content

### Delivery Status Flow

```
PENDING → SENT → DELIVERED → READ
         ↓
       FAILED (after retries)
```

## Performance Considerations

### Concurrency

Default concurrency can be adjusted per processor:

```typescript
@Processor(QUEUE_NAMES.INCOMING_MESSAGES, {
  concurrency: 10, // Process 10 jobs concurrently
})
```

### Rate Limiting

Can be configured per queue to avoid overwhelming external APIs:

```typescript
await queue.add('job', data, {
  limiter: {
    max: 10, // Max 10 jobs per second
    duration: 1000,
  },
});
```

### Memory Management

- Completed jobs automatically removed after 1 hour
- Failed jobs kept for 24 hours for debugging
- Redis persistence ensures job durability

## Monitoring

### Queue Metrics

Monitor using `QueueService.getQueueStats()`:

- Waiting jobs count
- Active jobs count
- Completed jobs count
- Failed jobs count
- Delayed jobs count

### Database Logs

All processing logged in database:

- `UsageLog`: Message and AI usage metrics
- `WebhookEvent`: Webhook delivery attempts
- `Message`: Message delivery status and metadata

## Testing

### Build Verification

✅ Successfully compiled with `npm run build`

### Manual Testing

Use Redis CLI to inspect queues:

```bash
# List all queues
redis-cli KEYS "bull:*"

# Get queue length
redis-cli LLEN "bull:incoming-messages:wait"

# View job data
redis-cli HGETALL "bull:incoming-messages:1"
```

### Integration Testing

Test with BullMQ Board or custom monitoring dashboard.

## Next Steps

To use the queue system in other modules:

1. **Import QueuesModule** in your module
2. **Inject QueueService** in your service
3. **Enqueue jobs** using the service methods

Example:

```typescript
import { QueueService } from '../queues/queue.service';

@Injectable()
export class MessagesService {
  constructor(private queueService: QueueService) {}

  async handleIncomingMessage(data: IncomingMessageJob) {
    await this.queueService.enqueueIncomingMessage(data);
  }
}
```

## Documentation

Created comprehensive README at `backend/src/modules/queues/README.md` with:

- Queue descriptions and responsibilities
- Configuration guide
- Usage examples
- Error handling strategies
- Monitoring and troubleshooting tips
- Architecture diagrams

## Requirements Satisfied

✅ **7.1**: BullMQ configured with Redis backend
✅ **7.2**: 6 queues registered and configured
✅ **7.3**: Message processing with workers and concurrency
✅ **7.4**: Automatic retries with exponential backoff (3 attempts)
✅ **7.5**: Dead-letter queue for failed jobs (automatic via BullMQ)

## Files Created

1. `backend/src/modules/queues/queues.module.ts` - Main module
2. `backend/src/modules/queues/queue.service.ts` - Helper service
3. `backend/src/modules/queues/interfaces/queue-job.interface.ts` - Job interfaces
4. `backend/src/modules/queues/processors/incoming-messages.processor.ts` - Incoming messages
5. `backend/src/modules/queues/processors/ai-processing.processor.ts` - AI processing
6. `backend/src/modules/queues/processors/outgoing-messages.processor.ts` - Outgoing messages
7. `backend/src/modules/queues/processors/whatsapp-cloud-send.processor.ts` - WhatsApp Cloud
8. `backend/src/modules/queues/processors/whatsapp-qr-send.processor.ts` - WhatsApp QR
9. `backend/src/modules/queues/processors/webhook-delivery.processor.ts` - Webhooks
10. `backend/src/modules/queues/README.md` - Documentation

## Files Modified

1. `backend/src/app.module.ts` - Added QueuesModule import
2. `backend/.env.example` - Added Redis configuration variables
