# PowerShell script to verify logging functionality
# This script sends test messages and checks for log entries

param(
    [string]$BackendUrl = "http://localhost:3000",
    [string]$TestChatbotId = $env:TEST_CHATBOT_ID
)

# Colors for output
function Write-Section {
    param([string]$Message)
    Write-Host ""
    Write-Host ("=" * 80) -ForegroundColor Cyan
    Write-Host $Message -ForegroundColor Cyan -NoNewline
    Write-Host ""
    Write-Host ("=" * 80) -ForegroundColor Cyan
    Write-Host ""
}

function Write-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Write-ErrorMsg {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor Red
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ $Message" -ForegroundColor Blue
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠ $Message" -ForegroundColor Yellow
}

# Check prerequisites
function Test-Prerequisites {
    Write-Section "Checking Prerequisites"
    
    # Check if backend is running
    Write-Info "Checking if backend is running..."
    try {
        $response = Invoke-RestMethod -Uri "$BackendUrl/health" -Method Get -ErrorAction Stop
        Write-Success "Backend is running at $BackendUrl"
    }
    catch {
        Write-ErrorMsg "Backend is not running at $BackendUrl"
        Write-Info "Please start the backend with: npm run start:dev"
        exit 1
    }
    
    # Check if Redis is running
    Write-Info "Checking Redis connection..."
    try {
        $redisResponse = Invoke-RestMethod -Uri "$BackendUrl/health/redis" -Method Get -ErrorAction Stop
        if ($redisResponse.status -eq "ok") {
            Write-Success "Redis is connected"
        }
        else {
            Write-ErrorMsg "Redis is not connected"
            Write-Info "Please start Redis with: redis-server"
            exit 1
        }
    }
    catch {
        Write-ErrorMsg "Failed to check Redis status"
        exit 1
    }
    
    # Check if chatbot ID is provided
    if ([string]::IsNullOrEmpty($TestChatbotId)) {
        Write-ErrorMsg "TEST_CHATBOT_ID is not set"
        Write-Info "Please set it with: `$env:TEST_CHATBOT_ID='your-chatbot-id'"
        Write-Info "Or pass it as parameter: -TestChatbotId 'your-chatbot-id'"
        exit 1
    }
    
    Write-Success "All prerequisites met"
}

# Test Widget message flow
function Test-WidgetFlow {
    Write-Section "Testing Widget Message Flow"
    
    # Generate unique test data
    $timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
    $externalUserId = "test-user-$timestamp"
    $testMessage = "Test message from Widget at $(Get-Date -Format 'o')"
    
    Write-Info "Sending message via Widget API..."
    Write-Info "  Chatbot ID: $TestChatbotId"
    Write-Info "  User ID: $externalUserId"
    Write-Info "  Message: $testMessage"
    
    # Send message
    try {
        $body = @{
            botId = $TestChatbotId
            externalUserId = $externalUserId
            message = $testMessage
        } | ConvertTo-Json
        
        $response = Invoke-RestMethod -Uri "$BackendUrl/widget/message" `
            -Method Post `
            -ContentType "application/json" `
            -Body $body `
            -ErrorAction Stop
        
        $messageId = $response.messageId
        $conversationId = $response.conversationId
        
        Write-Success "Message sent successfully"
        Write-Info "  Message ID: $messageId"
        Write-Info "  Conversation ID: $conversationId"
        
        # Wait for processing
        Write-Info ""
        Write-Info "Waiting 10 seconds for message processing..."
        Start-Sleep -Seconds 10
        
        # Check logs
        Write-Info ""
        Write-Info "Checking logs for message flow..."
        
        $logFile = "logs/combined.log"
        if (Test-Path $logFile) {
            Write-Info "Searching for log entries with Message ID: $messageId"
            Write-Host ""
            
            $logContent = Get-Content $logFile -Tail 500
            
            # Search for specific log entries
            if ($logContent | Select-String -Pattern "Message received from WIDGET.*$messageId" -Quiet) {
                Write-Success "Found: Message received log"
            }
            else {
                Write-Warning "Missing: Message received log"
            }
            
            if ($logContent | Select-String -Pattern "Message queued.*$messageId" -Quiet) {
                Write-Success "Found: Message queued log"
            }
            else {
                Write-Warning "Missing: Message queued log"
            }
            
            if ($logContent | Select-String -Pattern "AI processing started.*$messageId" -Quiet) {
                Write-Success "Found: AI processing started log"
            }
            else {
                Write-Warning "Missing: AI processing started log"
            }
            
            if ($logContent | Select-String -Pattern "AI response received.*$messageId" -Quiet) {
                Write-Success "Found: AI response received log"
            }
            else {
                Write-Warning "Missing: AI response received log"
            }
            
            if ($logContent | Select-String -Pattern "Sending message to WIDGET.*$conversationId" -Quiet) {
                Write-Success "Found: Message sending log"
            }
            else {
                Write-Warning "Missing: Message sending log"
            }
            
            if ($logContent | Select-String -Pattern "Message sent successfully via WIDGET.*$conversationId" -Quiet) {
                Write-Success "Found: Message sent log"
            }
            else {
                Write-Warning "Missing: Message sent log"
            }
            
            Write-Host ""
            Write-Info "Recent log entries for this message:"
            Write-Host "---" -ForegroundColor Gray
            $logContent | Select-String -Pattern "$messageId|$conversationId" | Select-Object -Last 20 | ForEach-Object {
                Write-Host $_.Line -ForegroundColor Gray
            }
            Write-Host "---" -ForegroundColor Gray
        }
        else {
            Write-Warning "Log file not found at: $logFile"
            Write-Info "Logs may be output to console only"
        }
        
        return $true
    }
    catch {
        Write-ErrorMsg "Failed to send message"
        Write-ErrorMsg "Error: $($_.Exception.Message)"
        if ($_.Exception.Response) {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            Write-ErrorMsg "Response: $responseBody"
        }
        return $false
    }
}

# Test WhatsApp QR flow (informational)
function Test-WhatsAppQRFlow {
    Write-Section "Testing WhatsApp QR Message Flow"
    
    Write-Warning "WhatsApp QR testing requires manual steps:"
    Write-Info "1. Ensure WhatsApp QR Service is running on port 3005"
    Write-Info "2. Initialize a session via the admin panel"
    Write-Info "3. Scan the QR code with WhatsApp"
    Write-Info "4. Send a message from WhatsApp"
    Write-Info "5. Check backend logs for:"
    Write-Info "   - Message received from WHATSAPP_QR"
    Write-Info "   - Message queued in incoming-messages"
    Write-Info "   - AI processing started"
    Write-Info "   - AI response received"
    Write-Info "   - Sending message to WHATSAPP_QR"
    Write-Info "   - Message sent successfully via WHATSAPP_QR"
}

# Main execution
function Main {
    Write-Host ""
    Write-Host ("█" * 80) -ForegroundColor Cyan
    Write-Host "  LOGGING VERIFICATION TEST SUITE" -ForegroundColor Cyan
    Write-Host ("█" * 80) -ForegroundColor Cyan
    Write-Host ""
    
    Test-Prerequisites
    $widgetSuccess = Test-WidgetFlow
    Test-WhatsAppQRFlow
    
    Write-Section "Test Summary"
    if ($widgetSuccess) {
        Write-Success "Widget message flow test completed"
    }
    else {
        Write-ErrorMsg "Widget message flow test failed"
    }
    Write-Info "Please review the log entries above to verify all stages"
    
    Write-Section "Next Steps"
    Write-Info "1. Review the backend logs (logs/combined.log)"
    Write-Info "2. Verify all stages appear in the logs"
    Write-Info "3. If any stage is missing, investigate that component"
    Write-Info ""
    Write-Info "To view logs in real-time:"
    Write-Info "  Get-Content logs/combined.log -Wait -Tail 50 | Select-String 'MessageLogger'"
    
    Write-Host ""
    Write-Host ("█" * 80) -ForegroundColor Cyan
    Write-Host "  TEST COMPLETE" -ForegroundColor Cyan
    Write-Host ("█" * 80) -ForegroundColor Cyan
    Write-Host ""
}

# Run main function
Main
