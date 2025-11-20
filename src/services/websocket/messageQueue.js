/**
 * Module: services/websocket/messageQueue.js
 * Purpose: Message queueing for offline/disconnected WebSocket
 * Part of: Easter Quest Frontend - Chat System
 *
 * Features:
 * - FIFO queue with max size limit
 * - Automatic queue flushing when connected
 * - Overflow handling (drops oldest messages)
 *
 * @since 2025-11-20
 */

/**
 * MessageQueue - Manages queuing and sending of messages during disconnection
 *
 * @class
 * @example
 * const queue = new MessageQueue(100);
 * queue.enqueue({ type: 'user_message', content: 'Hello' });
 * queue.flush((msg) => ws.send(JSON.stringify(msg)));
 */
export class MessageQueue {
  /**
   * Create a MessageQueue instance
   *
   * @param {number} maxSize - Maximum queue size (default: 100)
   */
  constructor(maxSize = 100) {
    this.queue = [];
    this.maxSize = maxSize;

    console.log('[MessageQueue] Initialized with maxSize:', this.maxSize);
  }

  /**
   * Add message to queue
   *
   * @param {object} message - Message to queue
   * @returns {boolean} Success status
   */
  enqueue(message) {
    if (this.queue.length >= this.maxSize) {
      console.warn('[MessageQueue] Queue full, dropping oldest message');
      this.queue.shift();
    }

    this.queue.push(message);
    console.log('[MessageQueue] Message queued, queue size:', this.queue.length);
    return true;
  }

  /**
   * Send all queued messages
   *
   * @param {Function} sendCallback - Function to send message (returns boolean)
   * @returns {number} Number of messages successfully sent
   */
  flush(sendCallback) {
    if (this.queue.length === 0) return 0;

    console.log('[MessageQueue] Flushing queue:', this.queue.length);

    let sent = 0;
    while (this.queue.length > 0) {
      const message = this.queue.shift();
      try {
        const success = sendCallback(message);
        if (success) {
          sent++;
          console.log('[MessageQueue] Queued message sent:', message.type);
        } else {
          // Put it back at the front and stop
          this.queue.unshift(message);
          break;
        }
      } catch (error) {
        console.error('[MessageQueue] Failed to send queued message:', error);
        // Put it back at the front and stop
        this.queue.unshift(message);
        break;
      }
    }

    console.log(`[MessageQueue] Flushed ${sent} messages, ${this.queue.length} remaining`);
    return sent;
  }

  /**
   * Clear all queued messages
   */
  clear() {
    const size = this.queue.length;
    this.queue = [];
    console.log('[MessageQueue] Cleared', size, 'messages');
  }

  /**
   * Get current queue size
   *
   * @returns {number}
   */
  size() {
    return this.queue.length;
  }

  /**
   * Check if queue is empty
   *
   * @returns {boolean}
   */
  isEmpty() {
    return this.queue.length === 0;
  }
}
