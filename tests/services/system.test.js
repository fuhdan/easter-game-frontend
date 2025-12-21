/**
 * Module: system.test.js
 * Purpose: Tests for system service
 * Part of: Easter Quest Frontend Testing
 *
 * @since 2025-12-20
 */

import * as systemService from '../../src/services/system';
import { request } from '../../src/services/api';

// Mock the api module
jest.mock('../../src/services/api', () => ({
  request: jest.fn(),
  log: {
    info: jest.fn(),
    error: jest.fn()
  }
}));

describe('System Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('health', () => {
    test('returns health status', async () => {
      const mockHealth = { status: 'ok', timestamp: '2025-12-20T10:00:00Z' };

      request.mockResolvedValueOnce(mockHealth);

      const result = await systemService.health();

      expect(request).toHaveBeenCalledWith('GET', '/health');
      expect(result).toEqual(mockHealth);
    });

    test('returns error status when unhealthy', async () => {
      const mockHealth = { status: 'error', message: 'Database connection failed' };

      request.mockResolvedValueOnce(mockHealth);

      const result = await systemService.health();

      expect(result.status).toBe('error');
    });
  });

  describe('version', () => {
    test('returns version information', async () => {
      const mockVersion = { version: '1.0.0', build: '20250101' };

      request.mockResolvedValueOnce(mockVersion);

      const result = await systemService.version();

      expect(request).toHaveBeenCalledWith('GET', '/version');
      expect(result).toEqual(mockVersion);
    });

    test('includes build number', async () => {
      const mockVersion = { version: '2.3.4', build: '20250115-abc123' };

      request.mockResolvedValueOnce(mockVersion);

      const result = await systemService.version();

      expect(result.build).toBeDefined();
      expect(result.version).toBe('2.3.4');
    });
  });

  describe('ping', () => {
    test('returns pong message', async () => {
      const mockPing = { message: 'pong', timestamp: '2025-12-20T10:00:00Z' };

      request.mockResolvedValueOnce(mockPing);

      const result = await systemService.ping();

      expect(request).toHaveBeenCalledWith('GET', '/ping');
      expect(result).toEqual(mockPing);
    });

    test('confirms server is responding', async () => {
      request.mockResolvedValueOnce({ message: 'pong' });

      const result = await systemService.ping();

      expect(result.message).toBe('pong');
    });
  });

  describe('getConfig', () => {
    test('fetches all configuration without category filter', async () => {
      const mockConfig = [
        { key: 'ai.model', value: 'llama3.2:3b', category: 'ai', description: 'AI model' },
        { key: 'game.max_hints', value: 3, category: 'game', description: 'Max hints' }
      ];

      request.mockResolvedValueOnce(mockConfig);

      const result = await systemService.getConfig();

      expect(request).toHaveBeenCalledWith('GET', '/system/config');
      expect(result).toEqual(mockConfig);
    });

    test('fetches configuration with category filter', async () => {
      const mockConfig = [
        { key: 'ai.model', value: 'llama3.2:3b', category: 'ai', description: 'AI model' },
        { key: 'ai.temperature', value: 0.7, category: 'ai', description: 'Temperature' }
      ];

      request.mockResolvedValueOnce(mockConfig);

      const result = await systemService.getConfig('ai');

      expect(request).toHaveBeenCalledWith('GET', '/system/config?category=ai');
      expect(result).toEqual(mockConfig);
    });

    test('fetches chat configuration', async () => {
      const mockConfig = [
        { key: 'chat.rate_limit', value: 30, category: 'chat', description: 'Chat rate limit' }
      ];

      request.mockResolvedValueOnce(mockConfig);

      const result = await systemService.getConfig('chat');

      expect(request).toHaveBeenCalledWith('GET', '/system/config?category=chat');
      expect(result).toEqual(mockConfig);
    });

    test('fetches game configuration', async () => {
      const mockConfig = [
        { key: 'game.max_hints', value: 3, category: 'game', description: 'Max hints' }
      ];

      request.mockResolvedValueOnce(mockConfig);

      const result = await systemService.getConfig('game');

      expect(request).toHaveBeenCalledWith('GET', '/system/config?category=game');
      expect(result).toEqual(mockConfig);
    });

    test('fetches system configuration', async () => {
      const mockConfig = [
        { key: 'system.maintenance', value: false, category: 'system', description: 'Maintenance mode' }
      ];

      request.mockResolvedValueOnce(mockConfig);

      const result = await systemService.getConfig('system');

      expect(request).toHaveBeenCalledWith('GET', '/system/config?category=system');
      expect(result).toEqual(mockConfig);
    });

    test('handles null category parameter', async () => {
      request.mockResolvedValueOnce([]);

      await systemService.getConfig(null);

      expect(request).toHaveBeenCalledWith('GET', '/system/config');
    });
  });

  describe('updateConfig', () => {
    test('updates a configuration value', async () => {
      const key = 'ai.temperature';
      const value = 0.8;
      const mockUpdated = { key, value, category: 'ai', description: 'Temperature' };

      request.mockResolvedValueOnce(mockUpdated);

      const result = await systemService.updateConfig(key, value);

      expect(request).toHaveBeenCalledWith('PATCH', '/system/config/ai.temperature', { value: 0.8 });
      expect(result).toEqual(mockUpdated);
    });

    test('updates string configuration', async () => {
      const mockUpdated = { key: 'ai.model', value: 'mistral:7b', category: 'ai' };

      request.mockResolvedValueOnce(mockUpdated);

      const result = await systemService.updateConfig('ai.model', 'mistral:7b');

      expect(request).toHaveBeenCalledWith('PATCH', '/system/config/ai.model', { value: 'mistral:7b' });
      expect(result.value).toBe('mistral:7b');
    });

    test('updates boolean configuration', async () => {
      const mockUpdated = { key: 'system.maintenance', value: true, category: 'system' };

      request.mockResolvedValueOnce(mockUpdated);

      const result = await systemService.updateConfig('system.maintenance', true);

      expect(request).toHaveBeenCalledWith('PATCH', '/system/config/system.maintenance', { value: true });
      expect(result.value).toBe(true);
    });

    test('updates numeric configuration', async () => {
      const mockUpdated = { key: 'game.max_hints', value: 5, category: 'game' };

      request.mockResolvedValueOnce(mockUpdated);

      const result = await systemService.updateConfig('game.max_hints', 5);

      expect(request).toHaveBeenCalledWith('PATCH', '/system/config/game.max_hints', { value: 5 });
      expect(result.value).toBe(5);
    });

    test('handles configuration key not found', async () => {
      request.mockRejectedValueOnce(new Error('Configuration key not found'));

      await expect(
        systemService.updateConfig('invalid.key', 'value')
      ).rejects.toThrow('Configuration key not found');
    });

    test('handles validation error', async () => {
      request.mockRejectedValueOnce(new Error('Invalid value type'));

      await expect(
        systemService.updateConfig('ai.temperature', 'invalid')
      ).rejects.toThrow('Invalid value type');
    });
  });

  describe('reloadConfig', () => {
    test('reloads configuration cache', async () => {
      const mockResponse = { success: true, message: 'Configuration reloaded' };

      request.mockResolvedValueOnce(mockResponse);

      const result = await systemService.reloadConfig();

      expect(request).toHaveBeenCalledWith('POST', '/system/config/reload');
      expect(result).toEqual(mockResponse);
    });

    test('confirms cache reload', async () => {
      const mockResponse = { success: true, timestamp: '2025-12-20T10:00:00Z' };

      request.mockResolvedValueOnce(mockResponse);

      const result = await systemService.reloadConfig();

      expect(result.success).toBe(true);
    });

    test('handles reload error', async () => {
      request.mockRejectedValueOnce(new Error('Failed to reload configuration'));

      await expect(systemService.reloadConfig()).rejects.toThrow('Failed to reload configuration');
    });
  });

  describe('error handling', () => {
    test('handles network errors in health check', async () => {
      request.mockRejectedValueOnce(new Error('Network error'));

      await expect(systemService.health()).rejects.toThrow('Network error');
    });

    test('handles unauthorized access to config', async () => {
      request.mockRejectedValueOnce(new Error('Permission denied'));

      await expect(systemService.getConfig()).rejects.toThrow('Permission denied');
    });

    test('handles unauthorized access to updateConfig', async () => {
      request.mockRejectedValueOnce(new Error('Permission denied'));

      await expect(
        systemService.updateConfig('test.key', 'value')
      ).rejects.toThrow('Permission denied');
    });
  });
});
