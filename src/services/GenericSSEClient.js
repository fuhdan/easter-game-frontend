/**
 * Module: services/GenericSSEClient.js
 * Purpose: Reusable SSE (Server-Sent Events) client for any endpoint
 * Part of: Easter Quest 2025 - Real-Time Updates Infrastructure
 *
 * Features:
 * - Configurable endpoint and event types
 * - Automatic reconnection with exponential backoff
 * - Token refresh handling with automatic reconnection
 * - Event-based architecture for flexible event handling
 * - Connection state management
 * - Comprehensive logging for debugging
 *
 * Usage:
 * ```javascript
 * const client = new GenericSSEClient({
 *   endpoint: '/admin/notifications/stream',
 *   eventTypes: ['notification', 'heartbeat'],
 *   maxReconnectAttempts: 5,
 *   reconnectDelay: 1000,
 *   maxReconnectDelay: 30000,
 *   name: 'Notifications' // For logging
 * });
 *
 * client.on('notification', (data) => {
 *   console.log('Received:', data);
 * });
 *
 * client.on('connected', () => {
 *   console.log('Connected!');
 * });
 *
 * client.connect();
 * ```
 *
 * @since 2025-11-23
 */

import { onTokenRefresh } from './api';

/**
 * Generic SSE Client
 *
 * Manages EventSource connection to any SSE endpoint with:
 * - Automatic reconnection with exponential backoff
 * - Token refresh handling
 * - Configurable event types
 * - Event listeners for custom events
 * - Connection state tracking
 *
 * This class serves as the foundation for all SSE connections in the application.
 * By centralizing SSE logic, we ensure consistent behavior and easier maintenance.
 */
class GenericSSEClient {
  /**
   * Create generic SSE client instance
   *
   * @param {Object} options - Configuration options
   * @param {string} options.endpoint - SSE endpoint URL (required)
   * @param {string[]} options.eventTypes - Event types to listen for (default: ['data'])
   * @param {number} options.maxReconnectAttempts - Max reconnection attempts (default: 5)
   * @param {number} options.reconnectDelay - Initial reconnection delay in ms (default: 1000)
   * @param {number} options.maxReconnectDelay - Max reconnection delay in ms (default: 30000)
   * @param {string} options.name - Client name for logging (default: 'GenericSSE')
   *
   * @throws {Error} If endpoint is not provided
   */
  constructor(options = {}) {
    // SECURITY: Validate required options
    if (!options.endpoint) {
      throw new Error('GenericSSEClient: endpoint is required');
    }

    // Configuration
    this.endpoint = options.endpoint;
    this.eventTypes = options.eventTypes || ['data'];
    this.maxReconnectAttempts = options.maxReconnectAttempts || 5;
    this.reconnectDelay = options.reconnectDelay || 1000;
    this.maxReconnectDelay = options.maxReconnectDelay || 30000;
    this.name = options.name || 'GenericSSE';

    // State management
    this.eventSource = null;
    this.listeners = new Map(); // Event type -> Set of callbacks
    this.reconnectAttempts = 0;
    this.isConnected = false;
    this.isIntentionalClose = false;
    this.unsubscribeTokenRefresh = null;

    // Bind methods to preserve 'this' context
    this.connect = this.connect.bind(this);
    this.disconnect = this.disconnect.bind(this);
    this.on = this.on.bind(this);
    this.off = this.off.bind(this);
    this.handleOpen = this.handleOpen.bind(this);
    this.handleError = this.handleError.bind(this);
    this.handleSSEError = this.handleSSEError.bind(this);
    this.reconnect = this.reconnect.bind(this);
    this.handleTokenRefresh = this.handleTokenRefresh.bind(this);
    this.setupEventListeners = this.setupEventListeners.bind(this);

    console.log(`[${this.name}] Client initialized for ${this.endpoint}`);
  }

  /**
   * Connect to SSE endpoint
   *
   * Establishes EventSource connection and sets up event listeners.
   * Automatically reconnects on connection loss unless intentionally closed.
   * EventSource automatically sends HTTPOnly cookies for authentication.
   */
  connect() {
    if (this.eventSource) {
      console.log(`[${this.name}] Already connected`);
      return;
    }

    try {
      console.log(`[${this.name}] Connecting to ${this.endpoint}`);

      // SECURITY: Create EventSource connection
      // NOTE: EventSource automatically sends cookies (credentials: 'include' by default)
      // This ensures HTTPOnly authentication cookies are sent with the request
      this.eventSource = new EventSource(this.endpoint);

      // Listen for connection open
      this.eventSource.addEventListener('open', this.handleOpen);

      // Listen for connection errors
      this.eventSource.addEventListener('error', this.handleError);

      // Setup custom event listeners for all configured event types
      this.setupEventListeners();

      // SECURITY: Subscribe to token refresh events
      // When tokens are refreshed, we need to reconnect with new cookies
      this.unsubscribeTokenRefresh = onTokenRefresh(this.handleTokenRefresh);

      this.isIntentionalClose = false;

    } catch (error) {
      console.error(`[${this.name}] Connection error:`, error);
      this.emit('error', { message: 'Failed to connect', error });
      this.reconnect();
    }
  }

  /**
   * Setup event listeners for all configured event types
   *
   * Dynamically registers listeners based on the eventTypes array.
   * Each event is automatically parsed as JSON and emitted to registered callbacks.
   */
  setupEventListeners() {
    this.eventTypes.forEach(eventType => {
      this.eventSource.addEventListener(eventType, (event) => {
        try {
          const data = JSON.parse(event.data);
          // Generic logging format: [ClientName] EventType: {data}
          const eventLabel = eventType.charAt(0).toUpperCase() + eventType.slice(1);
          console.log(`[${this.name}] ${eventLabel}:`, data);
          this.emit(eventType, data);
        } catch (error) {
          console.error(`[${this.name}] Failed to parse ${eventType}:`, error);
          this.emit('error', { message: `Failed to parse ${eventType}`, error });
        }
      });
    });

    // Also listen for generic 'error' events from server
    this.eventSource.addEventListener('error', this.handleSSEError);
  }

  /**
   * Disconnect from SSE endpoint
   *
   * Closes EventSource connection and prevents automatic reconnection.
   * Cleans up token refresh subscription.
   */
  disconnect() {
    console.log(`[${this.name}] Disconnecting`);
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
   *
   * Called when EventSource connection is successfully established.
   * Resets reconnection state and notifies listeners.
   */
  handleOpen() {
    console.log(`[${this.name}] Connected successfully`);
    this.isConnected = true;
    this.reconnectAttempts = 0;
    this.reconnectDelay = 1000; // Reset delay
    this.emit('connected');
  }

  /**
   * Handle connection error
   *
   * Triggered when EventSource encounters an error or loses connection.
   * Automatically attempts to reconnect unless intentionally closed.
   *
   * @param {Event} event - Error event from EventSource
   */
  handleError(event) {
    console.error(`[${this.name}] Connection error:`, event);

    // Mark as disconnected
    this.isConnected = false;

    // Close the dead connection
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    // Emit error event to listeners
    this.emit('error', { message: 'Connection lost', event });

    // IMPORTANT: Only reconnect if not intentionally closed
    if (!this.isIntentionalClose) {
      this.reconnect();
    }
  }

  /**
   * Handle error event from server
   *
   * SSE servers can send error events with additional information.
   * This handler parses and emits those errors to listeners.
   *
   * @param {MessageEvent} event - SSE message event
   */
  handleSSEError(event) {
    try {
      if (event.data) {
        const data = JSON.parse(event.data);
        console.error(`[${this.name}] Server error:`, data.message);
        this.emit('error', data);
      }
    } catch (error) {
      // Not a JSON error event, ignore
    }
  }

  /**
   * Handle token refresh
   *
   * When JWT tokens are refreshed, EventSource needs to reconnect
   * to send the new HTTPOnly cookies with the request.
   * EventSource will automatically send the new cookies on reconnection.
   */
  handleTokenRefresh() {
    console.log(`[${this.name}] Token refreshed - reconnecting`);

    // Disconnect current connection
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    // Reconnect with new tokens (EventSource will send new cookies)
    this.connect();
  }

  /**
   * Attempt to reconnect with exponential backoff
   *
   * Implements exponential backoff strategy:
   * - Attempt 1: 1 second
   * - Attempt 2: 2 seconds
   * - Attempt 3: 4 seconds
   * - Attempt 4: 8 seconds
   * - Attempt 5: 16 seconds
   * - Max: 30 seconds
   *
   * Stops after maxReconnectAttempts and emits error.
   */
  reconnect() {
    // Don't reconnect if intentionally closed
    if (this.isIntentionalClose) {
      console.log(`[${this.name}] Not reconnecting (intentional close)`);
      return;
    }

    // Check if max attempts reached
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error(`[${this.name}] Max reconnection attempts reached`);
      this.emit('error', {
        message: 'Failed to reconnect after maximum attempts',
        attempts: this.reconnectAttempts
      });
      return;
    }

    this.reconnectAttempts++;

    // Calculate exponential backoff delay
    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
      this.maxReconnectDelay
    );

    console.log(
      `[${this.name}] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
    );

    setTimeout(() => {
      console.log(`[${this.name}] Attempting reconnection...`);
      this.connect();
    }, delay);
  }

  /**
   * Register event listener
   *
   * Supports multiple listeners per event type.
   * Listeners are called in registration order.
   *
   * Event types:
   * - Custom events from eventTypes array (e.g., 'notification', 'heartbeat')
   * - 'connected' - Connection established
   * - 'disconnected' - Connection closed
   * - 'error' - Connection or parsing error
   *
   * @param {string} eventType - Event type to listen for
   * @param {Function} callback - Callback function (receives event data)
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
   * Removes a specific callback for an event type.
   * If callback is not provided, all listeners for that event are removed.
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
   * Internal method used to trigger callbacks for an event.
   * Errors in callbacks are caught and logged to prevent disrupting other listeners.
   *
   * @param {string} eventType - Event type
   * @param {*} data - Event data to pass to callbacks
   */
  emit(eventType, data) {
    if (this.listeners.has(eventType)) {
      this.listeners.get(eventType).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`[${this.name}] Error in ${eventType} listener:`, error);
        }
      });
    }
  }

  /**
   * Get connection status
   *
   * @returns {boolean} True if currently connected
   */
  isConnectionActive() {
    return this.isConnected;
  }

  /**
   * Get reconnection attempts count
   *
   * Useful for debugging and monitoring connection health.
   *
   * @returns {number} Number of reconnection attempts made
   */
  getReconnectAttempts() {
    return this.reconnectAttempts;
  }
}

export default GenericSSEClient;
