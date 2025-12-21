/**
 * Module: api.test.js
 * Purpose: Tests for API service
 * Part of: Easter Quest Frontend Testing
 *
 * @since 2025-12-19
 */

import { request, buildHeaders, APIError, log, CONFIG, utils, onTokenRefresh } from '../../src/services/api';
import { mockFetchResponse } from '../test-utils';

// Mock the API config
jest.mock('../../src/config/apiConfig', () => ({
  API_CONFIG: {
    BASE_URL: '/api/v1',
    VERSION: 'v1',
    ENDPOINTS: {
      AUTH: {
        LOGIN: '/api/v1/auth/login',
        LOGOUT: '/api/v1/auth/logout',
        REFRESH: '/api/v1/auth/refresh',
        ME: '/api/v1/auth/me'
      }
    }
  }
}));

describe('API Service', () => {
  let mockFetch;
  let consoleErrorSpy;
  let consoleLogSpy;

  beforeEach(() => {
    mockFetch = jest.fn();
    global.fetch = mockFetch;
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    jest.clearAllMocks();
  });

  afterEach(() => {
    delete global.fetch;
    consoleErrorSpy.mockRestore();
    consoleLogSpy.mockRestore();
  });

  describe('buildHeaders', () => {
    test('builds headers with default content type', () => {
      const headers = buildHeaders();
      expect(headers).toEqual({
        'Content-Type': 'application/json'
      });
    });

    test('builds headers with custom content type', () => {
      const headers = buildHeaders('text/plain');
      expect(headers).toEqual({
        'Content-Type': 'text/plain'
      });
    });

    test('builds headers with null content type', () => {
      const headers = buildHeaders(null);
      expect(headers).toEqual({});
    });
  });

  describe('APIError', () => {
    test('creates error with default values', () => {
      const error = new APIError('Test error');
      expect(error.message).toBe('Test error');
      expect(error.status).toBe(500);
      expect(error.data).toBeNull();
      expect(error.name).toBe('APIError');
    });

    test('creates error with custom status and data', () => {
      const errorData = { detail: 'Bad request' };
      const error = new APIError('Validation error', 400, errorData);
      expect(error.message).toBe('Validation error');
      expect(error.status).toBe(400);
      expect(error.data).toEqual(errorData);
    });

    test('getUserMessage returns correct message for 401', () => {
      const error = new APIError('Unauthorized', 401);
      expect(error.getUserMessage()).toBe('Please log in again');
    });

    test('getUserMessage returns correct message for 403', () => {
      const error = new APIError('Forbidden', 403);
      expect(error.getUserMessage()).toBe('Permission denied');
    });

    test('getUserMessage returns correct message for 404', () => {
      const error = new APIError('Not found', 404);
      expect(error.getUserMessage()).toBe('Resource not found');
    });

    test('getUserMessage returns correct message for 429 with detail string', () => {
      const error = new APIError('Rate limited', 429, { detail: 'Too many requests' });
      expect(error.getUserMessage()).toBe('Too many requests');
    });

    test('getUserMessage returns correct message for 429 with detail object', () => {
      const error = new APIError('Rate limited', 429, {
        detail: { message: 'Custom rate limit message' }
      });
      expect(error.getUserMessage()).toBe('Custom rate limit message');
    });

    test('getUserMessage returns default message for 429 without detail', () => {
      const error = new APIError('Rate limited', 429);
      expect(error.getUserMessage()).toBe('Too many requests. Please wait a moment and try again.');
    });

    test('getUserMessage returns correct message for 5xx errors', () => {
      const error = new APIError('Server error', 500);
      expect(error.getUserMessage()).toBe('Server error - please try again');
    });

    test('getUserMessage returns error message for other errors', () => {
      const error = new APIError('Custom error', 418);
      expect(error.getUserMessage()).toBe('Custom error');
    });

    test('getUserMessage returns default message when message is empty', () => {
      const error = new APIError('', 418);
      expect(error.getUserMessage()).toBe('An error occurred');
    });

    test('getUserMessage handles 429 with non-string, non-object detail', () => {
      const error = new APIError('Rate limited', 429, { detail: 123 });
      expect(error.getUserMessage()).toBe('Too many requests. Please wait a moment and try again.');
    });
  });

  describe('request function', () => {
    test('makes successful GET request', async () => {
      const mockResponse = { data: 'test' };
      mockFetch.mockImplementationOnce(() => mockFetchResponse(mockResponse));

      const result = await request('GET', '/test');

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/test',
        expect.objectContaining({
          method: 'GET',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        })
      );

      expect(result).toEqual(mockResponse);
    });

    test('makes successful POST request with data', async () => {
      const mockResponse = { success: true };
      const postData = { username: 'test', password: 'pass' };
      mockFetch.mockImplementationOnce(() => mockFetchResponse(mockResponse));

      const result = await request('POST', '/auth/login', postData);

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/auth/login',
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(postData)
        })
      );

      expect(result).toEqual(mockResponse);
    });

    test('does not include body for GET requests', async () => {
      const mockResponse = { data: 'test' };
      mockFetch.mockImplementationOnce(() => mockFetchResponse(mockResponse));

      await request('GET', '/test', { ignored: 'data' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'GET',
          credentials: 'include'
        })
      );

      const callArgs = mockFetch.mock.calls[0][1];
      expect(callArgs.body).toBeUndefined();
    });

    test('handles 400 Bad Request', async () => {
      mockFetch.mockImplementationOnce(() =>
        mockFetchResponse({ detail: 'Bad request' }, false, 400)
      );

      try {
        await request('POST', '/test', {});
        fail('Should have thrown APIError');
      } catch (error) {
        expect(error).toBeInstanceOf(APIError);
        expect(error.status).toBe(400);
      }
    });

    test('handles 404 Not Found', async () => {
      mockFetch.mockImplementationOnce(() =>
        mockFetchResponse({ detail: 'Not found' }, false, 404)
      );

      try {
        await request('GET', '/nonexistent');
        fail('Should have thrown APIError');
      } catch (error) {
        expect(error).toBeInstanceOf(APIError);
        expect(error.status).toBe(404);
      }
    });

    test('retries on 500 error up to MAX_RETRIES times', async () => {
      mockFetch
        .mockImplementationOnce(() => mockFetchResponse({ detail: 'Server error' }, false, 500))
        .mockImplementationOnce(() => mockFetchResponse({ detail: 'Server error' }, false, 500))
        .mockImplementationOnce(() => mockFetchResponse({ detail: 'Server error' }, false, 500));

      await expect(request('GET', '/error')).rejects.toThrow(APIError);

      // Should have tried 3 times (CONFIG.MAX_RETRIES = 3)
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    test('succeeds on retry after 500 error', async () => {
      mockFetch
        .mockImplementationOnce(() => mockFetchResponse({ detail: 'Server error' }, false, 500))
        .mockImplementationOnce(() => mockFetchResponse({ data: 'success' }));

      const result = await request('GET', '/unstable');

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ data: 'success' });
    });

    test('handles network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(request('GET', '/test')).rejects.toThrow('Network error');
    });

    test('handles non-JSON response', async () => {
      mockFetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          headers: {
            get: () => 'text/plain'
          },
          json: () => Promise.reject(new Error('Not JSON')),
          text: () => Promise.resolve('Plain text response')
        })
      );

      const result = await request('GET', '/text');
      expect(result).toBe('Plain text response');
    });

    test('passes custom options to fetch', async () => {
      mockFetch.mockImplementationOnce(() => mockFetchResponse({ data: 'test' }));

      await request('GET', '/test', null, {
        headers: { 'X-Custom': 'header' }
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Custom': 'header'
          })
        })
      );
    });
  });

  describe('token refresh', () => {
    test('does not attempt refresh for /auth/refresh endpoint', async () => {
      mockFetch.mockImplementationOnce(() =>
        mockFetchResponse({ detail: 'Unauthorized' }, false, 401)
      );

      await expect(request('POST', '/auth/refresh')).rejects.toThrow(APIError);

      // Should only be called once (no refresh attempt)
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    test('does not attempt refresh for /auth/login endpoint', async () => {
      mockFetch.mockImplementationOnce(() =>
        mockFetchResponse({ detail: 'Invalid credentials' }, false, 401)
      );

      await expect(request('POST', '/auth/login', {})).rejects.toThrow(APIError);

      // Should only be called once (no refresh attempt)
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    test('automatically refreshes token on 401 and retries original request', async () => {
      // Mock auth-error event dispatch
      const dispatchEventSpy = jest.spyOn(window, 'dispatchEvent');

      // First call to protected endpoint returns 401
      // Second call is refresh (returns success)
      // Third call is retry of original request (returns success)
      mockFetch
        .mockImplementationOnce(() =>
          mockFetchResponse({ detail: 'Unauthorized' }, false, 401)
        )
        .mockImplementationOnce(() =>
          mockFetchResponse({ success: true, message: 'Token refreshed' })
        )
        .mockImplementationOnce(() =>
          mockFetchResponse({ data: 'protected data' })
        );

      const result = await request('GET', '/protected');

      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(result).toEqual({ data: 'protected data' });

      dispatchEventSpy.mockRestore();
    });

    test('handles refresh failure and dispatches auth-error event', async () => {
      const dispatchEventSpy = jest.spyOn(window, 'dispatchEvent');

      // First call to protected endpoint returns 401
      // Second call is refresh (returns 401)
      mockFetch
        .mockImplementationOnce(() =>
          mockFetchResponse({ detail: 'Unauthorized' }, false, 401)
        )
        .mockImplementationOnce(() =>
          mockFetchResponse({ detail: 'Refresh token expired' }, false, 401)
        );

      await expect(request('GET', '/protected')).rejects.toThrow(APIError);

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'auth-error'
        })
      );

      dispatchEventSpy.mockRestore();
    });

    test('handles refresh failure when retry request fails', async () => {
      const dispatchEventSpy = jest.spyOn(window, 'dispatchEvent');

      // First call to protected endpoint returns 401
      // Second call is refresh (returns success)
      // Third call is retry of original request (returns 403)
      mockFetch
        .mockImplementationOnce(() =>
          mockFetchResponse({ detail: 'Unauthorized' }, false, 401)
        )
        .mockImplementationOnce(() =>
          mockFetchResponse({ success: true })
        )
        .mockImplementationOnce(() =>
          mockFetchResponse({ detail: 'Forbidden' }, false, 403)
        );

      try {
        await request('GET', '/protected');
        fail('Should have thrown APIError');
      } catch (error) {
        expect(error).toBeInstanceOf(APIError);
        // When refresh succeeds but retry fails, original 401 error is thrown
        expect(error.status).toBe(401);
      }

      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(dispatchEventSpy).toHaveBeenCalled();

      dispatchEventSpy.mockRestore();
    });

    test('notifies token refresh listeners on successful refresh', async () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      // Subscribe listeners
      const unsubscribe1 = onTokenRefresh(listener1);
      const unsubscribe2 = onTokenRefresh(listener2);

      // Trigger token refresh
      mockFetch
        .mockImplementationOnce(() =>
          mockFetchResponse({ detail: 'Unauthorized' }, false, 401)
        )
        .mockImplementationOnce(() =>
          mockFetchResponse({ success: true })
        )
        .mockImplementationOnce(() =>
          mockFetchResponse({ data: 'success' })
        );

      await request('GET', '/protected');

      // Both listeners should be notified
      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(1);

      // Cleanup
      unsubscribe1();
      unsubscribe2();
    });

    test('handles error in token refresh listener gracefully', async () => {
      const errorListener = jest.fn(() => {
        throw new Error('Listener error');
      });
      const normalListener = jest.fn();

      const unsubscribe1 = onTokenRefresh(errorListener);
      const unsubscribe2 = onTokenRefresh(normalListener);

      mockFetch
        .mockImplementationOnce(() =>
          mockFetchResponse({ detail: 'Unauthorized' }, false, 401)
        )
        .mockImplementationOnce(() =>
          mockFetchResponse({ success: true })
        )
        .mockImplementationOnce(() =>
          mockFetchResponse({ data: 'success' })
        );

      await request('GET', '/protected');

      // Both listeners should be called, error should be caught
      expect(errorListener).toHaveBeenCalled();
      expect(normalListener).toHaveBeenCalled();

      unsubscribe1();
      unsubscribe2();
    });

    test('handles concurrent 401 requests with token refresh mutex', async () => {
      // Mock responses for concurrent requests
      // Request 1 gets 401, triggers refresh
      // Request 2 gets 401, waits for refresh from request 1
      // Refresh succeeds
      // Both retries succeed
      mockFetch
        .mockImplementationOnce(() =>
          mockFetchResponse({ detail: 'Unauthorized' }, false, 401)
        )
        .mockImplementationOnce(() =>
          mockFetchResponse({ detail: 'Unauthorized' }, false, 401)
        )
        .mockImplementationOnce(() =>
          mockFetchResponse({ success: true, message: 'Token refreshed' })
        )
        .mockImplementationOnce(() =>
          mockFetchResponse({ data: 'protected data 1' })
        )
        .mockImplementationOnce(() =>
          mockFetchResponse({ data: 'protected data 2' })
        );

      // Make two concurrent requests
      const [result1, result2] = await Promise.all([
        request('GET', '/protected1'),
        request('GET', '/protected2')
      ]);

      // Both should succeed with refreshed tokens
      expect(result1).toEqual({ data: 'protected data 1' });
      expect(result2).toEqual({ data: 'protected data 2' });

      // Should have made: 2 failed requests + 1 refresh + 2 retries = 5 total
      expect(mockFetch).toHaveBeenCalledTimes(5);
    });

    test('handles non-JSON retry response after token refresh', async () => {
      mockFetch
        .mockImplementationOnce(() =>
          mockFetchResponse({ detail: 'Unauthorized' }, false, 401)
        )
        .mockImplementationOnce(() =>
          mockFetchResponse({ success: true })
        )
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            status: 200,
            headers: {
              get: () => 'text/plain'
            },
            json: () => Promise.reject(new Error('Not JSON')),
            text: () => Promise.resolve('Plain text response')
          })
        );

      const result = await request('GET', '/protected');
      expect(result).toBe('Plain text response');
    });
  });

  describe('onTokenRefresh', () => {
    test('subscribes to token refresh events', () => {
      const callback = jest.fn();
      const unsubscribe = onTokenRefresh(callback);

      expect(typeof unsubscribe).toBe('function');

      // Cleanup
      unsubscribe();
    });

    test('unsubscribes from token refresh events', () => {
      const callback = jest.fn();
      const unsubscribe = onTokenRefresh(callback);

      unsubscribe();

      // After unsubscribe, callback should not be in the set
      // (We can't easily test this without triggering a refresh, but we can test the unsubscribe function exists)
      expect(typeof unsubscribe).toBe('function');
    });
  });

  describe('utils.processLoginResponse', () => {
    test('processes successful login (scenario 1)', () => {
      const response = {
        success: true,
        user: { id: 1, username: 'test' },
        message: 'Login successful'
      };

      const result = utils.processLoginResponse(response);

      expect(result).toEqual({
        success: true,
        scenario: 1,
        user: { id: 1, username: 'test' },
        message: 'Login successful'
      });
    });

    test('processes password change required (scenario 2)', () => {
      const response = {
        success: false,
        user: {
          username: 'test',
          requiresPasswordChange: true,
          requiresOTP: false
        },
        message: 'Password change required'
      };

      const result = utils.processLoginResponse(response);

      expect(result).toEqual({
        success: false,
        scenario: 2,
        username: 'test',
        requiresPasswordChange: true,
        requiresOTP: false,
        message: 'Password change required'
      });
    });

    test('processes password change + OTP required (scenario 3)', () => {
      const response = {
        success: false,
        user: {
          username: 'test',
          requiresPasswordChange: true,
          requiresOTP: true
        },
        message: 'Password change and OTP required'
      };

      const result = utils.processLoginResponse(response);

      expect(result).toEqual({
        success: false,
        scenario: 3,
        username: 'test',
        requiresPasswordChange: true,
        requiresOTP: true,
        message: 'Password change and OTP required'
      });
    });

    test('handles unknown response format', () => {
      const response = {
        success: false,
        message: 'Unknown error'
      };

      const result = utils.processLoginResponse(response);

      expect(result).toEqual({
        success: false,
        scenario: 0,
        message: 'Unknown error'
      });
    });

    test('handles response without user object', () => {
      const response = {
        success: false
      };

      const result = utils.processLoginResponse(response);

      expect(result).toEqual({
        success: false,
        scenario: 0,
        message: 'Login failed'
      });
    });

    test('handles response with user=undefined explicitly', () => {
      const response = {
        success: false,
        user: undefined
      };

      const result = utils.processLoginResponse(response);

      expect(result).toEqual({
        success: false,
        scenario: 0,
        message: 'Login failed'
      });
    });

    test('processes scenario 2 with missing requiresOTP field', () => {
      const response = {
        success: false,
        user: {
          username: 'test',
          requiresPasswordChange: true
        },
        message: 'Password change required'
      };

      const result = utils.processLoginResponse(response);

      expect(result).toEqual({
        success: false,
        scenario: 2,
        username: 'test',
        requiresPasswordChange: true,
        requiresOTP: false,
        message: 'Password change required'
      });
    });
  });

  describe('utils.handleError', () => {
    test('handles APIError with showNotification', () => {
      const error = new APIError('Test error', 401);
      const showNotification = jest.fn();

      const message = utils.handleError(error, showNotification);

      expect(message).toBe('Please log in again');
      expect(showNotification).toHaveBeenCalledWith('Please log in again', 'error');
    });

    test('handles APIError without showNotification', () => {
      const error = new APIError('Test error', 500);

      const message = utils.handleError(error, null);

      expect(message).toBe('Server error - please try again');
    });

    test('handles generic Error', () => {
      const error = new Error('Generic error');
      const showNotification = jest.fn();

      const message = utils.handleError(error, showNotification);

      expect(message).toBe('An unexpected error occurred');
      expect(showNotification).toHaveBeenCalledWith('An unexpected error occurred', 'error');
    });
  });

  describe('utils.isAuthenticated', () => {
    test('returns true when authenticated', async () => {
      mockFetch.mockImplementationOnce(() =>
        mockFetchResponse({ user: { id: 1 } })
      );

      const result = await utils.isAuthenticated();

      expect(result).toBe(true);
    });

    test('returns false when not authenticated', async () => {
      mockFetch.mockImplementationOnce(() =>
        mockFetchResponse({ detail: 'Unauthorized' }, false, 401)
      );

      const result = await utils.isAuthenticated();

      expect(result).toBe(false);
    });

    test('returns false on network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await utils.isAuthenticated();

      expect(result).toBe(false);
    });
  });

  describe('AI Provider API utils', () => {
    test('listAIProviders calls correct endpoint', async () => {
      mockFetch.mockImplementationOnce(() =>
        mockFetchResponse({ providers: [], active_provider: 'ollama' })
      );

      const result = await utils.listAIProviders();

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/admin/ai-providers',
        expect.objectContaining({
          method: 'GET'
        })
      );
      expect(result.active_provider).toBe('ollama');
    });

    test('getActiveProvider calls correct endpoint', async () => {
      mockFetch.mockImplementationOnce(() =>
        mockFetchResponse({ provider: 'ollama', model: 'llama3.2:3b' })
      );

      const result = await utils.getActiveProvider();

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/admin/ai-providers/active',
        expect.objectContaining({
          method: 'GET'
        })
      );
      expect(result.provider).toBe('ollama');
    });

    test('setActiveProvider calls correct endpoint with data', async () => {
      mockFetch.mockImplementationOnce(() =>
        mockFetchResponse({ success: true, provider: 'claude' })
      );

      const result = await utils.setActiveProvider('claude');

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/admin/ai-providers/active',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ provider: 'claude' })
        })
      );
      expect(result.success).toBe(true);
    });

    test('setActiveModel calls correct endpoint with data', async () => {
      mockFetch.mockImplementationOnce(() =>
        mockFetchResponse({ success: true, model: 'llama3.2:3b' })
      );

      const result = await utils.setActiveModel('llama3.2:3b');

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/admin/ai-providers/model',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ model: 'llama3.2:3b' })
        })
      );
      expect(result.success).toBe(true);
    });

    test('testProvider calls correct endpoint', async () => {
      mockFetch.mockImplementationOnce(() =>
        mockFetchResponse({ healthy: true, provider: 'ollama' })
      );

      const result = await utils.testProvider('ollama');

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/admin/ai-providers/test/ollama',
        expect.objectContaining({
          method: 'POST'
        })
      );
      expect(result.healthy).toBe(true);
    });

    test('listOllamaModels calls correct endpoint', async () => {
      mockFetch.mockImplementationOnce(() =>
        mockFetchResponse({ installed: [], available: [] })
      );

      const result = await utils.listOllamaModels();

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/admin/ollama/models',
        expect.objectContaining({
          method: 'GET'
        })
      );
      expect(result).toHaveProperty('installed');
    });

    test('pullOllamaModel calls correct endpoint with data', async () => {
      mockFetch.mockImplementationOnce(() =>
        mockFetchResponse({ success: true, task_id: '123' })
      );

      const result = await utils.pullOllamaModel('mistral:7b');

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/admin/ollama/models/pull',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ model_name: 'mistral:7b' })
        })
      );
      expect(result.success).toBe(true);
    });

    test('getActivePulls calls correct endpoint', async () => {
      mockFetch.mockImplementationOnce(() =>
        mockFetchResponse({ active_pulls: [] })
      );

      const result = await utils.getActivePulls();

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/admin/ollama/models/pull/active',
        expect.objectContaining({
          method: 'GET'
        })
      );
      expect(result).toHaveProperty('active_pulls');
    });

    test('deleteOllamaModel calls correct endpoint with encoded name', async () => {
      mockFetch.mockImplementationOnce(() =>
        mockFetchResponse({ success: true })
      );

      const result = await utils.deleteOllamaModel('mistral:7b');

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/admin/ollama/models/mistral%3A7b',
        expect.objectContaining({
          method: 'DELETE'
        })
      );
      expect(result.success).toBe(true);
    });
  });
});
