# Logging Verification Test Suite

This directory contains scripts to verify that the logging system is working correctly across all message flow stages.

## Prerequisites

Before running the tests, ensure the following services are running:

1. **Backend Server**
   ```bash
   cd backend
   npm run start:dev
   ```

2. **Redis Server**
   ```bash
   redis-server
   ```

3. **Database**
   - Ensure MySQL is running and accessible
   - Database should be migrated: `npm run prisma:migrate`

4. **WhatsApp QR Service** (optional, for WhatsApp QR testing)
   ```bash
   cd whatsapp-qr-service
   npm run start:dev
   ```

## Getting a Test Chatbot ID

First, you need to get a valid chatbot ID to use for testing:

```bash
cd backend
npx ts-node scripts/get-test-chatbot.ts
```

This will output the available chatbots and provide the export command. Copy and run the export command:

**For Bash/Linux:**
```bash
export TEST_CHATBOT_ID="your-chatbot-id-here"
```

**For PowerShell/Windows:**
```powershell
$env:TEST_CHATBOT_ID="your-chatbot-id-here"
```

## Running the Tests

### Option 1: PowerShell Script (Recommended for Windows)

```powershell
cd backend
.\scripts\test-logging.ps1
```

Or with custom parameters:
```powershell
.\scripts\test-logging.ps1 -BackendUrl "http://localhost:3000" -TestChatbotId "your-chatbot-id"
```

### Option 2: Bash Script (Linux/Mac)

```bash
cd backend
./scripts/test-logging.sh
```

### Option 3: TypeScript Script (Cross-platform)

```bash
cd backend
npx ts-node scripts/test-logging.ts
```

## What the Tests Do

### 1. System Health Check
- Verifies backend is running
- Checks Redis connection
- Validates database connectivity

### 2. Widget Message Flow Test
The script will:
1. Send a test message via the Widget API
2. Wait for processing (10 seconds)
3. Check the logs for the following stages:
   - ✓ Message received from WIDGET
   - ✓ Message queued in incoming-messages
   - ✓ Processor started
   - ✓ AI processing started
   - ✓ AI response received
   - ✓ Message sending to WIDGET
   - ✓ WebSocket emit
   - ✓ Message sent successfully

### 3. WhatsApp QR Flow Information
Provides instructions for manual testing of the WhatsApp QR channel.

## Expected Log Entries

When the logging system is working correctly, you should see entries like:

```json
{
  "level": "info",
  "message": "Message received from WIDGET",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "messageId": "123e4567-e89b-12d3-a456-426614174000",
  "conversationId": "987fcdeb-51a2-43f7-b890-123456789abc",
  "channel": "WIDGET",
  "stage": "received",
  "details": {
    "externalUserId": "test-user-1234567890",
    "contentLength": 42,
    "contentPreview": "Test message from Widget at 2024-01-15..."
  }
}
```

## Viewing Logs in Real-Time

### Bash/Linux:
```bash
tail -f logs/combined.log | grep MessageLogger
```

### PowerShell/Windows:
```powershell
Get-Content logs/combined.log -Wait -Tail 50 | Select-String "MessageLogger"
```

## Troubleshooting

### Backend Not Running
```
✗ Backend is not running at http://localhost:3000
```
**Solution:** Start the backend with `npm run start:dev`

### Redis Not Connected
```
✗ Redis is not connected
```
**Solution:** Start Redis with `redis-server`

### No Test Chatbot ID
```
✗ TEST_CHATBOT_ID is not set
```
**Solution:** Run `npx ts-node scripts/get-test-chatbot.ts` and set the environment variable

### Missing Log Entries
If some log entries are missing, check:

1. **Message received log missing:**
   - Check WidgetService.sendMessage() or WhatsAppQRService.handleIncomingMessage()
   - Verify MessageLogger is injected correctly

2. **Message queued log missing:**
   - Check QueueService.enqueueIncomingMessage()
   - Verify the queue is being created

3. **AI processing logs missing:**
   - Check AIProcessingProcessor
   - Verify AI provider is configured (OPENAI_API_KEY)

4. **Message sending logs missing:**
   - Check OutgoingMessagesProcessor
   - Verify the processor is registered

5. **WebSocket emit log missing:**
   - Check MessagesGateway.emitNewMessage()
   - Verify WebSocket is configured correctly

## Manual Testing for WhatsApp QR

To test the WhatsApp QR flow:

1. Start the WhatsApp QR Service:
   ```bash
   cd whatsapp-qr-service
   npm run start:dev
   ```

2. Initialize a session via the admin panel or API:
   ```bash
   curl -X POST http://localhost:3000/whatsapp-qr/init \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{"chatbotId": "your-chatbot-id"}'
   ```

3. Get the QR code and scan it with WhatsApp

4. Send a message from WhatsApp to the connected number

5. Check the logs for the complete flow

## Success Criteria

The checkpoint is considered successful when:

1. ✓ Widget message flow test completes without errors
2. ✓ All expected log entries appear in the logs
3. ✓ Logs contain correct messageId and conversationId
4. ✓ Each stage of the flow is logged with appropriate details
5. ✓ No errors or warnings in the logs (except expected ones)

## Next Steps

After verifying the logging works correctly:

1. Review the logs to ensure all stages are captured
2. Proceed to the next task: Diagnosing and fixing Redis/queue issues
3. Use the logging to debug any issues that arise

## Files in This Directory

- `test-logging.ps1` - PowerShell test script (Windows)
- `test-logging.sh` - Bash test script (Linux/Mac)
- `test-logging.ts` - TypeScript test script (Cross-platform)
- `get-test-chatbot.ts` - Script to get a test chatbot ID
- `LOGGING_TEST_README.md` - This file

## Support

If you encounter issues:

1. Check the backend logs: `logs/combined.log`
2. Check the console output for errors
3. Verify all prerequisites are met
4. Review the troubleshooting section above
