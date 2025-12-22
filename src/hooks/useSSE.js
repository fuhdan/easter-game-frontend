/**
 * Module: hooks/useSSE.js
 * Purpose: Generic SSE (Server-Sent Events) hook for real-time updates
 * Part of: Easter Quest 2025 - Real-Time Updates Infrastructure
 *
 * Features:
 * - Automatic connection management
 * - Reconnection with exponential backoff
 * - Token refresh handling
 * - Event-based message handling
 * - Connection state tracking
 * - Automatic cleanup on unmount
 *
 * Usage:
 * ```javascript
 * const { data, isConnected, error } = useSSE({
 *   endpoint: '/api/sse/notifications',
 *   eventTypes: ['notification', 'heartbeat'],
 *   onMessage: (eventType, data) => console.log(eventType, data),
 *   onError: (error) => console.error(error)
 * });
 * ```
 *
 * @since 2025-12-22
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { onTokenRefresh } from '../services/api';

/**
 * Generic SSE hook
 *
 * Manages EventSource connection to any SSE endpoint with:
 * - Automatic reconnection with exponential backoff
 * - Token refresh handling
 * - Configurable event types
 * - Event listeners for custom events
 * - Connection state tracking
 *
 * This hook serves as the foundation for all SSE connections in the application.
 *
 * @param {Object} options - Configuration options
 * @param {string} options.endpoint - SSE endpoint URL (required)
 * @param {string[]} options.eventTypes - Event types to listen for (default: ['data'])
 * @param {Function} options.onMessage - Callback for messages (eventType, data)
 * @param {Function} options.onError - Callback for errors
 * @param {Function} options.onConnect - Callback when connected
 * @param {Function} options.onDisconnect - Callback when disconnected
 * @param {number} options.maxReconnectAttempts - Max reconnection attempts (default: 5)
 * @param {number} options.reconnectDelay - Initial reconnection delay in ms (default: 1000)
 * @param {number} options.maxReconnectDelay - Max reconnection delay in ms (default: 30000)
 * @param {string} options.name - Hook name for logging (default: 'useSSE')
 * @returns {Object} { data, isConnected, error, reconnect }
 */
export const useSSE = (options = {}) => {
  const {
    endpoint,
    eventTypes = ['data'],
    onMessage,
    onError,
    onConnect,
    onDisconnect,
    maxReconnectAttempts = 5,
    reconnectDelay = 1000,
    maxReconnectDelay = 30000,
    name = 'useSSE'
  } = options;

  // State
  const [data, setData] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);

  // Refs for managing connection
  const eventSourceRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef(null);
  const isIntentionalCloseRef = useRef(false);
  const currentReconnectDelayRef = useRef(reconnectDelay);
  const unsubscribeTokenRefreshRef = useRef(null);

  /**
   * Handle connection opened
   */
  const handleOpen = useCallback(() => {
    console.log(`[${name}] Connected successfully`);
    setIsConnected(true);
    setError(null);
    reconnectAttemptsRef.current = 0;
    currentReconnectDelayRef.current = reconnectDelay;
    onConnect?.();
  }, [name, reconnectDelay, onConnect]);

  /**
   * Setup event listeners for all configured event types
   */
  const setupEventListeners = useCallback((eventSource) => {
    eventTypes.forEach(eventType => {
      eventSource.addEventListener(eventType, (event) => {
        try {
          const parsedData = JSON.parse(event.data);
          const eventLabel = eventType.charAt(0).toUpperCase() + eventType.slice(1);
          console.log(`[${name}] ${eventLabel}:`, parsedData);

          setData({ type: eventType, payload: parsedData });
          onMessage?.(eventType, parsedData);
        } catch (err) {
          console.error(`[${name}] Failed to parse ${eventType}:`, err);
          const errorData = { message: `Failed to parse ${eventType}`, error: err };
          setError(errorData);
          onError?.(errorData);
        }
      });
    });

    // Also listen for generic 'error' events from server
    eventSource.addEventListener('error', (event) => {
      try {
        if (event.data) {
          const errorData = JSON.parse(event.data);
          console.error(`[${name}] Server error:`, errorData.message);
          setError(errorData);
          onError?.(errorData);
        }
      } catch (err) {
        // Not a JSON error event, ignore
      }
    });
  }, [eventTypes, name, onMessage, onError]);

  /**
   * Attempt to reconnect with exponential backoff
   */
  const reconnect = useCallback(() => {
    // Don't reconnect if intentionally closed
    if (isIntentionalCloseRef.current) {
      console.log(`[${name}] Not reconnecting (intentional close)`);
      return;
    }

    // Check if max attempts reached
    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      console.error(`[${name}] Max reconnection attempts reached`);
      const errorData = {
        message: 'Failed to reconnect after maximum attempts',
        attempts: reconnectAttemptsRef.current
      };
      setError(errorData);
      onError?.(errorData);
      return;
    }

    reconnectAttemptsRef.current++;

    // Calculate exponential backoff delay
    const delay = Math.min(
      currentReconnectDelayRef.current * Math.pow(2, reconnectAttemptsRef.current - 1),
      maxReconnectDelay
    );

    console.log(
      `[${name}] Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})`
    );

    reconnectTimeoutRef.current = setTimeout(() => {
      console.log(`[${name}] Attempting reconnection...`);
      connect();
    }, delay);
  }, [name, maxReconnectAttempts, maxReconnectDelay, onError]);

  /**
   * Handle connection error
   */
  const handleError = useCallback((event) => {
    console.error(`[${name}] Connection error:`, event);

    // Mark as disconnected
    setIsConnected(false);

    // Close the dead connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    // Emit error event
    const errorData = { message: 'Connection lost', event };
    setError(errorData);
    onError?.(errorData);

    // Only reconnect if not intentionally closed
    if (!isIntentionalCloseRef.current) {
      reconnect();
    }
  }, [name, onError, reconnect]);

  /**
   * Handle token refresh
   */
  const handleTokenRefresh = useCallback(() => {
    console.log(`[${name}] Token refreshed - reconnecting`);

    // Disconnect current connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    // Reconnect with new tokens (EventSource will send new cookies)
    connect();
  }, [name]);

  /**
   * Connect to SSE endpoint
   */
  const connect = useCallback(() => {
    if (!endpoint) {
      console.warn(`[${name}] No endpoint provided, skipping connection`);
      return;
    }

    if (eventSourceRef.current) {
      console.log(`[${name}] Already connected`);
      return;
    }

    try {
      console.log(`[${name}] Connecting to ${endpoint}`);

      // SECURITY: Create EventSource connection
      // NOTE: EventSource automatically sends cookies (credentials: 'include' by default)
      // This ensures HTTPOnly authentication cookies are sent with the request
      const eventSource = new EventSource(endpoint);
      eventSourceRef.current = eventSource;

      // Listen for connection open
      eventSource.addEventListener('open', handleOpen);

      // Listen for connection errors
      eventSource.addEventListener('error', handleError);

      // Setup custom event listeners for all configured event types
      setupEventListeners(eventSource);

      // SECURITY: Subscribe to token refresh events
      // When tokens are refreshed, we need to reconnect with new cookies
      unsubscribeTokenRefreshRef.current = onTokenRefresh(handleTokenRefresh);

      isIntentionalCloseRef.current = false;

    } catch (err) {
      console.error(`[${name}] Connection error:`, err);
      const errorData = { message: 'Failed to connect', error: err };
      setError(errorData);
      onError?.(errorData);
      reconnect();
    }
  }, [endpoint, name, handleOpen, handleError, setupEventListeners, handleTokenRefresh, onError, reconnect]);

  /**
   * Disconnect from SSE endpoint
   */
  const disconnect = useCallback(() => {
    console.log(`[${name}] Disconnecting`);
    isIntentionalCloseRef.current = true;

    // Clear reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Close connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    // Unsubscribe from token refresh
    if (unsubscribeTokenRefreshRef.current) {
      unsubscribeTokenRefreshRef.current();
      unsubscribeTokenRefreshRef.current = null;
    }

    setIsConnected(false);
    onDisconnect?.();
  }, [name, onDisconnect]);

  /**
   * Manual reconnect function
   */
  const manualReconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0;
    currentReconnectDelayRef.current = reconnectDelay;
    disconnect();
    setTimeout(() => {
      isIntentionalCloseRef.current = false;
      connect();
    }, 100);
  }, [disconnect, connect, reconnectDelay]);

  // Auto-connect and cleanup on mount/unmount
  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    data,
    isConnected,
    error,
    reconnect: manualReconnect,
    disconnect
  };
};

export default useSSE;
