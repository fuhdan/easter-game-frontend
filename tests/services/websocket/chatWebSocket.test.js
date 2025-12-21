/**
 * Module: chatWebSocket.test.js
 * Purpose: Tests for chatWebSocket service
 * Part of: Easter Quest Frontend Testing
 *
 * @since 2025-12-19
 */

import ChatWebSocket from '../../../src/services/websocket/chatWebSocket';

// Mock the manager modules
jest.mock('../../../src/services/websocket/reconnectionManager');
jest.mock('../../../src/services/websocket/messageQueue');
jest.mock('../../../src/services/websocket/heartbeatManager');

import { ReconnectionManager } from '../../../src/services/websocket/reconnectionManager';
import { MessageQueue } from '../../../src/services/websocket/messageQueue';
import { HeartbeatManager } from '../../../src/services/websocket/heartbeatManager';

// Mock WebSocket
class WebSocketMock {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  constructor(url) {
    this.url = url;
    this.readyState = WebSocketMock.CONNECTING;
    this.onopen = null;
    this.onclose = null;
    this.onerror = null;
    this.onmessage = null;
  }

  send = jest.fn();
  close = jest.fn();
}

global.WebSocket = WebSocketMock;

describe('ChatWebSocket Service', () => {
  let chatWs;
  let mockReconnectionManager;
  let mockMessageQueue;
  let mockHeartbeatManager;

  beforeEach(() => {
    // Mock ReconnectionManager
    mockReconnectionManager = {
      resetAttempts: jest.fn(),
      scheduleReconnect: jest.fn().mockResolvedValue(undefined),
      clearTimer: jest.fn()
    };
    ReconnectionManager.mockImplementation(() => mockReconnectionManager);

    // Mock MessageQueue
    mockMessageQueue = {
      enqueue: jest.fn(),
      flush: jest.fn(),
      isEmpty: jest.fn().mockReturnValue(false),
      size: jest.fn().mockReturnValue(0)
    };
    MessageQueue.mockImplementation(() => mockMessageQueue);

    // Mock HeartbeatManager
    mockHeartbeatManager = {
      start: jest.fn(),
      stop: jest.fn()
    };
    HeartbeatManager.mockImplementation(() => mockHeartbeatManager);

    jest.clearAllMocks();
    console.log = jest.fn();
    console.error = jest.fn();
  });

  afterEach(() => {
    if (chatWs) {
      chatWs.disconnect();
    }
  });

  describe('constructor', () => {
    test('creates instance with default URL', () => {
      // Mock window.location
      delete window.location;
      window.location = { protocol: 'http:', host: 'localhost:3000' };

      chatWs = new ChatWebSocket();

      expect(chatWs.url).toBe('ws://localhost:3000/ws/chat');
      expect(chatWs.status).toBe('disconnected');
    });

    test('creates instance with custom URL', () => {
      chatWs = new ChatWebSocket('ws://custom:8000/ws');

      expect(chatWs.url).toBe('ws://custom:8000/ws');
    });

    test('uses wss for https protocol', () => {
      delete window.location;
      window.location = { protocol: 'https:', host: 'example.com' };

      chatWs = new ChatWebSocket();

      expect(chatWs.url).toBe('wss://example.com/ws/chat');
    });

    test('initializes managers', () => {
      chatWs = new ChatWebSocket();

      expect(ReconnectionManager).toHaveBeenCalled();
      expect(MessageQueue).toHaveBeenCalled();
      expect(HeartbeatManager).toHaveBeenCalled();
    });
  });

  describe('connect', () => {
    beforeEach(() => {
      chatWs = new ChatWebSocket('ws://localhost:8000/ws/chat');
    });

    test('establishes WebSocket connection', async () => {
      const connectPromise = chatWs.connect();

      expect(chatWs.status).toBe('connecting');

      // Simulate successful connection
      chatWs.ws.readyState = WebSocketMock.OPEN;
      chatWs.ws.onopen();

      await connectPromise;

      expect(chatWs.status).toBe('connected');
      expect(mockReconnectionManager.resetAttempts).toHaveBeenCalled();
      expect(mockHeartbeatManager.start).toHaveBeenCalled();
    });

    test('does not reconnect if already connecting', async () => {
      chatWs.ws = new WebSocketMock('ws://test');
      chatWs.ws.readyState = WebSocketMock.CONNECTING;

      await chatWs.connect();

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Already connected or connecting')
      );
    });

    test('does not reconnect if already connected', async () => {
      chatWs.ws = new WebSocketMock('ws://test');
      chatWs.ws.readyState = WebSocketMock.OPEN;

      await chatWs.connect();

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Already connected or connecting')
      );
    });
  });

  describe('disconnect', () => {
    beforeEach(() => {
      chatWs = new ChatWebSocket('ws://localhost:8000/ws/chat');
    });

    test('closes WebSocket connection', () => {
      chatWs.ws = new WebSocketMock('ws://test');
      chatWs.ws.readyState = WebSocketMock.OPEN;

      // Save reference to ws before disconnect() sets it to null
      const mockWs = chatWs.ws;

      chatWs.disconnect();

      expect(mockWs.close).toHaveBeenCalledWith(1000, 'Manual disconnect');
      expect(chatWs.manualClose).toBe(true);
      expect(chatWs.status).toBe('disconnected');
      expect(chatWs.ws).toBe(null);
      expect(mockHeartbeatManager.stop).toHaveBeenCalled();
    });

    test('clears reconnection timer', () => {
      chatWs.disconnect();

      expect(mockReconnectionManager.clearTimer).toHaveBeenCalled();
    });
  });

  describe('send', () => {
    beforeEach(() => {
      chatWs = new ChatWebSocket('ws://localhost:8000/ws/chat');
      chatWs.ws = new WebSocketMock('ws://test');
    });

    test('sends message when connected', () => {
      chatWs.status = 'connected';
      chatWs.ws.readyState = WebSocketMock.OPEN;

      const result = chatWs.send('user_message', { content: 'Hello' });

      expect(chatWs.ws.send).toHaveBeenCalledWith(
        JSON.stringify({ type: 'user_message', content: 'Hello' })
      );
      expect(result).toBe(true);
    });

    test('queues message when disconnected', () => {
      chatWs.status = 'disconnected';

      const result = chatWs.send('user_message', { content: 'Hello' });

      expect(mockMessageQueue.enqueue).toHaveBeenCalledWith({
        type: 'user_message',
        content: 'Hello'
      });
      expect(result).toBe(false);
    });

    test('queues message on send error', () => {
      chatWs.status = 'connected';
      chatWs.ws.readyState = WebSocketMock.OPEN;
      chatWs.ws.send.mockImplementation(() => {
        throw new Error('Send failed');
      });

      const result = chatWs.send('user_message', { content: 'Hello' });

      expect(mockMessageQueue.enqueue).toHaveBeenCalled();
      expect(result).toBe(false);
    });
  });

  describe('message handling', () => {
    beforeEach(() => {
      chatWs = new ChatWebSocket('ws://localhost:8000/ws/chat');
    });

    test('handles incoming message', async () => {
      const messageHandler = jest.fn();
      chatWs.on('message', messageHandler);

      const connectPromise = chatWs.connect();
      chatWs.ws.readyState = WebSocketMock.OPEN;
      chatWs.ws.onopen();
      await connectPromise;

      // Simulate incoming message
      const testMessage = { type: 'ai_response', content: 'Hello' };
      chatWs.ws.onmessage({ data: JSON.stringify(testMessage) });

      expect(messageHandler).toHaveBeenCalledWith(testMessage);
    });

    test('handles pong message', async () => {
      const messageHandler = jest.fn();
      chatWs.on('message', messageHandler);

      const connectPromise = chatWs.connect();
      chatWs.ws.readyState = WebSocketMock.OPEN;
      chatWs.ws.onopen();
      await connectPromise;

      // Simulate pong message
      chatWs.ws.onmessage({ data: JSON.stringify({ type: 'pong' }) });

      // Pong should not be emitted to message listeners
      expect(messageHandler).not.toHaveBeenCalled();
    });

    test('handles invalid JSON', async () => {
      const connectPromise = chatWs.connect();
      chatWs.ws.readyState = WebSocketMock.OPEN;
      chatWs.ws.onopen();
      await connectPromise;

      chatWs.ws.onmessage({ data: 'invalid json' });

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to parse message'),
        expect.any(Error)
      );
    });
  });

  describe('event listeners', () => {
    beforeEach(() => {
      chatWs = new ChatWebSocket('ws://localhost:8000/ws/chat');
    });

    test('subscribes to events', () => {
      const handler = jest.fn();
      const unsubscribe = chatWs.on('message', handler);

      chatWs.emit('message', { test: 'data' });

      expect(handler).toHaveBeenCalledWith({ test: 'data' });

      // Unsubscribe
      unsubscribe();
      chatWs.emit('message', { test: 'data2' });

      expect(handler).toHaveBeenCalledTimes(1);
    });

    test('emits status changes', async () => {
      const statusHandler = jest.fn();
      chatWs.on('status', statusHandler);

      const connectPromise = chatWs.connect();
      expect(statusHandler).toHaveBeenCalledWith('connecting');

      chatWs.ws.readyState = WebSocketMock.OPEN;
      chatWs.ws.onopen();
      await connectPromise;

      expect(statusHandler).toHaveBeenCalledWith('connected');
    });

    test('emits close event', async () => {
      const closeHandler = jest.fn();
      chatWs.on('close', closeHandler);

      const connectPromise = chatWs.connect();
      chatWs.ws.readyState = WebSocketMock.OPEN;
      chatWs.ws.onopen();
      await connectPromise;

      chatWs.ws.onclose({ code: 1000, reason: 'Normal close' });

      expect(closeHandler).toHaveBeenCalledWith({
        code: 1000,
        reason: 'Normal close'
      });
    });
  });

  describe('reconnection', () => {
    beforeEach(() => {
      chatWs = new ChatWebSocket('ws://localhost:8000/ws/chat');
    });

    test('schedules reconnection on disconnect', async () => {
      const connectPromise = chatWs.connect();
      chatWs.ws.readyState = WebSocketMock.OPEN;
      chatWs.ws.onopen();
      await connectPromise;

      chatWs.ws.onclose({ code: 1006, reason: 'Abnormal closure' });

      expect(mockReconnectionManager.scheduleReconnect).toHaveBeenCalled();
    });

    test('does not reconnect on manual disconnect', async () => {
      const connectPromise = chatWs.connect();
      chatWs.ws.readyState = WebSocketMock.OPEN;
      chatWs.ws.onopen();
      await connectPromise;

      chatWs.manualClose = true;
      chatWs.ws.onclose({ code: 1000, reason: 'Manual disconnect' });

      expect(mockReconnectionManager.scheduleReconnect).not.toHaveBeenCalled();
    });

    test('does not reconnect on logout', async () => {
      const connectPromise = chatWs.connect();
      chatWs.ws.readyState = WebSocketMock.OPEN;
      chatWs.ws.onopen();
      await connectPromise;

      chatWs.ws.onclose({ code: 1000, reason: 'Logout' });

      expect(chatWs.manualClose).toBe(true);
      expect(mockReconnectionManager.scheduleReconnect).not.toHaveBeenCalled();
    });
  });

  describe('utility methods', () => {
    beforeEach(() => {
      chatWs = new ChatWebSocket('ws://localhost:8000/ws/chat');
    });

    test('getStatus returns current status', () => {
      expect(chatWs.getStatus()).toBe('disconnected');
    });

    test('isConnected checks connection state', async () => {
      expect(chatWs.isConnected()).toBe(false);

      const connectPromise = chatWs.connect();
      chatWs.ws.readyState = WebSocketMock.OPEN;
      chatWs.ws.onopen();
      await connectPromise;

      expect(chatWs.isConnected()).toBe(true);
    });

    test('getQueueSize returns queue size', () => {
      mockMessageQueue.size.mockReturnValue(5);

      expect(chatWs.getQueueSize()).toBe(5);
    });
  });
});
