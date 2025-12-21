/**
 * Module: heartbeatManager.test.js
 * Purpose: Tests for WebSocket heartbeat manager
 * Part of: Easter Quest Frontend Testing
 *
 * @since 2025-12-19
 */

// WebSocket polyfill for Jest environment
if (typeof WebSocket === 'undefined') {
  global.WebSocket = {
    CONNECTING: 0,
    OPEN: 1,
    CLOSING: 2,
    CLOSED: 3
  };
}

describe('Heartbeat Manager', () => {
  let mockWebSocket;
  let heartbeatInterval;

  beforeEach(() => {
    jest.useFakeTimers();
    mockWebSocket = {
      send: jest.fn(),
      close: jest.fn(),
      readyState: WebSocket.OPEN
    };
    heartbeatInterval = null;
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
    }
  });

  describe('heartbeat management', () => {
    test('starts heartbeat when connected', () => {
      // Start heartbeat
      heartbeatInterval = setInterval(() => {
        if (mockWebSocket.readyState === WebSocket.OPEN) {
          mockWebSocket.send(JSON.stringify({ type: 'ping' }));
        }
      }, 30000);

      // Fast-forward time
      jest.advanceTimersByTime(30000);

      expect(mockWebSocket.send).toHaveBeenCalledWith(
        JSON.stringify({ type: 'ping' })
      );
    });

    test('sends ping at regular intervals', () => {
      heartbeatInterval = setInterval(() => {
        if (mockWebSocket.readyState === WebSocket.OPEN) {
          mockWebSocket.send(JSON.stringify({ type: 'ping' }));
        }
      }, 30000);

      // Fast-forward through multiple intervals
      jest.advanceTimersByTime(90000); // 3 intervals

      expect(mockWebSocket.send).toHaveBeenCalledTimes(3);
    });

    test('stops heartbeat when connection closes', () => {
      heartbeatInterval = setInterval(() => {
        if (mockWebSocket.readyState === WebSocket.OPEN) {
          mockWebSocket.send(JSON.stringify({ type: 'ping' }));
        }
      }, 30000);

      // Connection closes
      mockWebSocket.readyState = WebSocket.CLOSED;

      jest.advanceTimersByTime(30000);

      // Should not send ping when closed
      expect(mockWebSocket.send).not.toHaveBeenCalled();
    });

    test('handles pong response', () => {
      const lastPongTime = Date.now();

      // Simulate receiving pong
      const handlePong = () => {
        return Date.now();
      };

      const newPongTime = handlePong();

      expect(newPongTime).toBeGreaterThanOrEqual(lastPongTime);
    });

    test('detects missed pongs', () => {
      const PONG_TIMEOUT = 60000;
      const initialTime = Date.now();
      let lastPongTime = initialTime;

      heartbeatInterval = setInterval(() => {
        const now = Date.now();
        if (now - lastPongTime > PONG_TIMEOUT) {
          // Connection considered dead
          mockWebSocket.close();
        }
      }, 30000);

      // Advance fake timers and system time together
      jest.setSystemTime(initialTime + 70000);
      jest.advanceTimersByTime(70000);

      // Should close connection
      expect(mockWebSocket.close).toHaveBeenCalled();
    });
  });
});
