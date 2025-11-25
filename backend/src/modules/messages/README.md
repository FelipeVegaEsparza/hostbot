# Messages Module

This module handles message creation, retrieval, and real-time delivery for the chatbot platform.

## Features

- Send and receive messages in conversations
- Automatic conversation creation if needed
- Message queueing for AI processing
- Real-time message delivery via WebSocket
- Pagination support for message history
- Delivery status tracking
- Support for message metadata (attachments, etc.)

## REST Endpoints

### POST /messages/send
Send a message (creates message and enqueues for AI processing).

**Request Body:**
```json
{
  "chatbotId": "uuid",
  "externalUserId": "+56912345678",
  "content": "Hello, I need help",
  "channel": "WIDGET",
  "metadata": {},
  "conversationId": "uuid" // optional
}
```

**Response:** HTTP 202 Accepted
```json
{
  "message": "Message accepted for processing",
  "data": {
    "message": { ... },
    "conversation": { ... }
  }
}
```

### GET /messages/conversation/:conversationId
Get messages for a conversation with pagination.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50)

### GET /messages/:id
Get a specific message by ID.

## WebSocket Gateway

The module provides a WebSocket gateway at `/messages` namespace for real-time updates.

### Events

#### Client -> Server

**subscribe**
Subscribe to a conversation to receive real-time messages.
```json
{
  "conversationId": "uuid"
}
```

**unsubscribe**
Unsubscribe from a conversation.
```json
{
  "conversationId": "uuid"
}
```

#### Server -> Client

**message**
Emitted when a new message is created in the conversation.
```json
{
  "id": "uuid",
  "conversationId": "uuid",
  "content": "Hello!",
  "role": "USER",
  "deliveryStatus": "SENT",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

**message:status**
Emitted when a message delivery status changes.
```json
{
  "messageId": "uuid",
  "status": "DELIVERED"
}
```

**typing**
Emitted when typing indicator should be shown.
```json
{
  "isTyping": true
}
```

## Service Methods

### `create(createMessageDto)`
Creates a new message in a conversation and updates the conversation's lastMessageAt timestamp.

### `send(sendMessageDto)`
Sends a message by:
1. Finding or creating a conversation
2. Creating the user message
3. Enqueuing the message for AI processing
4. Returning immediately (async processing)

### `findByConversation(conversationId, customerId, page, limit)`
Returns paginated list of messages for a conversation with ownership verification.

### `updateDeliveryStatus(messageId, status)`
Updates the delivery status of a message.

### `findOne(id)`
Gets a single message by ID.

## Message Flow

1. Client sends message via POST /messages/send
2. Message is saved to database with role=USER
3. Message is enqueued in `incoming-messages` queue
4. IncomingMessagesProcessor processes the message
5. Message is enqueued in `ai-processing` queue
6. AIProcessingProcessor generates AI response
7. AI response is saved with role=ASSISTANT
8. Response is enqueued in `outgoing-messages` queue
9. OutgoingMessagesProcessor sends response to appropriate channel
10. WebSocket gateway emits both messages to subscribed clients

## Real-time Updates

The MessagesGateway is injected into queue processors to emit real-time updates:
- When a user message is saved (IncomingMessagesProcessor)
- When an AI response is generated (AIProcessingProcessor)
- When message status changes (OutgoingMessagesProcessor)

## Security

All REST endpoints require JWT authentication. The module verifies that users can only access messages from conversations belonging to their chatbots.

WebSocket connections should also implement authentication (to be added in production).

## Related Modules

- **Conversations Module**: Manages conversation entities
- **Queues Module**: Processes messages asynchronously
- **AI Module**: Generates AI responses
- **Chatbots Module**: Provides chatbot configuration
