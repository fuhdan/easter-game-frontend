/**
 * Component: Header
 * Purpose: Application header with branding and user controls
 * Part of: Easter Quest Frontend
 *
 * Features:
 * - Ypsomed logo display
 * - Easter Quest branding
 * - User info display (username, team, role)
 * - Logout button
 * - Responsive layout
 *
 * @since 2025-08-27
 */

import React from 'react';
import PropTypes from 'prop-types';
import './Header.css';

/**
 * Dashboard header component.
 * @param {Object} props
 * @param {Object} props.user - Current authenticated user
 * @param {Function} props.onLogout - Logout handler function
 * @returns {JSX.Element}
 */
const Header = ({ user, onLogout }) => {
    return (
        <div className="dashboard-header">
            <div className="dashboard-logo">
                <div className="ypsomed-logo">
                    <img src="/assets/ypsomed-logo.png" alt="Ypsomed Logo" />
                </div>
                <div className="dashboard-title">
                    <h1>Easter Quest 2026</h1>
                    <p>Ypsomed Easter Challenge 2026</p>
                </div>
            </div>
            <div className="header-actions">
                <div className="user-info">
                    <div className="user-avatar">
                        {(user.display_name || user.username || 'U').substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                        <div className="user-name">
                            {user.display_name || user.username}
                        </div>
                        <div className="user-role">
                            {user.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </div>
                    </div>
                </div>
                <button onClick={onLogout} className="logout-btn">
                    Logout
                </button>
            </div> 
        </div>
    );
};

/**
 * PropTypes validation for Header component
 */
Header.propTypes = {
    user: PropTypes.shape({
        username: PropTypes.string.isRequired,
        team_name: PropTypes.string,
        role: PropTypes.string.isRequired
    }).isRequired,
    onLogout: PropTypes.func.isRequired
};

export default Header;