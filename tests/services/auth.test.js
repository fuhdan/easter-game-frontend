/**
 * Module: auth.test.js
 * Purpose: Tests for auth service
 * Part of: Easter Quest Frontend Testing
 *
 * @since 2025-12-19
 */

import { login, logout, activateAccount, refresh, me, verify } from '../../src/services/auth';
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

describe('Auth Service', () => {
  let mockFetch;

  beforeEach(() => {
    mockFetch = jest.fn();
    global.fetch = mockFetch;
    jest.clearAllMocks();
  });

  afterEach(() => {
    delete global.fetch;
  });

  describe('login', () => {
    test('successfully logs in with valid credentials', async () => {
      const mockResponse = {
        success: true,
        user: {
          id: 1,
          username: 'testuser',
          role: 'player'
        },
        message: 'Login successful'
      };

      mockFetch.mockImplementationOnce(() => mockFetchResponse(mockResponse));

      const result = await login({
        username: 'testuser',
        password: 'password123'
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/auth/login',
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            username: 'testuser',
            password: 'password123'
          })
        })
      );

      expect(result.success).toBe(true);
      expect(result.user.username).toBe('testuser');
    });

    test('fails with invalid credentials', async () => {
      const mockResponse = {
        success: false,
        detail: 'Invalid credentials'
      };

      mockFetch.mockImplementationOnce(() =>
        mockFetchResponse(mockResponse, false, 401)
      );

      await expect(
        login({
          username: 'testuser',
          password: 'wrongpassword'
        })
      ).rejects.toThrow('HTTP 401');
    });

    test('handles network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(
        login({
          username: 'testuser',
          password: 'password123'
        })
      ).rejects.toThrow();
    });

    test('trims username', async () => {
      const mockResponse = {
        success: true,
        user: { id: 1, username: 'testuser', role: 'player' },
        message: 'Login successful'
      };

      mockFetch.mockImplementationOnce(() => mockFetchResponse(mockResponse));

      const result = await login({
        username: '  testuser  ',
        password: 'password123'
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/auth/login',
        expect.objectContaining({
          body: JSON.stringify({
            username: 'testuser',
            password: 'password123'
          })
        })
      );

      expect(result.success).toBe(true);
    });

    test('handles undefined username gracefully', async () => {
      const mockResponse = {
        success: true,
        user: { id: 1, username: 'testuser', role: 'player' },
        message: 'Login successful'
      };

      mockFetch.mockImplementationOnce(() => mockFetchResponse(mockResponse));

      const result = await login({
        username: undefined,
        password: 'password123'
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/auth/login',
        expect.objectContaining({
          body: JSON.stringify({
            username: undefined,
            password: 'password123'
          })
        })
      );

      expect(result.success).toBe(true);
    });
  });

  describe('logout', () => {
    test('successfully logs out', async () => {
      const mockResponse = {
        success: true,
        message: 'Logged out successfully'
      };

      mockFetch.mockImplementationOnce(() => mockFetchResponse(mockResponse));

      const result = await logout();

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/auth/logout',
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        })
      );

      expect(result.success).toBe(true);
    });

    test('handles logout error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(logout()).rejects.toThrow();
    });
  });

  describe('activateAccount', () => {
    test('successfully activates account with new password', async () => {
      const mockResponse = {
        success: true,
        user: {
          id: 1,
          username: 'newuser',
          role: 'player'
        },
        message: 'Account activated successfully'
      };

      mockFetch.mockImplementationOnce(() => mockFetchResponse(mockResponse));

      const activationData = {
        username: 'newuser',
        old_password: 'temp123',
        new_password: 'newpassword123'
      };

      const result = await activateAccount(activationData);

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/users/change-password',
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(activationData)
        })
      );

      expect(result.success).toBe(true);
      expect(result.user.username).toBe('newuser');
    });

    test('fails with invalid old password', async () => {
      const mockResponse = {
        success: false,
        detail: 'Invalid old password'
      };

      mockFetch.mockImplementationOnce(() =>
        mockFetchResponse(mockResponse, false, 401)
      );

      await expect(
        activateAccount({
          username: 'newuser',
          old_password: 'wrongtemp',
          new_password: 'newpassword123'
        })
      ).rejects.toThrow('HTTP 401');
    });

    test('fails with weak new password', async () => {
      const mockResponse = {
        success: false,
        detail: 'Password too weak'
      };

      mockFetch.mockImplementationOnce(() =>
        mockFetchResponse(mockResponse, false, 400)
      );

      await expect(
        activateAccount({
          username: 'newuser',
          old_password: 'temp123',
          new_password: '123'
        })
      ).rejects.toThrow('HTTP 400');
    });
  });

  describe('refresh', () => {
    test('successfully refreshes token', async () => {
      const mockResponse = {
        success: true,
        message: 'Token refreshed'
      };

      mockFetch.mockImplementationOnce(() => mockFetchResponse(mockResponse));

      const result = await refresh();

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/auth/refresh',
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        })
      );

      expect(result.success).toBe(true);
    });

    test('fails with expired refresh token', async () => {
      const mockResponse = {
        success: false,
        detail: 'Refresh token expired'
      };

      mockFetch.mockImplementationOnce(() =>
        mockFetchResponse(mockResponse, false, 401)
      );

      await expect(refresh()).rejects.toThrow('HTTP 401');
    });

    test('handles network error during refresh', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(refresh()).rejects.toThrow('Network error');
    });
  });

  describe('me', () => {
    test('successfully gets current user', async () => {
      const mockResponse = {
        success: true,
        user: {
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          team_id: 1,
          role: 'player'
        }
      };

      mockFetch.mockImplementationOnce(() => mockFetchResponse(mockResponse));

      const result = await me();

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/auth/me',
        expect.objectContaining({
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        })
      );

      expect(result.success).toBe(true);
      expect(result.user.username).toBe('testuser');
    });

    test('fails when not authenticated', async () => {
      const mockResponse = {
        success: false,
        detail: 'Not authenticated'
      };

      mockFetch.mockImplementationOnce(() =>
        mockFetchResponse(mockResponse, false, 401)
      );

      await expect(me()).rejects.toThrow('HTTP 401');
    });

    test('handles network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(me()).rejects.toThrow('Network error');
    });
  });

  describe('verify', () => {
    test('successfully verifies authentication', async () => {
      const mockResponse = {
        success: true,
        user: {
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          team_id: 1,
          role: 'player'
        }
      };

      mockFetch.mockImplementationOnce(() => mockFetchResponse(mockResponse));

      const result = await verify();

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/auth/me',
        expect.objectContaining({
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        })
      );

      expect(result.success).toBe(true);
      expect(result.user.username).toBe('testuser');
    });

    test('fails when token is invalid', async () => {
      const mockResponse = {
        success: false,
        detail: 'Invalid token'
      };

      mockFetch.mockImplementationOnce(() =>
        mockFetchResponse(mockResponse, false, 401)
      );

      await expect(verify()).rejects.toThrow('HTTP 401');
    });

    test('handles server error', async () => {
      const mockResponse = {
        success: false,
        detail: 'Internal server error'
      };

      // Mock all 3 retry attempts (MAX_RETRIES = 3)
      mockFetch
        .mockImplementationOnce(() => mockFetchResponse(mockResponse, false, 500))
        .mockImplementationOnce(() => mockFetchResponse(mockResponse, false, 500))
        .mockImplementationOnce(() => mockFetchResponse(mockResponse, false, 500));

      await expect(verify()).rejects.toThrow('HTTP 500');
    });
  });
});
