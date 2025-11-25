# Circuit Breaker Implementation for AI Providers

## Overview

This document describes the Circuit Breaker pattern implementation for AI providers in the chatbot SaaS platform. The Circuit Breaker protects the system from cascading failures when AI providers experience issues.

## Implementation Details

### Circuit Breaker Service

**Location**: `backend/src/modules/ai/circuit-breaker.service.ts`

The `CircuitBreakerService` implements the Circuit Breaker pattern with three states:

#### States

1. **CLOSED** (Normal Operation)
   - All requests pass through to the AI provider
   - Failure count is tracked
   - Transitions to OPEN after 5 consecutive failures

2. **OPEN** (Circuit Tripped)
   - All requests are blocked
   - Fallback response is returned immediately
   - After 1 minute timeout, transitions to HALF_OPEN

3. **HALF_OPEN** (Testing Recovery)
   - Allows a single test request through
   - On success: transitions back to CLOSED
   - On failure: transitions back to OPEN

#### Configuration

- **Failure Threshold**: 5 failures
- **Reset Timeout**: 60,000 ms (1 minute)
- **Timeout**: 60,000 ms (1 minute)

### Integration with AI Service

**Location**: `backend/src/modules/ai/ai.service.ts`

The Circuit Breaker is integrated into both synchronous and streaming AI operations:

#### Key Methods

1. **generateResponse()**
   - Checks circuit state before making request
   - Records success/failure after request
   - Throws `ServiceUnavailableException` when circuit is OPEN

2. **streamResponse()**
   - Same circuit breaker logic as generateResponse
   - Handles streaming responses with proper error tracking

3. **getCircuitStatus()**
   - Returns current circuit status for a specific provider

4. **getAllCircuitStatuses()**
   - Returns circuit status for all providers

5. **resetCircuit()**
   - Manually resets a circuit (admin function)

### API Endpoints

**Location**: `backend/src/modules/ai/ai.controller.ts`

New endpoints for monitoring and managing circuit breakers:

1. **GET /ai/circuit-breaker/status**
   - Returns circuit breaker status for all AI providers
   - Response includes state, failure count, and timing information

2. **GET /ai/circuit-breaker/status/:provider**
   - Returns circuit breaker status for a specific provider

3. **POST /ai/circuit-breaker/reset/:provider**
   - Manually resets the circuit breaker for a provider
   - Admin-only endpoint

### Fallback Behavior

When a circuit is OPEN, the system returns a user-friendly fallback message:

```
"I apologize, but the AI service is temporarily unavailable. 
Our {provider} provider is experiencing issues. 
Please try again in a few moments."
```

## Benefits

1. **Prevents Cascading Failures**: Stops making requests to failing providers
2. **Fast Failure**: Returns immediately when circuit is open
3. **Automatic Recovery**: Tests provider health and recovers automatically
4. **Monitoring**: Provides visibility into provider health
5. **Manual Control**: Allows admins to manually reset circuits

## Usage Example

### Normal Operation

```typescript
// Circuit is CLOSED, request proceeds normally
const response = await aiService.generateResponse('openai', {
  prompt: 'Hello',
  model: 'gpt-4',
});
```

### Circuit Open

```typescript
// After 5 failures, circuit opens
// Subsequent requests throw ServiceUnavailableException
try {
  const response = await aiService.generateResponse('openai', {
    prompt: 'Hello',
    model: 'gpt-4',
  });
} catch (error) {
  // error.message contains fallback message
  // error.circuitState === 'OPEN'
}
```

### Monitoring

```typescript
// Check circuit status
const status = aiService.getCircuitStatus('openai');
console.log(status);
// {
//   state: 'CLOSED',
//   failureCount: 0,
//   lastFailureTime: null,
//   nextAttemptTime: null,
//   successCount: 42
// }
```

### Manual Reset

```typescript
// Admin can manually reset a circuit
aiService.resetCircuit('openai');
```

## Testing Recommendations

1. **Unit Tests**: Test state transitions and threshold logic
2. **Integration Tests**: Test with actual provider failures
3. **Load Tests**: Verify behavior under high load
4. **Recovery Tests**: Verify automatic recovery after timeout

## Future Enhancements

1. **Configurable Thresholds**: Allow per-provider configuration
2. **Metrics Export**: Export circuit breaker metrics to monitoring systems
3. **Alerting**: Send alerts when circuits open
4. **Dashboard**: Visual representation of circuit states
5. **Adaptive Thresholds**: Adjust thresholds based on historical data

## Related Requirements

- Requirement 6.5: AI provider error handling with fallback responses
