/**
 * Module: useSSE.test.js
 * Purpose: Tests for useSSE hook
 * Part of: Easter Quest Frontend Testing
 *
 * @since 2025-12-22
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useSSE } from '../../src/hooks/useSSE';
import * as api from '../../src/services/api';

// Mock EventSource
class MockEventSource {
  constructor(url) {
    this.url = url;
    this.listeners = {};
    this.readyState = 0; // CONNECTING
    MockEventSource.instance = this;

    // Simulate connection opening
    setTimeout(() => {
      this.readyState = 1; // OPEN
      this.listeners['open']?.forEach(fn => fn());
    }, 100);
  }

  addEventListener(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  removeEventListener(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(fn => fn !== callback);
    }
  }

  close() {
    this.readyState = 2; // CLOSED
    this.listeners['error']?.forEach(fn => fn({ type: 'error' }));
  }

  // Helper to simulate events
  simulateMessage(eventType, data) {
    const event = {
      type: eventType,
      data: JSON.stringify(data)
    };
    this.listeners[eventType]?.forEach(fn => fn(event));
  }

  simulateError() {
    this.listeners['error']?.forEach(fn => fn({ type: 'error' }));
  }
}

global.EventSource = MockEventSource;

// Mock api.onTokenRefresh
jest.mock('../../src/services/api', () => ({
  onTokenRefresh: jest.fn((callback) => {
    // Return unsubscribe function
    return () => {};
  })
}));

describe('useSSE', () => {
  let consoleSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
    MockEventSource.instance = null;
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    consoleSpy.mockRestore();
  });

  test('connects to SSE endpoint on mount', async () => {
    const { result } = renderHook(() => useSSE({
      endpoint: '/api/sse/test',
      eventTypes: ['test']
    }));

    expect(MockEventSource.instance).toBeTruthy();
    expect(MockEventSource.instance.url).toBe('/api/sse/test');

    // Wait for connection
    act(() => {
      jest.advanceTimersByTime(150);
    });

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });
  });

  test('calls onConnect callback when connected', async () => {
    const onConnect = jest.fn();

    renderHook(() => useSSE({
      endpoint: '/api/sse/test',
      onConnect
    }));

    act(() => {
      jest.advanceTimersByTime(150);
    });

    await waitFor(() => {
      expect(onConnect).toHaveBeenCalled();
    });
  });

  test('receives and parses messages', async () => {
    const onMessage = jest.fn();
    const testData = { id: 1, message: 'test' };

    renderHook(() => useSSE({
      endpoint: '/api/sse/test',
      eventTypes: ['notification'],
      onMessage
    }));

    act(() => {
      jest.advanceTimersByTime(150);
    });

    // Simulate message
    act(() => {
      MockEventSource.instance.simulateMessage('notification', testData);
    });

    await waitFor(() => {
      expect(onMessage).toHaveBeenCalledWith('notification', testData);
    });
  });

  test('updates data state when message received', async () => {
    const testData = { id: 1, message: 'test' };

    const { result } = renderHook(() => useSSE({
      endpoint: '/api/sse/test',
      eventTypes: ['notification']
    }));

    act(() => {
      jest.advanceTimersByTime(150);
    });

    act(() => {
      MockEventSource.instance.simulateMessage('notification', testData);
    });

    await waitFor(() => {
      expect(result.current.data).toEqual({
        type: 'notification',
        payload: testData
      });
    });
  });

  test('handles multiple event types', async () => {
    const onMessage = jest.fn();

    renderHook(() => useSSE({
      endpoint: '/api/sse/test',
      eventTypes: ['notification', 'heartbeat'],
      onMessage
    }));

    act(() => {
      jest.advanceTimersByTime(150);
    });

    act(() => {
      MockEventSource.instance.simulateMessage('notification', { type: 'alert' });
      MockEventSource.instance.simulateMessage('heartbeat', { count: 5 });
    });

    await waitFor(() => {
      expect(onMessage).toHaveBeenCalledWith('notification', { type: 'alert' });
      expect(onMessage).toHaveBeenCalledWith('heartbeat', { count: 5 });
    });
  });

  test('disconnects on unmount', async () => {
    const { unmount } = renderHook(() => useSSE({
      endpoint: '/api/sse/test'
    }));

    act(() => {
      jest.advanceTimersByTime(150);
    });

    const instance = MockEventSource.instance;
    const closeSpy = jest.spyOn(instance, 'close');

    unmount();

    expect(closeSpy).toHaveBeenCalled();
  });

  test('calls onDisconnect callback when disconnected', async () => {
    const onDisconnect = jest.fn();

    const { result } = renderHook(() => useSSE({
      endpoint: '/api/sse/test',
      onDisconnect
    }));

    act(() => {
      jest.advanceTimersByTime(150);
    });

    act(() => {
      result.current.disconnect();
    });

    await waitFor(() => {
      expect(onDisconnect).toHaveBeenCalled();
    });
  });

  test('attempts reconnection on error', async () => {
    renderHook(() => useSSE({
      endpoint: '/api/sse/test',
      maxReconnectAttempts: 3
    }));

    act(() => {
      jest.advanceTimersByTime(150);
    });

    const firstInstance = MockEventSource.instance;

    // Simulate error
    act(() => {
      firstInstance.simulateError();
    });

    // Wait for reconnection attempt (1 second initial delay)
    act(() => {
      jest.advanceTimersByTime(1100);
    });

    // Should create new EventSource
    expect(MockEventSource.instance).not.toBe(firstInstance);
  });

  test('stops reconnecting after max attempts', async () => {
    const onError = jest.fn();

    renderHook(() => useSSE({
      endpoint: '/api/sse/test',
      maxReconnectAttempts: 2,
      reconnectDelay: 100,
      onError
    }));

    act(() => {
      jest.advanceTimersByTime(150);
    });

    // First error
    act(() => {
      MockEventSource.instance.simulateError();
      jest.advanceTimersByTime(200);
    });

    // Second error
    act(() => {
      MockEventSource.instance.simulateError();
      jest.advanceTimersByTime(400);
    });

    // Third error (should not reconnect)
    act(() => {
      MockEventSource.instance.simulateError();
      jest.advanceTimersByTime(800);
    });

    // Verify max attempts error was called
    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Failed to reconnect after maximum attempts'
        })
      );
    });
  });

  test('handles parse errors gracefully', async () => {
    const onError = jest.fn();

    renderHook(() => useSSE({
      endpoint: '/api/sse/test',
      eventTypes: ['test'],
      onError
    }));

    act(() => {
      jest.advanceTimersByTime(150);
    });

    // Simulate invalid JSON
    act(() => {
      const event = {
        type: 'test',
        data: 'invalid json{'
      };
      MockEventSource.instance.listeners['test']?.forEach(fn => fn(event));
    });

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Failed to parse')
        })
      );
    });
  });

  test('does not connect if endpoint is not provided', () => {
    renderHook(() => useSSE({
      endpoint: null
    }));

    expect(MockEventSource.instance).toBeNull();
  });

  test('subscribes to token refresh', () => {
    renderHook(() => useSSE({
      endpoint: '/api/sse/test'
    }));

    expect(api.onTokenRefresh).toHaveBeenCalled();
  });
});
