# Queues Module

This module implements the message processing queue system using BullMQ and Redis.

## Overview

The queue system handles asynchronous processing of messages, AI requests, and webhook deliveries with automatic retries and exponential backoff.

## Queues

### 1. incoming-messages
Processes incoming messages from users across all channels (Widget, WhatsApp Cloud, WhatsApp QR).

**Responsibilities:**
- Create or retrieve conversation
- Save user message to database
- Update conversation timestamp
- Fetch conversation context
- Enqueue AI processing job
- Log usage metrics

### 2. ai-processing
Processes AI requests and generates responses using configured AI providers.

**Responsibilities:**
- Fetch knowledge base context if available
- Request AI response from configured provider
- Save assistant message to database
- Enqueue outgoing message job
- Log AI usage metrics
- Handle AI errors with fallback messages

### 3. outgoing-messages
Routes outgoing messages to appropriate delivery channels.

**Responsibilities:**
- Route messages based on channel (Widget, WhatsApp Cloud, WhatsApp QR)
- Enqueue channel-specific delivery jobs
- Update message delivery status

### 4. whatsapp-cloud-send
Sends messages via WhatsApp Cloud API (Meta).

**Responsibilities:**
- Send message using WhatsApp Cloud API
- Update message delivery status
- Log WhatsApp usage metrics
- Handle API errors with retries

### 5. whatsapp-qr-send
Sends messages via WhatsApp QR microservice (Baileys).

**Responsibilities:**
- Send message to WhatsApp QR microservice
- Update message delivery status
- Log WhatsApp usage metrics
- Handle connection errors with retries

### 6. webhook-delivery
Delivers webhook events to customer-configured URLs.

**Responsibilities:**
- Send HTTP POST request to webhook URL
- Update webhook event status
- Log delivery attempts and errors
- Retry failed deliveries with exponential backoff

## Configuration

### Redis Connection

Configure Redis connection in `.env`:

```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

### Queue Options

Default job options configured in `queues.module.ts`:

- **Attempts**: 3 retries
- **Backoff**: Exponential with 1000ms initial delay
- **Retention**: Completed jobs kept for 1 hour, failed jobs for 24 hours

## Usage

### Enqueuing Jobs

```typescript
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QUEUE_NAMES } from './modules/queues/queues.module';
import { IncomingMessageJob } from './modules/queues/interfaces/queue-job.interface';

@Injectable()
export class MessageService {
  constructor(
    @InjectQueue(QUEUE_NAMES.INCOMING_MESSAGES)
    private readonly incomingMessagesQueue: Queue,
  ) {}

  async processMessage(data: IncomingMessageJob) {
    await this.incomingMessagesQueue.add('process-message', data, {
      priority: 1, // Higher priority (lower number)
    });
  }
}
```

### Priority System

Messages are prioritized based on customer subscription plan:

- **Premium** (≥$100/month): Priority 1
- **Pro** ($50-$99/month): Priority 3
- **Basic** (<$50/month): Priority 5

## Error Handling

### Retry Strategy

All queues use exponential backoff:

1. **First retry**: 1 second delay
2. **Second retry**: 2 seconds delay
3. **Third retry**: 4 seconds delay

After 3 failed attempts, jobs are moved to a dead-letter queue.

### Error Logging

Failed jobs are logged with:
- Error message and stack trace
- Job attempt number
- Job data for debugging

### Fallback Behavior

- **AI Processing**: Returns error message to user
- **Message Delivery**: Marks message as FAILED
- **Webhook Delivery**: Marks webhook event as FAILED

## Monitoring

### Queue Metrics

Monitor queue health using BullMQ dashboard or custom metrics:

- Active jobs count
- Completed jobs count
- Failed jobs count
- Processing rate
- Average processing time

### Database Logs

All processing is logged in the database:

- `UsageLog`: Message and AI usage metrics
- `WebhookEvent`: Webhook delivery attempts
- `Message`: Message delivery status

## Testing

### Manual Testing

Use BullMQ Board or Redis CLI to inspect queues:

```bash
# Connect to Redis
redis-cli

# List all queues
KEYS bull:*

# Get queue length
LLEN bull:incoming-messages:wait

# View job data
HGETALL bull:incoming-messages:1
```

### Integration Testing

Test queue processing with Jest:

```typescript
describe('IncomingMessagesProcessor', () => {
  it('should process incoming message and enqueue AI job', async () => {
    const job = {
      data: {
        conversationId: 'test-conv-id',
        chatbotId: 'test-bot-id',
        externalUserId: 'user-123',
        content: 'Hello',
        channel: 'WIDGET',
      },
    };

    await processor.process(job as any);

    // Assert message saved to database
    // Assert AI job enqueued
  });
});
```

## Architecture

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│ incoming-messages   │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  ai-processing      │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ outgoing-messages   │
└──────┬──────────────┘
       │
       ├──────────────────┐
       │                  │
       ▼                  ▼
┌──────────────┐   ┌──────────────┐
│ whatsapp-    │   │ whatsapp-    │
│ cloud-send   │   │ qr-send      │
└──────────────┘   └──────────────┘
```

## Performance Considerations

### Concurrency

Configure worker concurrency in processor options:

```typescript
@Processor(QUEUE_NAMES.INCOMING_MESSAGES, {
  concurrency: 10, // Process 10 jobs concurrently
})
```

### Rate Limiting

Limit job processing rate to avoid overwhelming external APIs:

```typescript
await queue.add('job', data, {
  limiter: {
    max: 10, // Max 10 jobs
    duration: 1000, // Per second
  },
});
```

### Memory Management

- Completed jobs are automatically removed after 1 hour
- Failed jobs are kept for 24 hours for debugging
- Use Redis persistence for job durability

## Troubleshooting

### Jobs Stuck in Queue

Check Redis connection and worker status:

```bash
# Check Redis connection
redis-cli ping

# Check queue status
redis-cli LLEN bull:incoming-messages:wait
```

### High Failure Rate

Review error logs and adjust retry strategy:

```typescript
// Increase retry attempts
defaultJobOptions: {
  attempts: 5,
  backoff: {
    type: 'exponential',
    delay: 2000,
  },
}
```

### Slow Processing

Increase worker concurrency or add more workers:

```typescript
@Processor(QUEUE_NAMES.AI_PROCESSING, {
  concurrency: 20, // Increase from default
})
```
