/**
 * Module: services/websocket/reconnectionManager.js
 * Purpose: Handle WebSocket reconnection with exponential backoff
 * Part of: Easter Quest Frontend - Chat System
 *
 * Features:
 * - Exponential backoff algorithm
 * - Max reconnection attempts tracking
 * - Configurable delays
 *
 * @since 2025-11-20
 */

/**
 * ReconnectionManager - Handles automatic reconnection with exponential backoff
 *
 * @class
 * @example
 * const manager = new ReconnectionManager({ baseDelay: 1000, maxDelay: 30000 });
 * manager.scheduleReconnect(() => {
 *   console.log('Reconnecting...');
 *   return connection.connect();
 * });
 */
export class ReconnectionManager {
  /**
   * Create a ReconnectionManager instance
   *
   * @param {object} options - Configuration options
   * @param {number} options.baseDelay - Initial reconnect delay (ms, default: 1000)
   * @param {number} options.maxDelay - Max reconnect delay (ms, default: 30000)
   */
  constructor(options = {}) {
    this.baseDelay = options.baseDelay || 1000;
    this.maxDelay = options.maxDelay || 30000;
    this.reconnectAttempts = 0;
    this.reconnectTimer = null;

    console.log('[ReconnectionManager] Initialized with baseDelay:', this.baseDelay, 'maxDelay:', this.maxDelay);
  }

  /**
   * Schedule reconnection attempt with exponential backoff
   *
   * @param {Function} reconnectCallback - Function to call for reconnection
   * @returns {Promise<void>}
   */
  scheduleReconnect(reconnectCallback) {
    this.clearTimer();

    // Calculate backoff delay (exponential)
    const delay = Math.min(
      this.baseDelay * Math.pow(2, this.reconnectAttempts),
      this.maxDelay
    );

    console.log(`[ReconnectionManager] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1})`);

    return new Promise((resolve, reject) => {
      this.reconnectTimer = setTimeout(async () => {
        this.reconnectAttempts++;
        try {
          await reconnectCallback();
          resolve();
        } catch (error) {
          console.error('[ReconnectionManager] Reconnection failed:', error);
          reject(error);
        }
      }, delay);
    });
  }

  /**
   * Reset reconnection attempts counter
   */
  resetAttempts() {
    console.log('[ReconnectionManager] Reset attempts counter');
    this.reconnectAttempts = 0;
  }

  /**
   * Clear pending reconnection timer
   */
  clearTimer() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * Get current number of reconnection attempts
   *
   * @returns {number}
   */
  getAttempts() {
    return this.reconnectAttempts;
  }
}
