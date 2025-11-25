import { Injectable, Logger } from '@nestjs/common';

export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

interface CircuitBreakerConfig {
  failureThreshold: number;
  timeout: number; // milliseconds
  resetTimeout: number; // milliseconds
}

export interface CircuitStatus {
  state: CircuitState;
  failureCount: number;
  lastFailureTime: number | null;
  nextAttemptTime: number | null;
  successCount: number;
}

@Injectable()
export class CircuitBreakerService {
  private readonly logger = new Logger(CircuitBreakerService.name);
  private circuits: Map<string, CircuitStatus>;
  private config: CircuitBreakerConfig;

  constructor() {
    this.circuits = new Map<string, CircuitStatus>();
    this.config = {
      failureThreshold: 5,
      timeout: 60000, // 1 minute
      resetTimeout: 60000, // 1 minute before trying HALF_OPEN
    };
  }

  /**
   * Initialize a circuit for a provider if it doesn't exist
   */
  private initCircuit(providerName: string): void {
    if (!this.circuits.has(providerName)) {
      this.circuits.set(providerName, {
        state: CircuitState.CLOSED,
        failureCount: 0,
        lastFailureTime: null,
        nextAttemptTime: null,
        successCount: 0,
      });
      this.logger.log(`Initialized circuit breaker for provider: ${providerName}`);
    }
  }

  /**
   * Get the current state of a circuit
   */
  getState(providerName: string): CircuitState {
    this.initCircuit(providerName);
    const circuit = this.circuits.get(providerName)!;
    
    // Check if we should transition from OPEN to HALF_OPEN
    if (
      circuit.state === CircuitState.OPEN &&
      circuit.nextAttemptTime &&
      Date.now() >= circuit.nextAttemptTime
    ) {
      this.transitionToHalfOpen(providerName);
    }
    
    return circuit.state;
  }

  /**
   * Check if a request can proceed
   */
  canExecute(providerName: string): boolean {
    const state = this.getState(providerName);
    const circuit = this.circuits.get(providerName)!;
    
    if (state === CircuitState.OPEN) {
      const nextAttempt = circuit.nextAttemptTime 
        ? new Date(circuit.nextAttemptTime).toISOString() 
        : 'unknown';
      this.logger.warn(
        `🔴 Circuit breaker is OPEN for provider: ${providerName}. ` +
        `Next retry at: ${nextAttempt}`
      );
      return false;
    }
    
    if (state === CircuitState.HALF_OPEN) {
      this.logger.log(`🟡 Circuit breaker is HALF_OPEN for provider: ${providerName}. Allowing test request.`);
    }
    
    return true;
  }

  /**
   * Record a successful execution
   */
  recordSuccess(providerName: string): void {
    this.initCircuit(providerName);
    const circuit = this.circuits.get(providerName)!;
    
    if (circuit.state === CircuitState.HALF_OPEN) {
      // Successful request in HALF_OPEN state, transition to CLOSED
      this.transitionToClosed(providerName);
      this.logger.log(`Circuit breaker transitioned to CLOSED for provider: ${providerName}`);
    } else if (circuit.state === CircuitState.CLOSED) {
      // Reset failure count on success
      circuit.failureCount = 0;
      circuit.successCount++;
    }
  }

  /**
   * Record a failed execution
   */
  recordFailure(providerName: string, error: Error): void {
    this.initCircuit(providerName);
    const circuit = this.circuits.get(providerName)!;
    
    circuit.failureCount++;
    circuit.lastFailureTime = Date.now();
    
    // Log detailed error information
    this.logger.warn(
      `⚠️  Failure recorded for provider ${providerName}: ${error.message} (${circuit.failureCount}/${this.config.failureThreshold})`,
      error.stack
    );
    
    if (circuit.state === CircuitState.HALF_OPEN) {
      // Failed in HALF_OPEN, go back to OPEN
      this.transitionToOpen(providerName);
      this.logger.error(
        `❌ Circuit breaker transitioned back to OPEN for provider: ${providerName}. ` +
        `Next attempt at: ${new Date(circuit.nextAttemptTime!).toISOString()}`
      );
    } else if (circuit.state === CircuitState.CLOSED) {
      // Check if we've reached the failure threshold
      if (circuit.failureCount >= this.config.failureThreshold) {
        this.transitionToOpen(providerName);
        this.logger.error(
          `🔴 Circuit breaker OPENED for provider: ${providerName} after ${circuit.failureCount} failures. ` +
          `Will retry at: ${new Date(circuit.nextAttemptTime!).toISOString()}`
        );
      }
    }
  }

  /**
   * Transition circuit to CLOSED state
   */
  private transitionToClosed(providerName: string): void {
    const circuit = this.circuits.get(providerName)!;
    circuit.state = CircuitState.CLOSED;
    circuit.failureCount = 0;
    circuit.lastFailureTime = null;
    circuit.nextAttemptTime = null;
    circuit.successCount = 0;
  }

  /**
   * Transition circuit to OPEN state
   */
  private transitionToOpen(providerName: string): void {
    const circuit = this.circuits.get(providerName)!;
    circuit.state = CircuitState.OPEN;
    circuit.nextAttemptTime = Date.now() + this.config.resetTimeout;
  }

  /**
   * Transition circuit to HALF_OPEN state
   */
  private transitionToHalfOpen(providerName: string): void {
    const circuit = this.circuits.get(providerName)!;
    circuit.state = CircuitState.HALF_OPEN;
    circuit.failureCount = 0;
    this.logger.log(`Circuit breaker transitioned to HALF_OPEN for provider: ${providerName}`);
  }

  /**
   * Get circuit status for monitoring
   */
  getCircuitStatus(providerName: string): CircuitStatus | null {
    return this.circuits.get(providerName) || null;
  }

  /**
   * Get all circuit statuses
   */
  getAllCircuitStatuses(): Map<string, CircuitStatus> {
    return new Map(this.circuits);
  }

  /**
   * Reset a circuit manually (for admin purposes)
   */
  resetCircuit(providerName: string): void {
    if (this.circuits.has(providerName)) {
      this.transitionToClosed(providerName);
      this.logger.log(`Circuit breaker manually reset for provider: ${providerName}`);
    }
  }

  /**
   * Get fallback response when circuit is open
   */
  getFallbackResponse(providerName: string): string {
    return `I apologize, but the AI service is temporarily unavailable. Our ${providerName} provider is experiencing issues. Please try again in a few moments.`;
  }
}
