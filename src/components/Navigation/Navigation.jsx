/**
 * Component: Navigation
 * Purpose: Tab-based navigation for dashboard sections
 * Part of: Easter Quest Frontend
 *
 * Features:
 * - Role-based tab visibility
 * - System Admin Dashboard (admin, content_admin, system_admin)
 * - Game Admin Dashboard (game_admin + admin)
 * - Notifications (game_admin + admin)
 * - Team Management (admin + game_admin + team_captain)
 * - Game Panel (team_captain + player)
 * - Profile (all users)
 * - Active tab highlighting
 *
 * @since 2025-08-27
 * @updated 2025-11-23 - Renamed Team Creation to Team Management
 * @updated 2025-12-07 - Added content_admin and system_admin roles
 */

import React from 'react';
import { logger } from '../../utils/logger';
import './Navigation.css';

/**
 * Dashboard navigation tabs.
 * @param {Object} props
 * @param {string} props.activeTab - Currently active tab
 * @param {Function} props.onTabChange - Tab change handler
 * @returns {JSX.Element}
 */
const Navigation = ({ activeTab, onTabChange, user }) => {
    const tabs = [
        { id: 'system_admin', label: '⚙️ System Admin Dashboard' },
        { id: 'dashboard', label: '📊 Game Admin Dashboard' },
        { id: 'notifications', label: '🔔 Notifications' },
        { id: 'team_management', label: '👥 Team Management' },
        { id: 'game', label: '🎮 Game Panel' },
        { id: 'profile', label: '👤 Profile' }
    ];

    /**
     * Handle tab change with logging
     */
    const handleTabChange = (newTab) => {
        logger.info('navigation_tab_changed', {
            previousTab: activeTab,
            newTab,
            userRole: user.role,
            module: 'Navigation'
        });
        onTabChange(newTab);
    };

    return (
        <nav className="nav-tabs">

            {/* ✅ Show System Admin Dashboard for admin, content_admin, system_admin */}
            {(user.role === 'admin' || user.role === 'content_admin' || user.role === 'system_admin') && (
                <button
                    className={`nav-tab ${activeTab === 'system_admin' ? 'active' : ''}`}
                    onClick={() => handleTabChange('system_admin')}
                >
                {tabs[0].label}  {/* ✅ Label will show */}
                </button>
            )}

            {/* ✅ Only show Dashboard for game_admin and admin */}
            {(user.role === 'admin' || user.role === 'game_admin') && (
                <button
                className={`nav-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
                onClick={() => handleTabChange('dashboard')}
                >
                {tabs[1].label}  {/* ✅ Label will show */}
                </button>
            )}

            {/* ✅ Only show Notifications for game_admin and admin */}
            {(user.role === 'admin' || user.role === 'game_admin') && (
                <button
                className={`nav-tab ${activeTab === 'notifications' ? 'active' : ''}`}
                onClick={() => handleTabChange('notifications')}
                >
                {tabs[2].label}  {/* ✅ Label will show */}
                </button>
            )}

            {/* ✅ Only show Team Management for admin, game_admin, and team_captain */}
            {(user.role === 'admin' || user.role === 'game_admin' || user.role === 'team_captain') && (
                <button
                    className={`nav-tab ${activeTab === 'team_management' ? 'active' : ''}`}
                    onClick={() => handleTabChange('team_management')}
                >
                    {tabs[3].label}  {/* ✅ Label will show */}
                </button>
            )}

            {/* ✅ Only show Game Panel for Team Captain, Player and admin (NOT for other admins) */}
            {(user.role === 'team_captain' || user.role === 'player' || user.role === 'admin') && (
                <button
                    className={`nav-tab ${activeTab === 'game' ? 'active' : ''}`}
                    onClick={() => handleTabChange('game')}
                >
                    {tabs[4].label}  {/* ✅ Label will show */}
                </button>
            )}

            <button
                className={`nav-tab ${activeTab === 'profile' ? 'active' : ''}`}
                onClick={() => handleTabChange('profile')}
            >
                {tabs[5].label}  {/* ✅ Label will show */}
            </button>
        </nav>
    );
};

export default Navigation;