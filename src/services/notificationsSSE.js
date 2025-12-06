/**
 * Module: services/notificationsSSE.js
 * Purpose: SSE client for real-time admin notifications (wrapper around GenericSSEClient)
 * Part of: Easter Quest 2025 - Admin Notification System
 *
 * This is now a lightweight wrapper around GenericSSEClient configured
 * specifically for admin notifications. All SSE connection logic lives in
 * GenericSSEClient, ensuring consistent behavior across all SSE connections.
 *
 * Features:
 * - Real-time notification streaming from backend
 * - Automatic reconnection on disconnect (via GenericSSEClient)
 * - Token refresh handling with reconnection (via GenericSSEClient)
 * - Event-based architecture for notifications and heartbeats
 * - Connection state management
 *
 * Usage:
 * ```javascript
 * const client = new NotificationsSSE();
 *
 * client.on('notification', (data) => {
 *   console.log('New notification:', data);
 * });
 *
 * client.on('heartbeat', (data) => {
 *   console.log('Heartbeat:', data.count, 'notifications');
 * });
 *
 * client.connect();
 * ```
 *
 * @since 2025-11-22
 * @updated 2025-11-23 - Refactored to use GenericSSEClient
 */

import GenericSSEClient from './GenericSSEClient';
import { buildApiUrl } from '../config/apiConfig';

/**
 * SSE Client for Admin Notifications
 *
 * Backward-compatible wrapper around GenericSSEClient configured for
 * admin notification streaming. All existing code using NotificationsSSE
 * will work without changes.
 *
 * This class demonstrates the "wrapper pattern" - it inherits all
 * functionality from GenericSSEClient and only configures it with
 * notification-specific settings.
 */
class NotificationsSSE extends GenericSSEClient {
  /**
   * Create admin notifications SSE client instance
   *
   * Automatically configures GenericSSEClient with:
   * - Endpoint: /api/chat/admin/notifications/stream
   * - Event types: notification, heartbeat, error
   * - Reconnection: 5 attempts with exponential backoff (1s to 30s)
   */
  constructor() {
    super({
      endpoint: buildApiUrl('chat/admin/notifications/stream'),
      eventTypes: ['notification', 'heartbeat', 'error'],
      maxReconnectAttempts: 5,
      reconnectDelay: 1000,
      maxReconnectDelay: 30000,
      name: 'NotificationsSSE'
    });

    console.log('[NotificationsSSE] Initialized using GenericSSEClient');
  }
}

export default NotificationsSSE;
