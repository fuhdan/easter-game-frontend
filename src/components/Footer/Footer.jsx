/**
 * Component: Footer
 * Purpose: Role-based footer displaying current user role and permissions
 * Part of: Easter Quest - Ypsomed AG Easter Challenge Frontend
 *
 * Features:
 * - Displays current role in uppercase
 * - Shows role-specific permission description
 * - Consistent styling across all pages
 * - Appears at bottom of all authenticated pages
 *
 * Supported roles:
 * - admin: Full system access
 * - content_admin: Event/game creation (pre-event setup)
 * - system_admin: System configuration only
 * - game_admin: Service desk during event
 * - team_captain: Team management
 * - player: Game participant
 *
 * @module components/Footer
 * @since 2025-11-23
 * @updated 2025-12-07 - Added content_admin and system_admin roles
 */

import React from 'react';
import PropTypes from 'prop-types';
import './Footer.css';

/**
 * Footer component - Displays current user role and permissions
 *
 * Shows role-appropriate information based on user's role:
 * - Player: Basic password change permissions
 * - Team Captain: Team management, password, and game rating permissions
 * - Game Admin: Team member management and password change permissions
 * - Admin: Full system access including game admin and config management
 *
 * @param {Object} props - Component props
 * @param {Object} props.user - Current authenticated user object
 * @param {string} props.user.role - User role (player/team_captain/game_admin/admin)
 * @returns {JSX.Element} Footer with role information
 *
 * @example
 * <Footer user={currentUser} />
 */
const Footer = ({ user }) => {
    // Don't render footer if user is not available
    if (!user || !user.role) {
        return null;
    }

    /**
     * Get role-specific description text
     *
     * @param {string} role - User role
     * @returns {string} Description of role permissions
     */
    const getRoleDescription = (role) => {
        switch (role) {
            case 'player':
                return 'You can play games and change your password.';
            case 'team_captain':
                return 'You can manage your team members, change your team name, change your password, and rate games.';
            case 'game_admin':
                return 'You can monitor game progress, manage teams, handle notifications, and view analytics.';
            case 'content_admin':
                return 'You can create and manage events, games, and puzzles during the setup phase.';
            case 'system_admin':
                return 'You can configure system settings including AI, rate limits, and system parameters.';
            case 'admin':
                return 'You have full system access including all admin functions and system configuration.';
            default:
                return 'You have basic user permissions.';
        }
    };

    return (
        <footer className="app-footer">
            <div className="footer-content">
                <h4 className="footer-role-title">
                    Current Role: {user.role.replace('_', ' ').toUpperCase()}
                </h4>
                <p className="footer-role-description">
                    {getRoleDescription(user.role)}
                </p>
            </div>
        </footer>
    );
};

/**
 * PropTypes validation for Footer component
 * Validates user prop structure and required fields
 */
Footer.propTypes = {
    user: PropTypes.shape({
        role: PropTypes.oneOf(['player', 'team_captain', 'game_admin', 'content_admin', 'system_admin', 'admin']).isRequired
    }).isRequired
};

export default Footer;
