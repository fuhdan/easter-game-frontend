/**
 * Module: services/notificationsSSE.js
 * Purpose: Server-Sent Events (SSE) client for real-time admin notifications
 * Part of: Easter Quest 2025 - Admin Notification System
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
 */

import { onTokenRefresh } from './api';

/**
 * SSE Client for Admin Notifications
 *
 * Manages EventSource connection to backend SSE endpoint with:
 * - Automatic reconnection
 * - Token refresh handling
 * - Event listeners for notifications/heartbeats
 * - Connection state tracking
 */
class NotificationsSSE {
  /**
   * Create SSE client instance
   */
  constructor() {
    this.eventSource = null;
    this.listeners = new Map(); // Event type -> Set of callbacks
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000; // Start with 1 second
    this.maxReconnectDelay = 30000; // Max 30 seconds
    this.isConnected = false;
    this.isIntentionalClose = false;
    this.unsubscribeTokenRefresh = null;

    // Bind methods
    this.connect = this.connect.bind(this);
    this.disconnect = this.disconnect.bind(this);
    this.on = this.on.bind(this);
    this.off = this.off.bind(this);
    this.handleOpen = this.handleOpen.bind(this);
    this.handleError = this.handleError.bind(this);
    this.handleNotification = this.handleNotification.bind(this);
    this.handleHeartbeat = this.handleHeartbeat.bind(this);
    this.handleSSEError = this.handleSSEError.bind(this);
    this.reconnect = this.reconnect.bind(this);
    this.handleTokenRefresh = this.handleTokenRefresh.bind(this);

    console.log('[NotificationsSSE] Client initialized');
  }

  /**
   * Connect to SSE endpoint
   *
   * Establishes EventSource connection and sets up event listeners.
   * Automatically reconnects on connection loss unless intentionally closed.
   */
  connect() {
    if (this.eventSource) {
      console.log('[NotificationsSSE] Already connected');
      return;
    }

    try {
      console.log('[NotificationsSSE] Connecting to /api/chat/admin/notifications/stream');

      // Create EventSource connection
      // NOTE: EventSource automatically sends cookies (credentials: 'include' by default)
      this.eventSource = new EventSource('/api/chat/admin/notifications/stream');

      // Listen for connection open
      this.eventSource.addEventListener('open', this.handleOpen);

      // Listen for errors
      this.eventSource.addEventListener('error', this.handleError);

      // Listen for notification events
      this.eventSource.addEventListener('notification', this.handleNotification);

      // Listen for heartbeat events
      this.eventSource.addEventListener('heartbeat', this.handleHeartbeat);

      // Listen for error events from server
      this.eventSource.addEventListener('error', this.handleSSEError);

      // Subscribe to token refresh events
      this.unsubscribeTokenRefresh = onTokenRefresh(this.handleTokenRefresh);

      this.isIntentionalClose = false;

    } catch (error) {
      console.error('[NotificationsSSE] Connection error:', error);
      this.emit('error', { message: 'Failed to connect', error });
      this.reconnect();
    }
  }

  /**
   * Disconnect from SSE endpoint
   *
   * Closes EventSource connection and prevents automatic reconnection.
   */
  disconnect() {
    console.log('[NotificationsSSE] Disconnecting');
    this.isIntentionalClose = true;

    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    if (this.unsubscribeTokenRefresh) {
      this.unsubscribeTokenRefresh();
      this.unsubscribeTokenRefresh = null;
    }

    this.isConnected = false;
    this.emit('disconnected');
  }

  /**
   * Handle connection opened
   */
  handleOpen() {
    console.log('[NotificationsSSE] Connected successfully');
    this.isConnected = true;
    this.reconnectAttempts = 0;
    this.reconnectDelay = 1000;
    this.emit('connected');
  }

  /**
   * Handle connection error
   *
   * Triggered when EventSource encounters an error or loses connection.
   * Automatically attempts to reconnect unless intentionally closed.
   */
  handleError(event) {
    console.error('[NotificationsSSE] Connection error:', event);

    // Mark as disconnected
    this.isConnected = false;

    // Close the dead connection
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    // Emit error event
    this.emit('error', { message: 'Connection lost', event });

    // Reconnect unless intentionally closed
    if (!this.isIntentionalClose) {
      this.reconnect();
    }
  }

  /**
   * Handle notification event
   *
   * @param {MessageEvent} event - SSE message event
   */
  handleNotification(event) {
    try {
      const data = JSON.parse(event.data);
      console.log('[NotificationsSSE] Notification received:', data.id, data.escalation_type);
      this.emit('notification', data);
    } catch (error) {
      console.error('[NotificationsSSE] Failed to parse notification:', error);
      this.emit('error', { message: 'Failed to parse notification', error });
    }
  }

  /**
   * Handle heartbeat event
   *
   * @param {MessageEvent} event - SSE message event
   */
  handleHeartbeat(event) {
    try {
      const data = JSON.parse(event.data);
      console.log('[NotificationsSSE] Heartbeat:', data.count, 'notifications');
      this.emit('heartbeat', data);
    } catch (error) {
      console.error('[NotificationsSSE] Failed to parse heartbeat:', error);
    }
  }

  /**
   * Handle error event from server
   *
   * @param {MessageEvent} event - SSE message event
   */
  handleSSEError(event) {
    try {
      const data = JSON.parse(event.data);
      console.error('[NotificationsSSE] Server error:', data.message);
      this.emit('error', data);
    } catch (error) {
      // Not a JSON error event
    }
  }

  /**
   * Handle token refresh
   *
   * When tokens are refreshed, reconnect to SSE endpoint with new tokens.
   * EventSource will automatically send the new cookies.
   */
  handleTokenRefresh() {
    console.log('[NotificationsSSE] Token refreshed - reconnecting');

    // Disconnect current connection
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    // Reconnect with new tokens
    this.connect();
  }

  /**
   * Attempt to reconnect with exponential backoff
   */
  reconnect() {
    if (this.isIntentionalClose) {
      console.log('[NotificationsSSE] Not reconnecting (intentional close)');
      return;
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[NotificationsSSE] Max reconnection attempts reached');
      this.emit('error', {
        message: 'Failed to reconnect after maximum attempts',
        attempts: this.reconnectAttempts
      });
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
      this.maxReconnectDelay
    );

    console.log(
      `[NotificationsSSE] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
    );

    setTimeout(() => {
      console.log('[NotificationsSSE] Attempting reconnection...');
      this.connect();
    }, delay);
  }

  /**
   * Register event listener
   *
   * @param {string} eventType - Event type (notification, heartbeat, connected, disconnected, error)
   * @param {Function} callback - Callback function
   */
  on(eventType, callback) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType).add(callback);
  }

  /**
   * Unregister event listener
   *
   * @param {string} eventType - Event type
   * @param {Function} callback - Callback function to remove
   */
  off(eventType, callback) {
    if (this.listeners.has(eventType)) {
      this.listeners.get(eventType).delete(callback);
    }
  }

  /**
   * Emit event to all registered listeners
   *
   * @param {string} eventType - Event type
   * @param {*} data - Event data
   */
  emit(eventType, data) {
    if (this.listeners.has(eventType)) {
      this.listeners.get(eventType).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`[NotificationsSSE] Error in ${eventType} listener:`, error);
        }
      });
    }
  }

  /**
   * Get connection status
   *
   * @returns {boolean} True if connected
   */
  isConnectionActive() {
    return this.isConnected;
  }

  /**
   * Get reconnection attempts count
   *
   * @returns {number} Number of reconnection attempts
   */
  getReconnectAttempts() {
    return this.reconnectAttempts;
  }
}

export default NotificationsSSE;
