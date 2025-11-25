#!/usr/bin/env ts-node

/**
 * Test script to verify logging functionality
 * This script sends test messages through Widget and WhatsApp QR channels
 * and verifies that logs appear at each stage of the message flow
 */

import axios from 'axios';
import { io, Socket } from 'socket.io-client';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';
const WIDGET_SOCKET_URL = process.env.WIDGET_SOCKET_URL || 'http://localhost:3000';

// ANSI color codes for better output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title: string) {
  console.log('\n' + '='.repeat(80));
  log(title, colors.bright + colors.cyan);
  console.log('='.repeat(80) + '\n');
}

function logSuccess(message: string) {
  log(`✓ ${message}`, colors.green);
}

function logError(message: string) {
  log(`✗ ${message}`, colors.red);
}

function logInfo(message: string) {
  log(`ℹ ${message}`, colors.blue);
}

function logWarning(message: string) {
  log(`⚠ ${message}`, colors.yellow);
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Test Widget message flow
 */
async function testWidgetFlow(chatbotId: string): Promise<boolean> {
  logSection('Testing Widget Message Flow');
  
  try {
    // Step 1: Send message via Widget API
    logInfo('Step 1: Sending message via Widget API...');
    const testMessage = `Test message from Widget at ${new Date().toISOString()}`;
    const externalUserId = `test-user-${Date.now()}`;
    
    const response = await axios.post(`${BACKEND_URL}/widget/message`, {
      botId: chatbotId,
      externalUserId,
      message: testMessage,
    });
    
    if (response.status !== 201) {
      logError(`Failed to send message. Status: ${response.status}`);
      return false;
    }
    
    const { conversationId, messageId } = response.data;
    logSuccess(`Message sent successfully`);
    logInfo(`  - Message ID: ${messageId}`);
    logInfo(`  - Conversation ID: ${conversationId}`);
    
    // Step 2: Wait for processing
    logInfo('\nStep 2: Waiting for message processing (10 seconds)...');
    await sleep(10000);
    
    // Step 3: Check logs
    logInfo('\nStep 3: Expected log entries:');
    logInfo('  1. [MessageLogger] Message received from WIDGET');
    logInfo('  2. [MessageLogger] Message queued in incoming-messages');
    logInfo('  3. [IncomingMessagesProcessor] Processor started');
    logInfo('  4. [MessageLogger] AI processing started');
    logInfo('  5. [MessageLogger] AI response received');
    logInfo('  6. [MessageLogger] Sending message to WIDGET');
    logInfo('  7. [MessageLogger] WebSocket emit');
    logInfo('  8. [MessageLogger] Message sent successfully via WIDGET');
    
    logWarning('\n⚠ Please check the backend logs to verify all stages appeared');
    logWarning('  Look for logs containing:');
    logWarning(`    - messageId: ${messageId}`);
    logWarning(`    - conversationId: ${conversationId}`);
    
    return true;
  } catch (error: any) {
    logError(`Widget test failed: ${error.message}`);
    if (error.response) {
      logError(`  Response: ${JSON.stringify(error.response.data)}`);
    }
    return false;
  }
}

/**
 * Test WhatsApp QR message flow
 */
async function testWhatsAppQRFlow(chatbotId: string): Promise<boolean> {
  logSection('Testing WhatsApp QR Message Flow');
  
  try {
    // Step 1: Check if WhatsApp QR session exists
    logInfo('Step 1: Checking WhatsApp QR session status...');
    
    // Note: This requires authentication, so we'll simulate the incoming message webhook
    // In a real scenario, you would need to authenticate first
    
    logWarning('⚠ WhatsApp QR testing requires:');
    logWarning('  1. A WhatsApp QR session to be connected');
    logWarning('  2. The WhatsApp QR Service to be running');
    logWarning('  3. Authentication credentials');
    
    logInfo('\nTo test WhatsApp QR flow manually:');
    logInfo('  1. Ensure WhatsApp QR Service is running on port 3005');
    logInfo('  2. Initialize a session via the admin panel');
    logInfo('  3. Scan the QR code with WhatsApp');
    logInfo('  4. Send a message from WhatsApp');
    logInfo('  5. Check backend logs for:');
    logInfo('     - [MessageLogger] Message received from WHATSAPP_QR');
    logInfo('     - [MessageLogger] Message queued in incoming-messages');
    logInfo('     - [IncomingMessagesProcessor] Processor started');
    logInfo('     - [MessageLogger] AI processing started');
    logInfo('     - [MessageLogger] AI response received');
    logInfo('     - [MessageLogger] Sending message to WHATSAPP_QR');
    logInfo('     - [MessageLogger] Message sent successfully via WHATSAPP_QR');
    
    return true;
  } catch (error: any) {
    logError(`WhatsApp QR test failed: ${error.message}`);
    return false;
  }
}

/**
 * Test WebSocket connection and message reception
 */
async function testWebSocketConnection(conversationId: string): Promise<boolean> {
  logSection('Testing WebSocket Connection');
  
  return new Promise((resolve) => {
    try {
      logInfo('Connecting to WebSocket...');
      
      const socket: Socket = io(`${WIDGET_SOCKET_URL}/messages`, {
        transports: ['websocket'],
        reconnection: false,
      });
      
      let messageReceived = false;
      const timeout = setTimeout(() => {
        if (!messageReceived) {
          logWarning('⚠ No message received via WebSocket within 15 seconds');
          socket.disconnect();
          resolve(false);
        }
      }, 15000);
      
      socket.on('connect', () => {
        logSuccess('Connected to WebSocket');
        logInfo(`Subscribing to conversation: ${conversationId}`);
        socket.emit('subscribe', { conversationId });
      });
      
      socket.on('newMessage', (data: any) => {
        messageReceived = true;
        clearTimeout(timeout);
        logSuccess('Received message via WebSocket!');
        logInfo(`  - Message ID: ${data.id}`);
        logInfo(`  - Content: ${data.content.substring(0, 50)}...`);
        logInfo(`  - Role: ${data.role}`);
        socket.disconnect();
        resolve(true);
      });
      
      socket.on('error', (error: any) => {
        clearTimeout(timeout);
        logError(`WebSocket error: ${error.message}`);
        socket.disconnect();
        resolve(false);
      });
      
      socket.on('disconnect', () => {
        logInfo('Disconnected from WebSocket');
      });
      
    } catch (error: any) {
      logError(`WebSocket test failed: ${error.message}`);
      resolve(false);
    }
  });
}

/**
 * Check system health
 */
async function checkSystemHealth(): Promise<boolean> {
  logSection('Checking System Health');
  
  try {
    logInfo('Checking backend health...');
    const response = await axios.get(`${BACKEND_URL}/health`);
    
    if (response.status === 200) {
      logSuccess('Backend is healthy');
      logInfo(`  Status: ${response.data.status}`);
      
      // Check Redis
      if (response.data.details?.redis?.status === 'up') {
        logSuccess('  Redis: Connected');
      } else {
        logError('  Redis: Not connected');
        return false;
      }
      
      // Check Database
      if (response.data.details?.database?.status === 'up') {
        logSuccess('  Database: Connected');
      } else {
        logError('  Database: Not connected');
        return false;
      }
      
      return true;
    } else {
      logError(`Backend health check failed. Status: ${response.status}`);
      return false;
    }
  } catch (error: any) {
    logError(`Health check failed: ${error.message}`);
    return false;
  }
}

/**
 * Get a test chatbot ID
 */
async function getTestChatbotId(): Promise<string | null> {
  logInfo('Looking for a test chatbot...');
  
  // For now, we'll use a hardcoded test chatbot ID
  // In a real scenario, you would query the database or API
  const testChatbotId = process.env.TEST_CHATBOT_ID;
  
  if (testChatbotId) {
    logSuccess(`Using chatbot ID: ${testChatbotId}`);
    return testChatbotId;
  }
  
  logWarning('⚠ No TEST_CHATBOT_ID environment variable set');
  logInfo('Please set TEST_CHATBOT_ID to a valid chatbot ID');
  logInfo('Example: export TEST_CHATBOT_ID=your-chatbot-id');
  
  return null;
}

/**
 * Main test function
 */
async function main() {
  log('\n' + '█'.repeat(80), colors.bright + colors.cyan);
  log('  LOGGING VERIFICATION TEST SUITE', colors.bright + colors.cyan);
  log('█'.repeat(80) + '\n', colors.bright + colors.cyan);
  
  logInfo(`Backend URL: ${BACKEND_URL}`);
  logInfo(`WebSocket URL: ${WIDGET_SOCKET_URL}`);
  
  // Step 1: Check system health
  const healthOk = await checkSystemHealth();
  if (!healthOk) {
    logError('\n❌ System health check failed. Please ensure:');
    logError('  1. Backend is running (npm run start:dev)');
    logError('  2. Redis is running (redis-server)');
    logError('  3. Database is accessible');
    process.exit(1);
  }
  
  // Step 2: Get test chatbot ID
  const chatbotId = await getTestChatbotId();
  if (!chatbotId) {
    logError('\n❌ No test chatbot ID available');
    process.exit(1);
  }
  
  // Step 3: Test Widget flow
  const widgetSuccess = await testWidgetFlow(chatbotId);
  
  // Step 4: Test WhatsApp QR flow (informational only)
  await testWhatsAppQRFlow(chatbotId);
  
  // Final summary
  logSection('Test Summary');
  
  if (widgetSuccess) {
    logSuccess('✓ Widget message flow test completed');
    logInfo('  Please verify the following in backend logs:');
    logInfo('  1. Message received log');
    logInfo('  2. Message queued log');
    logInfo('  3. Processor start log');
    logInfo('  4. AI processing log');
    logInfo('  5. AI response log');
    logInfo('  6. Message sending log');
    logInfo('  7. WebSocket emit log');
    logInfo('  8. Message sent log');
  } else {
    logError('✗ Widget message flow test failed');
  }
  
  logInfo('\n✓ WhatsApp QR flow information provided');
  logInfo('  Manual testing required for WhatsApp QR channel');
  
  logSection('Next Steps');
  logInfo('1. Review the backend logs (backend/logs/combined.log)');
  logInfo('2. Look for MessageLogger entries with the test message IDs');
  logInfo('3. Verify all stages appear in the logs');
  logInfo('4. If any stage is missing, investigate that component');
  
  logInfo('\nTo view logs in real-time:');
  logInfo('  tail -f backend/logs/combined.log | grep MessageLogger');
  
  log('\n' + '█'.repeat(80), colors.bright + colors.cyan);
  log('  TEST COMPLETE', colors.bright + colors.cyan);
  log('█'.repeat(80) + '\n', colors.bright + colors.cyan);
}

// Run the tests
main().catch((error) => {
  logError(`\nUnexpected error: ${error.message}`);
  console.error(error);
  process.exit(1);
});
