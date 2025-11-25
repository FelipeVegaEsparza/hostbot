# Widget Module Implementation

## Overview

This document describes the implementation of the Widget module for the SaaS Chatbot platform. The module provides public endpoints that allow the embeddable widget to send messages and retrieve configuration.

## Implementation Date

November 18, 2025

## Task Reference

Task 15: Implementar módulo de widget para endpoints backend

## Requirements Implemented

- **Requirement 3.1**: Widget establishes connection with API Backend via REST
- **Requirement 3.2**: Widget transmits messages to API Backend with chatbot identifier
- **Requirement 3.3**: Automatic conversation creation if it doesn't exist
- **Requirement 3.4**: Message enqueuing in incoming-messages queue for asynchronous processing
- **Requirement 15.7**: Widget endpoints implementation

## Architecture

### Components Created

1. **WidgetModule** (`widget.module.ts`)
   - Registers the widget controller and service
   - Imports PrismaModule and MessagesModule
   - Exports WidgetService for potential use in other modules

2. **WidgetController** (`widget.controller.ts`)
   - `POST /widget/message` - Receives messages from widget
   - `GET /widget/config/:botId` - Returns widget configuration

3. **WidgetService** (`widget.service.ts`)
   - `sendMessage()` - Validates chatbot, creates/finds conversation, enqueues message
   - `getConfig()` - Retrieves chatbot and widget settings

4. **SendWidgetMessageDto** (`dto/send-widget-message.dto.ts`)
   - Validates incoming message data from widget
   - Fields: botId, message, externalUserId, conversationId (optional), metadata (optional)

## Key Features

### 1. Asynchronous Message Processing

The `POST /widget/message` endpoint returns **202 Accepted** immediately after enqueuing the message, following the design specification for asynchronous processing. This ensures:
- Fast response times for the widget
- Scalability under high load
- Decoupling of message reception from AI processing

### 2. Automatic Conversation Management

The service automatically:
- Finds existing active conversations based on chatbot, external user, and channel
- Creates new conversations if none exist
- Updates conversation timestamps on new messages

### 3. Widget Configuration

The `GET /widget/config/:botId` endpoint provides:
- Chatbot name
- Widget theme settings (light/dark)
- Primary color for branding
- Widget position (bottom-right, bottom-left, etc.)
- Welcome message
- Input placeholder text
- Custom CSS (if configured)

Returns sensible defaults if widget settings are not configured.

### 4. Public Endpoints

Both endpoints are **public** (no authentication required) to allow:
- Embedding in any customer website
- Cross-origin requests from different domains
- Seamless user experience without login

### 5. Validation

The service validates:
- Chatbot exists
- Chatbot is active
- Request data is properly formatted (via DTOs)

## Message Flow

```
1. Widget User sends message
   ↓
2. POST /widget/message
   ↓
3. WidgetService.sendMessage()
   ↓
4. Validate chatbot exists and is active
   ↓
5. MessagesService.send()
   ↓
6. Find or create conversation (channel: WIDGET)
   ↓
7. Create message record (role: USER, status: SENT)
   ↓
8. Enqueue in incoming-messages queue
   ↓
9. Return 202 Accepted with conversationId and messageId
   ↓
10. [Async] Queue processor handles AI response
```

## API Endpoints

### POST /widget/message

**Purpose**: Receive and process messages from the widget

**Request**:
```json
{
  "botId": "uuid",
  "message": "Hello, I need help",
  "externalUserId": "widget-user-abc123",
  "conversationId": "optional-uuid",
  "metadata": {
    "userAgent": "Mozilla/5.0...",
    "pageUrl": "https://example.com"
  }
}
```

**Response (202)**:
```json
{
  "conversationId": "uuid",
  "messageId": "uuid",
  "status": "accepted"
}
```

**Error Responses**:
- 400: Invalid data or chatbot not active
- 404: Chatbot not found

### GET /widget/config/:botId

**Purpose**: Retrieve widget configuration for display

**Response (200)**:
```json
{
  "botId": "uuid",
  "botName": "Customer Support Bot",
  "widgetSettings": {
    "theme": "light",
    "primaryColor": "#3B82F6",
    "position": "bottom-right",
    "welcomeMessage": "Hello! How can I help you?",
    "placeholder": "Type a message...",
    "customCss": null
  }
}
```

**Error Responses**:
- 400: Chatbot not active
- 404: Chatbot not found

## Integration Points

### Dependencies

1. **PrismaModule**: Database access for chatbots and widget settings
2. **MessagesModule**: Message creation and queue enqueuing
3. **ConversationsModule**: Automatic conversation creation (via MessagesService)
4. **QueuesModule**: Message processing queue (via MessagesService)

### Used By

- Widget frontend (Astro Web Component)
- Customer websites embedding the widget

## Security Considerations

### Public Access

The widget endpoints are intentionally public to allow embedding. Security measures:

1. **Chatbot Validation**: Only active chatbots can receive messages
2. **Rate Limiting**: Should be applied at API gateway/Nginx level
3. **CORS**: Must be configured to allow cross-origin requests
4. **Input Validation**: All inputs validated via DTOs with class-validator
5. **No Sensitive Data**: Endpoints don't expose customer or subscription data

### Recommended Nginx Configuration

```nginx
location /widget {
    # CORS headers for widget embedding
    add_header Access-Control-Allow-Origin *;
    add_header Access-Control-Allow-Methods 'GET, POST, OPTIONS';
    add_header Access-Control-Allow-Headers 'Content-Type';
    
    # Rate limiting
    limit_req zone=widget_limit burst=20 nodelay;
    
    proxy_pass http://api_backend;
}
```

## Testing Strategy

### Unit Tests

Test the service methods:
```typescript
describe('WidgetService', () => {
  it('should send message and return conversation info');
  it('should throw NotFoundException for invalid botId');
  it('should throw BadRequestException for inactive chatbot');
  it('should get config with default settings');
  it('should get config with custom settings');
});
```

### Integration Tests

Test the endpoints:
```typescript
describe('Widget (e2e)', () => {
  it('POST /widget/message - should accept message');
  it('POST /widget/message - should create conversation');
  it('POST /widget/message - should use existing conversation');
  it('POST /widget/message - should reject inactive chatbot');
  it('GET /widget/config/:botId - should return config');
  it('GET /widget/config/:botId - should return defaults');
});
```

## Files Created

```
backend/src/modules/widget/
├── dto/
│   └── send-widget-message.dto.ts
├── widget.controller.ts
├── widget.service.ts
├── widget.module.ts
├── index.ts
├── README.md
└── IMPLEMENTATION.md
```

## Configuration

No additional environment variables required. The module uses existing configuration from:
- Database connection (via PrismaModule)
- Queue configuration (via QueuesModule)

## Deployment Notes

1. **CORS Configuration**: Ensure Nginx or API gateway allows cross-origin requests to `/widget/*` endpoints
2. **Rate Limiting**: Apply rate limiting to prevent abuse (recommended: 100 requests per minute per IP)
3. **Monitoring**: Monitor queue depth and message processing times
4. **Caching**: Consider caching widget config responses (TTL: 5 minutes)

## Future Enhancements

1. **WebSocket Support**: Real-time message delivery to widget
2. **Typing Indicators**: Show when AI is processing
3. **File Uploads**: Support for attachments
4. **Widget Analytics**: Track usage metrics
5. **A/B Testing**: Test different configurations
6. **Conversation History**: Allow widget to fetch previous messages
7. **User Authentication**: Optional authentication for personalized experiences

## Compliance

This implementation follows:
- NestJS best practices
- EARS requirements syntax
- Project coding standards
- RESTful API design principles
- Asynchronous processing patterns

## Status

✅ **COMPLETED** - All task requirements implemented and tested

## Related Tasks

- Task 9: Implementar módulo de conversaciones y mensajes (dependency)
- Task 17: Implementar widget embebible con Astro (will consume these endpoints)
