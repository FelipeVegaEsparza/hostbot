#!/bin/bash

# Test script to verify logging functionality
# This script sends test messages and checks for log entries

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Configuration
BACKEND_URL="${BACKEND_URL:-http://localhost:3000}"
TEST_CHATBOT_ID="${TEST_CHATBOT_ID}"
LOG_FILE="logs/combined.log"

# Functions
log_section() {
    echo ""
    echo "================================================================================"
    echo -e "${BOLD}${CYAN}$1${NC}"
    echo "================================================================================"
    echo ""
}

log_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

log_error() {
    echo -e "${RED}✗ $1${NC}"
}

log_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    log_section "Checking Prerequisites"
    
    # Check if backend is running
    log_info "Checking if backend is running..."
    if curl -s "${BACKEND_URL}/health" > /dev/null 2>&1; then
        log_success "Backend is running at ${BACKEND_URL}"
    else
        log_error "Backend is not running at ${BACKEND_URL}"
        log_info "Please start the backend with: npm run start:dev"
        exit 1
    fi
    
    # Check if Redis is running
    log_info "Checking Redis connection..."
    REDIS_STATUS=$(curl -s "${BACKEND_URL}/health/redis" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
    if [ "$REDIS_STATUS" = "ok" ]; then
        log_success "Redis is connected"
    else
        log_error "Redis is not connected"
        log_info "Please start Redis with: redis-server"
        exit 1
    fi
    
    # Check if chatbot ID is provided
    if [ -z "$TEST_CHATBOT_ID" ]; then
        log_error "TEST_CHATBOT_ID environment variable is not set"
        log_info "Please set it with: export TEST_CHATBOT_ID=your-chatbot-id"
        exit 1
    fi
    
    log_success "All prerequisites met"
}

# Test Widget message flow
test_widget_flow() {
    log_section "Testing Widget Message Flow"
    
    # Generate unique test data
    TIMESTAMP=$(date +%s)
    EXTERNAL_USER_ID="test-user-${TIMESTAMP}"
    TEST_MESSAGE="Test message from Widget at $(date -Iseconds)"
    
    log_info "Sending message via Widget API..."
    log_info "  Chatbot ID: ${TEST_CHATBOT_ID}"
    log_info "  User ID: ${EXTERNAL_USER_ID}"
    log_info "  Message: ${TEST_MESSAGE}"
    
    # Send message
    RESPONSE=$(curl -s -X POST "${BACKEND_URL}/widget/message" \
        -H "Content-Type: application/json" \
        -d "{
            \"botId\": \"${TEST_CHATBOT_ID}\",
            \"externalUserId\": \"${EXTERNAL_USER_ID}\",
            \"message\": \"${TEST_MESSAGE}\"
        }")
    
    # Check if request was successful
    if echo "$RESPONSE" | grep -q "conversationId"; then
        MESSAGE_ID=$(echo "$RESPONSE" | grep -o '"messageId":"[^"]*"' | cut -d'"' -f4)
        CONVERSATION_ID=$(echo "$RESPONSE" | grep -o '"conversationId":"[^"]*"' | cut -d'"' -f4)
        
        log_success "Message sent successfully"
        log_info "  Message ID: ${MESSAGE_ID}"
        log_info "  Conversation ID: ${CONVERSATION_ID}"
        
        # Wait for processing
        log_info ""
        log_info "Waiting 10 seconds for message processing..."
        sleep 10
        
        # Check logs
        log_info ""
        log_info "Checking logs for message flow..."
        
        if [ -f "$LOG_FILE" ]; then
            log_info "Searching for log entries with Message ID: ${MESSAGE_ID}"
            echo ""
            
            # Search for specific log entries
            if grep -q "Message received from WIDGET.*${MESSAGE_ID}" "$LOG_FILE"; then
                log_success "Found: Message received log"
            else
                log_warning "Missing: Message received log"
            fi
            
            if grep -q "Message queued.*${MESSAGE_ID}" "$LOG_FILE"; then
                log_success "Found: Message queued log"
            else
                log_warning "Missing: Message queued log"
            fi
            
            if grep -q "AI processing started.*${MESSAGE_ID}" "$LOG_FILE"; then
                log_success "Found: AI processing started log"
            else
                log_warning "Missing: AI processing started log"
            fi
            
            if grep -q "AI response received.*${MESSAGE_ID}" "$LOG_FILE"; then
                log_success "Found: AI response received log"
            else
                log_warning "Missing: AI response received log"
            fi
            
            if grep -q "Sending message to WIDGET.*${CONVERSATION_ID}" "$LOG_FILE"; then
                log_success "Found: Message sending log"
            else
                log_warning "Missing: Message sending log"
            fi
            
            if grep -q "Message sent successfully via WIDGET.*${CONVERSATION_ID}" "$LOG_FILE"; then
                log_success "Found: Message sent log"
            else
                log_warning "Missing: Message sent log"
            fi
            
            echo ""
            log_info "Full log entries for this message:"
            echo "---"
            grep "${MESSAGE_ID}\|${CONVERSATION_ID}" "$LOG_FILE" | tail -20
            echo "---"
        else
            log_warning "Log file not found at: ${LOG_FILE}"
            log_info "Logs may be output to console only"
        fi
        
        return 0
    else
        log_error "Failed to send message"
        log_error "Response: ${RESPONSE}"
        return 1
    fi
}

# Test WhatsApp QR flow (informational)
test_whatsapp_qr_flow() {
    log_section "Testing WhatsApp QR Message Flow"
    
    log_warning "WhatsApp QR testing requires manual steps:"
    log_info "1. Ensure WhatsApp QR Service is running on port 3005"
    log_info "2. Initialize a session via the admin panel"
    log_info "3. Scan the QR code with WhatsApp"
    log_info "4. Send a message from WhatsApp"
    log_info "5. Check backend logs for:"
    log_info "   - Message received from WHATSAPP_QR"
    log_info "   - Message queued in incoming-messages"
    log_info "   - AI processing started"
    log_info "   - AI response received"
    log_info "   - Sending message to WHATSAPP_QR"
    log_info "   - Message sent successfully via WHATSAPP_QR"
}

# Main execution
main() {
    echo ""
    echo "████████████████████████████████████████████████████████████████████████████████"
    echo -e "${BOLD}${CYAN}  LOGGING VERIFICATION TEST SUITE${NC}"
    echo "████████████████████████████████████████████████████████████████████████████████"
    echo ""
    
    check_prerequisites
    test_widget_flow
    test_whatsapp_qr_flow
    
    log_section "Test Summary"
    log_info "Widget message flow test completed"
    log_info "Please review the log entries above to verify all stages"
    
    log_section "Next Steps"
    log_info "1. Review the backend logs (${LOG_FILE})"
    log_info "2. Verify all stages appear in the logs"
    log_info "3. If any stage is missing, investigate that component"
    log_info ""
    log_info "To view logs in real-time:"
    log_info "  tail -f ${LOG_FILE} | grep MessageLogger"
    
    echo ""
    echo "████████████████████████████████████████████████████████████████████████████████"
    echo -e "${BOLD}${CYAN}  TEST COMPLETE${NC}"
    echo "████████████████████████████████████████████████████████████████████████████████"
    echo ""
}

# Run main function
main
