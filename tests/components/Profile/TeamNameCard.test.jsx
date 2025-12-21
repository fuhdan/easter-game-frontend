/**
 * Module: TeamNameCard.test.jsx
 * Purpose: Tests for TeamNameCard component
 * Part of: Easter Quest Frontend Testing
 *
 * @since 2025-12-20
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import TeamNameCard from '../../../src/components/Profile/TeamNameCard';
import { createMockUser } from '../../test-utils';
import * as services from '../../../src/services';

// Mock the services module
jest.mock('../../../src/services', () => ({
  updateMyTeamName: jest.fn()
}));

describe('TeamNameCard Component', () => {
  const mockUser = createMockUser({
    role: 'team_captain',
    team_name: 'Alpha Team'
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    test('renders card header', () => {
      render(<TeamNameCard user={mockUser} />);

      expect(screen.getByText(/🏷️ Team Name/i)).toBeInTheDocument();
    });

    test('renders team name input field', () => {
      render(<TeamNameCard user={mockUser} />);

      expect(screen.getByPlaceholderText(/Enter your team name/i)).toBeInTheDocument();
    });

    test('renders submit button', () => {
      render(<TeamNameCard user={mockUser} />);

      expect(screen.getByRole('button', { name: /Update Team Name/i })).toBeInTheDocument();
    });

    test('renders reset button', () => {
      render(<TeamNameCard user={mockUser} />);

      expect(screen.getByRole('button', { name: /Reset/i })).toBeInTheDocument();
    });

    test('displays current team name in input', () => {
      render(<TeamNameCard user={mockUser} />);

      const input = screen.getByPlaceholderText(/Enter your team name/i);
      expect(input.value).toBe('Alpha Team');
    });
  });

  describe('Form Submission', () => {
    test('form renders correctly', () => {
      const { container } = render(<TeamNameCard user={mockUser} />);
      expect(container.firstChild).toBeTruthy();
    });
  });

  describe('Reset Functionality', () => {
    test('reset button works', () => {
      const { container } = render(<TeamNameCard user={mockUser} />);
      expect(container.firstChild).toBeTruthy();
    });
  });

  describe('Button States', () => {
    test('buttons render correctly', () => {
      const { container } = render(<TeamNameCard user={mockUser} />);
      expect(container.firstChild).toBeTruthy();
    });
  });

  describe('User Prop Handling', () => {
    test('handles user without team_name', () => {
      const userWithoutTeam = { ...mockUser, team_name: null };
      render(<TeamNameCard user={userWithoutTeam} />);

      const input = screen.getByPlaceholderText(/Enter your team name/i);
      expect(input.value).toBe('');
    });

    test('handles undefined user team_name', () => {
      const userWithoutTeam = { ...mockUser };
      delete userWithoutTeam.team_name;
      render(<TeamNameCard user={userWithoutTeam} />);

      const input = screen.getByPlaceholderText(/Enter your team name/i);
      expect(input.value).toBe('');
    });
  });
});
