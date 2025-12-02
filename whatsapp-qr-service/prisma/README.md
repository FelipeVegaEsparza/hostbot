# Prisma Database Schema

This directory contains the Prisma schema and migrations for the SaaS Chatbot platform.

## Schema Overview

The database schema includes the following main domains:

### User Management
- `User` - System users with authentication
- `Customer` - Customer accounts linked to users
- `Role` enum - USER, ADMIN

### Billing & Subscriptions
- `Plan` - Subscription plans with limits
- `Subscription` - Customer subscriptions
- `Invoice` - Payment invoices
- `PaymentMethodStored` - Stored payment methods
- `PaymentTransaction` - Payment transaction records
- `ExchangeRate` - Currency exchange rates
- `SubscriptionHistory` - Subscription change history
- `PaymentWebhookLog` - Payment gateway webhook logs

### Chatbots
- `Chatbot` - Chatbot configurations
- `WidgetSettings` - Widget customization settings

### Conversations & Messages
- `Conversation` - Chat conversations
- `Message` - Individual messages
- `Channel` enum - WIDGET, WHATSAPP_CLOUD, WHATSAPP_QR
- `ConversationStatus` enum - ACTIVE, CLOSED, ARCHIVED
- `MessageRole` enum - USER, ASSISTANT, SYSTEM
- `DeliveryStatus` enum - PENDING, SENT, DELIVERED, READ, FAILED

### Knowledge Base
- `KnowledgeBase` - Knowledge base containers
- `KnowledgeItem` - Knowledge base items with full-text search

### WhatsApp Integration
- `WhatsAppCloudAccount` - WhatsApp Cloud API credentials
- `WhatsAppQRSession` - WhatsApp QR session management
- `QRSessionStatus` enum - DISCONNECTED, CONNECTING, QR_READY, CONNECTED

### Webhooks & API
- `WebhookEvent` - Outgoing webhook events
- `APIKey` - API key management
- `WebhookStatus` enum - PENDING, SENT, FAILED

### AI Providers
- `AIProviderConfig` - AI provider configurations

### Usage & Billing
- `UsageLog` - Usage tracking
- `BillingEvent` - Billing events
- `UsageType` enum - MESSAGE, AI_REQUEST, WHATSAPP_MESSAGE
- `BillingStatus` enum - PENDING, COMPLETED, FAILED

## Commands

### Generate Prisma Client
```bash
npm run prisma:generate
```

### Create a Migration
```bash
npm run prisma:migrate
```

### Apply Migrations
```bash
npx prisma migrate deploy
```

### Open Prisma Studio (Database GUI)
```bash
npm run prisma:studio
```

### Reset Database (Development Only)
```bash
npx prisma migrate reset
```

## Database Setup

1. Ensure MySQL is running and accessible
2. Update the `DATABASE_URL` in `.env` file
3. Run migrations:
   ```bash
   npm run prisma:migrate
   ```

## Migration Workflow

1. Make changes to `schema.prisma`
2. Generate a migration:
   ```bash
   npx prisma migrate dev --name description_of_changes
   ```
3. The migration will be created in `prisma/migrations/`
4. Prisma Client will be automatically regenerated

## Important Notes

- **Full-Text Search**: The `KnowledgeItem` model uses MySQL full-text search on `title` and `content` fields
- **Indexes**: Critical fields have indexes for query performance
- **Cascading Deletes**: Most relations use `onDelete: Cascade` for data integrity
- **JSON Fields**: Several models use JSON fields for flexible configuration storage
- **Enums**: Type-safe enums are used throughout the schema

## Preview Features

The schema uses the following Prisma preview features:
- `fullTextIndex` - For full-text search on KnowledgeItem
- `fullTextSearch` - For full-text search queries

## Connection Pooling

Prisma automatically manages connection pooling. Default settings:
- Connection limit: 10 (configurable via `connection_limit` in DATABASE_URL)
- Pool timeout: 10 seconds

For production, consider adjusting these values based on your load.
