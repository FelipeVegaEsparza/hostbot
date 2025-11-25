#!/usr/bin/env ts-node

/**
 * Script to get a test chatbot ID from the database
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Fetching chatbots from database...\n');
    
    const chatbots = await prisma.chatbot.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        isActive: true,
        aiProvider: true,
        aiModel: true,
      },
      take: 5,
    });
    
    if (chatbots.length === 0) {
      console.log('❌ No active chatbots found in the database');
      console.log('\nPlease create a chatbot first:');
      console.log('1. Start the backend: npm run start:dev');
      console.log('2. Access the admin panel');
      console.log('3. Create a new chatbot');
      process.exit(1);
    }
    
    console.log(`Found ${chatbots.length} active chatbot(s):\n`);
    
    chatbots.forEach((chatbot, index) => {
      console.log(`${index + 1}. ${chatbot.name}`);
      console.log(`   ID: ${chatbot.id}`);
      console.log(`   AI Provider: ${chatbot.aiProvider || 'Not configured'}`);
      console.log(`   AI Model: ${chatbot.aiModel || 'Not configured'}`);
      console.log('');
    });
    
    const firstChatbot = chatbots[0];
    console.log('✓ Recommended test chatbot:');
    console.log(`  export TEST_CHATBOT_ID="${firstChatbot.id}"`);
    console.log('');
    console.log('Or for PowerShell:');
    console.log(`  $env:TEST_CHATBOT_ID="${firstChatbot.id}"`);
    
  } catch (error: any) {
    console.error('❌ Error fetching chatbots:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
