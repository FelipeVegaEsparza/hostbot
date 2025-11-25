import { Test, TestingModule } from '@nestjs/testing';
import { CircuitBreakerService, CircuitState } from './circuit-breaker.service';

describe('CircuitBreakerService', () => {
  let service: CircuitBreakerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CircuitBreakerService],
    }).compile();

    service = module.get<CircuitBreakerService>(CircuitBreakerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('initial state', () => {
    it('should start in CLOSED state', () => {
      const state = service.getState('openai');
      expect(state).toBe(CircuitState.CLOSED);
    });

    it('should allow execution in CLOSED state', () => {
      const canExecute = service.canExecute('openai');
      expect(canExecute).toBe(true);
    });
  });

  describe('recordSuccess', () => {
    it('should reset failure count on success in CLOSED state', () => {
      // Record some failures first
      service.recordFailure('openai', new Error('Test error'));
      service.recordFailure('openai', new Error('Test error'));
      
      // Record success
      service.recordSuccess('openai');
      
      const status = service.getCircuitStatus('openai');
      expect(status.failureCount).toBe(0);
    });

    it('should transition from HALF_OPEN to CLOSED on success', () => {
      // Force circuit to OPEN state
      for (let i = 0; i < 5; i++) {
        service.recordFailure('openai', new Error('Test error'));
      }
      
      expect(service.getState('openai')).toBe(CircuitState.OPEN);
      
      // Manually transition to HALF_OPEN (simulate timeout)
      const status = service.getCircuitStatus('openai');
      status.state = CircuitState.HALF_OPEN;
      
      // Record success
      service.recordSuccess('openai');
      
      expect(service.getState('openai')).toBe(CircuitState.CLOSED);
    });
  });

  describe('recordFailure', () => {
    it('should increment failure count', () => {
      service.recordFailure('openai', new Error('Test error'));
      
      const status = service.getCircuitStatus('openai');
      expect(status.failureCount).toBe(1);
    });

    it('should transition to OPEN after threshold failures', () => {
      // Record 5 failures (threshold)
      for (let i = 0; i < 5; i++) {
        service.recordFailure('openai', new Error('Test error'));
      }
      
      const state = service.getState('openai');
      expect(state).toBe(CircuitState.OPEN);
    });

    it('should not open circuit before threshold', () => {
      // Record 4 failures (below threshold of 5)
      for (let i = 0; i < 4; i++) {
        service.recordFailure('openai', new Error('Test error'));
      }
      
      const state = service.getState('openai');
      expect(state).toBe(CircuitState.CLOSED);
    });

    it('should set lastFailureTime', () => {
      const beforeTime = Date.now();
      service.recordFailure('openai', new Error('Test error'));
      const afterTime = Date.now();
      
      const status = service.getCircuitStatus('openai');
      expect(status.lastFailureTime).toBeGreaterThanOrEqual(beforeTime);
      expect(status.lastFailureTime).toBeLessThanOrEqual(afterTime);
    });

    it('should transition from HALF_OPEN back to OPEN on failure', () => {
      // Force to OPEN
      for (let i = 0; i < 5; i++) {
        service.recordFailure('openai', new Error('Test error'));
      }
      
      // Manually set to HALF_OPEN
      const status = service.getCircuitStatus('openai');
      status.state = CircuitState.HALF_OPEN;
      status.failureCount = 0;
      
      // Record failure
      service.recordFailure('openai', new Error('Test error'));
      
      expect(service.getState('openai')).toBe(CircuitState.OPEN);
    });
  });

  describe('canExecute', () => {
    it('should return true in CLOSED state', () => {
      expect(service.canExecute('openai')).toBe(true);
    });

    it('should return false in OPEN state', () => {
      // Force to OPEN
      for (let i = 0; i < 5; i++) {
        service.recordFailure('openai', new Error('Test error'));
      }
      
      expect(service.canExecute('openai')).toBe(false);
    });

    it('should return true in HALF_OPEN state', () => {
      // Force to OPEN
      for (let i = 0; i < 5; i++) {
        service.recordFailure('openai', new Error('Test error'));
      }
      
      // Manually set to HALF_OPEN
      const status = service.getCircuitStatus('openai');
      status.state = CircuitState.HALF_OPEN;
      
      expect(service.canExecute('openai')).toBe(true);
    });
  });

  describe('getState', () => {
    it('should transition from OPEN to HALF_OPEN after timeout', () => {
      // Force to OPEN
      for (let i = 0; i < 5; i++) {
        service.recordFailure('openai', new Error('Test error'));
      }
      
      expect(service.getState('openai')).toBe(CircuitState.OPEN);
      
      // Manually set nextAttemptTime to past
      const status = service.getCircuitStatus('openai');
      status.nextAttemptTime = Date.now() - 1000;
      
      // Getting state should trigger transition
      const newState = service.getState('openai');
      expect(newState).toBe(CircuitState.HALF_OPEN);
    });

    it('should remain OPEN if timeout not reached', () => {
      // Force to OPEN
      for (let i = 0; i < 5; i++) {
        service.recordFailure('openai', new Error('Test error'));
      }
      
      const state = service.getState('openai');
      expect(state).toBe(CircuitState.OPEN);
    });
  });

  describe('getCircuitStatus', () => {
    it('should return null for non-existent circuit', () => {
      const status = service.getCircuitStatus('non-existent');
      expect(status).toBeNull();
    });

    it('should return status for existing circuit', () => {
      service.recordFailure('openai', new Error('Test error'));
      
      const status = service.getCircuitStatus('openai');
      expect(status).toBeDefined();
      expect(status.state).toBe(CircuitState.CLOSED);
      expect(status.failureCount).toBe(1);
    });
  });

  describe('getAllCircuitStatuses', () => {
    it('should return all circuit statuses', () => {
      service.recordFailure('openai', new Error('Test error'));
      service.recordFailure('anthropic', new Error('Test error'));
      
      const statuses = service.getAllCircuitStatuses();
      expect(statuses.size).toBe(2);
      expect(statuses.has('openai')).toBe(true);
      expect(statuses.has('anthropic')).toBe(true);
    });

    it('should return empty map if no circuits initialized', () => {
      const statuses = service.getAllCircuitStatuses();
      expect(statuses.size).toBe(0);
    });
  });

  describe('resetCircuit', () => {
    it('should reset circuit to CLOSED state', () => {
      // Force to OPEN
      for (let i = 0; i < 5; i++) {
        service.recordFailure('openai', new Error('Test error'));
      }
      
      expect(service.getState('openai')).toBe(CircuitState.OPEN);
      
      // Reset
      service.resetCircuit('openai');
      
      const status = service.getCircuitStatus('openai');
      expect(status.state).toBe(CircuitState.CLOSED);
      expect(status.failureCount).toBe(0);
      expect(status.lastFailureTime).toBeNull();
      expect(status.nextAttemptTime).toBeNull();
    });

    it('should do nothing for non-existent circuit', () => {
      expect(() => service.resetCircuit('non-existent')).not.toThrow();
    });
  });

  describe('getFallbackResponse', () => {
    it('should return fallback message', () => {
      const message = service.getFallbackResponse('openai');
      expect(message).toContain('openai');
      expect(message).toContain('temporarily unavailable');
    });
  });

  describe('multiple providers', () => {
    it('should maintain separate state for each provider', () => {
      // Fail openai 5 times
      for (let i = 0; i < 5; i++) {
        service.recordFailure('openai', new Error('Test error'));
      }
      
      // Fail anthropic 2 times
      for (let i = 0; i < 2; i++) {
        service.recordFailure('anthropic', new Error('Test error'));
      }
      
      expect(service.getState('openai')).toBe(CircuitState.OPEN);
      expect(service.getState('anthropic')).toBe(CircuitState.CLOSED);
      
      const openaiStatus = service.getCircuitStatus('openai');
      const anthropicStatus = service.getCircuitStatus('anthropic');
      
      expect(openaiStatus.failureCount).toBe(5);
      expect(anthropicStatus.failureCount).toBe(2);
    });
  });
});
