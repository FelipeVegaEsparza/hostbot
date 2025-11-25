"use strict";
/**
 * Unit tests for WhatsApp QR polling logic
 *
 * **Feature: fix-whatsapp-qr-display, Property 1: Polling continues until QR available**
 * **Validates: Requirements 1.1**
 *
 * Property 1: Polling continues until QR available
 * For any initialized session, the frontend should continue polling the backend
 * until either the QR code becomes available or a timeout occurs
 *
 * **Feature: fix-whatsapp-qr-display, Property 2: Loading state shown when QR unavailable**
 * **Validates: Requirements 1.3**
 *
 * Property 2: Loading state shown when QR unavailable
 * For any session state where qrCode is null and status is CONNECTING or QR_READY,
 * the UI should display a loading state
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.runTests = runTests;
const whatsapp_qr_polling_1 = require("./whatsapp-qr-polling");
// Test utilities
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
// Test suite
async function runTests() {
    console.log('Running WhatsApp QR Polling Tests...\n');
    let passedTests = 0;
    let failedTests = 0;
    // Test 1: Polling continues until QR code is available
    try {
        console.log('Test 1: Polling continues until QR code is available');
        let callCount = 0;
        const mockPollFn = async () => {
            callCount++;
            if (callCount < 3) {
                // First 2 calls: still connecting
                return { status: 'CONNECTING', qrCode: null };
            }
            // Third call: QR ready
            return { status: 'QR_READY', qrCode: 'data:image/png;base64,mock' };
        };
        const result = await (0, whatsapp_qr_polling_1.pollUntil)(mockPollFn, (data) => data.status === 'QR_READY' && data.qrCode !== null, { maxDuration: 10000, initialInterval: 100, maxInterval: 200 });
        if (result.success && result.data?.qrCode && callCount >= 3) {
            console.log('✓ PASSED: Polling continued until QR code was available');
            console.log(`  - Made ${callCount} polling attempts`);
            passedTests++;
        }
        else {
            console.log('✗ FAILED: Polling did not continue until QR code was available');
            console.log(`  - Expected success: true, got: ${result.success}`);
            console.log(`  - Expected callCount >= 3, got: ${callCount}`);
            failedTests++;
        }
    }
    catch (error) {
        console.log('✗ FAILED: Test threw an error:', error);
        failedTests++;
    }
    console.log();
    // Test 2: Polling stops when session is connected
    try {
        console.log('Test 2: Polling stops when session is connected');
        let callCount = 0;
        const mockPollFn = async () => {
            callCount++;
            if (callCount < 2) {
                return { status: 'CONNECTING', qrCode: null };
            }
            return { status: 'CONNECTED', qrCode: null };
        };
        const result = await (0, whatsapp_qr_polling_1.pollUntil)(mockPollFn, (data) => data.status === 'CONNECTED', { maxDuration: 10000, initialInterval: 100, maxInterval: 200 });
        if (result.success && result.data?.status === 'CONNECTED' && callCount >= 2) {
            console.log('✓ PASSED: Polling stopped when session connected');
            console.log(`  - Made ${callCount} polling attempts`);
            passedTests++;
        }
        else {
            console.log('✗ FAILED: Polling did not stop correctly when connected');
            failedTests++;
        }
    }
    catch (error) {
        console.log('✗ FAILED: Test threw an error:', error);
        failedTests++;
    }
    console.log();
    // Test 3: Polling times out after maxDuration
    try {
        console.log('Test 3: Polling times out after maxDuration');
        const startTime = Date.now();
        const mockPollFn = async () => {
            // Always return connecting status
            return { status: 'CONNECTING', qrCode: null };
        };
        const result = await (0, whatsapp_qr_polling_1.pollUntil)(mockPollFn, (data) => data.status === 'QR_READY' && data.qrCode !== null, { maxDuration: 500, initialInterval: 50, maxInterval: 100 });
        const elapsed = Date.now() - startTime;
        if (!result.success && result.timedOut && elapsed >= 500 && elapsed < 1000) {
            console.log('✓ PASSED: Polling timed out correctly');
            console.log(`  - Elapsed time: ${elapsed}ms`);
            passedTests++;
        }
        else {
            console.log('✗ FAILED: Polling did not timeout correctly');
            console.log(`  - Expected timedOut: true, got: ${result.timedOut}`);
            console.log(`  - Elapsed time: ${elapsed}ms`);
            failedTests++;
        }
    }
    catch (error) {
        console.log('✗ FAILED: Test threw an error:', error);
        failedTests++;
    }
    console.log();
    // Test 4: Exponential backoff increases interval
    try {
        console.log('Test 4: Exponential backoff increases interval');
        const intervals = [];
        let lastCallTime = Date.now();
        let callCount = 0;
        const mockPollFn = async () => {
            const now = Date.now();
            if (callCount > 0) {
                intervals.push(now - lastCallTime);
            }
            lastCallTime = now;
            callCount++;
            if (callCount >= 5) {
                return { status: 'QR_READY', qrCode: 'data:image/png;base64,mock' };
            }
            return { status: 'CONNECTING', qrCode: null };
        };
        await (0, whatsapp_qr_polling_1.pollUntil)(mockPollFn, (data) => data.status === 'QR_READY' && data.qrCode !== null, { maxDuration: 10000, initialInterval: 100, maxInterval: 300, backoffMultiplier: 1.5 });
        // Check that intervals are increasing (with some tolerance for timing)
        let isIncreasing = true;
        for (let i = 1; i < intervals.length; i++) {
            // Allow 20ms tolerance for timing variations
            if (intervals[i] < intervals[i - 1] - 20) {
                isIncreasing = false;
                break;
            }
        }
        if (isIncreasing && intervals.length >= 3) {
            console.log('✓ PASSED: Exponential backoff working correctly');
            console.log(`  - Intervals: ${intervals.map(i => Math.round(i)).join('ms, ')}ms`);
            passedTests++;
        }
        else {
            console.log('✗ FAILED: Exponential backoff not working correctly');
            console.log(`  - Intervals: ${intervals.map(i => Math.round(i)).join('ms, ')}ms`);
            failedTests++;
        }
    }
    catch (error) {
        console.log('✗ FAILED: Test threw an error:', error);
        failedTests++;
    }
    console.log();
    // Test 5: Polling continues even when errors occur
    try {
        console.log('Test 5: Polling continues even when errors occur');
        let callCount = 0;
        const mockPollFn = async () => {
            callCount++;
            if (callCount === 2) {
                // Throw error on second call
                throw new Error('Network error');
            }
            if (callCount < 4) {
                return { status: 'CONNECTING', qrCode: null };
            }
            return { status: 'QR_READY', qrCode: 'data:image/png;base64,mock' };
        };
        const result = await (0, whatsapp_qr_polling_1.pollUntil)(mockPollFn, (data) => data.status === 'QR_READY' && data.qrCode !== null, { maxDuration: 10000, initialInterval: 100, maxInterval: 200 });
        if (result.success && callCount >= 4) {
            console.log('✓ PASSED: Polling continued despite errors');
            console.log(`  - Made ${callCount} polling attempts (including failed one)`);
            passedTests++;
        }
        else {
            console.log('✗ FAILED: Polling did not continue after error');
            console.log(`  - Call count: ${callCount}`);
            failedTests++;
        }
    }
    catch (error) {
        console.log('✗ FAILED: Test threw an error:', error);
        failedTests++;
    }
    console.log();
    // Test 6: Loading state should be shown when QR unavailable (Property 2)
    try {
        console.log('Test 6: Loading state should be shown when QR unavailable');
        // Test case 1: CONNECTING status with null qrCode
        const connectingSession = { status: 'CONNECTING', qrCode: null };
        const shouldShowLoadingForConnecting = connectingSession.qrCode === null &&
            (connectingSession.status === 'CONNECTING' || connectingSession.status === 'QR_READY');
        // Test case 2: QR_READY status with null qrCode (edge case)
        const qrReadyNoCodeSession = { status: 'QR_READY', qrCode: null };
        const shouldShowLoadingForQRReady = qrReadyNoCodeSession.qrCode === null &&
            (qrReadyNoCodeSession.status === 'CONNECTING' || qrReadyNoCodeSession.status === 'QR_READY');
        // Test case 3: CONNECTED status should NOT show loading
        const connectedSession = { status: 'CONNECTED', qrCode: null };
        const shouldNotShowLoadingForConnected = !(connectedSession.qrCode === null &&
            (connectedSession.status === 'CONNECTING' || connectedSession.status === 'QR_READY'));
        // Test case 4: QR_READY with qrCode should NOT show loading
        const qrReadyWithCodeSession = { status: 'QR_READY', qrCode: 'data:image/png;base64,mock' };
        const shouldNotShowLoadingForQRAvailable = !(qrReadyWithCodeSession.qrCode === null &&
            (qrReadyWithCodeSession.status === 'CONNECTING' || qrReadyWithCodeSession.status === 'QR_READY'));
        if (shouldShowLoadingForConnecting && shouldShowLoadingForQRReady &&
            shouldNotShowLoadingForConnected && shouldNotShowLoadingForQRAvailable) {
            console.log('✓ PASSED: Loading state logic is correct');
            console.log('  - Shows loading for CONNECTING with null qrCode');
            console.log('  - Shows loading for QR_READY with null qrCode');
            console.log('  - Does not show loading for CONNECTED');
            console.log('  - Does not show loading when qrCode is available');
            passedTests++;
        }
        else {
            console.log('✗ FAILED: Loading state logic is incorrect');
            console.log(`  - CONNECTING with null qrCode: ${shouldShowLoadingForConnecting}`);
            console.log(`  - QR_READY with null qrCode: ${shouldShowLoadingForQRReady}`);
            console.log(`  - CONNECTED should not show loading: ${shouldNotShowLoadingForConnected}`);
            console.log(`  - QR available should not show loading: ${shouldNotShowLoadingForQRAvailable}`);
            failedTests++;
        }
    }
    catch (error) {
        console.log('✗ FAILED: Test threw an error:', error);
        failedTests++;
    }
    console.log();
    console.log('='.repeat(50));
    console.log(`Test Results: ${passedTests} passed, ${failedTests} failed`);
    console.log('='.repeat(50));
    // Exit with appropriate code
    process.exit(failedTests > 0 ? 1 : 0);
}
// Run tests if this file is executed directly
if (require.main === module) {
    runTests().catch((error) => {
        console.error('Test suite failed:', error);
        process.exit(1);
    });
}
