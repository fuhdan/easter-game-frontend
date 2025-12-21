/**
 * Module: TeamManagement.test.jsx
 * Purpose: Tests for TeamManagement component
 * Part of: Easter Quest Frontend Testing
 *
 * @since 2025-12-20
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import TeamManagement from '../../../src/components/TeamManagement/TeamManagement';

// Mock child components
jest.mock('../../../src/components/TeamManagement/PlayerManagementTab', () => {
  return function MockPlayerManagementTab() {
    return <div data-testid="player-management-tab">Player Management Tab</div>;
  };
});

jest.mock('../../../src/components/TeamManagement/TeamCreationTab', () => {
  return function MockTeamCreationTab() {
    return <div data-testid="team-creation-tab">Team Creation Tab</div>;
  };
});

jest.mock('../../../src/components/TeamManagement/TeamsTab', () => {
  return function MockTeamsTab() {
    return <div data-testid="teams-tab">Teams Tab</div>;
  };
});

jest.mock('../../../src/components/TeamManagement/ActivationCodesTab', () => {
  return function MockActivationCodesTab() {
    return <div data-testid="activation-codes-tab">Activation Codes Tab</div>;
  };
});

describe('TeamManagement Component', () => {
  const mockAdmin = { id: 1, username: 'admin', role: 'admin' };
  const mockGameAdmin = { id: 2, username: 'gameadmin', role: 'game_admin' };
  const mockCaptain = { id: 3, username: 'captain', role: 'team_captain', team_id: 1, team_name: 'Team Alpha' };

  describe('Rendering', () => {
    test('renders component header', () => {
      render(<TeamManagement user={mockAdmin} />);

      expect(screen.getByText(/TEAM MANAGEMENT/i)).toBeInTheDocument();
    });
  });

  describe('Tab Navigation - Admin Role', () => {
    test('admin sees all four tabs', () => {
      render(<TeamManagement user={mockAdmin} />);

      expect(screen.getByRole('button', { name: /Switch to.*Player Management/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Switch to.*Team Creation/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Switch to.*Teams/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Switch to.*Activation Codes/i })).toBeInTheDocument();
    });

    test('admin defaults to player management tab', () => {
      render(<TeamManagement user={mockAdmin} />);

      expect(screen.getByTestId('player-management-tab')).toBeInTheDocument();
    });

    test('admin can switch to team creation tab', () => {
      render(<TeamManagement user={mockAdmin} />);

      const teamCreationTab = screen.getByRole('button', { name: /Switch to.*Team Creation/i });
      fireEvent.click(teamCreationTab);

      expect(screen.getByTestId('team-creation-tab')).toBeInTheDocument();
    });

    test('admin can switch to teams tab', () => {
      render(<TeamManagement user={mockAdmin} />);

      const teamsTab = screen.getByRole('button', { name: /Switch to.*Teams/i });
      fireEvent.click(teamsTab);

      expect(screen.getByTestId('teams-tab')).toBeInTheDocument();
    });

    test('admin can switch to activation codes tab', () => {
      render(<TeamManagement user={mockAdmin} />);

      const activationCodesTab = screen.getByRole('button', { name: /Switch to.*Activation Codes/i });
      fireEvent.click(activationCodesTab);

      expect(screen.getByTestId('activation-codes-tab')).toBeInTheDocument();
    });
  });

  describe('Tab Navigation - Game Admin Role', () => {
    test('game_admin sees teams and activation codes tabs only', () => {
      render(<TeamManagement user={mockGameAdmin} />);

      expect(screen.queryByRole('button', { name: /Switch to.*Player Management/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Switch to.*Team Creation/i })).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Switch to.*Teams/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Switch to.*Activation Codes/i })).toBeInTheDocument();
    });

    test('game_admin defaults to teams tab', () => {
      render(<TeamManagement user={mockGameAdmin} />);

      expect(screen.getByTestId('teams-tab')).toBeInTheDocument();
    });
  });

  describe('Tab Navigation - Team Captain Role', () => {
    test('team_captain sees teams and activation codes tabs only', () => {
      render(<TeamManagement user={mockCaptain} />);

      expect(screen.queryByRole('button', { name: /Switch to.*Player Management/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Switch to.*Team Creation/i })).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Switch to.*Teams/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Switch to.*Activation Codes/i })).toBeInTheDocument();
    });

    test('team_captain defaults to teams tab', () => {
      render(<TeamManagement user={mockCaptain} />);

      expect(screen.getByTestId('teams-tab')).toBeInTheDocument();
    });
  });

  describe('Tab Switching', () => {
    test('active tab has active class', () => {
      render(<TeamManagement user={mockAdmin} />);

      const playerManagementTab = screen.getByRole('button', { name: /Switch to.*Player Management/i });
      expect(playerManagementTab).toHaveClass('active');
    });

    test('clicking tab changes content', () => {
      render(<TeamManagement user={mockAdmin} />);

      expect(screen.getByTestId('player-management-tab')).toBeInTheDocument();

      const teamsTab = screen.getByRole('button', { name: /Switch to.*Teams/i });
      fireEvent.click(teamsTab);

      expect(screen.queryByTestId('player-management-tab')).not.toBeInTheDocument();
      expect(screen.getByTestId('teams-tab')).toBeInTheDocument();
    });

    test('can switch between all tabs multiple times', () => {
      render(<TeamManagement user={mockAdmin} />);

      const playerManagementTab = screen.getByRole('button', { name: /Switch to.*Player Management/i });
      const teamCreationTab = screen.getByRole('button', { name: /Switch to.*Team Creation/i });
      const teamsTab = screen.getByRole('button', { name: /Switch to.*Teams/i });
      const activationCodesTab = screen.getByRole('button', { name: /Switch to.*Activation Codes/i });

      fireEvent.click(teamCreationTab);
      expect(screen.getByTestId('team-creation-tab')).toBeInTheDocument();

      fireEvent.click(teamsTab);
      expect(screen.getByTestId('teams-tab')).toBeInTheDocument();

      fireEvent.click(activationCodesTab);
      expect(screen.getByTestId('activation-codes-tab')).toBeInTheDocument();

      fireEvent.click(playerManagementTab);
      expect(screen.getByTestId('player-management-tab')).toBeInTheDocument();
    });
  });

  describe('Tab Order', () => {
    test('admin tabs appear in correct order', () => {
      render(<TeamManagement user={mockAdmin} />);

      const tabs = screen.getAllByRole('button');
      expect(tabs[0]).toHaveTextContent(/Player Management/i);
      expect(tabs[1]).toHaveTextContent(/Team Creation/i);
      expect(tabs[2]).toHaveTextContent(/Teams/i);
      expect(tabs[3]).toHaveTextContent(/Activation Codes/i);
    });

    test('game_admin tabs appear in correct order', () => {
      render(<TeamManagement user={mockGameAdmin} />);

      const tabs = screen.getAllByRole('button');
      expect(tabs[0]).toHaveTextContent(/Teams/i);
      expect(tabs[1]).toHaveTextContent(/Activation Codes/i);
    });

    test('team_captain tabs appear in correct order', () => {
      render(<TeamManagement user={mockCaptain} />);

      const tabs = screen.getAllByRole('button');
      expect(tabs[0]).toHaveTextContent(/Teams/i);
      expect(tabs[1]).toHaveTextContent(/Activation Codes/i);
    });
  });

  describe('User Prop Handling', () => {
    test('handles user with minimal required fields', () => {
      const minimalUser = { id: 1, username: 'user', role: 'admin' };
      render(<TeamManagement user={minimalUser} />);

      expect(screen.getByText(/TEAM MANAGEMENT/i)).toBeInTheDocument();
    });

    test('handles team captain with team info', () => {
      const captainWithTeam = {
        id: 1,
        username: 'captain',
        role: 'team_captain',
        team_id: 5,
        team_name: 'Dream Team'
      };
      render(<TeamManagement user={captainWithTeam} />);

      expect(screen.getByTestId('teams-tab')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('tab buttons have accessible labels', () => {
      render(<TeamManagement user={mockAdmin} />);

      expect(screen.getByRole('button', { name: /Switch to.*Player Management/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Switch to.*Team Creation/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Switch to.*Teams/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Switch to.*Activation Codes/i })).toBeInTheDocument();
    });

    test('keyboard navigation works for tabs', () => {
      render(<TeamManagement user={mockAdmin} />);

      const firstTab = screen.getByRole('button', { name: /Switch to.*Player Management/i });
      const secondTab = screen.getByRole('button', { name: /Switch to.*Team Creation/i });

      firstTab.focus();
      expect(firstTab).toHaveFocus();

      secondTab.focus();
      expect(secondTab).toHaveFocus();
    });
  });

  describe('Component Structure', () => {
    test('has correct CSS classes', () => {
      const { container } = render(<TeamManagement user={mockAdmin} />);

      expect(container.querySelector('.team-management-dashboard')).toBeInTheDocument();
      expect(container.querySelector('.team-management-card-container')).toBeInTheDocument();
      expect(container.querySelector('.card-header')).toBeInTheDocument();
      expect(container.querySelector('.card-body')).toBeInTheDocument();
    });

    test('renders tab navigation container', () => {
      const { container } = render(<TeamManagement user={mockAdmin} />);

      expect(container.querySelector('.team-management-tabs')).toBeInTheDocument();
    });

    test('renders dashboard content container', () => {
      const { container } = render(<TeamManagement user={mockAdmin} />);

      expect(container.querySelector('.dashboard-content')).toBeInTheDocument();
    });
  });
});
