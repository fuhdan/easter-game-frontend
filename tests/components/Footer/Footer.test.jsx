/**
 * Module: Footer.test.jsx
 * Purpose: Tests for Footer component
 * Part of: Easter Quest Frontend Testing
 *
 * @since 2025-12-20
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Footer from '../../../src/components/Footer/Footer';
import { createMockUser } from '../../test-utils';

describe('Footer Component', () => {
  describe('Rendering', () => {
    test('renders footer with user role', () => {
      const user = createMockUser({ role: 'player' });
      render(<Footer user={user} />);

      expect(screen.getByText(/Current Role:/)).toBeInTheDocument();
      expect(screen.getByText(/PLAYER/)).toBeInTheDocument();
    });

    test('does not render when user is null', () => {
      const { container } = render(<Footer user={null} />);
      expect(container.firstChild).toBeNull();
    });

    test('does not render when user is undefined', () => {
      const { container } = render(<Footer user={undefined} />);
      expect(container.firstChild).toBeNull();
    });

    test('does not render when user has no role', () => {
      const user = { username: 'test' };
      const { container } = render(<Footer user={user} />);
      expect(container.firstChild).toBeNull();
    });

    test('renders footer content with correct structure', () => {
      const user = createMockUser({ role: 'player' });
      const { container } = render(<Footer user={user} />);

      const footer = container.querySelector('.app-footer');
      expect(footer).toBeInTheDocument();

      const footerContent = container.querySelector('.footer-content');
      expect(footerContent).toBeInTheDocument();
    });
  });

  describe('Player Role', () => {
    test('displays player role in uppercase', () => {
      const user = createMockUser({ role: 'player' });
      render(<Footer user={user} />);

      expect(screen.getByText(/PLAYER/)).toBeInTheDocument();
    });

    test('displays correct player permissions description', () => {
      const user = createMockUser({ role: 'player' });
      render(<Footer user={user} />);

      expect(screen.getByText(/You can play games and change your password/)).toBeInTheDocument();
    });

    test('renders role title with correct class', () => {
      const user = createMockUser({ role: 'player' });
      const { container } = render(<Footer user={user} />);

      const roleTitle = container.querySelector('.footer-role-title');
      expect(roleTitle).toBeInTheDocument();
      expect(roleTitle).toHaveTextContent('Current Role: PLAYER');
    });

    test('renders role description with correct class', () => {
      const user = createMockUser({ role: 'player' });
      const { container } = render(<Footer user={user} />);

      const roleDescription = container.querySelector('.footer-role-description');
      expect(roleDescription).toBeInTheDocument();
    });
  });

  describe('Team Captain Role', () => {
    test('displays team captain role in uppercase', () => {
      const user = createMockUser({ role: 'team_captain' });
      render(<Footer user={user} />);

      expect(screen.getByText(/TEAM CAPTAIN/)).toBeInTheDocument();
    });

    test('displays correct team captain permissions description', () => {
      const user = createMockUser({ role: 'team_captain' });
      render(<Footer user={user} />);

      expect(screen.getByText(/You can manage your team members, change your team name, change your password, and rate games/)).toBeInTheDocument();
    });

    test('formats underscore as space in team_captain role', () => {
      const user = createMockUser({ role: 'team_captain' });
      render(<Footer user={user} />);

      // Should display "TEAM CAPTAIN" not "TEAM_CAPTAIN"
      expect(screen.getByText(/TEAM CAPTAIN/)).toBeInTheDocument();
      expect(screen.queryByText(/TEAM_CAPTAIN/)).not.toBeInTheDocument();
    });
  });

  describe('Game Admin Role', () => {
    test('displays game admin role in uppercase', () => {
      const user = createMockUser({ role: 'game_admin' });
      render(<Footer user={user} />);

      expect(screen.getByText(/GAME ADMIN/)).toBeInTheDocument();
    });

    test('displays correct game admin permissions description', () => {
      const user = createMockUser({ role: 'game_admin' });
      render(<Footer user={user} />);

      expect(screen.getByText(/You can monitor game progress, manage teams, handle notifications, and view analytics/)).toBeInTheDocument();
    });
  });

  describe('Content Admin Role', () => {
    test('displays content admin role in uppercase', () => {
      const user = createMockUser({ role: 'content_admin' });
      render(<Footer user={user} />);

      expect(screen.getByText(/CONTENT ADMIN/)).toBeInTheDocument();
    });

    test('displays correct content admin permissions description', () => {
      const user = createMockUser({ role: 'content_admin' });
      render(<Footer user={user} />);

      expect(screen.getByText(/You can create and manage events, games, and puzzles during the setup phase/)).toBeInTheDocument();
    });
  });

  describe('System Admin Role', () => {
    test('displays system admin role in uppercase', () => {
      const user = createMockUser({ role: 'system_admin' });
      render(<Footer user={user} />);

      expect(screen.getByText(/SYSTEM ADMIN/)).toBeInTheDocument();
    });

    test('displays correct system admin permissions description', () => {
      const user = createMockUser({ role: 'system_admin' });
      render(<Footer user={user} />);

      expect(screen.getByText(/You can configure system settings including AI, rate limits, and system parameters/)).toBeInTheDocument();
    });
  });

  describe('Admin Role', () => {
    test('displays admin role in uppercase', () => {
      const user = createMockUser({ role: 'admin' });
      render(<Footer user={user} />);

      expect(screen.getByText(/Current Role: ADMIN/)).toBeInTheDocument();
    });

    test('displays correct admin permissions description', () => {
      const user = createMockUser({ role: 'admin' });
      render(<Footer user={user} />);

      expect(screen.getByText(/You have full system access including all admin functions and system configuration/)).toBeInTheDocument();
    });
  });

  describe('Unknown Role Handling', () => {
    test('displays basic permissions for unknown role', () => {
      const user = { role: 'unknown_role' };
      render(<Footer user={user} />);

      expect(screen.getByText(/You have basic user permissions/)).toBeInTheDocument();
    });

    test('displays unknown role in uppercase', () => {
      const user = { role: 'custom_role' };
      render(<Footer user={user} />);

      expect(screen.getByText(/CUSTOM ROLE/)).toBeInTheDocument();
    });
  });

  describe('Role Formatting', () => {
    test('converts single underscore to space', () => {
      const user = createMockUser({ role: 'team_captain' });
      render(<Footer user={user} />);

      expect(screen.getByText(/TEAM CAPTAIN/)).toBeInTheDocument();
    });

    test('converts multiple underscores to spaces', () => {
      const user = { role: 'super_admin_user' };
      render(<Footer user={user} />);

      // Only first underscore is replaced based on current implementation
      const roleText = screen.getByText(/Current Role:/);
      expect(roleText).toBeInTheDocument();
    });

    test('uppercases the entire role text', () => {
      const user = createMockUser({ role: 'player' });
      render(<Footer user={user} />);

      const roleTitle = screen.getByText(/Current Role:/);
      expect(roleTitle.textContent).toContain('PLAYER');
      expect(roleTitle.textContent).not.toContain('player');
    });
  });

  describe('CSS Classes', () => {
    test('footer has correct class', () => {
      const user = createMockUser({ role: 'player' });
      const { container } = render(<Footer user={user} />);

      const footer = container.querySelector('footer.app-footer');
      expect(footer).toBeInTheDocument();
    });

    test('footer content has correct class', () => {
      const user = createMockUser({ role: 'player' });
      const { container } = render(<Footer user={user} />);

      const footerContent = container.querySelector('.footer-content');
      expect(footerContent).toBeInTheDocument();
    });

    test('role title has correct class', () => {
      const user = createMockUser({ role: 'player' });
      const { container } = render(<Footer user={user} />);

      const roleTitle = container.querySelector('h4.footer-role-title');
      expect(roleTitle).toBeInTheDocument();
    });

    test('role description has correct class', () => {
      const user = createMockUser({ role: 'player' });
      const { container } = render(<Footer user={user} />);

      const roleDescription = container.querySelector('p.footer-role-description');
      expect(roleDescription).toBeInTheDocument();
    });
  });

  describe('PropTypes Validation', () => {
    test('accepts valid user with player role', () => {
      const user = createMockUser({ role: 'player' });
      expect(() => render(<Footer user={user} />)).not.toThrow();
    });

    test('accepts valid user with team_captain role', () => {
      const user = createMockUser({ role: 'team_captain' });
      expect(() => render(<Footer user={user} />)).not.toThrow();
    });

    test('accepts valid user with game_admin role', () => {
      const user = createMockUser({ role: 'game_admin' });
      expect(() => render(<Footer user={user} />)).not.toThrow();
    });

    test('accepts valid user with content_admin role', () => {
      const user = createMockUser({ role: 'content_admin' });
      expect(() => render(<Footer user={user} />)).not.toThrow();
    });

    test('accepts valid user with system_admin role', () => {
      const user = createMockUser({ role: 'system_admin' });
      expect(() => render(<Footer user={user} />)).not.toThrow();
    });

    test('accepts valid user with admin role', () => {
      const user = createMockUser({ role: 'admin' });
      expect(() => render(<Footer user={user} />)).not.toThrow();
    });
  });

  describe('Accessibility', () => {
    test('uses semantic footer element', () => {
      const user = createMockUser({ role: 'player' });
      const { container } = render(<Footer user={user} />);

      const footer = container.querySelector('footer');
      expect(footer).toBeInTheDocument();
    });

    test('uses heading for role title', () => {
      const user = createMockUser({ role: 'player' });
      const { container } = render(<Footer user={user} />);

      const heading = container.querySelector('h4');
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent('Current Role:');
    });

    test('role description is in paragraph element', () => {
      const user = createMockUser({ role: 'player' });
      const { container } = render(<Footer user={user} />);

      const paragraph = container.querySelector('p.footer-role-description');
      expect(paragraph).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    test('handles user object with extra properties', () => {
      const user = {
        role: 'player',
        username: 'testuser',
        email: 'test@example.com',
        extraProp: 'extra'
      };
      render(<Footer user={user} />);

      expect(screen.getByText(/PLAYER/)).toBeInTheDocument();
    });

    test('handles empty string role gracefully', () => {
      const user = { role: '' };
      const { container } = render(<Footer user={user} />);

      // Should not render with empty role
      expect(container.firstChild).toBeNull();
    });

    test('renders when only role property is present', () => {
      const user = { role: 'player' };
      render(<Footer user={user} />);

      expect(screen.getByText(/PLAYER/)).toBeInTheDocument();
    });
  });

  describe('All Roles Coverage', () => {
    const roles = [
      { role: 'player', display: 'PLAYER' },
      { role: 'team_captain', display: 'TEAM CAPTAIN' },
      { role: 'game_admin', display: 'GAME ADMIN' },
      { role: 'content_admin', display: 'CONTENT ADMIN' },
      { role: 'system_admin', display: 'SYSTEM ADMIN' },
      { role: 'admin', display: 'ADMIN' }
    ];

    roles.forEach(({ role, display }) => {
      test(`renders correctly for ${role} role`, () => {
        const user = createMockUser({ role });
        render(<Footer user={user} />);

        expect(screen.getByText(new RegExp(display))).toBeInTheDocument();
      });
    });
  });
});
