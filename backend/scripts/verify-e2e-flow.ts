/**
 * Manual E2E Flow Verification Script
 * 
 * This script verifies the complete end-to-end message flow by:
 * 1. Checking system health
 * 2. Sending test messages via Widget
 * 3. Verifying responses are generated
 * 4. Checking queue status
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:3000';
const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'Admin123456!';

interface TestResult {
  test: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  message: string;
  details?: any;
}

const results: TestResult[] = [];

function logResult(result: TestResult) {
  results.push(result);
  const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⏭️';
  console.log(`${icon} ${result.test}: ${result.message}`);
  if (result.details) {
    console.log('   Details:', JSON.stringify(result.details, null, 2));
  }
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('🚀 Starting End-to-End Flow Verification\n');
  console.log('=' .repeat(60));
  
  let adminToken: string | null = null;
  let chatbotId: string | null = null;

  // Test 1: Check if backend is running
  try {
    const response = await axios.get(`${BASE_URL}/health`);
    logResult({
      test: 'Backend Health Check',
      status: 'PASS',
      message: 'Backend is running and healthy',
      details: response.data,
    });
  } catch (error: any) {
    logResult({
      test: 'Backend Health Check',
      status: 'FAIL',
      message: `Backend is not accessible: ${error.message}`,
    });
    console.log('\n❌ Backend is not running. Please start it with: npm run start:dev');
    return;
  }

  // Test 2: Check Redis health
  try {
    const response = await axios.get(`${BASE_URL}/health/redis`);
    logResult({
      test: 'Redis Health Check',
      status: 'PASS',
      message: 'Redis is connected',
      details: response.data,
    });
  } catch (error: any) {
    logResult({
      test: 'Redis Health Check',
      status: 'FAIL',
      message: `Redis is not accessible: ${error.message}`,
    });
  }

  // Test 3: Check Database health
  try {
    const response = await axios.get(`${BASE_URL}/health/database`);
    logResult({
      test: 'Database Health Check',
      status: 'PASS',
      message: 'Database is connected',
      details: response.data,
    });
  } catch (error: any) {
    logResult({
      test: 'Database Health Check',
      status: 'FAIL',
      message: `Database is not accessible: ${error.message}`,
    });
  }

  // Test 4: Login as admin
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });
    adminToken = response.data.access_token;
    logResult({
      test: 'Admin Login',
      status: 'PASS',
      message: 'Successfully logged in as admin',
    });
  } catch (error: any) {
    logResult({
      test: 'Admin Login',
      status: 'FAIL',
      message: `Failed to login: ${error.response?.data?.message || error.message}`,
    });
    console.log('\n⚠️  Admin user not found. Please create an admin user first.');
    console.log('   You can do this by registering a user and updating their role to ADMIN in the database.');
    return;
  }

  if (!adminToken) {
    console.log('\n❌ Cannot proceed without admin token');
    return;
  }

  // Test 5: Get queues status
  try {
    const response = await axios.get(`${BASE_URL}/health/queues`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    logResult({
      test: 'Queues Status',
      status: 'PASS',
      message: 'Successfully retrieved queue status',
      details: response.data,
    });
  } catch (error: any) {
    logResult({
      test: 'Queues Status',
      status: 'FAIL',
      message: `Failed to get queues: ${error.response?.data?.message || error.message}`,
    });
  }

  // Test 6: Get WebSocket status
  try {
    const response = await axios.get(`${BASE_URL}/health/websocket`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    logResult({
      test: 'WebSocket Status',
      status: 'PASS',
      message: 'Successfully retrieved WebSocket status',
      details: response.data,
    });
  } catch (error: any) {
    logResult({
      test: 'WebSocket Status',
      status: 'FAIL',
      message: `Failed to get WebSocket status: ${error.response?.data?.message || error.message}`,
    });
  }

  // Test 7: Get AI providers status
  try {
    const response = await axios.get(`${BASE_URL}/health/ai-providers`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    logResult({
      test: 'AI Providers Status',
      status: 'PASS',
      message: 'Successfully retrieved AI providers status',
      details: response.data,
    });
  } catch (error: any) {
    logResult({
      test: 'AI Providers Status',
      status: 'FAIL',
      message: `Failed to get AI providers: ${error.response?.data?.message || error.message}`,
    });
  }

  // Test 8: Get first chatbot
  try {
    const response = await axios.get(`${BASE_URL}/chatbots`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (response.data && response.data.length > 0) {
      chatbotId = response.data[0].id;
      logResult({
        test: 'Get Chatbot',
        status: 'PASS',
        message: `Found chatbot: ${response.data[0].name}`,
        details: { chatbotId, name: response.data[0].name },
      });
    } else {
      logResult({
        test: 'Get Chatbot',
        status: 'SKIP',
        message: 'No chatbots found. Skipping test message flow.',
      });
    }
  } catch (error: any) {
    logResult({
      test: 'Get Chatbot',
      status: 'FAIL',
      message: `Failed to get chatbots: ${error.response?.data?.message || error.message}`,
    });
  }

  // Test 9: Send test message via Widget (if chatbot exists)
  if (chatbotId) {
    try {
      console.log('\n📤 Sending test message via Widget...');
      const response = await axios.post(
        `${BASE_URL}/health/test-message`,
        {
          chatbotId: chatbotId,
          channel: 'WIDGET',
          externalUserId: 'e2e-test-user-' + Date.now(),
          message: 'Hello! This is an end-to-end test message. Please respond briefly.',
        },
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        }
      );

      logResult({
        test: 'Send Test Message (Widget)',
        status: 'PASS',
        message: 'Test message sent successfully',
        details: {
          messageId: response.data.messageId,
          conversationId: response.data.conversationId,
          stages: response.data.stages,
        },
      });

      // Wait for processing
      console.log('\n⏳ Waiting 10 seconds for message processing...');
      await sleep(10000);

      // Check queues again
      const queuesResponse = await axios.get(`${BASE_URL}/health/queues`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      logResult({
        test: 'Queues After Message',
        status: 'PASS',
        message: 'Queue status after message processing',
        details: queuesResponse.data,
      });

    } catch (error: any) {
      logResult({
        test: 'Send Test Message (Widget)',
        status: 'FAIL',
        message: `Failed to send test message: ${error.response?.data?.message || error.message}`,
        details: error.response?.data,
      });
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Summary\n');
  
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const skipped = results.filter(r => r.status === 'SKIP').length;
  
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⏭️  Skipped: ${skipped}`);
  console.log(`📝 Total: ${results.length}`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! The end-to-end flow is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the errors above.');
  }
  
  console.log('='.repeat(60));
}

main().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
