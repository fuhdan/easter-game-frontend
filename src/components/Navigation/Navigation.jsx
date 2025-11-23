/**
 * Component: Navigation
 * Purpose: Tab-based navigation for dashboard sections
 * Part of: Easter Quest Frontend
 *
 * Features:
 * - Role-based tab visibility
 * - System Admin Dashboard (admin only)
 * - Game Admin Dashboard (game_admin + admin)
 * - Notifications (game_admin + admin)
 * - Team Management (admin + team_captain)
 * - Game Panel (all users)
 * - Profile (all users)
 * - Active tab highlighting
 *
 * @since 2025-08-27
 * @updated 2025-11-23 - Renamed Team Creation to Team Management
 */

import React from 'react';
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

    return (
        <nav className="nav-tabs">

            {/* ✅ Only show System Admin Dashboard for admin */}
            {user.role === 'admin' && (
                <button
                    className={`nav-tab ${activeTab === 'system_admin' ? 'active' : ''}`}
                    onClick={() => onTabChange('system_admin')}
                >
                {tabs[0].label}  {/* ✅ Label will show */}
                </button>
            )}

            {/* ✅ Only show Dashboard for game_admin and admin */}
            {(user.role === 'admin' || user.role === 'game_admin') && (
                <button
                className={`nav-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
                onClick={() => onTabChange('dashboard')}
                >
                {tabs[1].label}  {/* ✅ Label will show */}
                </button>
            )}

            {/* ✅ Only show Notifications for game_admin and admin */}
            {(user.role === 'admin' || user.role === 'game_admin') && (
                <button
                className={`nav-tab ${activeTab === 'notifications' ? 'active' : ''}`}
                onClick={() => onTabChange('notifications')}
                >
                {tabs[2].label}  {/* ✅ Label will show */}
                </button>
            )}

            {/* ✅ Only show Team Management for admin and team_captain */}
            {(user.role === 'admin' || user.role === 'team_captain') && (
                <button
                    className={`nav-tab ${activeTab === 'team_management' ? 'active' : ''}`}
                    onClick={() => onTabChange('team_management')}
                >
                    {tabs[3].label}  {/* ✅ Label will show */}
                </button>
            )}

            {/* ✅ Only show Game Panel for Team Captain and player (NOT for admins) */}
            {(user.role === 'team_captain' || user.role === 'player') && (
                <button
                    className={`nav-tab ${activeTab === 'game' ? 'active' : ''}`}
                    onClick={() => onTabChange('game')}
                >
                    {tabs[4].label}  {/* ✅ Label will show */}
                </button>
            )}

            <button
                className={`nav-tab ${activeTab === 'profile' ? 'active' : ''}`}
                onClick={() => onTabChange('profile')}
            >
                {tabs[5].label}  {/* ✅ Label will show */}
            </button>
        </nav>
    );
};

export default Navigation;