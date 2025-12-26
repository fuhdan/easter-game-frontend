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
import { logger } from '../utils/logger';

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

  // CRITICAL FIX: Store callbacks and arrays in refs to prevent reconnection loops
  // When callbacks/arrays change, we don't want to trigger reconnections
  const onMessageRef = useRef(onMessage);
  const onErrorRef = useRef(onError);
  const onConnectRef = useRef(onConnect);
  const onDisconnectRef = useRef(onDisconnect);
  const eventTypesRef = useRef(eventTypes);

  // Update refs when callbacks/arrays change (without triggering reconnections)
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    onConnectRef.current = onConnect;
  }, [onConnect]);

  useEffect(() => {
    onDisconnectRef.current = onDisconnect;
  }, [onDisconnect]);

  useEffect(() => {
    eventTypesRef.current = eventTypes;
  }, [eventTypes]);

  /**
   * Handle connection opened
   */
  const handleOpen = useCallback(() => {
    logger.info('sse_connected', {
      endpoint,
      hookName: name,
      module: 'useSSE'
    });
    setIsConnected(true);
    setError(null);
    reconnectAttemptsRef.current = 0;
    currentReconnectDelayRef.current = reconnectDelay;
    onConnectRef.current?.();
  }, [name, reconnectDelay, endpoint]);

  /**
   * Setup event listeners for all configured event types
   */
  const setupEventListeners = useCallback((eventSource) => {
    eventTypesRef.current.forEach(eventType => {
      eventSource.addEventListener(eventType, (event) => {
        try {
          // SECURITY: Check if event.data exists before parsing
          // Browser native error events don't have data, only server-sent events do
          if (!event.data) {
            logger.warn('sse_event_without_data', {
              eventType,
              hookName: name,
              module: 'useSSE'
            });
            return;
          }

          const parsedData = JSON.parse(event.data);

          // PERF: Don't log heartbeats - they happen frequently
          if (eventType !== 'heartbeat') {
            logger.debug('sse_message_received', {
              eventType,
              dataSize: event.data?.length,
              hookName: name,
              module: 'useSSE'
            });
          }

          setData({ type: eventType, payload: parsedData });
          onMessageRef.current?.(eventType, parsedData);
        } catch (err) {
          logger.error('sse_parse_error', {
            eventType,
            errorMessage: err.message,
            hookName: name,
            module: 'useSSE'
          }, err);
          const errorData = { message: `Failed to parse ${eventType}`, error: err };
          setError(errorData);
          onErrorRef.current?.(errorData);
        }
      });
    });

    // Also listen for generic 'error' events from server
    eventSource.addEventListener('error', (event) => {
      try {
        if (event.data) {
          const errorData = JSON.parse(event.data);
          logger.error('sse_server_error', {
            errorMessage: errorData.message,
            hookName: name,
            module: 'useSSE'
          });
          setError(errorData);
          onErrorRef.current?.(errorData);
        }
      } catch (err) {
        // Not a JSON error event, ignore
      }
    });
  }, [name]);

  /**
   * Attempt to reconnect with exponential backoff
   */
  const reconnect = useCallback(() => {
    // Don't reconnect if intentionally closed
    if (isIntentionalCloseRef.current) {
      logger.debug('sse_skip_reconnect', {
        reason: 'intentional_close',
        hookName: name,
        module: 'useSSE'
      });
      return;
    }

    // Check if max attempts reached
    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      logger.error('sse_max_reconnect_attempts', {
        attempts: reconnectAttemptsRef.current,
        maxAttempts: maxReconnectAttempts,
        hookName: name,
        module: 'useSSE'
      });
      const errorData = {
        message: 'Failed to reconnect after maximum attempts',
        attempts: reconnectAttemptsRef.current
      };
      setError(errorData);
      onErrorRef.current?.(errorData);
      return;
    }

    reconnectAttemptsRef.current++;

    // Calculate exponential backoff delay
    const delay = Math.min(
      currentReconnectDelayRef.current * Math.pow(2, reconnectAttemptsRef.current - 1),
      maxReconnectDelay
    );

    logger.info('sse_reconnect_scheduled', {
      delayMs: delay,
      attempt: reconnectAttemptsRef.current,
      maxAttempts: maxReconnectAttempts,
      hookName: name,
      module: 'useSSE'
    });

    reconnectTimeoutRef.current = setTimeout(() => {
      logger.info('sse_reconnect_attempting', {
        attempt: reconnectAttemptsRef.current,
        hookName: name,
        module: 'useSSE'
      });
      connect();
    }, delay);
  }, [name, maxReconnectAttempts, maxReconnectDelay]);

  /**
   * Handle connection error
   */
  const handleError = useCallback((event) => {
    const readyState = eventSourceRef.current?.readyState;
    const readyStateName = ['CONNECTING', 'OPEN', 'CLOSED'][readyState] || 'UNKNOWN';

    logger.error('sse_connection_error', {
      readyState,
      readyStateName,
      endpoint,
      hookName: name,
      eventType: event?.type,
      eventTarget: event?.target?.constructor?.name,
      module: 'useSSE'
    });

    // Mark as disconnected
    setIsConnected(false);

    // Close the dead connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    // Emit error event
    const errorData = {
      message: 'Connection lost',
      event,
      readyState: readyStateName,
      endpoint
    };
    setError(errorData);
    onErrorRef.current?.(errorData);

    // Only reconnect if not intentionally closed
    if (!isIntentionalCloseRef.current) {
      reconnect();
    }
  }, [name, endpoint, reconnect]);

  /**
   * Handle token refresh
   */
  const handleTokenRefresh = useCallback(() => {
    logger.info('sse_token_refreshed', {
      hookName: name,
      willReconnect: true,
      module: 'useSSE'
    });

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
      logger.warn('sse_no_endpoint', {
        hookName: name,
        module: 'useSSE'
      });
      return;
    }

    if (eventSourceRef.current) {
      logger.debug('sse_already_connected', {
        hookName: name,
        module: 'useSSE'
      });
      return;
    }

    try {
      const connectTimestamp = new Date().toISOString();
      logger.info('sse_connecting', {
        endpoint,
        hookName: name,
        connectTimestamp,
        hasExistingConnection: !!eventSourceRef.current,
        module: 'useSSE'
      });

      // SECURITY: Create EventSource connection
      // NOTE: EventSource automatically sends cookies (credentials: 'include' by default)
      // This ensures HTTPOnly authentication cookies are sent with the request
      const eventSource = new EventSource(endpoint);
      eventSourceRef.current = eventSource;

      logger.debug('sse_eventsource_created', {
        endpoint,
        hookName: name,
        readyState: eventSource.readyState,
        module: 'useSSE'
      });

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
      logger.error('sse_connect_error', {
        endpoint,
        errorMessage: err.message,
        hookName: name,
        module: 'useSSE'
      }, err);
      const errorData = { message: 'Failed to connect', error: err };
      setError(errorData);
      onErrorRef.current?.(errorData);
      reconnect();
    }
  }, [endpoint, name, handleOpen, handleError, setupEventListeners, handleTokenRefresh, reconnect]);

  /**
   * Disconnect from SSE endpoint
   */
  const disconnect = useCallback(() => {
    logger.info('sse_disconnecting', {
      hookName: name,
      module: 'useSSE'
    });
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
    onDisconnectRef.current?.();
  }, [name]);

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
