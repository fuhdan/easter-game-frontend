/**
 * Component: Navigation
 * Purpose: Tab-based navigation for dashboard sections
 * Part of: Easter Quest - Ypsomed AG Easter Challenge Frontend
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
        { id: 'dashboard', label: '📊 Admin Dashboard' },
        { id: 'teams', label: '👥 Team Creation' },
        { id: 'game', label: '🎮 Game Panel' },
        { id: 'profile', label: '👤 Profile' }
    ];

    return (
        <nav className="nav-tabs">
            {/* ✅ Only show Dashboard for admin and super_admin */}
            {(user.role === 'super_admin' || user.role === 'admin') && (
                <button
                className={`nav-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
                onClick={() => onTabChange('dashboard')}
                >
                {tabs[0].label}  {/* ✅ Label will show */}
                </button>
            )}

            {/* ✅ Only show Team Creation for super_admin */}
            {user.role === 'super_admin' && (
                <button
                    className={`nav-tab ${activeTab === 'team_creation' ? 'active' : ''}`}
                    onClick={() => onTabChange('team_creation')}
                >
                    {tabs[1].label}  {/* ✅ Label will show */}
                </button>
            )}

            {/* ✅ Only show Game Panel for super_admin, Team Captain and player */}
            {(user.role === 'super_admin' || user.role === 'team_captain' || user.role === 'player') && (
                <button
                    className={`nav-tab ${activeTab === 'game' ? 'active' : ''}`}
                    onClick={() => onTabChange('game')}
                >
                    {tabs[2].label}  {/* ✅ Label will show */}
                </button>
            )}

            <button
                className={`nav-tab ${activeTab === 'profile' ? 'active' : ''}`}
                onClick={() => onTabChange('profile')}
            >
                {tabs[3].label}  {/* ✅ Label will show */}
            </button>
        </nav>
    );
};

export default Navigation;