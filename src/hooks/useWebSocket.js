/**
 * Module: hooks/useWebSocket.js
 * Purpose: React hook for WebSocket connection management
 * Part of: Easter Quest Frontend - Chat System
 *
 * Features:
 * - Connection lifecycle management
 * - Token refresh integration (auto-reconnect on token refresh)
 * - Status tracking (connected, connecting, disconnected)
 * - Message sending with validation
 * - Event subscription management
 *
 * @since 2025-11-09
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import ChatWebSocket from '../services/websocket/chatWebSocket';
import { onTokenRefresh } from '../services/api';

/**
 * useWebSocket - React hook for managing WebSocket connection
 *
 * @param {string} url - WebSocket URL (optional, auto-detected if not provided)
 * @param {object} options - Configuration options
 * @param {boolean} options.autoConnect - Auto-connect on mount (default: true)
 * @param {number} options.reconnectInterval - Reconnect delay (ms)
 * @param {number} options.maxReconnectInterval - Max reconnect delay (ms)
 * @param {number} options.heartbeatInterval - Heartbeat interval (ms)
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
  // WebSocket instance (persistent across renders)
  const wsRef = useRef(null);

  // Track if component is mounted (prevents cleanup issues in StrictMode)
  const isMountedRef = useRef(false);

  // Track cleanup timeout to cancel it if needed
  const cleanupTimeoutRef = useRef(null);

  // Connection status state
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  // Error state
  const [lastError, setLastError] = useState(null);

  // Message listeners
  const messageListenersRef = useRef(new Set());

  // Configuration
  const config = {
    autoConnect: options.autoConnect !== undefined ? options.autoConnect : true,
    reconnectInterval: options.reconnectInterval || 1000,
    maxReconnectInterval: options.maxReconnectInterval || 30000,
    heartbeatInterval: options.heartbeatInterval || 30000
  };

  /**
   * Initialize WebSocket instance
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

    // Create WebSocket instance
    wsRef.current = new ChatWebSocket(url, {
      reconnectInterval: config.reconnectInterval,
      maxReconnectInterval: config.maxReconnectInterval,
      heartbeatInterval: config.heartbeatInterval
    });

    // Subscribe to status changes
    const unsubscribeStatus = wsRef.current.on('status', (status) => {
      console.log('[useWebSocket] Status changed:', status);
      setConnectionStatus(status);
    });

    // Subscribe to errors
    const unsubscribeError = wsRef.current.on('error', (error) => {
      console.error('[useWebSocket] Error:', error);
      setLastError(error);
    });

    // Subscribe to messages
    const unsubscribeMessage = wsRef.current.on('message', (data) => {
      console.log('[useWebSocket] Message received:', data.type, data);
      // Notify all message listeners
      messageListenersRef.current.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error('[useWebSocket] Error in message listener:', error);
        }
      });
    });

    // Auto-connect if enabled
    if (config.autoConnect) {
      console.log('[useWebSocket] Auto-connecting...');
      wsRef.current.connect().catch(error => {
        console.error('[useWebSocket] Auto-connect failed:', error);
        setLastError(error);
      });
    }

    // Cleanup on unmount (only on real unmount, not StrictMode double-mount)
    return () => {
      console.log('[useWebSocket] Cleanup called');

      // Only disconnect if this is a real unmount (not StrictMode remount)
      // In development, React StrictMode intentionally double-mounts components
      // We use a short timeout to differentiate between StrictMode remount and real unmount
      cleanupTimeoutRef.current = setTimeout(() => {
        console.log('[useWebSocket] Performing actual cleanup');
        unsubscribeStatus();
        unsubscribeError();
        unsubscribeMessage();

        if (wsRef.current) {
          wsRef.current.disconnect();
          wsRef.current = null;
        }
        isMountedRef.current = false;
        cleanupTimeoutRef.current = null;
      }, 100);
    };
  }, [url]); // Only recreate if URL changes

  /**
   * Token refresh integration
   * Pattern from existing RateLimitCard SSE implementation
   */
  useEffect(() => {
    console.log('[useWebSocket] Setting up token refresh listener');

    const unsubscribe = onTokenRefresh(() => {
      console.log('[useWebSocket] Token refreshed - reconnecting WebSocket');

      if (wsRef.current) {
        // Close existing connection
        wsRef.current.disconnect();

        // Wait 100ms for new cookies to be set
        setTimeout(() => {
          console.log('[useWebSocket] Reconnecting with new tokens...');
          wsRef.current.connect().catch(error => {
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
  }, []);

  /**
   * Connect to WebSocket
   *
   * @returns {Promise<void>}
   */
  const connect = useCallback(() => {
    if (!wsRef.current) {
      console.error('[useWebSocket] WebSocket instance not initialized');
      return Promise.reject(new Error('WebSocket not initialized'));
    }

    return wsRef.current.connect();
  }, []);

  /**
   * Disconnect from WebSocket
   */
  const disconnect = useCallback(() => {
    if (!wsRef.current) {
      console.warn('[useWebSocket] WebSocket instance not initialized');
      return;
    }

    wsRef.current.disconnect();
  }, []);

  /**
   * Send message via WebSocket
   *
   * @param {string} type - Message type
   * @param {object} data - Message payload
   * @returns {boolean} Success status
   */
  const sendMessage = useCallback((type, data = {}) => {
    if (!wsRef.current) {
      console.error('[useWebSocket] WebSocket instance not initialized');
      return false;
    }

    if (!type || typeof type !== 'string') {
      console.error('[useWebSocket] Invalid message type:', type);
      return false;
    }

    return wsRef.current.send(type, data);
  }, []);

  /**
   * Subscribe to incoming messages
   *
   * @param {Function} callback - Message handler
   * @returns {Function} Unsubscribe function
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
   * Useful for manual reconnection after auth errors
   *
   * @returns {Promise<void>}
   */
  const reconnect = useCallback(() => {
    console.log('[useWebSocket] Manual reconnect requested');

    if (!wsRef.current) {
      console.error('[useWebSocket] WebSocket instance not initialized');
      return Promise.reject(new Error('WebSocket not initialized'));
    }

    // Disconnect first
    wsRef.current.disconnect();

    // Wait a bit, then reconnect
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        wsRef.current.connect()
          .then(resolve)
          .catch(reject);
      }, 100);
    });
  }, []);

  /**
   * Get current queue size
   *
   * @returns {number} Number of queued messages
   */
  const getQueueSize = useCallback(() => {
    if (!wsRef.current) return 0;
    return wsRef.current.getQueueSize();
  }, []);

  /**
   * Check if connected
   *
   * @returns {boolean}
   */
  const isConnected = useCallback(() => {
    if (!wsRef.current) return false;
    return wsRef.current.isConnected();
  }, []);

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
