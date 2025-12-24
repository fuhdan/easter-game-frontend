/**
 * Module: utils/__tests__/logger.test.js
 * Purpose: Unit tests for logger utility
 * Part of: Easter Quest 2025 Frontend
 *
 * @since 2025-12-22
 */

import { logger, LEVELS } from '../logger';
import logBuffer from '../logBuffer';

// Mock dependencies
jest.mock('loglevel');
jest.mock('../sentry', () => ({
  captureSentryException: jest.fn(),
  captureSentryMessage: jest.fn(),
  addSentryBreadcrumb: jest.fn(),
}));

describe('Logger', () => {
  beforeEach(() => {
    // Clear log buffer before each test
    logBuffer.clear();

    // Clear console mocks
    jest.clearAllMocks();

    // Spy on console methods
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'info').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    // Restore console methods
    console.log.mockRestore();
    console.info.mockRestore();
    console.warn.mockRestore();
    console.error.mockRestore();
  });

  describe('Log Levels', () => {
    test('should define log levels in correct order', () => {
      expect(LEVELS.DEBUG).toBe(0);
      expect(LEVELS.INFO).toBe(1);
      expect(LEVELS.WARN).toBe(2);
      expect(LEVELS.ERROR).toBe(3);
      expect(LEVELS.CRITICAL).toBe(4);
    });
  });

  describe('debug()', () => {
    test('should log debug message', () => {
      logger.debug('test_debug_event', { data: 'test' });

      const logs = logBuffer.getAll();
      expect(logs.length).toBeGreaterThan(0);

      const lastLog = logs[logs.length - 1];
      expect(lastLog.level).toBe('DEBUG');
      expect(lastLog.eventName).toBe('test_debug_event');
      expect(lastLog.context.data).toBe('test');
    });

    test('should enrich context with metadata', () => {
      logger.debug('test_event', { customField: 'value' });

      const logs = logBuffer.getAll();
      const lastLog = logs[logs.length - 1];

      // Check for automatic enrichment
      expect(lastLog.context.timestamp).toBeDefined();
      expect(lastLog.context.environment).toBeDefined();
      expect(lastLog.context.correlationId).toBeDefined();
      expect(lastLog.context.customField).toBe('value');
    });
  });

  describe('info()', () => {
    test('should log info message', () => {
      logger.info('user_logged_in', { userId: 42, role: 'player' });

      const logs = logBuffer.getAll();
      const lastLog = logs[logs.length - 1];

      expect(lastLog.level).toBe('INFO');
      expect(lastLog.eventName).toBe('user_logged_in');
      expect(lastLog.context.userId).toBe(42);
      expect(lastLog.context.role).toBe('player');
    });
  });

  describe('warn()', () => {
    test('should log warning message', () => {
      logger.warn('api_rate_limit_warning', { endpoint: '/api/chat', remaining: 2 });

      const logs = logBuffer.getAll();
      const lastLog = logs[logs.length - 1];

      expect(lastLog.level).toBe('WARN');
      expect(lastLog.eventName).toBe('api_rate_limit_warning');
      expect(lastLog.context.endpoint).toBe('/api/chat');
      expect(lastLog.context.remaining).toBe(2);
    });

    test('should handle error object as second parameter', () => {
      const error = new Error('Test warning error');
      logger.warn('test_warning', error);

      const logs = logBuffer.getAll();
      const lastLog = logs[logs.length - 1];

      expect(lastLog.level).toBe('WARN');
      expect(lastLog.context.error).toBeDefined();
      expect(lastLog.context.error.message).toBe('Test warning error');
    });
  });

  describe('error()', () => {
    test('should log error message with context', () => {
      const error = new Error('Test error');
      logger.error('api_request_failed', { endpoint: '/api/games' }, error);

      const logs = logBuffer.getAll();
      const lastLog = logs[logs.length - 1];

      expect(lastLog.level).toBe('ERROR');
      expect(lastLog.eventName).toBe('api_request_failed');
      expect(lastLog.context.endpoint).toBe('/api/games');
      expect(lastLog.context.error).toBeDefined();
      expect(lastLog.context.error.message).toBe('Test error');
    });

    test('should handle error object as second parameter', () => {
      const error = new Error('Direct error');
      logger.error('test_error', error);

      const logs = logBuffer.getAll();
      const lastLog = logs[logs.length - 1];

      expect(lastLog.level).toBe('ERROR');
      expect(lastLog.context.error).toBeDefined();
      expect(lastLog.context.error.message).toBe('Direct error');
    });
  });

  describe('critical()', () => {
    test('should log critical message', () => {
      const error = new Error('Critical failure');
      logger.critical('auth_system_failure', { reason: 'JWT verification failed' }, error);

      const logs = logBuffer.getAll();
      const lastLog = logs[logs.length - 1];

      expect(lastLog.level).toBe('CRITICAL');
      expect(lastLog.eventName).toBe('auth_system_failure');
      expect(lastLog.context.reason).toBe('JWT verification failed');
      expect(lastLog.context.error).toBeDefined();
    });
  });

  describe('Security', () => {
    test('should mask PII in context', () => {
      logger.info('user_action', {
        username: 'john_doe',
        email: 'john@example.com',
      });

      const logs = logBuffer.getAll();
      const lastLog = logs[logs.length - 1];

      // Username and email should be masked
      expect(lastLog.context.username).toBe('joh***');
      expect(lastLog.context.email).toBe('j***@***.***');
    });

    test('should redact sensitive data', () => {
      logger.info('user_login_attempt', {
        username: 'john_doe',
        password: 'secret123', // Should be redacted
        token: 'abc123', // Should be redacted
      });

      const logs = logBuffer.getAll();
      const lastLog = logs[logs.length - 1];

      // Username should be masked
      expect(lastLog.context.username).toBe('joh***');

      // Sensitive data should be redacted
      expect(lastLog.context.password).toBe('[REDACTED]');
      expect(lastLog.context.token).toBe('[REDACTED]');
    });

    test('should handle nested sensitive data', () => {
      logger.info('user_data', {
        user: {
          username: 'john_doe',
          credentials: {
            password: 'secret',
            api_key: 'xyz789',
          },
        },
      });

      const logs = logBuffer.getAll();
      const lastLog = logs[logs.length - 1];

      expect(lastLog.context.user.username).toBe('joh***');
      expect(lastLog.context.user.credentials.password).toBe('[REDACTED]');
      expect(lastLog.context.user.credentials.api_key).toBe('[REDACTED]');
    });
  });

  describe('Log Buffer', () => {
    test('should add logs to buffer', () => {
      logBuffer.clear();

      logger.info('event1', { data: 1 });
      logger.info('event2', { data: 2 });
      logger.info('event3', { data: 3 });

      const logs = logBuffer.getAll();
      expect(logs.length).toBe(3);
    });

    test('should retrieve buffer via logger.getBuffer()', () => {
      logBuffer.clear();

      logger.info('event1', { data: 1 });
      logger.info('event2', { data: 2 });

      const logs = logger.getBuffer();
      expect(logs.length).toBe(2);
      expect(logs[0].eventName).toBe('event1');
      expect(logs[1].eventName).toBe('event2');
    });

    test('should clear buffer via logger.clearBuffer()', () => {
      logger.info('event1', { data: 1 });
      logger.info('event2', { data: 2 });

      expect(logger.getBuffer().length).toBeGreaterThan(0);

      logger.clearBuffer();

      expect(logger.getBuffer().length).toBe(0);
    });

    test('should get buffer statistics', () => {
      logBuffer.clear();

      logger.debug('debug1');
      logger.info('info1');
      logger.info('info2');
      logger.warn('warn1');
      logger.error('error1', new Error('test'));

      const stats = logger.getStats();

      expect(stats.totalEntries).toBe(5);
      expect(stats.bufferedEntries).toBe(5);
      expect(stats.countByLevel.DEBUG).toBe(1);
      expect(stats.countByLevel.INFO).toBe(2);
      expect(stats.countByLevel.WARN).toBe(1);
      expect(stats.countByLevel.ERROR).toBe(1);
    });
  });

  describe('Log Level Management', () => {
    test('should set log level', () => {
      logger.setLevel('ERROR');
      expect(logger.getLevel()).toBe('ERROR');

      logger.setLevel('DEBUG');
      expect(logger.getLevel()).toBe('DEBUG');
    });

    test('should get current log level', () => {
      const level = logger.getLevel();
      expect(level).toBeDefined();
      expect(['DEBUG', 'INFO', 'WARN', 'ERROR', 'CRITICAL']).toContain(level);
    });
  });

  describe('Export Logs', () => {
    test('should export logs as JSON', () => {
      logBuffer.clear();

      logger.info('event1', { data: 1 });
      logger.error('event2', { data: 2 }, new Error('test'));

      const json = logger.exportLogs();
      expect(json).toBeDefined();
      expect(typeof json).toBe('string');

      const parsed = JSON.parse(json);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBe(2);
    });
  });
});
