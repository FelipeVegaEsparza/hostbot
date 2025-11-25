# Conversations Module

This module handles conversation management for the chatbot platform.

## Features

- Create and manage conversations between chatbots and external users
- Support for multiple channels (WIDGET, WHATSAPP_CLOUD, WHATSAPP_QR)
- Automatic conversation creation or retrieval
- Pagination support for conversation listings
- Ownership verification for security
- Automatic lastMessageAt timestamp updates

## Endpoints

### POST /conversations
Create a new conversation.

**Request Body:**
```json
{
  "chatbotId": "uuid",
  "externalUserId": "+56912345678",
  "channel": "WIDGET"
}
```

### GET /conversations
Get all conversations for the authenticated customer with pagination.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

### GET /conversations/:id
Get a specific conversation by ID.

### PATCH /conversations/:id
Update a conversation (e.g., change status).

**Request Body:**
```json
{
  "status": "CLOSED"
}
```

### DELETE /conversations/:id
Delete a conversation.

## Service Methods

### `create(createConversationDto)`
Creates a new conversation. If a conversation already exists for the same chatbot, external user, and channel, returns the existing one.

### `findOrCreate(chatbotId, externalUserId, channel)`
Finds an existing active conversation or creates a new one. Used internally by the messages module.

### `findAllByCustomer(customerId, page, limit)`
Returns paginated list of conversations for a customer.

### `findOne(id, customerId)`
Gets a single conversation with ownership verification.

### `update(id, customerId, updateConversationDto)`
Updates a conversation with ownership verification.

### `updateLastMessageAt(conversationId)`
Updates the lastMessageAt timestamp. Called automatically when messages are created.

### `remove(id, customerId)`
Deletes a conversation with ownership verification.

## Security

All endpoints require JWT authentication. The module verifies that users can only access conversations belonging to their chatbots.

## Related Modules

- **Messages Module**: Creates and manages messages within conversations
- **Chatbots Module**: Provides the chatbot entities that conversations belong to
- **Queues Module**: Processes incoming messages asynchronously
