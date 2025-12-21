/**
 * Module: Navigation.test.jsx
 * Purpose: Tests for Navigation component
 * Part of: Easter Quest Frontend Testing
 *
 * @since 2025-12-20
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Navigation from '../../../src/components/Navigation/Navigation';
import { createMockUser, createMockAdmin } from '../../test-utils';

describe('Navigation Component', () => {
  let mockOnTabChange;

  beforeEach(() => {
    mockOnTabChange = jest.fn();
  });

  describe('Rendering', () => {
    test('renders navigation component', () => {
      const user = createMockUser({ role: 'player' });
      const { container } = render(
        <Navigation activeTab="game" onTabChange={mockOnTabChange} user={user} />
      );

      const nav = container.querySelector('.nav-tabs');
      expect(nav).toBeInTheDocument();
    });

    test('renders with semantic nav element', () => {
      const user = createMockUser({ role: 'player' });
      const { container } = render(
        <Navigation activeTab="game" onTabChange={mockOnTabChange} user={user} />
      );

      const nav = container.querySelector('nav');
      expect(nav).toBeInTheDocument();
    });
  });

  describe('Player Role Tabs', () => {
    test('player sees only Game Panel and Profile tabs', () => {
      const user = createMockUser({ role: 'player' });
      render(<Navigation activeTab="game" onTabChange={mockOnTabChange} user={user} />);

      expect(screen.getByText(/Game Panel/)).toBeInTheDocument();
      expect(screen.getByText(/Profile/)).toBeInTheDocument();
    });

    test('player does not see admin tabs', () => {
      const user = createMockUser({ role: 'player' });
      render(<Navigation activeTab="game" onTabChange={mockOnTabChange} user={user} />);

      expect(screen.queryByText(/System Admin Dashboard/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Game Admin Dashboard/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Notifications/)).not.toBeInTheDocument();
    });

    test('player does not see Team Management tab', () => {
      const user = createMockUser({ role: 'player' });
      render(<Navigation activeTab="game" onTabChange={mockOnTabChange} user={user} />);

      expect(screen.queryByText(/Team Management/)).not.toBeInTheDocument();
    });
  });

  describe('Team Captain Role Tabs', () => {
    test('team captain sees Game Panel, Team Management, and Profile tabs', () => {
      const user = createMockUser({ role: 'team_captain' });
      render(<Navigation activeTab="game" onTabChange={mockOnTabChange} user={user} />);

      expect(screen.getByText(/Game Panel/)).toBeInTheDocument();
      expect(screen.getByText(/Team Management/)).toBeInTheDocument();
      expect(screen.getByText(/Profile/)).toBeInTheDocument();
    });

    test('team captain does not see admin dashboard tabs', () => {
      const user = createMockUser({ role: 'team_captain' });
      render(<Navigation activeTab="game" onTabChange={mockOnTabChange} user={user} />);

      expect(screen.queryByText(/System Admin Dashboard/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Game Admin Dashboard/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Notifications/)).not.toBeInTheDocument();
    });
  });

  describe('Game Admin Role Tabs', () => {
    test('game admin sees Game Admin Dashboard, Notifications, Team Management, and Profile', () => {
      const user = createMockUser({ role: 'game_admin' });
      render(<Navigation activeTab="dashboard" onTabChange={mockOnTabChange} user={user} />);

      expect(screen.getByText(/Game Admin Dashboard/)).toBeInTheDocument();
      expect(screen.getByText(/Notifications/)).toBeInTheDocument();
      expect(screen.getByText(/Team Management/)).toBeInTheDocument();
      expect(screen.getByText(/Profile/)).toBeInTheDocument();
    });

    test('game admin does not see System Admin Dashboard', () => {
      const user = createMockUser({ role: 'game_admin' });
      render(<Navigation activeTab="dashboard" onTabChange={mockOnTabChange} user={user} />);

      expect(screen.queryByText(/System Admin Dashboard/)).not.toBeInTheDocument();
    });

    test('game admin does not see Game Panel', () => {
      const user = createMockUser({ role: 'game_admin' });
      render(<Navigation activeTab="dashboard" onTabChange={mockOnTabChange} user={user} />);

      expect(screen.queryByText(/Game Panel/)).not.toBeInTheDocument();
    });
  });

  describe('Content Admin Role Tabs', () => {
    test('content admin sees System Admin Dashboard and Profile', () => {
      const user = createMockUser({ role: 'content_admin' });
      render(<Navigation activeTab="system_admin" onTabChange={mockOnTabChange} user={user} />);

      expect(screen.getByText(/System Admin Dashboard/)).toBeInTheDocument();
      expect(screen.getByText(/Profile/)).toBeInTheDocument();
    });

    test('content admin does not see game-related tabs', () => {
      const user = createMockUser({ role: 'content_admin' });
      render(<Navigation activeTab="system_admin" onTabChange={mockOnTabChange} user={user} />);

      expect(screen.queryByText(/Game Admin Dashboard/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Notifications/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Team Management/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Game Panel/)).not.toBeInTheDocument();
    });
  });

  describe('System Admin Role Tabs', () => {
    test('system admin sees System Admin Dashboard and Profile', () => {
      const user = createMockUser({ role: 'system_admin' });
      render(<Navigation activeTab="system_admin" onTabChange={mockOnTabChange} user={user} />);

      expect(screen.getByText(/System Admin Dashboard/)).toBeInTheDocument();
      expect(screen.getByText(/Profile/)).toBeInTheDocument();
    });

    test('system admin does not see other tabs', () => {
      const user = createMockUser({ role: 'system_admin' });
      render(<Navigation activeTab="system_admin" onTabChange={mockOnTabChange} user={user} />);

      expect(screen.queryByText(/Game Admin Dashboard/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Notifications/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Team Management/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Game Panel/)).not.toBeInTheDocument();
    });
  });

  describe('Admin Role Tabs', () => {
    test('admin sees all tabs', () => {
      const user = createMockAdmin();
      render(<Navigation activeTab="dashboard" onTabChange={mockOnTabChange} user={user} />);

      expect(screen.getByText(/System Admin Dashboard/)).toBeInTheDocument();
      expect(screen.getByText(/Game Admin Dashboard/)).toBeInTheDocument();
      expect(screen.getByText(/Notifications/)).toBeInTheDocument();
      expect(screen.getByText(/Team Management/)).toBeInTheDocument();
      expect(screen.getByText(/Game Panel/)).toBeInTheDocument();
      expect(screen.getByText(/Profile/)).toBeInTheDocument();
    });
  });

  describe('Active Tab Highlighting', () => {
    test('highlights active tab for player', () => {
      const user = createMockUser({ role: 'player' });
      const { container } = render(
        <Navigation activeTab="game" onTabChange={mockOnTabChange} user={user} />
      );

      const activeButton = container.querySelector('.nav-tab.active');
      expect(activeButton).toHaveTextContent('Game Panel');
    });

    test('highlights profile tab when active', () => {
      const user = createMockUser({ role: 'player' });
      const { container } = render(
        <Navigation activeTab="profile" onTabChange={mockOnTabChange} user={user} />
      );

      const activeButton = container.querySelector('.nav-tab.active');
      expect(activeButton).toHaveTextContent('Profile');
    });

    test('highlights admin dashboard when active', () => {
      const user = createMockAdmin();
      const { container } = render(
        <Navigation activeTab="dashboard" onTabChange={mockOnTabChange} user={user} />
      );

      const activeButton = container.querySelector('.nav-tab.active');
      expect(activeButton).toHaveTextContent('Game Admin Dashboard');
    });

    test('highlights system admin dashboard when active', () => {
      const user = createMockAdmin();
      const { container } = render(
        <Navigation activeTab="system_admin" onTabChange={mockOnTabChange} user={user} />
      );

      const activeButton = container.querySelector('.nav-tab.active');
      expect(activeButton).toHaveTextContent('System Admin Dashboard');
    });

    test('highlights notifications tab when active', () => {
      const user = createMockAdmin();
      const { container } = render(
        <Navigation activeTab="notifications" onTabChange={mockOnTabChange} user={user} />
      );

      const activeButton = container.querySelector('.nav-tab.active');
      expect(activeButton).toHaveTextContent('Notifications');
    });

    test('highlights team management tab when active', () => {
      const user = createMockUser({ role: 'team_captain' });
      const { container } = render(
        <Navigation activeTab="team_management" onTabChange={mockOnTabChange} user={user} />
      );

      const activeButton = container.querySelector('.nav-tab.active');
      expect(activeButton).toHaveTextContent('Team Management');
    });
  });

  describe('Tab Click Handlers', () => {
    test('calls onTabChange when Game Panel is clicked', () => {
      const user = createMockUser({ role: 'player' });
      render(<Navigation activeTab="profile" onTabChange={mockOnTabChange} user={user} />);

      const gameButton = screen.getByText(/Game Panel/);
      fireEvent.click(gameButton);

      expect(mockOnTabChange).toHaveBeenCalledWith('game');
    });

    test('calls onTabChange when Profile is clicked', () => {
      const user = createMockUser({ role: 'player' });
      render(<Navigation activeTab="game" onTabChange={mockOnTabChange} user={user} />);

      const profileButton = screen.getByText(/Profile/);
      fireEvent.click(profileButton);

      expect(mockOnTabChange).toHaveBeenCalledWith('profile');
    });

    test('calls onTabChange when System Admin Dashboard is clicked', () => {
      const user = createMockAdmin();
      render(<Navigation activeTab="dashboard" onTabChange={mockOnTabChange} user={user} />);

      const systemAdminButton = screen.getByText(/System Admin Dashboard/);
      fireEvent.click(systemAdminButton);

      expect(mockOnTabChange).toHaveBeenCalledWith('system_admin');
    });

    test('calls onTabChange when Game Admin Dashboard is clicked', () => {
      const user = createMockAdmin();
      render(<Navigation activeTab="profile" onTabChange={mockOnTabChange} user={user} />);

      const dashboardButton = screen.getByText(/Game Admin Dashboard/);
      fireEvent.click(dashboardButton);

      expect(mockOnTabChange).toHaveBeenCalledWith('dashboard');
    });

    test('calls onTabChange when Notifications is clicked', () => {
      const user = createMockAdmin();
      render(<Navigation activeTab="dashboard" onTabChange={mockOnTabChange} user={user} />);

      const notificationsButton = screen.getByText(/Notifications/);
      fireEvent.click(notificationsButton);

      expect(mockOnTabChange).toHaveBeenCalledWith('notifications');
    });

    test('calls onTabChange when Team Management is clicked', () => {
      const user = createMockUser({ role: 'team_captain' });
      render(<Navigation activeTab="game" onTabChange={mockOnTabChange} user={user} />);

      const teamButton = screen.getByText(/Team Management/);
      fireEvent.click(teamButton);

      expect(mockOnTabChange).toHaveBeenCalledWith('team_management');
    });

    test('calls onTabChange only once per click', () => {
      const user = createMockUser({ role: 'player' });
      render(<Navigation activeTab="game" onTabChange={mockOnTabChange} user={user} />);

      const profileButton = screen.getByText(/Profile/);
      fireEvent.click(profileButton);

      expect(mockOnTabChange).toHaveBeenCalledTimes(1);
    });
  });

  describe('Tab Icons', () => {
    test('System Admin Dashboard has settings icon', () => {
      const user = createMockAdmin();
      render(<Navigation activeTab="system_admin" onTabChange={mockOnTabChange} user={user} />);

      expect(screen.getByText(/⚙️ System Admin Dashboard/)).toBeInTheDocument();
    });

    test('Game Admin Dashboard has chart icon', () => {
      const user = createMockAdmin();
      render(<Navigation activeTab="dashboard" onTabChange={mockOnTabChange} user={user} />);

      expect(screen.getByText(/📊 Game Admin Dashboard/)).toBeInTheDocument();
    });

    test('Notifications has bell icon', () => {
      const user = createMockAdmin();
      render(<Navigation activeTab="notifications" onTabChange={mockOnTabChange} user={user} />);

      expect(screen.getByText(/🔔 Notifications/)).toBeInTheDocument();
    });

    test('Team Management has people icon', () => {
      const user = createMockUser({ role: 'team_captain' });
      render(<Navigation activeTab="team_management" onTabChange={mockOnTabChange} user={user} />);

      expect(screen.getByText(/👥 Team Management/)).toBeInTheDocument();
    });

    test('Game Panel has game controller icon', () => {
      const user = createMockUser({ role: 'player' });
      render(<Navigation activeTab="game" onTabChange={mockOnTabChange} user={user} />);

      expect(screen.getByText(/🎮 Game Panel/)).toBeInTheDocument();
    });

    test('Profile has user icon', () => {
      const user = createMockUser({ role: 'player' });
      render(<Navigation activeTab="profile" onTabChange={mockOnTabChange} user={user} />);

      expect(screen.getByText(/👤 Profile/)).toBeInTheDocument();
    });
  });

  describe('CSS Classes', () => {
    test('navigation has nav-tabs class', () => {
      const user = createMockUser({ role: 'player' });
      const { container } = render(
        <Navigation activeTab="game" onTabChange={mockOnTabChange} user={user} />
      );

      const nav = container.querySelector('.nav-tabs');
      expect(nav).toBeInTheDocument();
    });

    test('buttons have nav-tab class', () => {
      const user = createMockUser({ role: 'player' });
      const { container } = render(
        <Navigation activeTab="game" onTabChange={mockOnTabChange} user={user} />
      );

      const buttons = container.querySelectorAll('.nav-tab');
      expect(buttons.length).toBeGreaterThan(0);
    });

    test('active tab has active class', () => {
      const user = createMockUser({ role: 'player' });
      const { container } = render(
        <Navigation activeTab="game" onTabChange={mockOnTabChange} user={user} />
      );

      const activeButton = container.querySelector('.nav-tab.active');
      expect(activeButton).toBeInTheDocument();
    });

    test('inactive tabs do not have active class', () => {
      const user = createMockUser({ role: 'player' });
      render(<Navigation activeTab="game" onTabChange={mockOnTabChange} user={user} />);

      const profileButton = screen.getByText(/Profile/);
      expect(profileButton).not.toHaveClass('active');
      expect(profileButton).toHaveClass('nav-tab');
    });
  });

  describe('Profile Tab', () => {
    test('profile tab is always visible for all roles', () => {
      const roles = ['player', 'team_captain', 'game_admin', 'content_admin', 'system_admin', 'admin'];

      roles.forEach((role) => {
        const user = createMockUser({ role });
        const { unmount } = render(
          <Navigation activeTab="profile" onTabChange={mockOnTabChange} user={user} />
        );

        expect(screen.getByText(/Profile/)).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe('Edge Cases', () => {
    test('handles unknown activeTab gracefully', () => {
      const user = createMockUser({ role: 'player' });
      const { container } = render(
        <Navigation activeTab="unknown" onTabChange={mockOnTabChange} user={user} />
      );

      const activeButtons = container.querySelectorAll('.nav-tab.active');
      expect(activeButtons).toHaveLength(0);
    });

    test('renders without crashing when user role changes', () => {
      const user = createMockUser({ role: 'player' });
      const { rerender } = render(
        <Navigation activeTab="game" onTabChange={mockOnTabChange} user={user} />
      );

      const adminUser = createMockAdmin();
      rerender(<Navigation activeTab="dashboard" onTabChange={mockOnTabChange} user={adminUser} />);

      expect(screen.getByText(/Game Admin Dashboard/)).toBeInTheDocument();
    });

    test('handles rapid tab changes', () => {
      const user = createMockAdmin();
      render(<Navigation activeTab="game" onTabChange={mockOnTabChange} user={user} />);

      const dashboardButton = screen.getByText(/Game Admin Dashboard/);
      const profileButton = screen.getByText(/Profile/);

      fireEvent.click(dashboardButton);
      fireEvent.click(profileButton);
      fireEvent.click(dashboardButton);

      expect(mockOnTabChange).toHaveBeenCalledTimes(3);
    });
  });

  describe('Accessibility', () => {
    test('all tabs are buttons', () => {
      const user = createMockAdmin();
      const { container } = render(
        <Navigation activeTab="dashboard" onTabChange={mockOnTabChange} user={user} />
      );

      const buttons = container.querySelectorAll('button.nav-tab');
      expect(buttons.length).toBeGreaterThan(0);
    });

    test('buttons have accessible text', () => {
      const user = createMockUser({ role: 'player' });
      render(<Navigation activeTab="game" onTabChange={mockOnTabChange} user={user} />);

      const gameButton = screen.getByText(/Game Panel/);
      expect(gameButton).toHaveAccessibleName();
    });

    test('active tab is indicated by class', () => {
      const user = createMockUser({ role: 'player' });
      const { container } = render(
        <Navigation activeTab="game" onTabChange={mockOnTabChange} user={user} />
      );

      const activeButton = container.querySelector('.nav-tab.active');
      expect(activeButton).toBeInTheDocument();
    });
  });
});
