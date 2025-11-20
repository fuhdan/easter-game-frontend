/**
 * Module: services/websocket/heartbeatManager.js
 * Purpose: Heartbeat/ping mechanism for WebSocket health monitoring
 * Part of: Easter Quest Frontend - Chat System
 *
 * Features:
 * - Periodic ping messages
 * - Configurable interval
 * - Automatic start/stop on connection state change
 *
 * @since 2025-11-20
 */

/**
 * HeartbeatManager - Manages periodic ping messages to keep connection alive
 *
 * @class
 * @example
 * const heartbeat = new HeartbeatManager(30000);
 * heartbeat.start(() => ws.send('ping'));
 * heartbeat.stop();
 */
export class HeartbeatManager {
  /**
   * Create a HeartbeatManager instance
   *
   * @param {number} interval - Ping interval in milliseconds (default: 30000)
   */
  constructor(interval = 30000) {
    this.interval = interval;
    this.timer = null;

    console.log('[HeartbeatManager] Initialized with interval:', this.interval);
  }

  /**
   * Start heartbeat timer
   *
   * @param {Function} pingCallback - Function to send ping message
   * @param {Function} isConnectedCallback - Function to check if connected
   */
  start(pingCallback, isConnectedCallback) {
    this.stop();

    this.timer = setInterval(() => {
      if (isConnectedCallback()) {
        try {
          pingCallback();
          console.log('[HeartbeatManager] Ping sent');
        } catch (error) {
          console.error('[HeartbeatManager] Failed to send ping:', error);
        }
      }
    }, this.interval);

    console.log('[HeartbeatManager] Heartbeat started');
  }

  /**
   * Stop heartbeat timer
   */
  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      console.log('[HeartbeatManager] Heartbeat stopped');
    }
  }

  /**
   * Check if heartbeat is running
   *
   * @returns {boolean}
   */
  isRunning() {
    return this.timer !== null;
  }

  /**
   * Update heartbeat interval
   *
   * @param {number} newInterval - New interval in milliseconds
   */
  setInterval(newInterval) {
    this.interval = newInterval;
    console.log('[HeartbeatManager] Interval updated to:', this.interval);
  }
}
