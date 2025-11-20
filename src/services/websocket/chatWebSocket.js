/**
 * Module: services/websocket/chatWebSocket.js
 * Purpose: WebSocket client for real-time chat communication
 * Part of: Easter Quest Frontend - Chat System
 *
 * Features:
 * - Auto-reconnection with exponential backoff (via ReconnectionManager)
 * - Message queuing during disconnection (via MessageQueue)
 * - Event-based message handling
 * - Heartbeat/ping management (via HeartbeatManager)
 * - Token refresh integration support
 *
 * @since 2025-11-09
 */

import { ReconnectionManager } from './reconnectionManager';
import { MessageQueue } from './messageQueue';
import { HeartbeatManager } from './heartbeatManager';

/**
 * ChatWebSocket - Manages WebSocket connection for chat
 *
 * @class
 * @example
 * const ws = new ChatWebSocket('ws://localhost:8000/ws/chat');
 * ws.on('message', (data) => console.log('Received:', data));
 * ws.connect();
 * ws.send('user_message', { content: 'Hello!' });
 */
class ChatWebSocket {
  /**
   * Create a ChatWebSocket instance
   *
   * @param {string} url - WebSocket endpoint URL (optional, auto-detected)
   * @param {object} options - Configuration options
   * @param {number} options.reconnectInterval - Initial reconnect delay (ms)
   * @param {number} options.maxReconnectInterval - Max reconnect delay (ms)
   * @param {number} options.heartbeatInterval - Ping interval (ms)
   * @param {number} options.maxQueueSize - Max queued messages
   */
  constructor(url = null, options = {}) {
    // IMPORTANT: Auto-detect WebSocket URL from current location
    // Browser automatically sends HTTPOnly cookies with WebSocket handshake
    if (!url) {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      this.url = `${protocol}//${host}/ws/chat`;
    } else {
      this.url = url;
    }

    this.ws = null;

    // Initialize managers
    this.reconnectionManager = new ReconnectionManager({
      baseDelay: options.reconnectInterval || 1000,
      maxDelay: options.maxReconnectInterval || 30000
    });

    this.messageQueue = new MessageQueue(options.maxQueueSize || 100);

    this.heartbeatManager = new HeartbeatManager(options.heartbeatInterval || 30000);

    // Event listeners
    this.listeners = {
      open: [],
      close: [],
      error: [],
      message: [],
      status: []
    };

    // Connection state
    this.status = 'disconnected'; // 'disconnected' | 'connecting' | 'connected'
    this.manualClose = false;

    console.log('[ChatWebSocket] Initialized with URL:', this.url);
  }

  /**
   * Establish WebSocket connection
   *
   * @returns {Promise<void>}
   */
  connect() {
    if (this.ws && (this.ws.readyState === WebSocket.CONNECTING || this.ws.readyState === WebSocket.OPEN)) {
      console.log('[ChatWebSocket] Already connected or connecting');
      return Promise.resolve();
    }

    this.manualClose = false;
    this._updateStatus('connecting');

    return new Promise((resolve, reject) => {
      try {
        console.log('[ChatWebSocket] Connecting to:', this.url);

        // SECURITY: Cookies sent automatically for authentication
        this.ws = new WebSocket(this.url);

        // Connection opened
        this.ws.onopen = () => {
          console.log('[ChatWebSocket] Connected successfully');
          this.reconnectionManager.resetAttempts();
          this._updateStatus('connected');
          this._startHeartbeat();
          this._flushMessageQueue();
          this.emit('open');
          resolve();
        };

        // Connection closed
        this.ws.onclose = (event) => {
          console.log('[ChatWebSocket] Connection closed:', event.code, event.reason);
          this._stopHeartbeat();
          this._updateStatus('disconnected');
          this.emit('close', { code: event.code, reason: event.reason });

          // Don't reconnect if server closed due to logout
          if (event.code === 1000 && event.reason === 'Logout') {
            console.log('[ChatWebSocket] Server closed connection due to logout, not reconnecting');
            this.manualClose = true;
            return;
          }

          // Auto-reconnect if not manually closed
          if (!this.manualClose) {
            this._scheduleReconnect();
          }
        };

        // Connection error
        this.ws.onerror = (error) => {
          console.error('[ChatWebSocket] WebSocket error:', error);
          this.emit('error', error);
          reject(error);
        };

        // Message received
        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('[ChatWebSocket] Message received:', data.type);
            this._handleIncomingMessage(data);
          } catch (error) {
            console.error('[ChatWebSocket] Failed to parse message:', error);
          }
        };
      } catch (error) {
        console.error('[ChatWebSocket] Failed to create WebSocket:', error);
        this._updateStatus('disconnected');
        reject(error);
      }
    });
  }

  /**
   * Close WebSocket connection
   *
   * @param {number} code - Close code (default: 1000)
   * @param {string} reason - Close reason
   */
  disconnect(code = 1000, reason = 'Manual disconnect') {
    console.log('[ChatWebSocket] Disconnecting:', reason);
    this.manualClose = true;
    this._stopHeartbeat();
    this.reconnectionManager.clearTimer();

    if (this.ws) {
      this.ws.close(code, reason);
      this.ws = null;
    }

    this._updateStatus('disconnected');
  }

  /**
   * Send message via WebSocket
   *
   * @param {string} type - Message type
   * @param {object} data - Message payload
   * @returns {boolean} Success status
   */
  send(type, data = {}) {
    const message = { type, ...data };

    if (this.status === 'connected' && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(message));
        console.log('[ChatWebSocket] Message sent:', type);
        return true;
      } catch (error) {
        console.error('[ChatWebSocket] Failed to send message:', error);
        this.messageQueue.enqueue(message);
        return false;
      }
    } else {
      console.log('[ChatWebSocket] Not connected, queueing message:', type);
      this.messageQueue.enqueue(message);
      return false;
    }
  }

  /**
   * Send all queued messages
   *
   * @private
   */
  _flushMessageQueue() {
    if (this.messageQueue.isEmpty()) return;

    console.log('[ChatWebSocket] Flushing message queue');

    this.messageQueue.flush((message) => {
      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify(message));
        return true;
      }
      return false;
    });
  }

  /**
   * Handle incoming WebSocket message
   *
   * @param {object} data - Parsed message data
   * @private
   */
  _handleIncomingMessage(data) {
    // Handle pong (heartbeat response)
    if (data.type === 'pong') {
      console.log('[ChatWebSocket] Pong received');
      return;
    }

    // Emit to message listeners
    this.emit('message', data);
  }

  /**
   * Start heartbeat/ping
   *
   * @private
   */
  _startHeartbeat() {
    this.heartbeatManager.start(
      () => this.send('ping'),
      () => this.status === 'connected' && this.ws?.readyState === WebSocket.OPEN
    );
  }

  /**
   * Stop heartbeat
   *
   * @private
   */
  _stopHeartbeat() {
    this.heartbeatManager.stop();
  }

  /**
   * Schedule reconnection attempt
   *
   * @private
   */
  _scheduleReconnect() {
    this.reconnectionManager.scheduleReconnect(() => {
      return this.connect();
    }).catch((error) => {
      console.error('[ChatWebSocket] Reconnection failed:', error);
    });
  }

  /**
   * Update connection status
   *
   * @param {string} newStatus - New status
   * @private
   */
  _updateStatus(newStatus) {
    if (this.status !== newStatus) {
      console.log(`[ChatWebSocket] Status: ${this.status} -> ${newStatus}`);
      this.status = newStatus;
      this.emit('status', newStatus);
    }
  }

  /**
   * Subscribe to event
   *
   * @param {string} event - Event name
   * @param {Function} callback - Event handler
   * @returns {Function} Unsubscribe function
   */
  on(event, callback) {
    if (!this.listeners[event]) {
      console.warn(`[ChatWebSocket] Unknown event: ${event}`);
      return () => {};
    }

    this.listeners[event].push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.listeners[event].indexOf(callback);
      if (index > -1) {
        this.listeners[event].splice(index, 1);
      }
    };
  }

  /**
   * Emit event to subscribers
   *
   * @param {string} event - Event name
   * @param {*} data - Event data
   * @private
   */
  emit(event, data) {
    if (!this.listeners[event]) return;

    this.listeners[event].forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`[ChatWebSocket] Error in ${event} listener:`, error);
      }
    });
  }

  /**
   * Get current connection status
   *
   * @returns {string} Current status
   */
  getStatus() {
    return this.status;
  }

  /**
   * Check if connected
   *
   * @returns {boolean}
   */
  isConnected() {
    return this.status === 'connected' && this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Get queued message count
   *
   * @returns {number}
   */
  getQueueSize() {
    return this.messageQueue.size();
  }
}

export default ChatWebSocket;
