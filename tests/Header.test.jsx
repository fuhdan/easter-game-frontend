/**
 * Test Suite: Header Component
 * Purpose: Unit and integration tests for the Header component
 * Part of: Easter Quest Frontend Testing
 *
 * Tests cover:
 * - Component rendering
 * - Props validation
 * - User interaction (logout button click)
 * - Conditional rendering based on user data
 * - Accessibility
 *
 * @since 2025-12-18
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Header from '../src/components/Header/Header';

// Mock data for tests
const mockUser = {
  username: 'testuser',
  display_name: 'Test User',
  team_name: 'Team Alpha',
  role: 'player'
};

const mockAdminUser = {
  username: 'admin',
  display_name: 'Admin User',
  role: 'admin'
};

describe('Header Component', () => {

  // Test 1: Component renders without crashing
  test('renders Header component', () => {
    const mockLogout = jest.fn();
    render(<Header user={mockUser} onLogout={mockLogout} />);

    // Check if main element is present
    expect(screen.getByText('Easter Quest 2026')).toBeInTheDocument();
  });

  // Test 2: Displays user information correctly
  test('displays user name and role', () => {
    const mockLogout = jest.fn();
    render(<Header user={mockUser} onLogout={mockLogout} />);

    // Check user display name
    expect(screen.getByText('Test User')).toBeInTheDocument();

    // Check formatted role (should be "Player")
    expect(screen.getByText('Player')).toBeInTheDocument();
  });

  // Test 3: Displays username when display_name is not available
  test('displays username when display_name is missing', () => {
    const userWithoutDisplayName = {
      username: 'johndoe',
      role: 'player'
    };
    const mockLogout = jest.fn();

    render(<Header user={userWithoutDisplayName} onLogout={mockLogout} />);

    expect(screen.getByText('johndoe')).toBeInTheDocument();
  });

  // Test 4: Formats role correctly
  test('formats user role with proper capitalization', () => {
    const mockLogout = jest.fn();
    render(<Header user={mockAdminUser} onLogout={mockLogout} />);

    // "admin" should be displayed as "Admin"
    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  // Test 5: Logout button is present
  test('renders logout button', () => {
    const mockLogout = jest.fn();
    render(<Header user={mockUser} onLogout={mockLogout} />);

    const logoutButton = screen.getByRole('button', { name: /logout/i });
    expect(logoutButton).toBeInTheDocument();
  });

  // Test 6: Logout button calls onLogout function when clicked
  test('calls onLogout when logout button is clicked', () => {
    const mockLogout = jest.fn();
    render(<Header user={mockUser} onLogout={mockLogout} />);

    const logoutButton = screen.getByRole('button', { name: /logout/i });
    fireEvent.click(logoutButton);

    // Verify onLogout was called exactly once
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  // Test 7: User avatar displays correct initials
  test('displays correct user avatar initials', () => {
    const mockLogout = jest.fn();
    const { container } = render(<Header user={mockUser} onLogout={mockLogout} />);

    const avatar = container.querySelector('.user-avatar');
    // Should display first 2 characters of display_name
    expect(avatar.textContent).toBe('TE');
  });

  // Test 8: User avatar uses username if display_name is not available
  test('uses username for avatar when display_name is missing', () => {
    const userWithoutDisplayName = {
      username: 'johndoe',
      role: 'player'
    };
    const mockLogout = jest.fn();
    const { container } = render(<Header user={userWithoutDisplayName} onLogout={mockLogout} />);

    const avatar = container.querySelector('.user-avatar');
    expect(avatar.textContent).toBe('JO');
  });

  // Test 9: Branding text is correct
  test('displays correct branding text', () => {
    const mockLogout = jest.fn();
    render(<Header user={mockUser} onLogout={mockLogout} />);

    expect(screen.getByText('Easter Quest 2026')).toBeInTheDocument();
    expect(screen.getByText('Ypsomed Easter Challenge 2026')).toBeInTheDocument();
  });

  // Test 10: Accessibility - logout button is keyboard accessible
  test('logout button is keyboard accessible', () => {
    const mockLogout = jest.fn();
    render(<Header user={mockUser} onLogout={mockLogout} />);

    const logoutButton = screen.getByRole('button', { name: /logout/i });

    // Tab to button and press Enter
    logoutButton.focus();
    expect(logoutButton).toHaveFocus();

    fireEvent.keyDown(logoutButton, { key: 'Enter', code: 'Enter' });
    // Button should still be clickable via keyboard
    expect(logoutButton).toBeEnabled();
  });

  // Test 11: Component has correct CSS classes
  test('renders with correct CSS classes', () => {
    const mockLogout = jest.fn();
    const { container } = render(<Header user={mockUser} onLogout={mockLogout} />);

    expect(container.querySelector('.dashboard-header')).toBeInTheDocument();
    expect(container.querySelector('.dashboard-logo')).toBeInTheDocument();
    expect(container.querySelector('.user-info')).toBeInTheDocument();
    expect(container.querySelector('.logout-btn')).toBeInTheDocument();
  });

  // Test 12: Handles user with underscored role correctly
  test('formats underscored role name correctly', () => {
    const userWithUnderscoredRole = {
      username: 'gamemaster',
      role: 'game_admin'
    };
    const mockLogout = jest.fn();

    render(<Header user={userWithUnderscoredRole} onLogout={mockLogout} />);

    // "game_admin" should be displayed as "Game Admin"
    expect(screen.getByText('Game Admin')).toBeInTheDocument();
  });

  // Test 13: Snapshot test (ensures component structure doesn't change unexpectedly)
  test('matches snapshot', () => {
    const mockLogout = jest.fn();
    const { container } = render(<Header user={mockUser} onLogout={mockLogout} />);

    expect(container.firstChild).toMatchSnapshot();
  });

});
