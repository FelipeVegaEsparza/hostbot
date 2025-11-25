# Prisma Database Setup Guide

This guide explains how to set up and run the database migrations for the SaaS Chatbot platform.

## Prerequisites

- MySQL 8.0 or higher running (via Docker or local installation)
- Node.js 20+ installed
- npm dependencies installed (`npm install`)

## Quick Start

### 1. Start MySQL (using Docker Compose)

```bash
# From the project root directory
docker-compose up -d mysql
```

This will start MySQL on `localhost:3306` with the following credentials:
- Database: `chatbot_saas`
- User: `chatbot_user`
- Password: `chatbot_password`

### 2. Verify Database Connection

Ensure the `DATABASE_URL` in `backend/.env` matches your MySQL configuration:

```env
DATABASE_URL="mysql://chatbot_user:chatbot_password@localhost:3306/chatbot_saas"
```

### 3. Generate Prisma Client

```bash
cd backend
npm run prisma:generate
```

This generates the Prisma Client based on your schema.

### 4. Create and Apply Initial Migration

```bash
npm run prisma:migrate
```

When prompted, enter a migration name like: `initial_schema`

This will:
- Create a new migration in `prisma/migrations/`
- Apply the migration to your database
- Regenerate the Prisma Client

### 5. Verify Migration

You can verify the migration was successful by:

**Option A: Using Prisma Studio**
```bash
npm run prisma:studio
```

This opens a web interface at `http://localhost:5555` where you can browse your database.

**Option B: Using MySQL CLI**
```bash
docker exec -it chatbot-mysql mysql -u chatbot_user -pchatbot_password chatbot_saas
```

Then run:
```sql
SHOW TABLES;
```

You should see all the tables from the schema.

## Database Schema Overview

The schema includes 30+ tables organized into these domains:

### Core Tables
- **User** - System users
- **Customer** - Customer accounts
- **Plan** - Subscription plans
- **Subscription** - Active subscriptions

### Chatbot Tables
- **Chatbot** - Chatbot configurations
- **Conversation** - Chat conversations
- **Message** - Individual messages
- **WidgetSettings** - Widget customization

### Knowledge Base
- **KnowledgeBase** - Knowledge containers
- **KnowledgeItem** - Knowledge items (with full-text search)

### WhatsApp Integration
- **WhatsAppCloudAccount** - Cloud API credentials
- **WhatsAppQRSession** - QR session management

### Billing & Payments
- **Invoice** - Payment invoices
- **PaymentTransaction** - Transaction records
- **PaymentMethodStored** - Stored payment methods
- **ExchangeRate** - Currency rates
- **SubscriptionHistory** - Subscription changes
- **PaymentWebhookLog** - Payment webhooks

### System Tables
- **APIKey** - API key management
- **WebhookEvent** - Outgoing webhooks
- **AIProviderConfig** - AI provider configs
- **UsageLog** - Usage tracking
- **BillingEvent** - Billing events

## Common Commands

### Create a New Migration
```bash
npx prisma migrate dev --name your_migration_name
```

### Apply Migrations (Production)
```bash
npx prisma migrate deploy
```

### Reset Database (Development Only - DESTRUCTIVE)
```bash
npx prisma migrate reset
```

This will:
1. Drop the database
2. Create a new database
3. Apply all migrations
4. Run seed script (if configured)

### View Migration Status
```bash
npx prisma migrate status
```

### Generate Prisma Client Only
```bash
npx prisma generate
```

### Format Schema File
```bash
npx prisma format
```

## Troubleshooting

### Error: "Can't reach database server"

**Solution**: Ensure MySQL is running and accessible:
```bash
docker-compose ps mysql
```

If not running:
```bash
docker-compose up -d mysql
```

### Error: "Database does not exist"

**Solution**: Create the database manually:
```bash
docker exec -it chatbot-mysql mysql -u root -prootpassword -e "CREATE DATABASE IF NOT EXISTS chatbot_saas;"
```

### Error: "Authentication failed"

**Solution**: Verify credentials in `.env` match docker-compose.yml

### Migration Conflicts

If you have migration conflicts:

1. Check migration status:
   ```bash
   npx prisma migrate status
   ```

2. Resolve conflicts by either:
   - Applying pending migrations: `npx prisma migrate deploy`
   - Resetting (dev only): `npx prisma migrate reset`

### Full-Text Search Not Working

Ensure your MySQL version supports full-text search (MySQL 5.6+) and that the `fullTextIndex` preview feature is enabled in `schema.prisma`:

```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["fullTextIndex", "fullTextSearch"]
}
```

## Production Deployment

For production deployments:

1. **Never use `migrate dev`** - Use `migrate deploy` instead
2. **Backup your database** before running migrations
3. **Test migrations** in a staging environment first
4. **Use connection pooling** - Configure in DATABASE_URL:
   ```
   DATABASE_URL="mysql://user:pass@host:3306/db?connection_limit=10&pool_timeout=10"
   ```

### Production Migration Workflow

```bash
# 1. Backup database
mysqldump -u user -p chatbot_saas > backup.sql

# 2. Apply migrations
npx prisma migrate deploy

# 3. Verify
npx prisma migrate status
```

## Seeding Data (Optional)

To seed initial data, create a `prisma/seed.ts` file:

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create default plans
  await prisma.plan.createMany({
    data: [
      {
        name: 'Free',
        price: 0,
        currency: 'USD',
        maxChatbots: 1,
        maxMessagesPerMonth: 100,
        aiProviders: ['openai'],
        features: { support: 'community' },
      },
      {
        name: 'Pro',
        price: 29.99,
        currency: 'USD',
        maxChatbots: 5,
        maxMessagesPerMonth: 10000,
        aiProviders: ['openai', 'anthropic', 'groq'],
        features: { support: 'email' },
      },
    ],
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

Add to `package.json`:
```json
{
  "prisma": {
    "seed": "ts-node prisma/seed.ts"
  }
}
```

Run seed:
```bash
npx prisma db seed
```

## Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Prisma Migrate Guide](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [MySQL Full-Text Search](https://dev.mysql.com/doc/refman/8.0/en/fulltext-search.html)
