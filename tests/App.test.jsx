/**
 * Module: App.test.jsx
 * Purpose: Tests for main App component
 * Part of: Easter Quest Frontend Testing
 *
 * @since 2025-12-19
 */

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../src/App';
import { createMockUser, createMockAdmin, mockFetchResponse } from './test-utils';

// Mock all child components
jest.mock('../src/components/Login/Login', () => ({
  __esModule: true,
  default: ({ onLogin, error }) => (
    <div data-testid="login-component">
      <button onClick={() => onLogin('test', 'pass')}>Login Button</button>
      {error && <div data-testid="login-error">{error}</div>}
    </div>
  )
}));

jest.mock('../src/components/Header/Header', () => ({
  __esModule: true,
  default: ({ user, onLogout }) => (
    <div data-testid="header">
      <span>{user.username}</span>
      <button onClick={onLogout}>Logout</button>
    </div>
  )
}));

jest.mock('../src/components/Navigation/Navigation', () => ({
  __esModule: true,
  default: ({ activeTab, onTabChange, user }) => (
    <div data-testid="navigation">
      <button onClick={() => onTabChange('profile')}>Profile</button>
      <button onClick={() => onTabChange('game')}>Game</button>
      <button onClick={() => onTabChange('dashboard')}>Dashboard</button>
    </div>
  )
}));

jest.mock('../src/components/Footer/Footer', () => ({
  __esModule: true,
  default: ({ user }) => <div data-testid="footer">{user.role}</div>
}));

jest.mock('../src/components/GamePanel/GamePanel', () => ({
  __esModule: true,
  default: ({ user }) => <div data-testid="game-panel">Game Panel</div>
}));

jest.mock('../src/components/Profile/Profile', () => ({
  __esModule: true,
  default: ({ user }) => <div data-testid="profile">Profile: {user.username}</div>
}));

jest.mock('../src/components/AdminDashboard/GameAdminDashboard', () => ({
  __esModule: true,
  default: ({ user }) => <div data-testid="admin-dashboard">Admin Dashboard</div>
}));

jest.mock('../src/components/SystemAdminDashboard/SystemAdminDashboard', () => ({
  __esModule: true,
  default: ({ user }) => <div data-testid="system-admin-dashboard">System Admin Dashboard</div>
}));

jest.mock('../src/components/TeamManagement/TeamManagement', () => ({
  __esModule: true,
  default: ({ user }) => <div data-testid="team-management">Team Management</div>
}));

jest.mock('../src/components/ChatWidget', () => ({
  ChatWidget: () => <div data-testid="chat-widget">Chat Widget</div>
}));

jest.mock('../src/components/Loader/Loader', () => ({
  __esModule: true,
  default: ({ message }) => <div data-testid="loader">{message}</div>
}));

jest.mock('../src/contexts/ChatContext', () => ({
  ChatProvider: ({ children }) => <div>{children}</div>
}));

jest.mock('../src/components/ErrorBoundary/ErrorBoundary', () => ({
  __esModule: true,
  default: ({ children }) => <div>{children}</div>
}));

describe('App Component', () => {
  let mockFetch;

  beforeEach(() => {
    mockFetch = jest.fn();
    global.fetch = mockFetch;
    jest.clearAllMocks();
  });

  afterEach(() => {
    delete global.fetch;
  });

  describe('Initial Load', () => {
    test('shows loader while checking auth status', () => {
      mockFetch.mockImplementationOnce(() =>
        new Promise(resolve => setTimeout(() => resolve(mockFetchResponse({ ok: false })), 100))
      );

      render(<App />);

      expect(screen.getByTestId('loader')).toBeInTheDocument();
      expect(screen.getByTestId('loader')).toHaveTextContent('Loading Easter Quest 2026...');
    });

    test('shows login when not authenticated', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401
      });

      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('login-component')).toBeInTheDocument();
      });

      expect(screen.queryByTestId('header')).not.toBeInTheDocument();
    });

    test('shows authenticated app when user is logged in', async () => {
      const mockUser = createMockUser();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUser
      });

      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('header')).toBeInTheDocument();
      });

      expect(screen.queryByTestId('login-component')).not.toBeInTheDocument();
      expect(screen.getByTestId('navigation')).toBeInTheDocument();
      expect(screen.getByTestId('footer')).toBeInTheDocument();
      expect(screen.getByTestId('chat-widget')).toBeInTheDocument();
    });
  });

  describe('Authentication', () => {
    test('checks auth status on mount', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401
      });

      render(<App />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/auth/me'),
          expect.objectContaining({
            method: 'GET',
            credentials: 'include'
          })
        );
      });
    });

    test('handles successful login', async () => {
      const mockUser = createMockUser();

      // Initial auth check (fails)
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401
      });

      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('login-component')).toBeInTheDocument();
      });

      // Mock login API call
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          user: mockUser,
          message: 'Login successful'
        })
      });

      const loginButton = screen.getByText('Login Button');
      await act(async () => {
        loginButton.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('header')).toBeInTheDocument();
      });
    });

    test('handles logout', async () => {
      const mockUser = createMockUser();

      // Initial auth check (succeeds)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUser
      });

      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('header')).toBeInTheDocument();
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
        expect(screen.getByTestId('login-component')).toBeInTheDocument();
      });

      expect(screen.queryByTestId('header')).not.toBeInTheDocument();
    });
  });

  describe('Role-based Routing', () => {
    test('sets default tab for player role', async () => {
      const mockUser = createMockUser({ role: 'player' });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUser
      });

      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('game-panel')).toBeInTheDocument();
      });
    });

    test('sets default tab for admin role', async () => {
      const mockAdmin = createMockAdmin({ role: 'admin' });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockAdmin
      });

      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('system-admin-dashboard')).toBeInTheDocument();
      });
    });

    test('sets default tab for game_admin role', async () => {
      const mockAdmin = createMockAdmin({ role: 'game_admin' });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockAdmin
      });

      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('admin-dashboard')).toBeInTheDocument();
      });
    });

    test('allows tab switching', async () => {
      const mockUser = createMockUser({ role: 'player' });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUser
      });

      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('game-panel')).toBeInTheDocument();
      });

      // Switch to profile
      const profileButton = screen.getByText('Profile');
      await act(async () => {
        profileButton.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('profile')).toBeInTheDocument();
      });
    });
  });

  describe('Permission-based Component Rendering', () => {
    test('admin can access system admin dashboard', async () => {
      const mockAdmin = createMockAdmin({ role: 'admin' });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockAdmin
      });

      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('system-admin-dashboard')).toBeInTheDocument();
      });
    });

    test('player cannot access admin dashboards', async () => {
      const mockUser = createMockUser({ role: 'player' });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUser
      });

      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('game-panel')).toBeInTheDocument();
      });

      // Try to switch to dashboard (should not show admin dashboard for player)
      const dashboardButton = screen.getByText('Dashboard');
      await act(async () => {
        dashboardButton.click();
      });

      // Admin dashboard should not be visible
      expect(screen.queryByTestId('admin-dashboard')).not.toBeInTheDocument();
      expect(screen.queryByTestId('system-admin-dashboard')).not.toBeInTheDocument();
    });

    test('all roles can access profile', async () => {
      const mockUser = createMockUser({ role: 'player' });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUser
      });

      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('navigation')).toBeInTheDocument();
      });

      const profileButton = screen.getByText('Profile');
      await act(async () => {
        profileButton.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('profile')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    test('handles auth check failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('login-component')).toBeInTheDocument();
      });
    });

    test('handles logout failure gracefully', async () => {
      const mockUser = createMockUser();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUser
      });

      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('header')).toBeInTheDocument();
      });

      // Mock logout API call (fails)
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const logoutButton = screen.getByText('Logout');
      await act(async () => {
        logoutButton.click();
      });

      // User should still be logged out locally
      await waitFor(() => {
        expect(screen.getByTestId('login-component')).toBeInTheDocument();
      });
    });
  });
});
