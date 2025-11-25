import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // ============================================
  // Create Admin User
  // ============================================
  console.log('\n👤 Creating admin user...');
  
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@chatbot.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!';
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      password: hashedPassword,
      name: 'System Administrator',
      role: 'ADMIN',
      customer: {
        create: {
          companyName: 'System Admin',
        },
      },
    },
    include: {
      customer: true,
    },
  });

  console.log(`✅ Admin user created/verified:`);
  console.log(`   Email: ${adminEmail}`);
  console.log(`   Password: ${adminPassword}`);
  console.log(`   ⚠️  IMPORTANT: Change this password immediately after first login!`);

  // ============================================
  // Create Default Plans
  // ============================================
  console.log('\n💳 Creating default plans...');

  const plans = [
    {
      name: 'Free',
      price: 0,
      currency: 'USD' as const,
      maxChatbots: 1,
      maxMessagesPerMonth: 100,
      aiProviders: ['openai'],
      features: {
        support: 'community',
        knowledgeBase: false,
        whatsappIntegration: false,
        customBranding: false,
      },
    },
    {
      name: 'Pro',
      price: 29.99,
      currency: 'USD' as const,
      maxChatbots: 5,
      maxMessagesPerMonth: 10000,
      aiProviders: ['openai', 'anthropic', 'groq'],
      features: {
        support: 'email',
        knowledgeBase: true,
        whatsappIntegration: true,
        customBranding: true,
      },
    },
    {
      name: 'Enterprise',
      price: 99.99,
      currency: 'USD' as const,
      maxChatbots: -1, // unlimited
      maxMessagesPerMonth: -1, // unlimited
      aiProviders: ['openai', 'anthropic', 'groq', 'cohere'],
      features: {
        support: 'priority',
        knowledgeBase: true,
        whatsappIntegration: true,
        customBranding: true,
        whiteLabel: true,
        dedicatedSupport: true,
      },
    },
  ];

  for (const planData of plans) {
    // Check if plan already exists
    const existingPlan = await prisma.plan.findFirst({
      where: { name: planData.name },
    });

    if (existingPlan) {
      console.log(`✅ Plan already exists: ${existingPlan.name} ($${existingPlan.price})`);
    } else {
      const plan = await prisma.plan.create({
        data: planData,
      });
      console.log(`✅ Plan created: ${plan.name} ($${plan.price})`);
    }
  }

  // ============================================
  // Create Admin Subscription (Optional)
  // ============================================
  console.log('\n🔄 Checking admin subscription...');

  const adminSubscription = await prisma.subscription.findUnique({
    where: { customerId: adminUser.customer!.id },
  });

  if (!adminSubscription) {
    const enterprisePlan = await prisma.plan.findFirst({
      where: { name: 'Enterprise' },
    });

    if (enterprisePlan) {
      const now = new Date();
      const periodEnd = new Date(now);
      periodEnd.setFullYear(periodEnd.getFullYear() + 10); // 10 years for admin

      await prisma.subscription.create({
        data: {
          customerId: adminUser.customer!.id,
          planId: enterprisePlan.id,
          status: 'ACTIVE',
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
        },
      });
      console.log('✅ Admin subscription created (Enterprise plan)');
    }
  } else {
    console.log('✅ Admin subscription already exists');
  }

  console.log('\n✨ Database seeding completed successfully!');
  console.log('\n📝 Summary:');
  console.log(`   - Admin user: ${adminEmail}`);
  console.log(`   - Plans created: ${plans.length}`);
  console.log(`   - Admin subscription: Active`);
  console.log('\n🚀 You can now login with the admin credentials');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
