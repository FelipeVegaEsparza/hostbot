# Quick Start: Checkpoint 4 - Logging Verification

## TL;DR - Run These Commands

```bash
# 1. Start backend (in one terminal)
cd backend
npm run start:dev

# 2. Get test chatbot ID (in another terminal)
cd backend
npx ts-node scripts/get-test-chatbot.ts

# 3. Set the chatbot ID (copy from output above)
# For Bash/Linux:
export TEST_CHATBOT_ID="your-chatbot-id-here"

# For PowerShell/Windows:
$env:TEST_CHATBOT_ID="your-chatbot-id-here"

# 4. Run the test
# For PowerShell/Windows:
.\scripts\test-logging.ps1

# For Bash/Linux:
./scripts/test-logging.sh

# 5. Watch the logs in real-time (optional)
# For Bash/Linux:
tail -f logs/combined.log | grep MessageLogger

# For PowerShell/Windows:
Get-Content logs/combined.log -Wait -Tail 50 | Select-String "MessageLogger"
```

## What to Expect

The test will:
1. ✓ Check if backend is running
2. ✓ Check if Redis is connected
3. ✓ Send a test message via Widget API
4. ✓ Wait 10 seconds for processing
5. ✓ Check logs for all stages
6. ✓ Display results

## Expected Output

```
================================================================================
  LOGGING VERIFICATION TEST SUITE
================================================================================

Checking Prerequisites
ℹ Checking if backend is running...
✓ Backend is running at http://localhost:3000
ℹ Checking Redis connection...
✓ Redis is connected
✓ All prerequisites met

Testing Widget Message Flow
ℹ Sending message via Widget API...
✓ Message sent successfully
  Message ID: 123e4567-e89b-12d3-a456-426614174000
  Conversation ID: 987fcdeb-51a2-43f7-b890-123456789abc

ℹ Waiting 10 seconds for message processing...

ℹ Checking logs for message flow...
✓ Found: Message received log
✓ Found: Message queued log
✓ Found: AI processing started log
✓ Found: AI response received log
✓ Found: Message sending log
✓ Found: Message sent log

Test Summary
✓ Widget message flow test completed
```

## If Something Goes Wrong

### Backend not running
```bash
cd backend
npm run start:dev
```

### Redis not running
```bash
redis-server
```

### No chatbot found
Create a chatbot via the admin panel first, then run the test again.

### Logs missing
Check the console output of the backend for errors. The logs should appear in `backend/logs/combined.log`.

## Full Documentation

For detailed information, see:
- `CHECKPOINT_4_VERIFICATION.md` - Complete verification guide
- `scripts/LOGGING_TEST_README.md` - Test scripts documentation
