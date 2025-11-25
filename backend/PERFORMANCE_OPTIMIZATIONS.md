# Performance Optimizations Implementation

This document describes the performance optimizations implemented in the SaaS Chatbot platform.

## Overview

The following optimizations have been implemented to improve system performance, scalability, and response times:

1. **Database Connection Pooling** - Optimized Prisma connection management
2. **Redis Caching** - Implemented caching layer for frequently accessed data
3. **HTTP Compression** - Enabled gzip compression for API responses
4. **Pagination** - Added pagination to all list endpoints
5. **Queue Rate Limiting** - Configured BullMQ rate limiting
6. **Priority Queues** - Implemented priority-based job processing
7. **Database Indexes** - Optimized database queries with proper indexing

## 1. Database Connection Pooling

### Configuration

Prisma connection pooling is configured via the `DATABASE_URL` environment variable:

```env
DATABASE_URL="mysql://user:password@localhost:3306/chatbot_saas?connection_limit=10&pool_timeout=20"
```

### Parameters

- **connection_limit**: Maximum 10 concurrent connections
- **pool_timeout**: 20 seconds timeout for acquiring connections
- **Minimum connections**: 2 (managed by Prisma automatically)

### Benefits

- Reduces database connection overhead
- Prevents connection exhaustion
- Improves query performance under load

## 2. Redis Caching Service

### Implementation

A global `CacheService` has been implemented in `src/common/cache/cache.service.ts`.

### Features

- **Get/Set operations** with optional TTL
- **Pattern-based deletion** for cache invalidation
- **Get-or-set pattern** for lazy loading
- **Increment operations** for counters
- **TTL management** for expiration control

### Usage Example

```typescript
// Cache chatbot data for 10 minutes
await this.cacheService.set(`chatbot:${id}`, chatbot, 600);

// Get from cache
const cached = await this.cacheService.get<Chatbot>(`chatbot:${id}`);

// Invalidate cache pattern
await this.cacheService.delPattern(`chatbots:customer:${customerId}:*`);
```

### Cached Resources

- **Chatbots**: Individual chatbots (10 min TTL)
- **Chatbot Lists**: Paginated chatbot lists (5 min TTL)
- **Plans**: Subscription plans (15 min TTL)
- **Exchange Rates**: Currency conversion rates (24 hours TTL)

### Cache Keys Convention

```
chatbot:{id}                                    # Individual chatbot
chatbots:customer:{customerId}:page:{n}:limit:{m}  # Paginated list
plan:{id}                                       # Subscription plan
exchange-rate:{from}:{to}                       # Exchange rate
```

## 3. HTTP Compression

### Configuration

Compression middleware is enabled in `main.ts`:

```typescript
import compression from 'compression';
app.use(compression());
```

### Benefits

- Reduces response payload size by 60-80%
- Improves network transfer speed
- Reduces bandwidth costs

### Compression Settings

- **Algorithm**: gzip (default)
- **Threshold**: 1KB (responses smaller than 1KB are not compressed)
- **Level**: 6 (balanced compression ratio and speed)

## 4. Pagination

### Implementation

A standard `PaginationDto` has been implemented for all list endpoints.

### Parameters

- **page**: Page number (1-based, default: 1)
- **limit**: Items per page (1-100, default: 10)

### Response Format

```json
{
  "data": [...],
  "meta": {
    "total": 150,
    "page": 1,
    "limit": 10,
    "totalPages": 15,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

### Paginated Endpoints

- `GET /chatbots` - List chatbots (default limit: 10)
- `GET /conversations` - List conversations (default limit: 20)
- `GET /messages/conversation/:id` - List messages (default limit: 50)
- `GET /knowledge/bases` - List knowledge bases (default limit: 10)
- `GET /knowledge/bases/:id/items` - List knowledge items (default limit: 20)

### Usage Example

```typescript
// Controller
@Get()
async findAll(@Query() paginationDto: PaginationDto) {
  return this.service.findAll(paginationDto);
}

// Service
async findAll(paginationDto: PaginationDto = {}) {
  const { page = 1, limit = 10 } = paginationDto;
  const { skip, take } = getPaginationParams(page, limit);
  
  const total = await this.prisma.model.count();
  const data = await this.prisma.model.findMany({ skip, take });
  
  return new PaginatedResponseDto(data, total, page, limit);
}
```

## 5. Queue Rate Limiting

### Configuration

BullMQ queues are configured with rate limiting in `queues.module.ts`:

```typescript
limiter: {
  max: 10,        // Maximum 10 jobs
  duration: 1000, // Per 1000ms (1 second)
}
```

### Benefits

- Prevents queue overload
- Protects external APIs from rate limit violations
- Ensures fair resource distribution
- Prevents system degradation under high load

### Per-Queue Limits

All queues share the same rate limit of **10 jobs per second**:

- incoming-messages
- outgoing-messages
- ai-processing
- whatsapp-cloud-send
- whatsapp-qr-send
- webhook-delivery

## 6. Priority Queues

### Implementation

Jobs are prioritized based on customer subscription plan:

```typescript
// Priority levels (1 = highest, 10 = lowest)
const priority = await this.getPriority(customerId);

await queue.add('job-name', data, { priority });
```

### Priority Mapping

- **Premium Plans** ($100+): Priority 1
- **Pro Plans** ($50-$99): Priority 3
- **Basic Plans** (<$50): Priority 5
- **Webhooks**: Priority 7 (lower priority)

### Benefits

- Premium customers get faster response times
- Fair resource allocation based on subscription tier
- Prevents low-priority jobs from blocking high-priority ones

## 7. Database Indexes

### Existing Indexes

The Prisma schema includes optimized indexes on frequently queried fields:

#### User & Customer
- `User.email` - Unique index for login
- `Customer.userId` - Foreign key index

#### Chatbots
- `Chatbot.customerId` - Filter by customer
- `Chatbot.knowledgeBaseId` - Join with knowledge base
- `Chatbot.isActive` - Filter active chatbots

#### Conversations & Messages
- `Conversation.chatbotId` - Filter by chatbot
- `Conversation.externalUserId` - Find user conversations
- `Conversation.lastMessageAt` - Sort by recent activity
- `Conversation.channel` - Filter by channel
- `Message.conversationId` - Get conversation messages
- `Message.createdAt` - Sort messages chronologically
- `Message.role` - Filter by message role

#### Knowledge Base
- `KnowledgeBase.customerId` - Filter by customer
- `KnowledgeItem.knowledgeBaseId` - Get items in base
- **Full-text index** on `KnowledgeItem.title` and `KnowledgeItem.content`

#### Subscriptions & Billing
- `Subscription.customerId` - Get customer subscription
- `Subscription.planId` - Join with plan
- `Subscription.status` - Filter active subscriptions
- `Invoice.customerId` - Get customer invoices
- `Invoice.status` - Filter by payment status
- `Invoice.createdAt` - Sort by date

#### API & Webhooks
- `APIKey.customerId` - Get customer API keys
- `APIKey.key` - Authenticate by API key
- `APIKey.isActive` - Filter active keys
- `WebhookEvent.status` - Find pending webhooks
- `WebhookEvent.createdAt` - Process in order

### Index Usage Guidelines

- **Single-column indexes**: Used for simple WHERE clauses
- **Composite indexes**: Used for multi-column queries
- **Full-text indexes**: Used for text search in knowledge base
- **Foreign key indexes**: Automatically created for relationships

## Performance Metrics

### Expected Improvements

- **API Response Time**: 30-50% reduction with caching
- **Database Query Time**: 40-60% reduction with indexes
- **Network Transfer**: 60-80% reduction with compression
- **Queue Processing**: 2-3x throughput with rate limiting
- **Memory Usage**: Stable with connection pooling

### Monitoring

Monitor these metrics to track performance:

1. **Cache Hit Rate**: Should be >70% for frequently accessed data
2. **Database Connection Pool**: Should not exceed 80% utilization
3. **Queue Processing Rate**: Should maintain 10 jobs/second
4. **API Response Times**: P95 should be <500ms
5. **Memory Usage**: Should remain stable under load

## Configuration

### Environment Variables

```env
# Database with connection pooling
DATABASE_URL="mysql://user:password@localhost:3306/chatbot_saas?connection_limit=10&pool_timeout=20"

# Redis for caching and queues
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# Rate limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100  # 100 requests per window
```

### Tuning Recommendations

#### For High Traffic (>1000 req/min)

- Increase connection pool: `connection_limit=20`
- Increase queue rate limit: `max: 20`
- Reduce cache TTL for more frequent updates
- Add read replicas for database

#### For Low Traffic (<100 req/min)

- Reduce connection pool: `connection_limit=5`
- Keep default queue rate limit
- Increase cache TTL to reduce database load

## Best Practices

### Caching

1. **Cache frequently read data** (chatbots, plans, settings)
2. **Invalidate on write** (delete cache when data changes)
3. **Use appropriate TTL** (balance freshness vs performance)
4. **Cache at multiple levels** (application, database, CDN)

### Pagination

1. **Always paginate lists** (prevent large result sets)
2. **Use reasonable defaults** (10-50 items per page)
3. **Limit maximum page size** (prevent abuse)
4. **Include pagination metadata** (total, pages, navigation)

### Database

1. **Use indexes wisely** (balance query speed vs write overhead)
2. **Monitor slow queries** (identify missing indexes)
3. **Use connection pooling** (prevent connection exhaustion)
4. **Optimize N+1 queries** (use includes/joins)

### Queues

1. **Use priority queues** (important jobs first)
2. **Implement rate limiting** (protect external APIs)
3. **Handle failures gracefully** (retries with backoff)
4. **Monitor queue depth** (prevent backlog)

## Troubleshooting

### High Cache Miss Rate

- Check if cache keys are consistent
- Verify TTL is not too short
- Ensure cache invalidation is working

### Database Connection Pool Exhausted

- Increase `connection_limit`
- Check for connection leaks
- Optimize long-running queries

### Queue Backlog Growing

- Increase rate limit if external APIs allow
- Add more workers
- Optimize job processing time
- Check for failing jobs

### Slow API Responses

- Check cache hit rate
- Review database query performance
- Verify compression is enabled
- Check for N+1 query problems

## Future Optimizations

Potential future improvements:

1. **CDN Integration** - Cache static assets and API responses
2. **Database Read Replicas** - Distribute read load
3. **Horizontal Scaling** - Multiple API instances with load balancer
4. **Query Result Caching** - Cache complex database queries
5. **GraphQL DataLoader** - Batch and cache database requests
6. **Response Streaming** - Stream large responses
7. **Edge Caching** - Cache at edge locations globally
