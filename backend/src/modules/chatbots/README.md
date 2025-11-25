# Chatbots Module

This module handles the creation, management, and configuration of chatbots for customers.

## Features

- ✅ Create chatbots with UUID generation
- ✅ Validate plan limits before chatbot creation
- ✅ Validate AI provider availability in customer's plan
- ✅ List chatbots filtered by customer
- ✅ Update chatbot configuration (name, description, aiProvider, aiModel, systemPrompt)
- ✅ Delete chatbots with cascade deletion of related records
- ✅ Get chatbot statistics (conversations, messages, channels)

## Endpoints

### POST /chatbots
Create a new chatbot for the authenticated customer.

**Authentication:** Required (JWT)

**Request Body:**
```json
{
  "name": "Customer Support Bot",
  "description": "A chatbot to handle customer support inquiries",
  "aiProvider": "openai",
  "aiModel": "gpt-4o",
  "aiConfig": {
    "temperature": 0.7,
    "maxTokens": 1000
  },
  "systemPrompt": "You are a helpful customer support assistant.",
  "knowledgeBaseId": "123e4567-e89b-12d3-a456-426614174000",
  "isActive": true
}
```

**Validations:**
- Checks if customer has reached chatbot limit in their plan
- Validates that the AI provider is allowed in the customer's plan
- Verifies knowledge base exists and belongs to customer (if provided)

**Response:** 201 Created
```json
{
  "id": "uuid",
  "customerId": "uuid",
  "name": "Customer Support Bot",
  "description": "A chatbot to handle customer support inquiries",
  "aiProvider": "openai",
  "aiModel": "gpt-4o",
  "aiConfig": { "temperature": 0.7, "maxTokens": 1000 },
  "systemPrompt": "You are a helpful customer support assistant.",
  "isActive": true,
  "knowledgeBaseId": "uuid",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "customer": { ... },
  "knowledgeBase": { ... }
}
```

### GET /chatbots
Get all chatbots for the authenticated customer.

**Authentication:** Required (JWT)

**Response:** 200 OK
```json
[
  {
    "id": "uuid",
    "customerId": "uuid",
    "name": "Customer Support Bot",
    "description": "A chatbot to handle customer support inquiries",
    "aiProvider": "openai",
    "aiModel": "gpt-4o",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "knowledgeBase": { ... },
    "widgetSettings": { ... },
    "whatsappCloudAccount": { ... },
    "whatsappQRSession": { ... },
    "_count": {
      "conversations": 10
    }
  }
]
```

### GET /chatbots/:id
Get a specific chatbot by ID.

**Authentication:** Required (JWT)

**Response:** 200 OK
```json
{
  "id": "uuid",
  "customerId": "uuid",
  "name": "Customer Support Bot",
  "description": "A chatbot to handle customer support inquiries",
  "aiProvider": "openai",
  "aiModel": "gpt-4o",
  "aiConfig": { "temperature": 0.7, "maxTokens": 1000 },
  "systemPrompt": "You are a helpful customer support assistant.",
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "customer": { ... },
  "knowledgeBase": { ... },
  "widgetSettings": { ... },
  "whatsappCloudAccount": { ... },
  "whatsappQRSession": { ... },
  "conversations": [ ... ],
  "_count": {
    "conversations": 10
  }
}
```

### PATCH /chatbots/:id
Update a chatbot's configuration.

**Authentication:** Required (JWT)

**Request Body:** (all fields optional)
```json
{
  "name": "Updated Bot Name",
  "description": "Updated description",
  "aiProvider": "anthropic",
  "aiModel": "claude-3-5-sonnet-20241022",
  "aiConfig": {
    "temperature": 0.8,
    "maxTokens": 2000
  },
  "systemPrompt": "Updated system prompt",
  "knowledgeBaseId": "new-uuid",
  "isActive": false
}
```

**Validations:**
- Verifies chatbot exists and belongs to customer
- Validates new AI provider is allowed in plan (if changed)
- Verifies new knowledge base exists and belongs to customer (if changed)

**Response:** 200 OK (same structure as GET /chatbots/:id)

### DELETE /chatbots/:id
Delete a chatbot.

**Authentication:** Required (JWT)

**Response:** 200 OK
```json
{
  "message": "Chatbot deleted successfully"
}
```

**Note:** Cascade deletion will remove:
- Widget settings
- WhatsApp Cloud accounts
- WhatsApp QR sessions
- Conversations and messages

### GET /chatbots/:id/stats
Get statistics for a specific chatbot.

**Authentication:** Required (JWT)

**Response:** 200 OK
```json
{
  "chatbotId": "uuid",
  "conversations": {
    "total": 100,
    "active": 25,
    "closed": 75
  },
  "messages": {
    "total": 500,
    "user": 250,
    "assistant": 250
  },
  "channels": {
    "WIDGET": 50,
    "WHATSAPP_CLOUD": 30,
    "WHATSAPP_QR": 20
  }
}
```

## Service Methods

### `create(customerId: string, createChatbotDto: CreateChatbotDto)`
Creates a new chatbot with plan limit validation.

### `findAll(customerId: string)`
Returns all chatbots for a specific customer.

### `findOne(id: string, customerId: string)`
Returns a single chatbot with detailed information.

### `update(id: string, customerId: string, updateChatbotDto: UpdateChatbotDto)`
Updates a chatbot's configuration.

### `remove(id: string, customerId: string)`
Deletes a chatbot and all related records.

### `getStats(id: string, customerId: string)`
Returns statistics for a chatbot.

## Dependencies

- **PrismaModule**: Database access
- **BillingModule**: Plan limit validation

## Security

- All endpoints require JWT authentication
- Chatbots are filtered by customer ID to ensure data isolation
- Plan limits are enforced before creation
- AI provider availability is validated against customer's plan

## Requirements Covered

- ✅ Requirement 2.1: Create chatbots up to plan limit
- ✅ Requirement 2.2: Generate unique UUID for each chatbot
- ✅ Requirement 2.3: Store chatbot configurations
- ✅ Requirement 2.4: List chatbots filtered by customer
- ✅ Requirement 2.5: Update and delete chatbots
- ✅ Requirement 15.2: REST endpoints for chatbot management
