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
import { logger } from '../utils/logger';

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
        logger.debug('websocket_status_changed', {
          prevStatus,
          newStatus,
          module: 'useWebSocket'
        });
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
      logger.warn('websocket_queue_full', {
        maxQueueSize: config.maxQueueSize,
        droppedMessageType: messageQueueRef.current[0]?.type,
        module: 'useWebSocket'
      });
      messageQueueRef.current.shift();
    }
    messageQueueRef.current.push(message);
    logger.debug('websocket_message_queued', {
      queueSize: messageQueueRef.current.length,
      messageType: message.type,
      module: 'useWebSocket'
    });
  }, [config.maxQueueSize]);

  /**
   * Flush message queue
   */
  const flushMessageQueue = useCallback(() => {
    if (messageQueueRef.current.length === 0) return;

    logger.debug('websocket_flushing_queue', {
      queueSize: messageQueueRef.current.length,
      module: 'useWebSocket'
    });

    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    let sent = 0;
    while (messageQueueRef.current.length > 0) {
      const message = messageQueueRef.current.shift();
      try {
        ws.send(JSON.stringify(message));
        sent++;
        logger.debug('websocket_queued_message_sent', {
          messageType: message.type,
          module: 'useWebSocket'
        });
      } catch (error) {
        logger.error('websocket_failed_send_queued_message', {
          messageType: message.type,
          error: error.message,
          module: 'useWebSocket'
        }, error);
        messageQueueRef.current.unshift(message);
        break;
      }
    }

    logger.debug('websocket_queue_flushed', {
      sent,
      remaining: messageQueueRef.current.length,
      module: 'useWebSocket'
    });
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
          logger.debug('websocket_ping_sent', { module: 'useWebSocket' });
        } catch (error) {
          logger.error('websocket_ping_failed', {
            error: error.message,
            module: 'useWebSocket'
          }, error);
        }
      }
    }, config.heartbeatInterval);

    logger.debug('websocket_heartbeat_started', {
      interval: config.heartbeatInterval,
      module: 'useWebSocket'
    });
  }, [config.heartbeatInterval]);

  /**
   * Stop heartbeat
   */
  const stopHeartbeat = useCallback(() => {
    if (heartbeatTimerRef.current) {
      clearInterval(heartbeatTimerRef.current);
      heartbeatTimerRef.current = null;
      logger.debug('websocket_heartbeat_stopped', { module: 'useWebSocket' });
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
      logger.debug('websocket_skip_reconnect', {
        reason: 'Manual close',
        module: 'useWebSocket'
      });
      return;
    }

    clearReconnectTimer();

    // Calculate exponential backoff delay
    const delay = Math.min(
      config.reconnectInterval * Math.pow(2, reconnectAttemptsRef.current),
      config.maxReconnectInterval
    );

    logger.info('websocket_reconnect_scheduled', {
      delay,
      attempt: reconnectAttemptsRef.current + 1,
      module: 'useWebSocket'
    });

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
      logger.debug('websocket_pong_received', { module: 'useWebSocket' });
      return;
    }

    // Notify all message listeners
    messageListenersRef.current.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        logger.error('websocket_message_listener_error', {
          messageType: data.type,
          error: error.message,
          module: 'useWebSocket'
        }, error);
      }
    });
  }, []);

  /**
   * Connect to WebSocket
   */
  const connect = useCallback(() => {
    if (wsRef.current && (wsRef.current.readyState === WebSocket.CONNECTING || wsRef.current.readyState === WebSocket.OPEN)) {
      logger.debug('websocket_already_connected', {
        readyState: wsRef.current.readyState,
        module: 'useWebSocket'
      });
      return Promise.resolve();
    }

    manualCloseRef.current = false;
    updateStatus('connecting');

    return new Promise((resolve, reject) => {
      try {
        logger.info('websocket_connecting', {
          url: wsUrl,
          module: 'useWebSocket'
        });

        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          logger.info('websocket_connected', {
            url: wsUrl,
            module: 'useWebSocket'
          });
          reconnectAttemptsRef.current = 0;
          updateStatus('connected');
          startHeartbeat();
          flushMessageQueue();
          resolve();
        };

        ws.onclose = (event) => {
          logger.info('websocket_closed', {
            code: event.code,
            reason: event.reason,
            module: 'useWebSocket'
          });
          stopHeartbeat();
          updateStatus('disconnected');

          // Don't reconnect if server closed due to logout
          if (event.code === 1000 && event.reason === 'Logout') {
            logger.info('websocket_logout_close', {
              reason: 'Server closed due to logout',
              module: 'useWebSocket'
            });
            manualCloseRef.current = true;
            return;
          }

          // Auto-reconnect if not manually closed
          if (!manualCloseRef.current) {
            scheduleReconnect();
          }
        };

        ws.onerror = (error) => {
          logger.error('websocket_error', {
            url: wsUrl,
            error: error.message,
            module: 'useWebSocket'
          }, error);
          setLastError(error);
          reject(error);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            logger.debug('websocket_message_received', {
              messageType: data.type,
              module: 'useWebSocket'
            });
            handleMessage(data);
          } catch (error) {
            logger.error('websocket_parse_error', {
              error: error.message,
              module: 'useWebSocket'
            }, error);
          }
        };
      } catch (error) {
        logger.error('websocket_create_failed', {
          url: wsUrl,
          error: error.message,
          module: 'useWebSocket'
        }, error);
        updateStatus('disconnected');
        reject(error);
      }
    });
  }, [wsUrl, updateStatus, startHeartbeat, stopHeartbeat, flushMessageQueue, scheduleReconnect, handleMessage]);

  /**
   * Disconnect from WebSocket
   */
  const disconnect = useCallback((code = 1000, reason = 'Manual disconnect') => {
    logger.info('websocket_disconnecting', {
      code,
      reason,
      module: 'useWebSocket'
    });
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
      logger.error('websocket_invalid_message_type', {
        type: typeof type,
        value: type,
        module: 'useWebSocket'
      });
      return false;
    }

    const message = { type, ...data };
    const ws = wsRef.current;

    if (ws && ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(message));
        logger.debug('websocket_message_sent', {
          messageType: type,
          module: 'useWebSocket'
        });
        return true;
      } catch (error) {
        logger.error('websocket_send_failed', {
          messageType: type,
          error: error.message,
          module: 'useWebSocket'
        }, error);
        enqueueMessage(message);
        return false;
      }
    } else {
      logger.debug('websocket_message_queued_not_connected', {
        messageType: type,
        readyState: ws?.readyState,
        module: 'useWebSocket'
      });
      enqueueMessage(message);
      return false;
    }
  }, [enqueueMessage]);

  /**
   * Subscribe to incoming messages
   */
  const onMessage = useCallback((callback) => {
    if (typeof callback !== 'function') {
      logger.error('websocket_invalid_callback', {
        callbackType: typeof callback,
        module: 'useWebSocket'
      });
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
    logger.info('websocket_manual_reconnect', {
      module: 'useWebSocket'
    });
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
      logger.debug('websocket_cancel_cleanup', {
        reason: 'previous_mount',
        module: 'useWebSocket'
      });
      clearTimeout(cleanupTimeoutRef.current);
      cleanupTimeoutRef.current = null;
    }

    // Skip if already initialized (handles React StrictMode double-mount)
    if (isMountedRef.current && wsRef.current) {
      logger.debug('websocket_already_initialized', {
        strictMode: true,
        module: 'useWebSocket'
      });
      return;
    }

    logger.info('websocket_initializing', {
      url: wsUrl,
      autoConnect: config.autoConnect,
      module: 'useWebSocket'
    });
    isMountedRef.current = true;

    // Auto-connect if enabled
    if (config.autoConnect) {
      logger.info('websocket_auto_connecting', {
        url: wsUrl,
        module: 'useWebSocket'
      });
      connect().catch(error => {
        logger.error('websocket_auto_connect_failed', {
          url: wsUrl,
          errorMessage: error.message,
          module: 'useWebSocket'
        }, error);
        setLastError(error);
      });
    }

    // Cleanup on unmount (only on real unmount, not StrictMode double-mount)
    return () => {
      logger.debug('websocket_cleanup_called', {
        module: 'useWebSocket'
      });

      // Use timeout to differentiate between StrictMode remount and real unmount
      cleanupTimeoutRef.current = setTimeout(() => {
        logger.info('websocket_cleanup_executing', {
          module: 'useWebSocket'
        });
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
    logger.debug('websocket_token_listener_setup', {
      module: 'useWebSocket'
    });

    const unsubscribe = onTokenRefresh(() => {
      logger.info('websocket_token_refreshed', {
        willReconnect: !!wsRef.current,
        module: 'useWebSocket'
      });

      if (wsRef.current) {
        disconnect();

        // Wait 100ms for new cookies to be set
        setTimeout(() => {
          logger.info('websocket_reconnecting_after_token_refresh', {
            url: wsUrl,
            module: 'useWebSocket'
          });
          connect().catch(error => {
            logger.error('websocket_reconnect_after_token_failed', {
              url: wsUrl,
              errorMessage: error.message,
              module: 'useWebSocket'
            }, error);
            setLastError(error);
          });
        }, 100);
      }
    });

    return () => {
      logger.debug('websocket_token_listener_cleanup', {
        module: 'useWebSocket'
      });
      unsubscribe();
    };
  }, [disconnect, connect, wsUrl]);

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
