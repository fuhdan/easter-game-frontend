/**
 * Module: utils/logBuffer.js
 * Purpose: Circular buffer for storing recent log entries
 * Part of: Easter Quest 2025 Frontend
 *
 * Features:
 * - Circular buffer with fixed size (default 100 entries)
 * - O(1) insertion and retrieval
 * - Memory efficient (overwrites oldest entries)
 * - Development-only feature (disabled in production)
 *
 * @since 2025-12-22
 */

/**
 * Circular buffer for log entries
 *
 * Stores the last N log entries in memory
 * Used by LogViewer component for debugging
 */
class LogBuffer {
  /**
   * Create a new log buffer
   *
   * @param {number} maxSize - Maximum number of entries to store (default: 100)
   */
  constructor(maxSize = 100) {
    this.maxSize = maxSize;
    this.buffer = new Array(maxSize);
    this.index = 0;
    this.count = 0;
  }

  /**
   * Add a log entry to the buffer
   *
   * @param {object} entry - Log entry to add
   * @param {string} entry.level - Log level (DEBUG, INFO, WARN, ERROR, CRITICAL)
   * @param {string} entry.eventName - Event name
   * @param {object} entry.context - Log context
   * @param {string} entry.timestamp - ISO timestamp
   * @param {Error} [entry.error] - Error object (optional)
   *
   * @example
   * logBuffer.add({
   *   level: 'INFO',
   *   eventName: 'user_logged_in',
   *   context: { userId: 42 },
   *   timestamp: '2025-12-22T10:30:45.123Z'
   * });
   */
  add(entry) {
    // Store entry at current index
    this.buffer[this.index] = {
      ...entry,
      id: this.count, // Unique ID for each entry
    };

    // Move to next index (circular)
    this.index = (this.index + 1) % this.maxSize;

    // Increment count
    this.count++;
  }

  /**
   * Get all log entries (sorted by time, oldest first)
   *
   * @returns {Array<object>} Array of log entries
   *
   * @example
   * const logs = logBuffer.getAll();
   * // Returns: [{ level: 'INFO', ... }, { level: 'ERROR', ... }]
   */
  getAll() {
    const totalEntries = Math.min(this.count, this.maxSize);

    if (totalEntries === 0) {
      return [];
    }

    const entries = [];

    // If buffer is not full yet, return entries from 0 to index
    if (this.count < this.maxSize) {
      for (let i = 0; i < this.index; i++) {
        if (this.buffer[i]) {
          entries.push(this.buffer[i]);
        }
      }
    } else {
      // Buffer is full, return entries in circular order
      // Start from current index (oldest) to index-1 (newest)
      for (let i = 0; i < this.maxSize; i++) {
        const bufferIndex = (this.index + i) % this.maxSize;
        if (this.buffer[bufferIndex]) {
          entries.push(this.buffer[bufferIndex]);
        }
      }
    }

    return entries;
  }

  /**
   * Get log entries filtered by level
   *
   * @param {string} level - Log level to filter by
   * @returns {Array<object>} Filtered log entries
   *
   * @example
   * const errors = logBuffer.getByLevel('ERROR');
   */
  getByLevel(level) {
    return this.getAll().filter(entry => entry.level === level);
  }

  /**
   * Get log entries filtered by event name
   *
   * @param {string} eventName - Event name to filter by
   * @returns {Array<object>} Filtered log entries
   *
   * @example
   * const apiLogs = logBuffer.getByEventName('api_request_completed');
   */
  getByEventName(eventName) {
    return this.getAll().filter(entry => entry.eventName === eventName);
  }

  /**
   * Get log entries within time range
   *
   * @param {Date} startTime - Start time
   * @param {Date} endTime - End time
   * @returns {Array<object>} Filtered log entries
   *
   * @example
   * const lastHour = new Date(Date.now() - 60 * 60 * 1000);
   * const recentLogs = logBuffer.getByTimeRange(lastHour, new Date());
   */
  getByTimeRange(startTime, endTime) {
    return this.getAll().filter(entry => {
      const entryTime = new Date(entry.timestamp);
      return entryTime >= startTime && entryTime <= endTime;
    });
  }

  /**
   * Search log entries by text
   *
   * Searches in event name and context (as JSON string)
   *
   * @param {string} searchText - Text to search for
   * @returns {Array<object>} Matching log entries
   *
   * @example
   * const results = logBuffer.search('api_request');
   */
  search(searchText) {
    if (!searchText) {
      return this.getAll();
    }

    const lowerSearch = searchText.toLowerCase();

    return this.getAll().filter(entry => {
      // Search in event name
      if (entry.eventName.toLowerCase().includes(lowerSearch)) {
        return true;
      }

      // Search in context (convert to JSON string)
      try {
        const contextStr = JSON.stringify(entry.context).toLowerCase();
        return contextStr.includes(lowerSearch);
      } catch (error) {
        return false;
      }
    });
  }

  /**
   * Get the last N log entries
   *
   * @param {number} count - Number of entries to get
   * @returns {Array<object>} Last N log entries
   *
   * @example
   * const last10 = logBuffer.getLast(10);
   */
  getLast(count) {
    const all = this.getAll();
    return all.slice(-count);
  }

  /**
   * Clear all log entries
   *
   * @example
   * logBuffer.clear();
   */
  clear() {
    this.buffer = new Array(this.maxSize);
    this.index = 0;
    this.count = 0;
  }

  /**
   * Get buffer statistics
   *
   * @returns {object} Buffer statistics
   *
   * @example
   * const stats = logBuffer.getStats();
   * // Returns: {
   * //   totalEntries: 150,
   * //   bufferedEntries: 100,
   * //   maxSize: 100,
   * //   countByLevel: { DEBUG: 50, INFO: 30, ... }
   * // }
   */
  getStats() {
    const entries = this.getAll();

    const countByLevel = entries.reduce((acc, entry) => {
      acc[entry.level] = (acc[entry.level] || 0) + 1;
      return acc;
    }, {});

    return {
      totalEntries: this.count,
      bufferedEntries: entries.length,
      maxSize: this.maxSize,
      countByLevel,
    };
  }

  /**
   * Export buffer to JSON
   *
   * @returns {string} JSON string of all log entries
   *
   * @example
   * const json = logBuffer.toJSON();
   * // Download or send to server
   */
  toJSON() {
    return JSON.stringify(this.getAll(), null, 2);
  }
}

/**
 * Global log buffer instance
 * Singleton pattern - one buffer for the entire application
 */
const logBuffer = new LogBuffer(100);

export default logBuffer;
