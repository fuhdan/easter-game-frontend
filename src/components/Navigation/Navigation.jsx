/**
 * Component: Navigation
 * Purpose: Tab-based navigation for dashboard sections
 * Part of: Easter Quest Frontend
 *
 * Features:
 * - Role-based tab visibility
 * - System Admin Dashboard (super_admin only)
 * - Game Admin Dashboard (admin + super_admin)
 * - Notifications (admin + super_admin)
 * - Team Creation (admin + super_admin)
 * - Game Panel (all users)
 * - Profile (all users)
 * - Active tab highlighting
 *
 * @since 2025-08-27
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
        { id: 'teams', label: '👥 Team Creation' },
        { id: 'game', label: '🎮 Game Panel' },
        { id: 'profile', label: '👤 Profile' }
    ];

    return (
        <nav className="nav-tabs">

            {/* ✅ Only show System Admin Dashboard for super_admin */}
            {user.role === 'super_admin' && (
                <button
                    className={`nav-tab ${activeTab === 'system_admin' ? 'active' : ''}`}
                    onClick={() => onTabChange('system_admin')}
                >
                {tabs[0].label}  {/* ✅ Label will show */}
                </button>
            )}

            {/* ✅ Only show Dashboard for admin and super_admin */}
            {(user.role === 'super_admin' || user.role === 'admin') && (
                <button
                className={`nav-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
                onClick={() => onTabChange('dashboard')}
                >
                {tabs[1].label}  {/* ✅ Label will show */}
                </button>
            )}

            {/* ✅ Only show Notifications for admin and super_admin */}
            {(user.role === 'super_admin' || user.role === 'admin') && (
                <button
                className={`nav-tab ${activeTab === 'notifications' ? 'active' : ''}`}
                onClick={() => onTabChange('notifications')}
                >
                {tabs[2].label}  {/* ✅ Label will show */}
                </button>
            )}

            {/* ✅ Only show Team Creation for super_admin */}
            {user.role === 'super_admin' && (
                <button
                    className={`nav-tab ${activeTab === 'team_creation' ? 'active' : ''}`}
                    onClick={() => onTabChange('team_creation')}
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