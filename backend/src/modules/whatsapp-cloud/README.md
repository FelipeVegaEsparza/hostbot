# WhatsApp Cloud API Module

This module handles integration with WhatsApp Business Cloud API (Meta's official API).

## Features

- ✅ Webhook verification and signature validation
- ✅ Incoming message processing
- ✅ Outgoing message sending via queue
- ✅ Account credential management
- ✅ Automatic conversation creation
- ✅ Message status tracking
- ✅ Webhook event logging
- ✅ Exponential retry with 3 attempts

## Setup

### 1. Environment Variables

Add to your `.env` file:

```bash
# WhatsApp Cloud API
WHATSAPP_APP_SECRET="your-whatsapp-app-secret"
WHATSAPP_VERIFY_TOKEN="your-webhook-verify-token"
```

### 2. Meta Developer Setup

1. Create a Meta App at https://developers.facebook.com
2. Add WhatsApp product to your app
3. Get your App Secret from App Settings
4. Configure webhook URL: `https://your-domain.com/whatsapp-cloud/webhook`
5. Set webhook verify token (must match `WHATSAPP_VERIFY_TOKEN`)
6. Subscribe to `messages` webhook field

### 3. Database Setup

The module uses the following Prisma models:
- `WhatsAppCloudAccount` - Stores credentials per chatbot
- `Conversation` - Tracks conversations
- `Message` - Stores messages
- `WebhookEvent` - Logs webhook events

## API Endpoints

### GET /whatsapp-cloud/webhook
Webhook verification endpoint (called by Meta during setup)

**Query Parameters:**
- `hub.mode` - Should be "subscribe"
- `hub.verify_token` - Your verify token
- `hub.challenge` - Challenge string to return

**Response:** Returns the challenge string if verification succeeds

### POST /whatsapp-cloud/webhook
Receives incoming messages and status updates from WhatsApp

**Headers:**
- `x-hub-signature-256` - Webhook signature for validation

**Body:** WhatsApp webhook event payload

**Response:** `{ success: boolean }`

### POST /whatsapp-cloud/send
Send a message via WhatsApp Cloud API

**Body:**
```json
{
  "chatbotId": "uuid",
  "to": "1234567890",
  "message": "Hello from chatbot!",
  "metadata": {}
}
```

**Response:** `{ success: true, message: "Message enqueued for sending" }`

### POST /whatsapp-cloud/account
Create or update WhatsApp Cloud account for a chatbot

**Body:**
```json
{
  "chatbotId": "uuid",
  "phoneNumberId": "123456789",
  "accessToken": "your-access-token",
  "webhookVerifyToken": "your-verify-token"
}
```

**Response:** `{ success: true, data: {...} }`

### GET /whatsapp-cloud/account/:chatbotId
Get WhatsApp Cloud account details

**Response:** `{ success: true, data: {...} }`

### POST /whatsapp-cloud/account/:chatbotId/deactivate
Deactivate WhatsApp Cloud account

**Response:** `{ success: true, data: {...} }`

## Message Flow

### Incoming Messages

1. Meta sends webhook POST to `/whatsapp-cloud/webhook`
2. Signature is validated using `WHATSAPP_APP_SECRET`
3. Message is saved to database
4. Conversation is created/updated
5. Message is enqueued in `incoming-messages` queue
6. AI processing is triggered
7. Response is generated and sent back

### Outgoing Messages

1. Client calls `/whatsapp-cloud/send`
2. Message is enqueued in `whatsapp-cloud-send` queue
3. Processor sends message via Meta API
4. Retry with exponential backoff (3 attempts)
5. Message status is updated in database
6. Usage is logged

## Security

### Webhook Signature Validation

All incoming webhooks are validated using HMAC SHA256:

```typescript
const expectedSignature = crypto
  .createHmac('sha256', WHATSAPP_APP_SECRET)
  .update(payload)
  .digest('hex');
```

### Access Token Storage

Access tokens are stored encrypted in the database per chatbot.

## Error Handling

- Invalid signatures return 400 Bad Request
- Missing accounts return 404 Not Found
- Failed sends are retried 3 times with exponential backoff
- All errors are logged with context

## Queue Configuration

### whatsapp-cloud-send Queue

- **Attempts:** 3
- **Backoff:** Exponential starting at 2000ms
- **Priority:** Based on customer plan

## Usage Example

```typescript
// Create account
await whatsappCloudService.createOrUpdateAccount({
  chatbotId: 'chatbot-uuid',
  phoneNumberId: '123456789',
  accessToken: 'EAAxxxx...',
  webhookVerifyToken: 'my-verify-token',
});

// Send message
await whatsappCloudService.sendMessage({
  chatbotId: 'chatbot-uuid',
  to: '1234567890',
  message: 'Hello!',
});
```

## Testing

### Test Webhook Verification

```bash
curl "http://localhost:3000/whatsapp-cloud/webhook?hub.mode=subscribe&hub.verify_token=your-verify-token&hub.challenge=test123"
```

### Test Incoming Message

```bash
curl -X POST http://localhost:3000/whatsapp-cloud/webhook \
  -H "Content-Type: application/json" \
  -H "x-hub-signature-256: sha256=..." \
  -d '{
    "object": "whatsapp_business_account",
    "entry": [{
      "id": "123",
      "changes": [{
        "value": {
          "messaging_product": "whatsapp",
          "metadata": {
            "phone_number_id": "123456789"
          },
          "messages": [{
            "from": "1234567890",
            "id": "msg_123",
            "timestamp": "1234567890",
            "text": {
              "body": "Hello"
            },
            "type": "text"
          }]
        },
        "field": "messages"
      }]
    }]
  }'
```

## Monitoring

- All webhook events are logged to `WebhookEvent` table
- Message delivery status tracked in `Message.deliveryStatus`
- Usage logged in `UsageLog` table
- Errors logged with Winston

## Troubleshooting

### Webhook not receiving messages

1. Check webhook URL is publicly accessible
2. Verify webhook is subscribed to `messages` field
3. Check `WHATSAPP_APP_SECRET` matches Meta app
4. Review webhook event logs in database

### Messages not sending

1. Check `WhatsAppCloudAccount` is active
2. Verify access token is valid
3. Check phone number format (digits only)
4. Review queue processor logs
5. Check retry attempts in failed jobs

### Signature validation failing

1. Ensure `WHATSAPP_APP_SECRET` is correct
2. Check payload is not modified before validation
3. Verify header name is `x-hub-signature-256`

## References

- [WhatsApp Cloud API Documentation](https://developers.facebook.com/docs/whatsapp/cloud-api)
- [Webhook Setup Guide](https://developers.facebook.com/docs/whatsapp/cloud-api/guides/set-up-webhooks)
- [Message Templates](https://developers.facebook.com/docs/whatsapp/cloud-api/guides/send-message-templates)
