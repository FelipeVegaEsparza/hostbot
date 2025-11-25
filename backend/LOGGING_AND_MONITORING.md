# Logging and Monitoring Implementation

This document describes the logging, monitoring, and health check implementation for the SaaS Chatbot platform.

## Overview

The system implements comprehensive logging and monitoring using:
- **Winston** for structured JSON logging
- **Correlation IDs** for request tracking across services
- **Tracing Interceptor** for request duration measurement
- **Health Checks** for database, Redis, and queues monitoring
- **Global Exception Filter** for centralized error handling

## Components

### 1. CustomLogger Service

**Location:** `src/common/logger/custom-logger.service.ts`

A Winston-based logger that provides structured logging in JSON format with multiple log levels.

**Features:**
- Structured JSON logging
- Multiple log levels: error, warn, info, debug, verbose
- Console output with colors
- File output for errors (`logs/error.log`)
- File output for all logs (`logs/combined.log`)
- Automatic log rotation (5MB max file size, 5 files retained)
- Context support for identifying log sources

**Usage:**
```typescript
import { CustomLogger } from './common/logger/custom-logger.service';

const logger = new CustomLogger();
logger.setContext('MyService');

logger.log('Operation completed successfully');
logger.error('Operation failed', error.stack);
logger.warn('Resource usage high');
logger.debug('Debug information');

// Structured logging with metadata
logger.logWithMeta('info', 'User action', {
  userId: '123',
  action: 'login',
  ip: '192.168.1.1'
});
```

**Configuration:**
Set the `LOG_LEVEL` environment variable to control verbosity:
- `error`: Only errors
- `warn`: Warnings and errors
- `info`: Informational messages, warnings, and errors (default)
- `debug`: Debug messages and above
- `verbose`: All messages

### 2. CorrelationIdMiddleware

**Location:** `src/common/middleware/correlation-id.middleware.ts`

Middleware that adds a unique correlation ID to each request for tracking across the system.

**Features:**
- Generates UUID v4 for each request
- Accepts existing correlation ID from `x-correlation-id` header
- Attaches correlation ID to request object
- Returns correlation ID in response headers
- Enables distributed tracing

**Usage:**
The middleware is automatically applied globally in `main.ts`. The correlation ID is available in:
- Request object: `req.correlationId`
- Response headers: `x-correlation-id`
- All log entries

### 3. TracingInterceptor

**Location:** `src/common/interceptors/tracing.interceptor.ts`

Interceptor that measures request duration and logs detailed request/response information.

**Features:**
- Logs incoming requests with metadata
- Measures request duration in milliseconds
- Logs successful responses with status code and duration
- Logs failed responses with error details
- Includes correlation ID in all logs

**Log Format:**
```json
{
  "level": "info",
  "message": "Request completed",
  "correlationId": "550e8400-e29b-41d4-a716-446655440000",
  "method": "GET",
  "url": "/api/chatbots",
  "statusCode": 200,
  "duration": 45,
  "ip": "192.168.1.1",
  "timestamp": "2024-01-15 10:30:45"
}
```

### 4. AllExceptionsFilter

**Location:** `src/common/filters/http-exception.filter.ts`

Global exception filter that catches all unhandled exceptions and provides consistent error responses.

**Features:**
- Catches all exceptions (HTTP and non-HTTP)
- Provides consistent error response format
- Logs errors with full context and stack traces
- Includes correlation ID for error tracking
- Sanitizes error messages for security

**Error Response Format:**
```json
{
  "statusCode": 500,
  "timestamp": "2024-01-15T10:30:45.123Z",
  "path": "/api/chatbots",
  "method": "POST",
  "message": "Internal server error"
}
```

### 5. Health Check System

**Location:** `src/modules/health/`

Comprehensive health check system that monitors critical system components.

#### HealthController

**Endpoints:**
- `GET /health` - Overall system health
- `GET /health/database` - Database connectivity
- `GET /health/redis` - Redis connectivity
- `GET /health/queues` - BullMQ queues status

#### HealthService

**Checks:**

1. **Database Check**
   - Executes simple query to verify connectivity
   - Returns status: up/down

2. **Redis Check**
   - Pings Redis server
   - Retrieves Redis version
   - Returns status: up/down with version info

3. **Queues Check**
   - Checks all BullMQ queues (incoming-messages, outgoing-messages, ai-processing)
   - Returns job counts: waiting, active, completed, failed
   - Flags as unhealthy if failed jobs > 100

**Response Format:**
```json
{
  "status": "ok",
  "info": {
    "database": { "status": "up" },
    "redis": { "status": "up", "details": { "version": "7.0.0" } },
    "queues": {
      "status": "up",
      "details": {
        "queues": [
          {
            "name": "incoming-messages",
            "waiting": 5,
            "active": 2,
            "completed": 1000,
            "failed": 3
          }
        ]
      }
    }
  },
  "error": {},
  "details": { /* same as info */ }
}
```

## Log Files

Logs are stored in the `backend/logs/` directory:

- **error.log** - Contains only error-level logs
- **combined.log** - Contains all log levels

Both files:
- Maximum size: 5MB
- Rotation: Keep last 5 files
- Format: JSON (one log entry per line)

## Monitoring Best Practices

### 1. Request Tracking

Every request has a unique correlation ID that appears in:
- Response headers
- All log entries
- Error messages

Use correlation IDs to trace a request through the entire system.

### 2. Error Investigation

When investigating errors:
1. Find the correlation ID from the error response
2. Search logs for that correlation ID
3. View the complete request flow and error context

Example:
```bash
# Search logs for a specific correlation ID
grep "550e8400-e29b-41d4-a716-446655440000" logs/combined.log
```

### 3. Health Monitoring

Set up automated health checks:
```bash
# Check overall health
curl http://localhost:3000/health

# Check specific component
curl http://localhost:3000/health/database
curl http://localhost:3000/health/redis
curl http://localhost:3000/health/queues
```

Recommended monitoring:
- Poll `/health` endpoint every 30 seconds
- Alert if status is "error"
- Alert if response time > 5 seconds
- Alert if endpoint returns 503

### 4. Log Analysis

Common log queries:

```bash
# Find all errors in the last hour
grep '"level":"error"' logs/error.log | tail -100

# Find slow requests (>1000ms)
grep '"duration":[0-9]\{4,\}' logs/combined.log

# Find requests from specific IP
grep '"ip":"192.168.1.1"' logs/combined.log

# Count requests by endpoint
grep '"url":' logs/combined.log | cut -d'"' -f8 | sort | uniq -c
```

### 5. Performance Monitoring

The TracingInterceptor logs request duration. Monitor these metrics:
- Average response time
- 95th percentile response time
- Requests per second
- Error rate

## Integration with External Tools

### Log Aggregation

The JSON log format is compatible with:
- **ELK Stack** (Elasticsearch, Logstash, Kibana)
- **Splunk**
- **Datadog**
- **New Relic**
- **CloudWatch Logs**

Example Logstash configuration:
```ruby
input {
  file {
    path => "/app/logs/combined.log"
    codec => json
  }
}

filter {
  # Add any custom filters here
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "chatbot-api-%{+YYYY.MM.dd}"
  }
}
```

### Alerting

Set up alerts for:
- Error rate > 5%
- Response time p95 > 2000ms
- Health check failures
- Queue failed jobs > 100
- Database connection failures

## Environment Variables

```bash
# Logging level (error, warn, info, debug, verbose)
LOG_LEVEL=info
```

## Testing

Test the logging and monitoring system:

```bash
# Start the application
npm run start:dev

# Check health endpoint
curl http://localhost:3000/health

# Generate some logs
curl http://localhost:3000/api/chatbots

# View logs
tail -f logs/combined.log

# View errors only
tail -f logs/error.log
```

## Troubleshooting

### Logs not appearing

1. Check if `logs/` directory exists
2. Check file permissions
3. Verify LOG_LEVEL environment variable
4. Check disk space

### Health checks failing

1. Verify database connection: `GET /health/database`
2. Verify Redis connection: `GET /health/redis`
3. Check queue status: `GET /health/queues`
4. Review error logs for details

### High memory usage

Log files can grow large. Consider:
- Reducing LOG_LEVEL in production (use 'info' or 'warn')
- Setting up log rotation with external tools
- Archiving old logs to external storage
- Using log aggregation services

## Production Recommendations

1. **Log Level**: Set to 'info' or 'warn' in production
2. **Log Rotation**: Use external tools (logrotate) for better control
3. **Log Aggregation**: Send logs to centralized logging service
4. **Monitoring**: Set up automated health checks and alerts
5. **Retention**: Keep logs for at least 30 days
6. **Security**: Ensure logs don't contain sensitive data (passwords, tokens)
7. **Performance**: Monitor log file I/O impact on performance

## Summary

The logging and monitoring system provides:
- ✅ Structured JSON logging with Winston
- ✅ Request tracking with correlation IDs
- ✅ Request duration measurement
- ✅ Comprehensive health checks
- ✅ Centralized error handling
- ✅ File-based log storage with rotation
- ✅ Multiple log levels for different environments
- ✅ Integration-ready for external monitoring tools

All requirements from task 19 have been implemented successfully.
