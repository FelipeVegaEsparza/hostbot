import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL_TEST || process.env.DATABASE_URL,
    },
  },
});

export async function setupTestDatabase() {
  // Clean up database before tests
  await prisma.$transaction([
    prisma.message.deleteMany(),
    prisma.conversation.deleteMany(),
    prisma.webhookEvent.deleteMany(),
    prisma.usageLog.deleteMany(),
    prisma.billingEvent.deleteMany(),
    prisma.knowledgeItem.deleteMany(),
    prisma.knowledgeBase.deleteMany(),
    prisma.widgetSettings.deleteMany(),
    prisma.whatsAppQRSession.deleteMany(),
    prisma.whatsAppCloudAccount.deleteMany(),
    prisma.aPIKey.deleteMany(),
    prisma.chatbot.deleteMany(),
    prisma.subscription.deleteMany(),
    prisma.customer.deleteMany(),
    prisma.user.deleteMany(),
    prisma.plan.deleteMany(),
  ]);
}

export async function teardownTestDatabase() {
  await prisma.$disconnect();
}

export { prisma };
