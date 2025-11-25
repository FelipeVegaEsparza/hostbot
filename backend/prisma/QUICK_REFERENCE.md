# Prisma Quick Reference

## Schema Structure

### 📊 Total Models: 30

#### User Management (2)
- `User` - System users
- `Customer` - Customer accounts

#### Billing & Subscriptions (9)
- `Plan` - Subscription plans
- `Subscription` - Active subscriptions
- `Invoice` - Payment invoices
- `PaymentMethodStored` - Stored payment methods
- `PaymentTransaction` - Transaction records
- `ExchangeRate` - Currency exchange rates
- `SubscriptionHistory` - Subscription changes
- `PaymentWebhookLog` - Payment webhooks

#### Chatbots (2)
- `Chatbot` - Chatbot configurations
- `WidgetSettings` - Widget customization

#### Conversations (2)
- `Conversation` - Chat conversations
- `Message` - Individual messages

#### Knowledge Base (2)
- `KnowledgeBase` - Knowledge containers
- `KnowledgeItem` - Knowledge items (full-text search)

#### WhatsApp (2)
- `WhatsAppCloudAccount` - Cloud API credentials
- `WhatsAppQRSession` - QR session management

#### System (4)
- `WebhookEvent` - Outgoing webhooks
- `APIKey` - API key management
- `AIProviderConfig` - AI provider configs
- `UsageLog` - Usage tracking
- `BillingEvent` - Billing events

### 📋 Total Enums: 13

1. `Role` - USER, ADMIN
2. `SubscriptionStatus` - ACTIVE, CANCELLED, EXPIRED, SUSPENDED
3. `Currency` - USD, CLP
4. `InvoiceStatus` - PENDING, PAID, FAILED, REFUNDED, CANCELLED
5. `PaymentMethod` - CREDIT_CARD, DEBIT_CARD, PAYPAL, BANK_TRANSFER, WEBPAY, KHIPU
6. `PaymentTransactionStatus` - PENDING, PROCESSING, COMPLETED, FAILED, REFUNDED, CANCELLED
7. `SubscriptionAction` - CREATED, UPGRADED, DOWNGRADED, RENEWED, CANCELLED, SUSPENDED, REACTIVATED
8. `Channel` - WIDGET, WHATSAPP_CLOUD, WHATSAPP_QR
9. `ConversationStatus` - ACTIVE, CLOSED, ARCHIVED
10. `MessageRole` - USER, ASSISTANT, SYSTEM
11. `DeliveryStatus` - PENDING, SENT, DELIVERED, READ, FAILED
12. `QRSessionStatus` - DISCONNECTED, CONNECTING, QR_READY, CONNECTED
13. `WebhookStatus` - PENDING, SENT, FAILED
14. `UsageType` - MESSAGE, AI_REQUEST, WHATSAPP_MESSAGE
15. `BillingStatus` - PENDING, COMPLETED, FAILED

## Key Features

### ✅ Implemented Features

1. **Full-Text Search** on `KnowledgeItem` (title, content)
2. **Cascading Deletes** for data integrity
3. **Comprehensive Indexes** for query performance
4. **JSON Fields** for flexible configuration
5. **Type-Safe Enums** throughout
6. **Timestamps** (createdAt, updatedAt) on all models
7. **UUID Primary Keys** for all models
8. **Foreign Key Relations** properly defined

### 🔍 Indexed Fields

- User: `email`
- Customer: `userId`
- Subscription: `customerId`, `planId`, `status`
- Invoice: `customerId`, `invoiceNumber`, `status`, `createdAt`
- Chatbot: `customerId`, `knowledgeBaseId`, `isActive`
- Conversation: `chatbotId`, `externalUserId`, `lastMessageAt`, `channel`
- Message: `conversationId`, `createdAt`, `role`
- KnowledgeItem: `knowledgeBaseId`, full-text on `title` and `content`
- WhatsAppCloudAccount: `chatbotId`, `phoneNumberId`
- WhatsAppQRSession: `chatbotId`, `sessionId`, `status`
- WebhookEvent: `status`, `createdAt`, `event`
- APIKey: `customerId`, `key`, `isActive`
- UsageLog: `customerId`, `createdAt`, `type`
- BillingEvent: `customerId`, `createdAt`, `status`

## Common Queries

### Create User with Customer
```typescript
await prisma.user.create({
  data: {
    email: 'user@example.com',
    password: 'hashed_password',
    customer: {
      create: {
        companyName: 'Company Name',
      },
    },
  },
  include: { customer: true },
});
```

### Create Chatbot with Widget
```typescript
await prisma.chatbot.create({
  data: {
    customerId: 'customer-id',
    name: 'My Bot',
    aiProvider: 'openai',
    aiModel: 'gpt-4',
    aiConfig: { temperature: 0.7 },
    widgetSettings: {
      create: {
        theme: 'light',
        primaryColor: '#3B82F6',
      },
    },
  },
  include: { widgetSettings: true },
});
```

### Full-Text Search
```typescript
await prisma.knowledgeItem.findMany({
  where: {
    knowledgeBaseId: 'kb-id',
    OR: [
      { title: { search: 'query' } },
      { content: { search: 'query' } },
    ],
  },
});
```

### Get Conversations with Pagination
```typescript
const [conversations, total] = await Promise.all([
  prisma.conversation.findMany({
    where: { chatbotId: 'bot-id' },
    include: {
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
    orderBy: { lastMessageAt: 'desc' },
    skip: (page - 1) * limit,
    take: limit,
  }),
  prisma.conversation.count({
    where: { chatbotId: 'bot-id' },
  }),
]);
```

### Track Usage
```typescript
await prisma.usageLog.create({
  data: {
    customerId: 'customer-id',
    type: 'MESSAGE',
    quantity: 1,
  },
});
```

### Create Invoice with Transaction
```typescript
await prisma.$transaction(async (tx) => {
  const invoice = await tx.invoice.create({
    data: {
      invoiceNumber: `INV-${Date.now()}`,
      customerId: 'customer-id',
      amount: 29.99,
      currency: 'USD',
      status: 'PENDING',
      paymentMethod: 'CREDIT_CARD',
      paymentProvider: 'paypal',
      dueDate: new Date(),
    },
  });

  const transaction = await tx.paymentTransaction.create({
    data: {
      customerId: 'customer-id',
      invoiceId: invoice.id,
      amount: 29.99,
      currency: 'USD',
      status: 'PENDING',
      provider: 'paypal',
      paymentMethod: 'CREDIT_CARD',
    },
  });

  return { invoice, transaction };
});
```

## PrismaService Usage

### Inject in Service
```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class MyService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.myModel.findMany();
  }
}
```

### Available Methods
- `findUnique()` - Find single record by unique field
- `findFirst()` - Find first matching record
- `findMany()` - Find multiple records
- `create()` - Create new record
- `createMany()` - Create multiple records
- `update()` - Update existing record
- `updateMany()` - Update multiple records
- `upsert()` - Update or create
- `delete()` - Delete record
- `deleteMany()` - Delete multiple records
- `count()` - Count records
- `aggregate()` - Aggregate data
- `groupBy()` - Group and aggregate

### Transactions
```typescript
await prisma.$transaction(async (tx) => {
  // All operations here are atomic
  await tx.model1.create({ data: {} });
  await tx.model2.update({ where: {}, data: {} });
});
```

## Migration Commands

```bash
# Generate Prisma Client
npm run prisma:generate

# Create migration (dev)
npm run prisma:migrate

# Apply migrations (production)
npx prisma migrate deploy

# View migration status
npx prisma migrate status

# Reset database (dev only)
npx prisma migrate reset

# Open Prisma Studio
npm run prisma:studio
```

## Environment Variables

```env
DATABASE_URL="mysql://user:password@localhost:3306/database"
```

## Tips

1. **Always use transactions** for operations that modify multiple tables
2. **Use include/select** to optimize queries and avoid N+1 problems
3. **Add indexes** to fields used in WHERE clauses
4. **Use pagination** for large result sets
5. **Leverage full-text search** for knowledge base queries
6. **Use soft deletes** (isActive flag) instead of hard deletes when needed
7. **Track usage** for billing and analytics
8. **Validate data** before database operations
9. **Use enums** for type safety
10. **Test migrations** in staging before production
