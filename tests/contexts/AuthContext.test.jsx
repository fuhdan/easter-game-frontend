/**
 * Module: AuthContext.test.jsx
 * Purpose: Tests for AuthContext
 * Part of: Easter Quest Frontend Testing
 *
 * @since 2025-12-19
 */

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AuthProvider, useAuth } from '../../src/contexts/AuthContext';
import { createMockUser, createMockAdmin } from '../test-utils';

// Mock the auth service module
jest.mock('../../src/services', () => ({
  login: jest.fn(),
  logout: jest.fn(),
  refresh: jest.fn(),
  me: jest.fn(),
}));

import { login as mockLogin, me as mockMe } from '../../src/services';

// Test component that uses the auth context
const TestComponent = () => {
  const { user, isAuthenticated, isAdmin, isPlayer, loading, error, sessionExpired } = useAuth();
  return (
    <div>
      <div data-testid="user">{user ? JSON.stringify(user) : 'null'}</div>
      <div data-testid="authenticated">{isAuthenticated ? 'yes' : 'no'}</div>
      <div data-testid="admin">{isAdmin ? 'yes' : 'no'}</div>
      <div data-testid="player">{isPlayer ? 'yes' : 'no'}</div>
      <div data-testid="loading">{loading ? 'yes' : 'no'}</div>
      <div data-testid="error">{error || 'none'}</div>
      <div data-testid="session-expired">{sessionExpired ? 'yes' : 'no'}</div>
    </div>
  );
};

describe('AuthContext', () => {
  let mockFetch;

  beforeEach(() => {
    mockFetch = jest.fn();
    global.fetch = mockFetch;
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('useAuth hook', () => {
    test('throws error when used outside AuthProvider', () => {
      // Suppress console.error for this test
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useAuth must be used within an AuthProvider');

      consoleError.mockRestore();
    });

    test('returns context value when used inside AuthProvider', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('no');
      });

      expect(screen.getByTestId('authenticated')).toHaveTextContent('no');
    });
  });

  describe('AuthProvider', () => {
    test('renders children', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401
      });

      render(
        <AuthProvider>
          <div data-testid="child">Test Child</div>
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('child')).toBeInTheDocument();
      });
    });

    test('checks auth status on mount', async () => {
      const mockUser = createMockUser();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUser
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('no');
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/me'),
        expect.objectContaining({
          method: 'GET',
          credentials: 'include'
        })
      );
    });

    test('sets user when auth check succeeds', async () => {
      const mockUser = createMockUser();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUser
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('yes');
      });

      const userData = JSON.parse(screen.getByTestId('user').textContent);
      expect(userData.username).toBe('testuser');
      expect(screen.getByTestId('player')).toHaveTextContent('yes');
      expect(screen.getByTestId('admin')).toHaveTextContent('no');
    });

    test('does not set user when auth check fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('no');
      });

      expect(screen.getByTestId('user')).toHaveTextContent('null');
    });

    test('identifies admin users correctly', async () => {
      const mockAdmin = createMockAdmin();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockAdmin
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('admin')).toHaveTextContent('yes');
      });

      expect(screen.getByTestId('player')).toHaveTextContent('no');
    });
  });

  describe('login function', () => {
    const LoginTestComponent = () => {
      const { login, user, error, loading } = useAuth();

      return (
        <div>
          <button onClick={() => login('testuser', 'password123')}>Login</button>
          <div data-testid="user">{user ? user.username : 'null'}</div>
          <div data-testid="error">{error || 'none'}</div>
          <div data-testid="loading">{loading ? 'yes' : 'no'}</div>
        </div>
      );
    };

    test('successfully logs in user', async () => {
      const mockUser = createMockUser();

      // Initial auth check (fails)
      mockMe.mockRejectedValue(new Error('Not authenticated'));

      render(
        <AuthProvider>
          <LoginTestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('no');
      });

      // Mock login service call
      mockLogin.mockResolvedValue({
        success: true,
        user: mockUser,
        message: 'Login successful'
      });

      const loginButton = screen.getByText('Login');
      await act(async () => {
        loginButton.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('testuser');
      });

      expect(screen.getByTestId('error')).toHaveTextContent('none');
    });

    test('handles login failure', async () => {
      // Initial auth check (fails)
      mockMe.mockRejectedValue(new Error('Not authenticated'));

      render(
        <AuthProvider>
          <LoginTestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('no');
      });

      // Mock login service call (fails)
      mockLogin.mockResolvedValue({
        success: false,
        detail: 'Invalid credentials'
      });

      const loginButton = screen.getByText('Login');
      await act(async () => {
        loginButton.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Invalid credentials');
      });

      expect(screen.getByTestId('user')).toHaveTextContent('null');
    });

    test('handles network error during login', async () => {
      // Initial auth check (fails)
      mockMe.mockRejectedValue(new Error('Not authenticated'));

      render(
        <AuthProvider>
          <LoginTestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('no');
      });

      // Mock login service call (network error)
      mockLogin.mockRejectedValue(new Error('Network error'));

      const loginButton = screen.getByText('Login');
      await act(async () => {
        loginButton.click();
      });

      await waitFor(() => {
        // The error message comes from err.message in the catch block
        expect(screen.getByTestId('error')).toHaveTextContent('Network error');
      });
    });

    test('clears session expired flag on successful login', async () => {
      const mockUser = createMockUser();

      // Initial auth check (fails)
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401
      });

      const SessionTestComponent = () => {
        const { login, sessionExpired, handleSessionExpiry } = useAuth();

        return (
          <div>
            <button onClick={() => handleSessionExpiry()}>Expire Session</button>
            <button onClick={() => login('testuser', 'password123')}>Login</button>
            <div data-testid="session-expired">{sessionExpired ? 'yes' : 'no'}</div>
          </div>
        );
      };

      render(
        <AuthProvider>
          <SessionTestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('session-expired')).toHaveTextContent('no');
      });

      // Trigger session expiry
      const expireButton = screen.getByText('Expire Session');
      await act(async () => {
        expireButton.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('session-expired')).toHaveTextContent('yes');
      });

      // Mock successful login
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          user: mockUser,
          message: 'Login successful'
        })
      });

      const loginButton = screen.getByText('Login');
      await act(async () => {
        loginButton.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('session-expired')).toHaveTextContent('no');
      });
    });
  });

  describe('logout function', () => {
    const LogoutTestComponent = () => {
      const { logout, user } = useAuth();

      return (
        <div>
          <button onClick={logout}>Logout</button>
          <div data-testid="user">{user ? user.username : 'null'}</div>
        </div>
      );
    };

    test('successfully logs out user', async () => {
      const mockUser = createMockUser();

      // Initial auth check (succeeds)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUser
      });

      render(
        <AuthProvider>
          <LogoutTestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('testuser');
      });

      // Mock logout API call
      mockFetch.mockResolvedValueOnce({
        ok: true
      });

      const logoutButton = screen.getByText('Logout');
      await act(async () => {
        logoutButton.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('null');
      });
    });

    test('clears user even if logout API fails', async () => {
      const mockUser = createMockUser();

      // Initial auth check (succeeds)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUser
      });

      render(
        <AuthProvider>
          <LogoutTestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('testuser');
      });

      // Mock logout API call (fails)
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const logoutButton = screen.getByText('Logout');
      await act(async () => {
        logoutButton.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('null');
      });
    });
  });

  describe('session expiry handling', () => {
    test('handles auth-error event when user is authenticated', async () => {
      const mockUser = createMockUser();

      // Initial auth check (succeeds)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUser
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('yes');
      });

      // Trigger auth-error event
      act(() => {
        window.dispatchEvent(new Event('auth-error'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('session-expired')).toHaveTextContent('yes');
      });

      expect(screen.getByTestId('authenticated')).toHaveTextContent('no');
      expect(screen.getByTestId('error')).toHaveTextContent('Your session has expired. Please log in again.');
    });

    test('does not handle auth-error event when user is not authenticated', async () => {
      // Initial auth check (fails)
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('no');
      });

      // Trigger auth-error event
      act(() => {
        window.dispatchEvent(new Event('auth-error'));
      });

      // Should not change session expired state
      await waitFor(() => {
        expect(screen.getByTestId('session-expired')).toHaveTextContent('no');
      });
    });
  });

  describe('clearError function', () => {
    const ClearErrorTestComponent = () => {
      const { error, clearError, handleSessionExpiry } = useAuth();

      return (
        <div>
          <button onClick={() => handleSessionExpiry('Test error')}>Set Error</button>
          <button onClick={clearError}>Clear Error</button>
          <div data-testid="error">{error || 'none'}</div>
          <div data-testid="session-expired">{error ? 'has-error' : 'no-error'}</div>
        </div>
      );
    };

    test('clears error and session expired flag', async () => {
      // Initial auth check (fails)
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401
      });

      render(
        <AuthProvider>
          <ClearErrorTestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('none');
      });

      // Set error
      const setErrorButton = screen.getByText('Set Error');
      await act(async () => {
        setErrorButton.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Your session has expired. Please log in again.');
      });

      // Clear error
      const clearErrorButton = screen.getByText('Clear Error');
      await act(async () => {
        clearErrorButton.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('none');
      });
    });
  });

  describe('context value', () => {
    test('provides all expected properties', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401
      });

      const ContextValueTestComponent = () => {
        const context = useAuth();

        return (
          <div>
            <div data-testid="has-user">{context.user !== undefined ? 'yes' : 'no'}</div>
            <div data-testid="has-login">{typeof context.login === 'function' ? 'yes' : 'no'}</div>
            <div data-testid="has-logout">{typeof context.logout === 'function' ? 'yes' : 'no'}</div>
            <div data-testid="has-loading">{context.loading !== undefined ? 'yes' : 'no'}</div>
            <div data-testid="has-error">{context.error !== undefined ? 'yes' : 'no'}</div>
            <div data-testid="has-clear-error">{typeof context.clearError === 'function' ? 'yes' : 'no'}</div>
            <div data-testid="has-is-authenticated">{context.isAuthenticated !== undefined ? 'yes' : 'no'}</div>
            <div data-testid="has-is-admin">{context.isAdmin !== undefined ? 'yes' : 'no'}</div>
            <div data-testid="has-is-player">{context.isPlayer !== undefined ? 'yes' : 'no'}</div>
            <div data-testid="has-session-expired">{context.sessionExpired !== undefined ? 'yes' : 'no'}</div>
            <div data-testid="has-handle-session-expiry">{typeof context.handleSessionExpiry === 'function' ? 'yes' : 'no'}</div>
          </div>
        );
      };

      render(
        <AuthProvider>
          <ContextValueTestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('has-user')).toHaveTextContent('yes');
        expect(screen.getByTestId('has-login')).toHaveTextContent('yes');
        expect(screen.getByTestId('has-logout')).toHaveTextContent('yes');
        expect(screen.getByTestId('has-loading')).toHaveTextContent('yes');
        expect(screen.getByTestId('has-error')).toHaveTextContent('yes');
        expect(screen.getByTestId('has-clear-error')).toHaveTextContent('yes');
        expect(screen.getByTestId('has-is-authenticated')).toHaveTextContent('yes');
        expect(screen.getByTestId('has-is-admin')).toHaveTextContent('yes');
        expect(screen.getByTestId('has-is-player')).toHaveTextContent('yes');
        expect(screen.getByTestId('has-session-expired')).toHaveTextContent('yes');
        expect(screen.getByTestId('has-handle-session-expiry')).toHaveTextContent('yes');
      });
    });
  });
});
