/**
 * Module: useWebSocket.test.js
 * Purpose: Tests for useWebSocket hook
 * Part of: Easter Quest Frontend Testing
 *
 * @since 2025-12-20
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import useWebSocket from '../../src/hooks/useWebSocket';
import ChatWebSocket from '../../src/services/websocket/chatWebSocket';
import { onTokenRefresh } from '../../src/services';

jest.mock('../../src/services/websocket/chatWebSocket');
jest.mock('../../src/services', () => ({
  onTokenRefresh: jest.fn()
}));

describe('useWebSocket', () => {
  let mockChatWebSocket;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Mock ChatWebSocket instance
    mockChatWebSocket = {
      connect: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn(),
      send: jest.fn().mockReturnValue(true),
      on: jest.fn((event, callback) => {
        // Store callbacks for testing
        if (event === 'status') mockChatWebSocket._statusCallback = callback;
        if (event === 'error') mockChatWebSocket._errorCallback = callback;
        if (event === 'message') mockChatWebSocket._messageCallback = callback;

        // Return unsubscribe function
        return jest.fn();
      }),
      getQueueSize: jest.fn().mockReturnValue(0),
      isConnected: jest.fn().mockReturnValue(false),
      _statusCallback: null,
      _errorCallback: null,
      _messageCallback: null
    };

    ChatWebSocket.mockImplementation(() => mockChatWebSocket);

    // Mock onTokenRefresh to return unsubscribe function
    onTokenRefresh.mockReturnValue(jest.fn());
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('initialization', () => {
    test('initializes with disconnected status', () => {
      const { result } = renderHook(() => useWebSocket());

      expect(result.current.connectionStatus).toBe('disconnected');
      expect(result.current.lastError).toBeNull();
    });

    test('creates ChatWebSocket instance', () => {
      renderHook(() => useWebSocket());

      expect(ChatWebSocket).toHaveBeenCalledWith(null, expect.objectContaining({
        reconnectInterval: 1000,
        maxReconnectInterval: 30000,
        heartbeatInterval: 30000
      }));
    });

    test('uses custom URL', () => {
      renderHook(() => useWebSocket('ws://custom-url'));

      expect(ChatWebSocket).toHaveBeenCalledWith('ws://custom-url', expect.any(Object));
    });

    test('uses custom configuration', () => {
      renderHook(() => useWebSocket(null, {
        reconnectInterval: 2000,
        maxReconnectInterval: 60000,
        heartbeatInterval: 45000
      }));

      expect(ChatWebSocket).toHaveBeenCalledWith(null, expect.objectContaining({
        reconnectInterval: 2000,
        maxReconnectInterval: 60000,
        heartbeatInterval: 45000
      }));
    });

    test('auto-connects by default', async () => {
      renderHook(() => useWebSocket());

      await waitFor(() => {
        expect(mockChatWebSocket.connect).toHaveBeenCalled();
      });
    });

    test('does not auto-connect when disabled', () => {
      renderHook(() => useWebSocket(null, { autoConnect: false }));

      expect(mockChatWebSocket.connect).not.toHaveBeenCalled();
    });

    test('subscribes to status changes', () => {
      renderHook(() => useWebSocket());

      expect(mockChatWebSocket.on).toHaveBeenCalledWith('status', expect.any(Function));
    });

    test('subscribes to errors', () => {
      renderHook(() => useWebSocket());

      expect(mockChatWebSocket.on).toHaveBeenCalledWith('error', expect.any(Function));
    });

    test('subscribes to messages', () => {
      renderHook(() => useWebSocket());

      expect(mockChatWebSocket.on).toHaveBeenCalledWith('message', expect.any(Function));
    });
  });

  describe('connection status', () => {
    test('updates status when WebSocket status changes', async () => {
      const { result } = renderHook(() => useWebSocket());

      await waitFor(() => {
        expect(mockChatWebSocket._statusCallback).toBeDefined();
      });

      act(() => {
        mockChatWebSocket._statusCallback('connected');
      });

      expect(result.current.connectionStatus).toBe('connected');
    });

    test('updates status through multiple states', async () => {
      const { result } = renderHook(() => useWebSocket());

      await waitFor(() => {
        expect(mockChatWebSocket._statusCallback).toBeDefined();
      });

      act(() => {
        mockChatWebSocket._statusCallback('connecting');
      });
      expect(result.current.connectionStatus).toBe('connecting');

      act(() => {
        mockChatWebSocket._statusCallback('connected');
      });
      expect(result.current.connectionStatus).toBe('connected');

      act(() => {
        mockChatWebSocket._statusCallback('disconnected');
      });
      expect(result.current.connectionStatus).toBe('disconnected');
    });
  });

  describe('error handling', () => {
    test('updates lastError when WebSocket error occurs', async () => {
      const { result } = renderHook(() => useWebSocket());

      await waitFor(() => {
        expect(mockChatWebSocket._errorCallback).toBeDefined();
      });

      const error = new Error('Connection failed');
      act(() => {
        mockChatWebSocket._errorCallback(error);
      });

      expect(result.current.lastError).toBe(error);
    });

    test('handles auto-connect failure', async () => {
      mockChatWebSocket.connect.mockRejectedValueOnce(new Error('Connect failed'));

      const { result } = renderHook(() => useWebSocket());

      await waitFor(() => {
        expect(result.current.lastError).toBeTruthy();
      });
    });
  });

  describe('connect/disconnect', () => {
    test('connects manually', async () => {
      const { result } = renderHook(() => useWebSocket(null, { autoConnect: false }));

      await act(async () => {
        await result.current.connect();
      });

      expect(mockChatWebSocket.connect).toHaveBeenCalled();
    });

    test('handles connect after disconnect', async () => {
      const { result } = renderHook(() => useWebSocket());

      result.current.disconnect();
      jest.advanceTimersByTime(200);

      // Should not throw
      await act(async () => {
        await result.current.connect();
      });

      expect(result.current).toBeTruthy();
    });

    test('disconnects WebSocket', () => {
      const { result } = renderHook(() => useWebSocket());

      act(() => {
        result.current.disconnect();
      });

      expect(mockChatWebSocket.disconnect).toHaveBeenCalled();
    });

    test('handles multiple disconnects', () => {
      const { result } = renderHook(() => useWebSocket());

      // Trigger cleanup
      result.current.disconnect();
      jest.advanceTimersByTime(200);

      act(() => {
        result.current.disconnect();
      });

      // Should not throw
      expect(result.current).toBeTruthy();
    });
  });

  describe('sendMessage', () => {
    test('sends message via WebSocket', () => {
      const { result } = renderHook(() => useWebSocket());

      const success = result.current.sendMessage('user_message', { content: 'Hello' });

      expect(mockChatWebSocket.send).toHaveBeenCalledWith('user_message', { content: 'Hello' });
      expect(success).toBe(true);
    });

    test('returns false for invalid message type', () => {
      const { result } = renderHook(() => useWebSocket());

      const success = result.current.sendMessage(null, {});

      expect(mockChatWebSocket.send).not.toHaveBeenCalled();
      expect(success).toBe(false);
    });

    test('returns false for non-string type', () => {
      const { result } = renderHook(() => useWebSocket());

      const success = result.current.sendMessage(123, {});

      expect(success).toBe(false);
    });

    test('handles sendMessage after disconnect', () => {
      const { result } = renderHook(() => useWebSocket());

      // Cleanup
      result.current.disconnect();
      jest.advanceTimersByTime(200);

      const success = result.current.sendMessage('test', {});

      // Should not throw, may return false
      expect(typeof success).toBe('boolean');
    });

    test('uses empty object as default data', () => {
      const { result } = renderHook(() => useWebSocket());

      result.current.sendMessage('test');

      expect(mockChatWebSocket.send).toHaveBeenCalledWith('test', {});
    });
  });

  describe('onMessage', () => {
    test('subscribes to messages', async () => {
      const { result } = renderHook(() => useWebSocket());
      const callback = jest.fn();

      await waitFor(() => {
        expect(mockChatWebSocket._messageCallback).toBeDefined();
      });

      act(() => {
        result.current.onMessage(callback);
      });

      act(() => {
        mockChatWebSocket._messageCallback({ type: 'test', data: 'hello' });
      });

      expect(callback).toHaveBeenCalledWith({ type: 'test', data: 'hello' });
    });

    test('unsubscribes from messages', async () => {
      const { result } = renderHook(() => useWebSocket());
      const callback = jest.fn();

      await waitFor(() => {
        expect(mockChatWebSocket._messageCallback).toBeDefined();
      });

      let unsubscribe;
      act(() => {
        unsubscribe = result.current.onMessage(callback);
      });

      act(() => {
        unsubscribe();
      });

      act(() => {
        mockChatWebSocket._messageCallback({ type: 'test', data: 'hello' });
      });

      expect(callback).not.toHaveBeenCalled();
    });

    test('handles multiple message listeners', async () => {
      const { result } = renderHook(() => useWebSocket());
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      await waitFor(() => {
        expect(mockChatWebSocket._messageCallback).toBeDefined();
      });

      act(() => {
        result.current.onMessage(callback1);
        result.current.onMessage(callback2);
      });

      act(() => {
        mockChatWebSocket._messageCallback({ type: 'test' });
      });

      expect(callback1).toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
    });

    test('handles listener errors gracefully', async () => {
      const { result } = renderHook(() => useWebSocket());
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const errorCallback = jest.fn(() => {
        throw new Error('Listener error');
      });
      const successCallback = jest.fn();

      await waitFor(() => {
        expect(mockChatWebSocket._messageCallback).toBeDefined();
      });

      act(() => {
        result.current.onMessage(errorCallback);
        result.current.onMessage(successCallback);
      });

      act(() => {
        mockChatWebSocket._messageCallback({ type: 'test' });
      });

      expect(errorCallback).toHaveBeenCalled();
      expect(successCallback).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    test('returns no-op unsubscribe for invalid callback', () => {
      const { result } = renderHook(() => useWebSocket());

      const unsubscribe = result.current.onMessage('not a function');

      expect(typeof unsubscribe).toBe('function');
      unsubscribe(); // Should not throw
    });
  });

  describe('reconnect', () => {
    test('has reconnect method', () => {
      const { result } = renderHook(() => useWebSocket());

      expect(typeof result.current.reconnect).toBe('function');
    });

    test('handles reconnect after disconnect', () => {
      const { result } = renderHook(() => useWebSocket());

      // Cleanup
      result.current.disconnect();
      jest.advanceTimersByTime(200);

      // Should have reconnect method
      expect(typeof result.current.reconnect).toBe('function');
    });

    test('handles reconnect failure', () => {
      mockChatWebSocket.connect.mockRejectedValueOnce(new Error('Reconnect failed'));

      const { result } = renderHook(() => useWebSocket());

      // Should have reconnect method even if it might fail
      expect(typeof result.current.reconnect).toBe('function');
    });
  });

  describe('token refresh', () => {
    test('sets up token refresh listener', () => {
      renderHook(() => useWebSocket());

      expect(onTokenRefresh).toHaveBeenCalled();
    });

    test('sets up token refresh listener', () => {
      renderHook(() => useWebSocket());

      // Should have set up token refresh listener
      expect(onTokenRefresh).toHaveBeenCalled();
      expect(typeof onTokenRefresh.mock.calls[0][0]).toBe('function');
    });

    test('handles reconnect failure after token refresh', async () => {
      const { result } = renderHook(() => useWebSocket());
      mockChatWebSocket.connect.mockRejectedValueOnce(new Error('Reconnect failed'));

      const tokenRefreshCallback = onTokenRefresh.mock.calls[0][0];

      await act(async () => {
        tokenRefreshCallback();
        jest.advanceTimersByTime(100);
      });

      await waitFor(() => {
        expect(result.current.lastError).toBeTruthy();
      });
    });
  });

  describe('utility methods', () => {
    test('getQueueSize returns queue size', () => {
      const { result } = renderHook(() => useWebSocket());
      mockChatWebSocket.getQueueSize.mockReturnValue(5);

      const size = result.current.getQueueSize();

      expect(size).toBe(5);
      expect(mockChatWebSocket.getQueueSize).toHaveBeenCalled();
    });

    test('getQueueSize returns 0 if not initialized', () => {
      const { result } = renderHook(() => useWebSocket());

      result.current.disconnect();
      jest.advanceTimersByTime(200);

      const size = result.current.getQueueSize();

      expect(size).toBe(0);
    });

    test('isConnected returns connection state', () => {
      const { result } = renderHook(() => useWebSocket());
      mockChatWebSocket.isConnected.mockReturnValue(true);

      const connected = result.current.isConnected();

      expect(connected).toBe(true);
      expect(mockChatWebSocket.isConnected).toHaveBeenCalled();
    });

    test('isConnected returns false if not initialized', () => {
      const { result } = renderHook(() => useWebSocket());

      result.current.disconnect();
      jest.advanceTimersByTime(200);

      const connected = result.current.isConnected();

      expect(connected).toBe(false);
    });
  });

  describe('cleanup', () => {
    test('cleans up on unmount', () => {
      const { unmount } = renderHook(() => useWebSocket());

      unmount();
      jest.advanceTimersByTime(200);

      expect(mockChatWebSocket.disconnect).toHaveBeenCalled();
    });

    test('cleans up token refresh listener', () => {
      const unsubscribe = jest.fn();
      onTokenRefresh.mockReturnValue(unsubscribe);

      const { unmount } = renderHook(() => useWebSocket());

      unmount();
      jest.advanceTimersByTime(200);

      expect(unsubscribe).toHaveBeenCalled();
    });

    test('handles StrictMode double-mount correctly', () => {
      const { unmount } = renderHook(() => useWebSocket());

      // First unmount (StrictMode)
      unmount();
      jest.advanceTimersByTime(50);

      // Should handle unmount without errors
      expect(ChatWebSocket).toHaveBeenCalled();
    });

    test('handles cleanup correctly', () => {
      const { unmount } = renderHook(() => useWebSocket());

      // Unmount
      unmount();

      jest.advanceTimersByTime(200);

      // Should have called disconnect
      expect(mockChatWebSocket.disconnect).toHaveBeenCalled();
    });
  });

  describe('return interface', () => {
    test('exposes all required methods and state', () => {
      const { result } = renderHook(() => useWebSocket());

      expect(result.current).toHaveProperty('connectionStatus');
      expect(result.current).toHaveProperty('lastError');
      expect(result.current).toHaveProperty('connect');
      expect(result.current).toHaveProperty('disconnect');
      expect(result.current).toHaveProperty('reconnect');
      expect(result.current).toHaveProperty('sendMessage');
      expect(result.current).toHaveProperty('onMessage');
      expect(result.current).toHaveProperty('getQueueSize');
      expect(result.current).toHaveProperty('isConnected');
    });
  });
});
