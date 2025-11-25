# Checkpoint 4: Logging Verification

## Status: Ready for Testing

This checkpoint verifies that the logging system implemented in tasks 1-3 is working correctly.

## What Was Implemented

### Task 1: Base System Configuration ✓
- Redis connection verification
- Environment variables validation
- WhatsApp QR Service connectivity check
- Database accessibility verification

### Task 2: Health Check Module ✓
- Health check endpoints for queues, WebSocket, and AI providers
- Test message endpoint for flow verification
- Admin authentication on diagnostic endpoints

### Task 3: Enhanced Logging System ✓
- MessageLogger service with structured logging
- Logging integration in all services:
  - WidgetService
  - WhatsAppQRService
  - IncomingMessagesProcessor
  - AIProcessingProcessor
  - OutgoingMessagesProcessor
  - MessagesGateway

## Verification Steps

### Prerequisites

1. **Start Backend**
   ```bash
   cd backend
   npm run start:dev
   ```

2. **Verify Redis is Running**
   ```bash
   redis-cli ping
   # Should return: PONG
   ```

3. **Get Test Chatbot ID**
   ```bash
   npx ts-node scripts/get-test-chatbot.ts
   ```
   
   Then set the environment variable:
   ```bash
   # Bash/Linux
   export TEST_CHATBOT_ID="your-chatbot-id"
   
   # PowerShell/Windows
   $env:TEST_CHATBOT_ID="your-chatbot-id"
   ```

### Test 1: Widget Message Flow

#### Run the Test Script

**PowerShell (Windows):**
```powershell
cd backend
.\scripts\test-logging.ps1
```

**Bash (Linux/Mac):**
```bash
cd backend
./scripts/test-logging.sh
```

#### Manual Test (Alternative)

1. Send a test message:
   ```bash
   curl -X POST http://localhost:3000/widget/message \
     -H "Content-Type: application/json" \
     -d '{
       "botId": "YOUR_CHATBOT_ID",
       "externalUserId": "test-user-123",
       "message": "Hello, this is a test message"
     }'
   ```

2. Wait 10 seconds for processing

3. Check the logs:
   ```bash
   # Bash/Linux
   tail -f backend/logs/combined.log | grep MessageLogger
   
   # PowerShell/Windows
   Get-Content backend/logs/combined.log -Wait -Tail 50 | Select-String "MessageLogger"
   ```

#### Expected Log Entries

You should see the following log entries in order:

1. **Message Received**
   ```
   [MessageLogger] Message received from WIDGET
   - messageId: xxx
   - conversationId: xxx
   - channel: WIDGET
   - stage: received
   ```

2. **Message Queued**
   ```
   [MessageLogger] Message queued in incoming-messages
   - messageId: xxx
   - queueName: incoming-messages
   - jobId: xxx
   ```

3. **Processor Started**
   ```
   [MessageLogger] Processor IncomingMessagesProcessor started
   - jobId: xxx
   ```

4. **AI Processing Started**
   ```
   [MessageLogger] AI processing started with openai/gpt-4o-mini
   - messageId: xxx
   - provider: openai
   - model: gpt-4o-mini
   ```

5. **AI Response Received**
   ```
   [MessageLogger] AI response received (X tokens, Xms)
   - messageId: xxx
   - tokensUsed: X
   - processingTimeMs: X
   ```

6. **Message Sending**
   ```
   [MessageLogger] Sending message to WIDGET
   - messageId: xxx
   - channel: WIDGET
   ```

7. **WebSocket Emit**
   ```
   [MessageLogger] WebSocket emit to X clients in room conversation:xxx
   - connectedClients: X
   - roomName: conversation:xxx
   ```

8. **Message Sent**
   ```
   [MessageLogger] Message sent successfully via WIDGET
   - messageId: xxx
   - deliveryStatus: SENT
   ```

### Test 2: WhatsApp QR Message Flow (Manual)

#### Prerequisites
1. WhatsApp QR Service must be running on port 3005
2. A WhatsApp QR session must be initialized and connected
3. You must have a phone with WhatsApp to send test messages

#### Steps

1. **Start WhatsApp QR Service**
   ```bash
   cd whatsapp-qr-service
   npm run start:dev
   ```

2. **Initialize Session** (via admin panel or API)
   - Go to admin panel
   - Navigate to WhatsApp QR settings
   - Initialize a new session
   - Scan the QR code with WhatsApp

3. **Send Test Message**
   - Send a message from WhatsApp to the connected number
   - The message should be: "Hello from WhatsApp"

4. **Check Logs**
   ```bash
   # Bash/Linux
   tail -f backend/logs/combined.log | grep MessageLogger
   
   # PowerShell/Windows
   Get-Content backend/logs/combined.log -Wait -Tail 50 | Select-String "MessageLogger"
   ```

#### Expected Log Entries

Similar to Widget flow, but with `channel: WHATSAPP_QR`:

1. Message received from WHATSAPP_QR
2. Message queued in incoming-messages
3. Processor started
4. AI processing started
5. AI response received
6. Sending message to WHATSAPP_QR
7. Message sent successfully via WHATSAPP_QR

## Verification Checklist

- [ ] Backend is running without errors
- [ ] Redis is connected and accessible
- [ ] Test chatbot ID is obtained and set
- [ ] Widget test message sent successfully
- [ ] All 8 log stages appear for Widget flow
- [ ] Logs contain correct messageId and conversationId
- [ ] No errors in the logs (except expected validation errors)
- [ ] WhatsApp QR flow instructions are clear (manual test)
- [ ] All tests pass without issues

## Common Issues and Solutions

### Issue: Backend not starting
**Solution:** 
- Check if port 3000 is available
- Verify all dependencies are installed: `npm install`
- Check environment variables in `.env`

### Issue: Redis connection failed
**Solution:**
- Start Redis: `redis-server`
- Check Redis URL in `.env`: `REDIS_URL="redis://localhost:6379"`

### Issue: No logs appearing
**Solution:**
- Check log level in `.env`: `LOG_LEVEL="info"`
- Verify logs directory exists: `mkdir -p logs`
- Check console output if file logging is not working

### Issue: AI processing fails
**Solution:**
- Verify OpenAI API key is set in `.env`
- Check API key is valid
- Ensure chatbot has aiProvider and aiModel configured

### Issue: Message not queued
**Solution:**
- Check Redis is running
- Verify queue processors are registered
- Check for errors in IncomingMessagesProcessor

### Issue: WebSocket not emitting
**Solution:**
- Check CORS configuration in `.env`
- Verify MessagesGateway is initialized
- Check if clients are connected to the correct namespace

## Success Criteria

This checkpoint is considered **PASSED** when:

1. ✅ Widget message flow completes end-to-end
2. ✅ All 8 expected log entries appear in correct order
3. ✅ Logs contain accurate messageId and conversationId
4. ✅ No unexpected errors in the logs
5. ✅ Each log entry contains appropriate details
6. ✅ WhatsApp QR flow instructions are documented

## Next Steps

After this checkpoint passes:

1. **Task 5:** Diagnose and correct Redis and queue issues
2. **Task 6:** Diagnose and correct AI provider issues
3. **Task 7:** Diagnose and correct WebSocket issues
4. **Task 8:** Diagnose and correct WhatsApp QR issues

## Notes

- The logging system is now in place and working
- Use these logs to debug issues in subsequent tasks
- The test scripts can be run repeatedly for regression testing
- Keep the logs for reference when troubleshooting

## Test Results

**Date:** _________________

**Tester:** _________________

**Widget Flow:** ☐ PASS ☐ FAIL

**WhatsApp QR Flow:** ☐ PASS ☐ FAIL ☐ NOT TESTED

**Notes:**
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________

**Overall Status:** ☐ PASS ☐ FAIL

**Signature:** _________________
