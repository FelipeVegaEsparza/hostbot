# WhatsApp QR Module

This module handles the integration with the WhatsApp QR microservice (Baileys) for connecting WhatsApp Business accounts via QR code scanning.

## Overview

The WhatsApp QR module provides endpoints to:
- Initialize WhatsApp sessions via QR code
- Retrieve QR codes for scanning
- Check session connection status
- Send messages through WhatsApp QR sessions
- Disconnect sessions
- Receive webhooks from the microservice
- Process incoming messages from WhatsApp

## Architecture

The module communicates with the WhatsApp QR microservice (Node.js + Baileys) which handles the actual WhatsApp connection. The backend acts as an orchestrator that:
1. Manages session state in the database
2. Enqueues messages for sending
3. Processes incoming messages
4. Handles webhooks from the microservice

## Endpoints

### POST /whatsapp-qr/init
Initialize a new WhatsApp QR session for a chatbot.

**Request Body:**
```json
{
  "chatbotId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "sessionId": "session_uuid_timestamp",
  "status": "CONNECTING"
}
```

### GET /whatsapp-qr/qr-code/:sessionId
Get the QR code for a session to scan with WhatsApp.

**Response:**
```json
{
  "success": true,
  "sessionId": "session_uuid_timestamp",
  "qrCode": "data:image/png;base64,...",
  "status": "QR_READY"
}
```

### GET /whatsapp-qr/status/:sessionId
Get the current status of a WhatsApp QR session.

**Response:**
```json
{
  "success": true,
  "session": {
    "sessionId": "session_uuid_timestamp",
    "chatbotId": "uuid",
    "status": "CONNECTED",
    "lastConnectedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### POST /whatsapp-qr/send
Send a message via WhatsApp QR. The message is enqueued for asynchronous processing.

**Request Body:**
```json
{
  "chatbotId": "uuid",
  "to": "5491112345678",
  "message": "Hello from chatbot!",
  "metadata": {}
}
```

**Response:**
```json
{
  "success": true,
  "message": "Message enqueued for sending"
}
```

### POST /whatsapp-qr/disconnect
Disconnect a WhatsApp QR session.

**Request Body:**
```json
{
  "chatbotId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "sessionId": "session_uuid_timestamp",
  "status": "DISCONNECTED"
}
```

### POST /whatsapp-qr/webhook
Internal webhook endpoint to receive notifications from the microservice.

**Request Body:**
```json
{
  "type": "qr" | "connected" | "disconnected",
  "sessionId": "session_uuid_timestamp",
  "data": {}
}
```

### POST /whatsapp-qr/incoming
Internal endpoint to receive incoming messages from the microservice.

**Request Body:**
```json
{
  "sessionId": "session_uuid_timestamp",
  "from": "5491112345678",
  "message": "Hello!",
  "messageId": "whatsapp_message_id",
  "timestamp": 1234567890
}
```

### GET /whatsapp-qr/session/:chatbotId
Get session information by chatbot ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "chatbotId": "uuid",
    "sessionId": "session_uuid_timestamp",
    "status": "CONNECTED",
    "lastConnectedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

## Session Status Flow

1. **DISCONNECTED** - Initial state, no connection
2. **CONNECTING** - Session initialization in progress
3. **QR_READY** - QR code generated and ready to scan
4. **CONNECTED** - WhatsApp successfully connected
5. **DISCONNECTED** - Session disconnected

## Message Flow

### Outgoing Messages
1. Client calls POST /whatsapp-qr/send
2. Message is saved to database with status PENDING
3. Message is enqueued in `whatsapp-qr-send` queue
4. Queue processor calls microservice to send message
5. Message status updated to SENT/DELIVERED/FAILED

### Incoming Messages
1. Microservice receives message from WhatsApp
2. Microservice calls POST /whatsapp-qr/incoming
3. Message is saved to database
4. Conversation is created/updated
5. Message is enqueued in `incoming-messages` queue for AI processing

## Environment Variables

- `WHATSAPP_QR_SERVICE_URL` - URL of the WhatsApp QR microservice (default: http://whatsapp-qr-service:3001)

## Database Models

### WhatsAppQRSession
- `id` - UUID
- `chatbotId` - Foreign key to Chatbot (unique)
- `sessionId` - Unique session identifier
- `status` - QRSessionStatus enum
- `qrCode` - Base64 encoded QR code (nullable)
- `lastConnectedAt` - Last connection timestamp
- `createdAt` - Creation timestamp
- `updatedAt` - Update timestamp

## Queue Integration

### whatsapp-qr-send Queue
Processes outgoing messages to be sent via WhatsApp QR.

**Job Data:**
```typescript
{
  sessionId: string;
  to: string;
  message: string;
  messageId: string;
  conversationId: string;
}
```

### incoming-messages Queue
Processes incoming messages for AI response generation.

**Job Data:**
```typescript
{
  conversationId: string;
  messageId: string;
  content: string;
  chatbotId: string;
  externalUserId: string;
  channel: 'WHATSAPP_QR';
  metadata: any;
}
```

## Error Handling

- **NotFoundException** - Session or chatbot not found
- **BadRequestException** - Invalid request or session not connected
- **Axios errors** - Microservice communication failures

All errors are logged and appropriate HTTP status codes are returned.

## Dependencies

- `@nestjs/common` - NestJS core
- `@nestjs/bullmq` - Queue management
- `axios` - HTTP client for microservice communication
- `class-validator` - DTO validation
- `PrismaService` - Database access

## Related Modules

- **WhatsApp Cloud Module** - Alternative WhatsApp integration using official API
- **Messages Module** - Message processing and storage
- **Conversations Module** - Conversation management
- **Queues Module** - Queue processors
