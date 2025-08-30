/**
 * Component: Header
 * Purpose: Application header with logo, title, user info and logout
 * Part of: Easter Quest 2025 Frontend Dashboard
 */

import React from 'react';
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
            <div class="header-actions">
                <div className="user-info">
                    <div className="user-avatar">
                        {(user.display_name || user.username || 'U').substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                        <div className="user-name">
                            {user.display_name || user.username}
                        </div>
                        <div className="user-role">
                            {user.role}
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

export default Header;