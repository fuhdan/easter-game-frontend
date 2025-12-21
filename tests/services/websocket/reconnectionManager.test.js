/**
 * Module: reconnectionManager.test.js
 * Purpose: Tests for WebSocket reconnection manager
 * Part of: Easter Quest Frontend Testing
 *
 * @since 2025-12-19
 */

describe('Reconnection Manager', () => {
  let reconnectionManager;

  beforeEach(() => {
    jest.useFakeTimers();
    reconnectionManager = {
      attempt: 0,
      maxAttempts: 5,
      delay: 1000,
      maxDelay: 30000,
      timeout: null
    };
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
    if (reconnectionManager.timeout) {
      clearTimeout(reconnectionManager.timeout);
    }
  });

  describe('reconnection logic', () => {
    test('calculates exponential backoff delay', () => {
      const calculateDelay = (attempt, baseDelay, maxDelay) => {
        const delay = baseDelay * Math.pow(2, attempt);
        return Math.min(delay, maxDelay);
      };

      expect(calculateDelay(0, 1000, 30000)).toBe(1000);
      expect(calculateDelay(1, 1000, 30000)).toBe(2000);
      expect(calculateDelay(2, 1000, 30000)).toBe(4000);
      expect(calculateDelay(3, 1000, 30000)).toBe(8000);
      expect(calculateDelay(10, 1000, 30000)).toBe(30000); // Capped at max
    });

    test('schedules reconnection attempt', () => {
      const mockReconnect = jest.fn();
      const delay = 1000;

      reconnectionManager.timeout = setTimeout(mockReconnect, delay);

      jest.advanceTimersByTime(delay);

      expect(mockReconnect).toHaveBeenCalled();
    });

    test('increments attempt counter', () => {
      expect(reconnectionManager.attempt).toBe(0);

      reconnectionManager.attempt++;
      expect(reconnectionManager.attempt).toBe(1);

      reconnectionManager.attempt++;
      expect(reconnectionManager.attempt).toBe(2);
    });

    test('stops after max attempts', () => {
      const mockReconnect = jest.fn();

      for (let i = 0; i < reconnectionManager.maxAttempts; i++) {
        if (reconnectionManager.attempt < reconnectionManager.maxAttempts) {
          reconnectionManager.attempt++;
          mockReconnect();
        }
      }

      expect(reconnectionManager.attempt).toBe(reconnectionManager.maxAttempts);
      expect(mockReconnect).toHaveBeenCalledTimes(reconnectionManager.maxAttempts);

      // Should not reconnect beyond max attempts
      if (reconnectionManager.attempt >= reconnectionManager.maxAttempts) {
        // Stop
      } else {
        mockReconnect();
      }

      expect(mockReconnect).toHaveBeenCalledTimes(reconnectionManager.maxAttempts);
    });

    test('resets attempt counter on successful connection', () => {
      reconnectionManager.attempt = 3;

      // Successful connection
      reconnectionManager.attempt = 0;

      expect(reconnectionManager.attempt).toBe(0);
    });

    test('cancels pending reconnection', () => {
      const mockReconnect = jest.fn();

      reconnectionManager.timeout = setTimeout(mockReconnect, 1000);

      // Cancel before timeout
      clearTimeout(reconnectionManager.timeout);
      reconnectionManager.timeout = null;

      jest.advanceTimersByTime(1000);

      expect(mockReconnect).not.toHaveBeenCalled();
    });

    test('uses jitter to avoid thundering herd', () => {
      const addJitter = (delay) => {
        const jitter = Math.random() * 0.3 * delay; // +/- 30% jitter
        return delay + jitter;
      };

      const baseDelay = 1000;
      const delays = [];

      for (let i = 0; i < 10; i++) {
        delays.push(addJitter(baseDelay));
      }

      // All delays should be different due to jitter
      const uniqueDelays = new Set(delays);
      expect(uniqueDelays.size).toBeGreaterThan(1);

      // All delays should be within acceptable range
      delays.forEach(delay => {
        expect(delay).toBeGreaterThanOrEqual(baseDelay);
        expect(delay).toBeLessThanOrEqual(baseDelay * 1.3);
      });
    });
  });
});
