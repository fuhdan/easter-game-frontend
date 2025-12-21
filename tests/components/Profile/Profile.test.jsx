/**
 * Module: Profile.test.jsx
 * Purpose: Tests for Profile component
 * Part of: Easter Quest Frontend Testing
 *
 * @since 2025-12-20
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Profile from '../../../src/components/Profile/Profile';
import { createMockUser, createMockAdmin } from '../../test-utils';

// Mock child components
jest.mock('../../../src/components/Profile/PasswordChangeCard', () => {
  return function MockPasswordChangeCard() {
    return <div data-testid="password-change-card">Password Change Card</div>;
  };
});

jest.mock('../../../src/components/Profile/GameRatingCard', () => {
  return function MockGameRatingCard() {
    return <div data-testid="game-rating-card">Game Rating Card</div>;
  };
});

jest.mock('../../../src/components/Profile/TeamNameCard', () => {
  return function MockTeamNameCard({ user }) {
    return <div data-testid="team-name-card">Team Name Card for {user.username}</div>;
  };
});

describe('Profile Component', () => {
  const mockUser = createMockUser({ role: 'player' });
  const mockCaptain = createMockUser({ role: 'team_captain', username: 'captain1' });
  const mockAdmin = createMockAdmin();

  describe('Rendering', () => {
    test('renders profile component with header', () => {
      render(<Profile user={mockUser} />);

      expect(screen.getByText(/PROFILE/i)).toBeInTheDocument();
    });

    test('renders password tab for all users', () => {
      render(<Profile user={mockUser} />);

      expect(screen.getByRole('button', { name: /Switch to.*Password/i })).toBeInTheDocument();
    });

    test('renders password change card by default', () => {
      render(<Profile user={mockUser} />);

      expect(screen.getByTestId('password-change-card')).toBeInTheDocument();
    });

    test('displays only password tab for regular players', () => {
      render(<Profile user={mockUser} />);

      expect(screen.getByRole('button', { name: /Switch to.*Password/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Switch to.*Team Settings/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Switch to.*Game Rating/i })).not.toBeInTheDocument();
    });

    test('displays all three tabs for team captains', () => {
      render(<Profile user={mockCaptain} />);

      expect(screen.getByRole('button', { name: /Switch to.*Password/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Switch to.*Team Settings/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Switch to.*Game Rating/i })).toBeInTheDocument();
    });

    test('displays password tab only for admins', () => {
      render(<Profile user={mockAdmin} />);

      expect(screen.getByRole('button', { name: /Switch to.*Password/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Switch to.*Team Settings/i })).not.toBeInTheDocument();
    });
  });

  describe('User Validation', () => {
    test('shows error when user prop is null', () => {
      render(<Profile user={null} />);

      expect(screen.getByText(/Error/i)).toBeInTheDocument();
      expect(screen.getByText(/User data not available/i)).toBeInTheDocument();
    });

    test('shows error when user prop is undefined', () => {
      render(<Profile user={undefined} />);

      expect(screen.getByText(/Error/i)).toBeInTheDocument();
      expect(screen.getByText(/User data not available/i)).toBeInTheDocument();
    });

    test('shows error when user is missing required id field', () => {
      const invalidUser = { username: 'test', role: 'player' };
      render(<Profile user={invalidUser} />);

      expect(screen.getByText(/Error/i)).toBeInTheDocument();
      expect(screen.getByText(/Invalid user data/i)).toBeInTheDocument();
    });

    test('shows error when user is missing required username field', () => {
      const invalidUser = { id: 1, role: 'player' };
      render(<Profile user={invalidUser} />);

      expect(screen.getByText(/Invalid user data/i)).toBeInTheDocument();
    });

    test('shows error when user is missing required role field', () => {
      const invalidUser = { id: 1, username: 'test' };
      render(<Profile user={invalidUser} />);

      expect(screen.getByText(/Invalid user data/i)).toBeInTheDocument();
    });

    test('logs error to console when user prop is invalid', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(<Profile user={null} />);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('user prop is required')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Tab Navigation', () => {
    test('password tab is active by default', () => {
      render(<Profile user={mockCaptain} />);

      const passwordTab = screen.getByRole('button', { name: /Switch to.*Password/i });
      expect(passwordTab).toHaveClass('active');
    });

    test('switches to team settings tab when clicked', () => {
      render(<Profile user={mockCaptain} />);

      const teamSettingsTab = screen.getByRole('button', { name: /Switch to.*Team Settings/i });
      fireEvent.click(teamSettingsTab);

      expect(teamSettingsTab).toHaveClass('active');
      expect(screen.getByTestId('team-name-card')).toBeInTheDocument();
    });

    test('switches to game rating tab when clicked', () => {
      render(<Profile user={mockCaptain} />);

      const gameRatingTab = screen.getByRole('button', { name: /Switch to.*Game Rating/i });
      fireEvent.click(gameRatingTab);

      expect(gameRatingTab).toHaveClass('active');
      expect(screen.getByTestId('game-rating-card')).toBeInTheDocument();
    });

    test('can switch between all tabs multiple times', () => {
      render(<Profile user={mockCaptain} />);

      const passwordTab = screen.getByRole('button', { name: /Switch to.*Password/i });
      const teamSettingsTab = screen.getByRole('button', { name: /Switch to.*Team Settings/i });
      const gameRatingTab = screen.getByRole('button', { name: /Switch to.*Game Rating/i });

      // Start on password tab
      expect(screen.getByTestId('password-change-card')).toBeInTheDocument();

      // Switch to team settings
      fireEvent.click(teamSettingsTab);
      expect(screen.getByTestId('team-name-card')).toBeInTheDocument();

      // Switch to game rating
      fireEvent.click(gameRatingTab);
      expect(screen.getByTestId('game-rating-card')).toBeInTheDocument();

      // Switch back to password
      fireEvent.click(passwordTab);
      expect(screen.getByTestId('password-change-card')).toBeInTheDocument();
    });

    test('active tab has active class', () => {
      render(<Profile user={mockCaptain} />);

      const teamSettingsTab = screen.getByRole('button', { name: /Switch to.*Team Settings/i });
      fireEvent.click(teamSettingsTab);

      expect(teamSettingsTab).toHaveClass('active');
      expect(screen.getByRole('button', { name: /Switch to.*Password/i })).not.toHaveClass('active');
      expect(screen.getByRole('button', { name: /Switch to.*Game Rating/i })).not.toHaveClass('active');
    });
  });

  describe('Content Rendering', () => {
    test('renders password change card when password tab is active', () => {
      render(<Profile user={mockUser} />);

      expect(screen.getByTestId('password-change-card')).toBeInTheDocument();
      expect(screen.queryByTestId('team-name-card')).not.toBeInTheDocument();
      expect(screen.queryByTestId('game-rating-card')).not.toBeInTheDocument();
    });

    test('renders team name card when team settings tab is active', () => {
      render(<Profile user={mockCaptain} />);

      fireEvent.click(screen.getByRole('button', { name: /Switch to.*Team Settings/i }));

      expect(screen.getByTestId('team-name-card')).toBeInTheDocument();
      expect(screen.queryByTestId('password-change-card')).not.toBeInTheDocument();
      expect(screen.queryByTestId('game-rating-card')).not.toBeInTheDocument();
    });

    test('renders game rating card when game rating tab is active', () => {
      render(<Profile user={mockCaptain} />);

      fireEvent.click(screen.getByRole('button', { name: /Switch to.*Game Rating/i }));

      expect(screen.getByTestId('game-rating-card')).toBeInTheDocument();
      expect(screen.queryByTestId('password-change-card')).not.toBeInTheDocument();
      expect(screen.queryByTestId('team-name-card')).not.toBeInTheDocument();
    });

    test('passes user prop to team name card', () => {
      render(<Profile user={mockCaptain} />);

      fireEvent.click(screen.getByRole('button', { name: /Switch to.*Team Settings/i }));

      expect(screen.getByText(/Team Name Card for captain1/i)).toBeInTheDocument();
    });
  });

  describe('Role-Based Access', () => {
    test('player role shows only password tab', () => {
      render(<Profile user={createMockUser({ role: 'player' })} />);

      const tabs = screen.getAllByRole('button');
      expect(tabs).toHaveLength(1);
      expect(tabs[0]).toHaveTextContent(/Password/i);
    });

    test('team_captain role shows all three tabs', () => {
      render(<Profile user={createMockUser({ role: 'team_captain' })} />);

      const tabs = screen.getAllByRole('button');
      expect(tabs).toHaveLength(3);
    });

    test('game_admin role shows only password tab', () => {
      render(<Profile user={createMockUser({ role: 'game_admin' })} />);

      const tabs = screen.getAllByRole('button');
      expect(tabs).toHaveLength(1);
    });

    test('admin role shows only password tab', () => {
      render(<Profile user={mockAdmin} />);

      const tabs = screen.getAllByRole('button');
      expect(tabs).toHaveLength(1);
    });
  });

  describe('Accessibility', () => {
    test('tab buttons have accessible labels', () => {
      render(<Profile user={mockCaptain} />);

      expect(screen.getByRole('button', { name: /Switch to.*Password/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Switch to.*Team Settings/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Switch to.*Game Rating/i })).toBeInTheDocument();
    });

    test('keyboard navigation works for tabs', () => {
      render(<Profile user={mockCaptain} />);

      const passwordTab = screen.getByRole('button', { name: /Switch to.*Password/i });
      const teamSettingsTab = screen.getByRole('button', { name: /Switch to.*Team Settings/i });

      passwordTab.focus();
      expect(passwordTab).toHaveFocus();

      teamSettingsTab.focus();
      expect(teamSettingsTab).toHaveFocus();
    });
  });

  describe('Edge Cases', () => {
    test('handles user with all optional fields present', () => {
      const fullUser = createMockUser({
        role: 'team_captain',
        display_name: 'Test Captain',
        email: 'captain@test.com',
        team_id: 5,
        team_name: 'Dream Team'
      });

      render(<Profile user={fullUser} />);

      expect(screen.getByText(/PROFILE/i)).toBeInTheDocument();
    });

    test('handles user with minimal required fields', () => {
      const minimalUser = {
        id: 1,
        username: 'minimal',
        role: 'player',
        email: 'minimal@test.com'
      };

      render(<Profile user={minimalUser} />);

      expect(screen.getByText(/PROFILE/i)).toBeInTheDocument();
      expect(screen.getByTestId('password-change-card')).toBeInTheDocument();
    });

    test('handles rapid tab switching', () => {
      render(<Profile user={mockCaptain} />);

      const passwordTab = screen.getByRole('button', { name: /Switch to.*Password/i });
      const teamSettingsTab = screen.getByRole('button', { name: /Switch to.*Team Settings/i });
      const gameRatingTab = screen.getByRole('button', { name: /Switch to.*Game Rating/i });

      // Rapidly switch tabs
      for (let i = 0; i < 5; i++) {
        fireEvent.click(teamSettingsTab);
        fireEvent.click(gameRatingTab);
        fireEvent.click(passwordTab);
      }

      // Should still work correctly
      expect(screen.getByTestId('password-change-card')).toBeInTheDocument();
    });
  });

  describe('Component Structure', () => {
    test('has correct CSS classes', () => {
      const { container } = render(<Profile user={mockUser} />);

      expect(container.querySelector('.profile')).toBeInTheDocument();
      expect(container.querySelector('.profile-card-container')).toBeInTheDocument();
      expect(container.querySelector('.card-header')).toBeInTheDocument();
      expect(container.querySelector('.card-body')).toBeInTheDocument();
    });

    test('renders profile tabs container', () => {
      const { container } = render(<Profile user={mockCaptain} />);

      expect(container.querySelector('.profile-tabs')).toBeInTheDocument();
    });

    test('renders profile content container', () => {
      const { container } = render(<Profile user={mockUser} />);

      expect(container.querySelector('.profile-content')).toBeInTheDocument();
    });
  });
});
