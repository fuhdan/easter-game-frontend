/**
 * Module: hooks/useNotifications.js
 * Purpose: SSE hook for real-time admin notifications
 * Part of: Easter Quest 2025 - Admin Notification System
 *
 * This is a specialized hook wrapping useSSE configured for admin notifications.
 * Provides real-time streaming of admin notifications for chat escalations.
 *
 * Features:
 * - Real-time notification streaming from backend
 * - Automatic reconnection on disconnect
 * - Token refresh handling with reconnection
 * - Event-based architecture for notifications and heartbeats
 * - Connection state management
 *
 * Usage:
 * ```javascript
 * const { notification, isConnected, error } = useNotifications({
 *   onNotification: (data) => console.log('New notification:', data),
 *   onHeartbeat: (data) => console.log('Heartbeat:', data.count)
 * });
 * ```
 *
 * @since 2025-12-22
 */

import { useCallback } from 'react';
import { useSSE } from './useSSE';
import { buildApiUrl } from '../config/apiConfig';

/**
 * Admin Notifications SSE Hook
 *
 * Provides real-time updates for admin notifications.
 *
 * Events:
 * - notification: New or updated notification
 * - heartbeat: Keep-alive ping with notification count
 *
 * @param {Object} options - Configuration options
 * @param {Function} options.onNotification - Callback when notification received (data)
 * @param {Function} options.onHeartbeat - Callback for heartbeat (data)
 * @param {Function} options.onConnect - Callback when connected
 * @param {Function} options.onDisconnect - Callback when disconnected
 * @param {Function} options.onError - Callback for errors
 * @returns {Object} { notification, isConnected, error, reconnect, disconnect }
 */
export const useNotifications = (options = {}) => {
  const {
    onNotification,
    onHeartbeat,
    onConnect,
    onDisconnect,
    onError
  } = options;

  /**
   * Handle incoming SSE messages
   */
  const handleMessage = useCallback((eventType, data) => {
    switch (eventType) {
      case 'notification':
        console.log('[useNotifications] Received notification:', data);
        onNotification?.(data);
        break;

      case 'heartbeat':
        console.log('[useNotifications] Heartbeat:', data.count, 'notifications');
        onHeartbeat?.(data);
        break;

      default:
        console.log('[useNotifications] Unknown event type:', eventType, data);
    }
  }, [onNotification, onHeartbeat]);

  /**
   * Handle connection established
   */
  const handleConnect = useCallback(() => {
    console.log('[useNotifications] SSE connected');
    onConnect?.();
  }, [onConnect]);

  /**
   * Handle disconnection
   */
  const handleDisconnect = useCallback(() => {
    console.log('[useNotifications] SSE disconnected');
    onDisconnect?.();
  }, [onDisconnect]);

  /**
   * Handle errors
   */
  const handleError = useCallback((errorData) => {
    console.error('[useNotifications] SSE error:', errorData);
    onError?.(errorData);
  }, [onError]);

  // Use generic SSE hook with notifications configuration
  const { data, isConnected, error, reconnect, disconnect } = useSSE({
    endpoint: buildApiUrl('chat/admin/notifications/stream'),
    eventTypes: ['notification', 'heartbeat', 'error'],
    onMessage: handleMessage,
    onConnect: handleConnect,
    onDisconnect: handleDisconnect,
    onError: handleError,
    maxReconnectAttempts: 5,
    reconnectDelay: 1000,
    maxReconnectDelay: 30000,
    name: 'Notifications'
  });

  return {
    notification: data,
    isConnected,
    error,
    reconnect,
    disconnect
  };
};

export default useNotifications;
