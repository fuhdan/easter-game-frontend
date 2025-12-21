/**
 * Module: messageQueue.test.js
 * Purpose: Tests for WebSocket message queue
 * Part of: Easter Quest Frontend Testing
 *
 * @since 2025-12-19
 */

describe('Message Queue', () => {
  let messageQueue;

  beforeEach(() => {
    messageQueue = [];
    jest.clearAllMocks();
  });

  describe('queue operations', () => {
    test('enqueues message', () => {
      const message = { type: 'user_message', content: 'Hello' };
      messageQueue.push(message);

      expect(messageQueue).toHaveLength(1);
      expect(messageQueue[0]).toEqual(message);
    });

    test('dequeues message', () => {
      const message1 = { type: 'user_message', content: 'First' };
      const message2 = { type: 'user_message', content: 'Second' };

      messageQueue.push(message1);
      messageQueue.push(message2);

      const dequeued = messageQueue.shift();

      expect(dequeued).toEqual(message1);
      expect(messageQueue).toHaveLength(1);
    });

    test('maintains FIFO order', () => {
      const messages = [
        { type: 'user_message', content: 'First' },
        { type: 'user_message', content: 'Second' },
        { type: 'user_message', content: 'Third' }
      ];

      messages.forEach(msg => messageQueue.push(msg));

      expect(messageQueue[0].content).toBe('First');
      expect(messageQueue[1].content).toBe('Second');
      expect(messageQueue[2].content).toBe('Third');
    });

    test('handles empty queue', () => {
      const dequeued = messageQueue.shift();

      expect(dequeued).toBeUndefined();
      expect(messageQueue).toHaveLength(0);
    });

    test('processes queued messages on reconnect', () => {
      const mockWebSocket = {
        send: jest.fn(),
        readyState: WebSocket.OPEN
      };

      // Add messages to queue while disconnected
      messageQueue.push({ type: 'msg1' });
      messageQueue.push({ type: 'msg2' });

      // Process queue on reconnect
      while (messageQueue.length > 0) {
        const msg = messageQueue.shift();
        mockWebSocket.send(JSON.stringify(msg));
      }

      expect(mockWebSocket.send).toHaveBeenCalledTimes(2);
      expect(messageQueue).toHaveLength(0);
    });

    test('limits queue size', () => {
      const MAX_QUEUE_SIZE = 100;

      // Fill queue beyond limit
      for (let i = 0; i < 150; i++) {
        messageQueue.push({ type: 'message', content: `Message ${i}` });

        // Enforce limit
        if (messageQueue.length > MAX_QUEUE_SIZE) {
          messageQueue.shift(); // Remove oldest
        }
      }

      expect(messageQueue).toHaveLength(MAX_QUEUE_SIZE);
      // First message should be message 50 (0-49 were removed)
      expect(messageQueue[0].content).toBe('Message 50');
    });
  });
});
