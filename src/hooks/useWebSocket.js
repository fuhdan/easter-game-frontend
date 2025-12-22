/**
 * Module: hooks/useWebSocket.js
 * Purpose: React hook for WebSocket connection management (functional, no classes)
 * Part of: Easter Quest Frontend - Chat System
 *
 * Features:
 * - Connection lifecycle management
 * - Auto-reconnection with exponential backoff
 * - Message queuing during disconnection
 * - Heartbeat/ping mechanism
 * - Token refresh integration (auto-reconnect on token refresh)
 * - Status tracking (connected, connecting, disconnected)
 * - Message sending with validation
 * - Event subscription management
 *
 * @since 2025-11-09
 * @updated 2025-12-22 - Refactored to remove class dependencies
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { onTokenRefresh } from '../services';

/**
 * useWebSocket - React hook for managing WebSocket connection
 *
 * @param {string} url - WebSocket URL (optional, auto-detected if not provided)
 * @param {object} options - Configuration options
 * @param {boolean} options.autoConnect - Auto-connect on mount (default: true)
 * @param {number} options.reconnectInterval - Initial reconnect delay (ms, default: 1000)
 * @param {number} options.maxReconnectInterval - Max reconnect delay (ms, default: 30000)
 * @param {number} options.heartbeatInterval - Heartbeat interval (ms, default: 30000)
 * @param {number} options.maxQueueSize - Max queued messages (default: 100)
 * @returns {object} WebSocket hook interface
 *
 * @example
 * const { connectionStatus, sendMessage, onMessage } = useWebSocket();
 *
 * useEffect(() => {
 *   const unsubscribe = onMessage((data) => {
 *     console.log('Message received:', data);
 *   });
 *   return unsubscribe;
 * }, [onMessage]);
 *
 * sendMessage('user_message', { content: 'Hello!' });
 */
const useWebSocket = (url = null, options = {}) => {
  // Configuration
  const config = {
    autoConnect: options.autoConnect !== undefined ? options.autoConnect : true,
    reconnectInterval: options.reconnectInterval || 1000,
    maxReconnectInterval: options.maxReconnectInterval || 30000,
    heartbeatInterval: options.heartbeatInterval || 30000,
    maxQueueSize: options.maxQueueSize || 100
  };

  // Compute WebSocket URL
  const wsUrl = url || (() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    return `${protocol}//${host}/ws/chat`;
  })();

  // State
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [lastError, setLastError] = useState(null);

  // Refs
  const wsRef = useRef(null);
  const messageListenersRef = useRef(new Set());
  const messageQueueRef = useRef([]);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimerRef = useRef(null);
  const heartbeatTimerRef = useRef(null);
  const manualCloseRef = useRef(false);
  const isMountedRef = useRef(false);
  const cleanupTimeoutRef = useRef(null);

  /**
   * Update connection status
   */
  const updateStatus = useCallback((newStatus) => {
    setConnectionStatus(prevStatus => {
      if (prevStatus !== newStatus) {
        console.log(`[useWebSocket] Status: ${prevStatus} -> ${newStatus}`);
        return newStatus;
      }
      return prevStatus;
    });
  }, []);

  /**
   * Add message to queue
   */
  const enqueueMessage = useCallback((message) => {
    if (messageQueueRef.current.length >= config.maxQueueSize) {
      console.warn('[useWebSocket] Queue full, dropping oldest message');
      messageQueueRef.current.shift();
    }
    messageQueueRef.current.push(message);
    console.log('[useWebSocket] Message queued, queue size:', messageQueueRef.current.length);
  }, [config.maxQueueSize]);

  /**
   * Flush message queue
   */
  const flushMessageQueue = useCallback(() => {
    if (messageQueueRef.current.length === 0) return;

    console.log('[useWebSocket] Flushing message queue:', messageQueueRef.current.length);

    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    let sent = 0;
    while (messageQueueRef.current.length > 0) {
      const message = messageQueueRef.current.shift();
      try {
        ws.send(JSON.stringify(message));
        sent++;
        console.log('[useWebSocket] Queued message sent:', message.type);
      } catch (error) {
        console.error('[useWebSocket] Failed to send queued message:', error);
        messageQueueRef.current.unshift(message);
        break;
      }
    }

    console.log(`[useWebSocket] Flushed ${sent} messages, ${messageQueueRef.current.length} remaining`);
  }, []);

  /**
   * Start heartbeat
   */
  const startHeartbeat = useCallback(() => {
    if (heartbeatTimerRef.current) {
      clearInterval(heartbeatTimerRef.current);
    }

    heartbeatTimerRef.current = setInterval(() => {
      const ws = wsRef.current;
      if (ws && ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(JSON.stringify({ type: 'ping' }));
          console.log('[useWebSocket] Ping sent');
        } catch (error) {
          console.error('[useWebSocket] Failed to send ping:', error);
        }
      }
    }, config.heartbeatInterval);

    console.log('[useWebSocket] Heartbeat started');
  }, [config.heartbeatInterval]);

  /**
   * Stop heartbeat
   */
  const stopHeartbeat = useCallback(() => {
    if (heartbeatTimerRef.current) {
      clearInterval(heartbeatTimerRef.current);
      heartbeatTimerRef.current = null;
      console.log('[useWebSocket] Heartbeat stopped');
    }
  }, []);

  /**
   * Clear reconnect timer
   */
  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  }, []);

  /**
   * Schedule reconnection with exponential backoff
   */
  const scheduleReconnect = useCallback(() => {
    if (manualCloseRef.current) {
      console.log('[useWebSocket] Not reconnecting (manual close)');
      return;
    }

    clearReconnectTimer();

    // Calculate exponential backoff delay
    const delay = Math.min(
      config.reconnectInterval * Math.pow(2, reconnectAttemptsRef.current),
      config.maxReconnectInterval
    );

    console.log(`[useWebSocket] Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current + 1})`);

    reconnectTimerRef.current = setTimeout(() => {
      reconnectAttemptsRef.current++;
      connect();
    }, delay);
  }, [config.reconnectInterval, config.maxReconnectInterval]);

  /**
   * Handle incoming message
   */
  const handleMessage = useCallback((data) => {
    // Handle pong (heartbeat response)
    if (data.type === 'pong') {
      console.log('[useWebSocket] Pong received');
      return;
    }

    // Notify all message listeners
    messageListenersRef.current.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        console.error('[useWebSocket] Error in message listener:', error);
      }
    });
  }, []);

  /**
   * Connect to WebSocket
   */
  const connect = useCallback(() => {
    if (wsRef.current && (wsRef.current.readyState === WebSocket.CONNECTING || wsRef.current.readyState === WebSocket.OPEN)) {
      console.log('[useWebSocket] Already connected or connecting');
      return Promise.resolve();
    }

    manualCloseRef.current = false;
    updateStatus('connecting');

    return new Promise((resolve, reject) => {
      try {
        console.log('[useWebSocket] Connecting to:', wsUrl);

        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log('[useWebSocket] Connected successfully');
          reconnectAttemptsRef.current = 0;
          updateStatus('connected');
          startHeartbeat();
          flushMessageQueue();
          resolve();
        };

        ws.onclose = (event) => {
          console.log('[useWebSocket] Connection closed:', event.code, event.reason);
          stopHeartbeat();
          updateStatus('disconnected');

          // Don't reconnect if server closed due to logout
          if (event.code === 1000 && event.reason === 'Logout') {
            console.log('[useWebSocket] Server closed connection due to logout, not reconnecting');
            manualCloseRef.current = true;
            return;
          }

          // Auto-reconnect if not manually closed
          if (!manualCloseRef.current) {
            scheduleReconnect();
          }
        };

        ws.onerror = (error) => {
          console.error('[useWebSocket] WebSocket error:', error);
          setLastError(error);
          reject(error);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('[useWebSocket] Message received:', data.type);
            handleMessage(data);
          } catch (error) {
            console.error('[useWebSocket] Failed to parse message:', error);
          }
        };
      } catch (error) {
        console.error('[useWebSocket] Failed to create WebSocket:', error);
        updateStatus('disconnected');
        reject(error);
      }
    });
  }, [wsUrl, updateStatus, startHeartbeat, stopHeartbeat, flushMessageQueue, scheduleReconnect, handleMessage]);

  /**
   * Disconnect from WebSocket
   */
  const disconnect = useCallback((code = 1000, reason = 'Manual disconnect') => {
    console.log('[useWebSocket] Disconnecting:', reason);
    manualCloseRef.current = true;
    stopHeartbeat();
    clearReconnectTimer();

    if (wsRef.current) {
      wsRef.current.close(code, reason);
      wsRef.current = null;
    }

    updateStatus('disconnected');
  }, [stopHeartbeat, clearReconnectTimer, updateStatus]);

  /**
   * Send message via WebSocket
   */
  const sendMessage = useCallback((type, data = {}) => {
    if (!type || typeof type !== 'string') {
      console.error('[useWebSocket] Invalid message type:', type);
      return false;
    }

    const message = { type, ...data };
    const ws = wsRef.current;

    if (ws && ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(message));
        console.log('[useWebSocket] Message sent:', type);
        return true;
      } catch (error) {
        console.error('[useWebSocket] Failed to send message:', error);
        enqueueMessage(message);
        return false;
      }
    } else {
      console.log('[useWebSocket] Not connected, queueing message:', type);
      enqueueMessage(message);
      return false;
    }
  }, [enqueueMessage]);

  /**
   * Subscribe to incoming messages
   */
  const onMessage = useCallback((callback) => {
    if (typeof callback !== 'function') {
      console.error('[useWebSocket] onMessage callback must be a function');
      return () => {};
    }

    messageListenersRef.current.add(callback);

    // Return unsubscribe function
    return () => {
      messageListenersRef.current.delete(callback);
    };
  }, []);

  /**
   * Reconnect WebSocket
   */
  const reconnect = useCallback(() => {
    console.log('[useWebSocket] Manual reconnect requested');
    reconnectAttemptsRef.current = 0;
    disconnect();

    return new Promise((resolve, reject) => {
      setTimeout(() => {
        connect().then(resolve).catch(reject);
      }, 100);
    });
  }, [disconnect, connect]);

  /**
   * Get current queue size
   */
  const getQueueSize = useCallback(() => {
    return messageQueueRef.current.length;
  }, []);

  /**
   * Check if connected
   */
  const isConnected = useCallback(() => {
    return connectionStatus === 'connected' && wsRef.current?.readyState === WebSocket.OPEN;
  }, [connectionStatus]);

  /**
   * Initialize WebSocket on mount
   */
  useEffect(() => {
    // Cancel any pending cleanup from previous mount cycle
    if (cleanupTimeoutRef.current) {
      console.log('[useWebSocket] Canceling pending cleanup from previous mount');
      clearTimeout(cleanupTimeoutRef.current);
      cleanupTimeoutRef.current = null;
    }

    // Skip if already initialized (handles React StrictMode double-mount)
    if (isMountedRef.current && wsRef.current) {
      console.log('[useWebSocket] Already initialized, skipping');
      return;
    }

    console.log('[useWebSocket] Initializing WebSocket');
    isMountedRef.current = true;

    // Auto-connect if enabled
    if (config.autoConnect) {
      console.log('[useWebSocket] Auto-connecting...');
      connect().catch(error => {
        console.error('[useWebSocket] Auto-connect failed:', error);
        setLastError(error);
      });
    }

    // Cleanup on unmount (only on real unmount, not StrictMode double-mount)
    return () => {
      console.log('[useWebSocket] Cleanup called');

      // Use timeout to differentiate between StrictMode remount and real unmount
      cleanupTimeoutRef.current = setTimeout(() => {
        console.log('[useWebSocket] Performing actual cleanup');
        stopHeartbeat();
        clearReconnectTimer();

        if (wsRef.current) {
          wsRef.current.close();
          wsRef.current = null;
        }

        isMountedRef.current = false;
        cleanupTimeoutRef.current = null;
      }, 100);
    };
  }, [wsUrl, config.autoConnect]);

  /**
   * Token refresh integration
   */
  useEffect(() => {
    console.log('[useWebSocket] Setting up token refresh listener');

    const unsubscribe = onTokenRefresh(() => {
      console.log('[useWebSocket] Token refreshed - reconnecting WebSocket');

      if (wsRef.current) {
        disconnect();

        // Wait 100ms for new cookies to be set
        setTimeout(() => {
          console.log('[useWebSocket] Reconnecting with new tokens...');
          connect().catch(error => {
            console.error('[useWebSocket] Reconnection after token refresh failed:', error);
            setLastError(error);
          });
        }, 100);
      }
    });

    return () => {
      console.log('[useWebSocket] Cleaning up token refresh listener');
      unsubscribe();
    };
  }, [disconnect, connect]);

  // Return hook interface
  return {
    // State
    connectionStatus,
    lastError,

    // Methods
    connect,
    disconnect,
    reconnect,
    sendMessage,
    onMessage,
    getQueueSize,
    isConnected
  };
};

export default useWebSocket;
