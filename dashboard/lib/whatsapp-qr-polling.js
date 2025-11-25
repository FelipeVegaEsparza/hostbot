"use strict";
/**
 * Polling utility for WhatsApp QR code generation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.pollUntil = pollUntil;
/**
 * Polls a function until a condition is met or timeout occurs
 * Implements exponential backoff for polling intervals
 */
async function pollUntil(pollFn, conditionFn, options = {}) {
    const { maxDuration = 30000, // 30 seconds default
    initialInterval = 1000, // 1 second default
    maxInterval = 3000, // 3 seconds default
    backoffMultiplier = 1.5, } = options;
    const startTime = Date.now();
    let interval = initialInterval;
    let lastData;
    while (Date.now() - startTime < maxDuration) {
        try {
            const data = await pollFn();
            lastData = data;
            // Check if condition is met
            if (conditionFn(data)) {
                return {
                    success: true,
                    data,
                    timedOut: false,
                };
            }
            // Wait before next poll with exponential backoff
            await new Promise((resolve) => setTimeout(resolve, interval));
            interval = Math.min(interval * backoffMultiplier, maxInterval);
        }
        catch (error) {
            console.error('Error during polling:', error);
            // Continue polling even on error
            await new Promise((resolve) => setTimeout(resolve, interval));
            interval = Math.min(interval * backoffMultiplier, maxInterval);
        }
    }
    // Timeout reached
    return {
        success: false,
        data: lastData,
        timedOut: true,
    };
}
