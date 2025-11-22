/**
 * Component: MainWindow
 * Purpose: Main application interface after successful login
 * Part of: Easter Quest - Ypsomed AG Easter Challenge Frontend
 * 
 * Features:
 * - Header with Ypsomed branding and user info
 * - Navigation tabs (Dashboard, Teams, Game, Profile)
 * - Role-based content (Admin vs Player views)
 * - Logout functionality
 * - Responsive layout
 * 
 * Design:
 * - Style A card-based layout
 * - Gradient header with logo
 * - Tab navigation system
 * - User profile dropdown
 */

import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './MainWindow.css';

/**
 * Main application window component
 * 
 * @returns {React.Component} Main interface with navigation and content
 */
function MainWindow() {
    const { user, logout, isAdmin, isPlayer } = useAuth();
    const [activeTab, setActiveTab] = useState(isAdmin ? 'dashboard' : 'game');
    const [showUserMenu, setShowUserMenu] = useState(false);

    /**
     * Handle navigation tab change
     * 
     * @param {string} tabId - Tab identifier
     */
    function handleTabChange(tabId) {
        setActiveTab(tabId);
        setShowUserMenu(false); // Close user menu on navigation
    }

    /**
     * Handle user menu toggle
     */
    function toggleUserMenu() {
        setShowUserMenu(!showUserMenu);
    }

    /**
     * Handle logout
     */
    async function handleLogout() {
        await logout();
    }

    /**
     * Get navigation tabs based on user role
     * 
     * @returns {Array} Array of tab objects
     */
    function getNavigationTabs() {
        const commonTabs = [
            { id: 'profile', label: 'Profile', icon: '👤' }
        ];

        if (isAdmin) {
            return [
                { id: 'dashboard', label: 'Dashboard', icon: '📊' },
                { id: 'teams', label: 'Team Creation', icon: '👥' },
                // Game Panel removed - admins don't play
                ...commonTabs
            ];
        }

        return [
            { id: 'game', label: 'Game Panel', icon: '🎮' },
            ...commonTabs
        ];
    }

    /**
     * Render content based on active tab
     * 
     * @returns {React.Component} Tab content component
     */
    function renderTabContent() {
        switch (activeTab) {
            case 'dashboard':
                return <DashboardPanel />;
            case 'teams':
                return <TeamsPanel />;
            case 'game':
                return isAdmin ? <GameMonitorPanel /> : <GamePanel />;
            case 'profile':
                return <ProfilePanel />;
            default:
                return <div>Content coming soon...</div>;
        }
    }

    return (
        <div className="main-window">
            {/* Header */}
            <header className="main-header">
                <div className="header-left">
                    <div className="ypsomed-logo-small">
                        <img 
                            src="/assets/ypsomed-logo.png" 
                            alt="Ypsomed Logo" 
                            className="logo-image-small"
                        />
                    </div>
                    <div className="header-title">
                        <h1>Easter Quest 2026</h1>
                        <span className="subtitle">Ypsomed Innovation Challenge</span>
                    </div>
                </div>

                <div className="header-right">
                    <div className="user-info" onClick={toggleUserMenu}>
                        <span className="user-name">{user?.display_name}</span>
                        <span className="user-role">{user?.role}</span>
                        <span className="dropdown-arrow">{showUserMenu ? '▲' : '▼'}</span>
                    </div>

                    {showUserMenu && (
                        <div className="user-menu">
                            <div className="user-details">
                                <strong>{user?.display_name}</strong>
                                <small>{user?.email}</small>
                            </div>
                            <hr />
                            <button onClick={handleLogout} className="logout-button">
                                🚪 Logout
                            </button>
                        </div>
                    )}
                </div>
            </header>

            {/* Navigation */}
            <nav className="main-navigation">
                <div className="nav-tabs">
                    {getNavigationTabs().map(tab => (
                        <button
                            key={tab.id}
                            className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => handleTabChange(tab.id)}
                        >
                            <span className="tab-icon">{tab.icon}</span>
                            <span className="tab-label">{tab.label}</span>
                        </button>
                    ))}
                </div>
            </nav>

            {/* Main content */}
            <main className="main-content">
                {renderTabContent()}
            </main>
        </div>
    );
}

/**
 * Dashboard panel for admins
 * 
 * @returns {React.Component} Dashboard content
 */
function DashboardPanel() {
    return (
        <div className="panel-container">
            <div className="panel-card">
                <h2>📊 Admin Dashboard</h2>
                <p>Monitor all team progress and game statistics.</p>
                <div className="stats-grid">
                    <div className="stat-card">
                        <h3>Active Teams</h3>
                        <div className="stat-value">8</div>
                    </div>
                    <div className="stat-card">
                        <h3>Players Online</h3>
                        <div className="stat-value">24</div>
                    </div>
                    <div className="stat-card">
                        <h3>Games Completed</h3>
                        <div className="stat-value">156</div>
                    </div>
                    <div className="stat-card">
                        <h3>Help Requests</h3>
                        <div className="stat-value">3</div>
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * Teams panel for admin team creation
 * 
 * @returns {React.Component} Teams content
 */
function TeamsPanel() {
    return (
        <div className="panel-container">
            <div className="panel-card">
                <h2>👥 Team Creation</h2>
                <p>Upload users and create teams for the Easter Quest.</p>
                <div className="teams-content">
                    <div className="upload-section">
                        <h3>Upload Users (CSV)</h3>
                        <div className="upload-area">
                            <p>📁 Drag and drop CSV file here or click to browse</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * Game monitor panel for admins
 * 
 * @returns {React.Component} Game monitor content
 */
function GameMonitorPanel() {
    return (
        <div className="panel-container">
            <div className="panel-card">
                <h2>🎮 Game Monitor</h2>
                <p>Real-time view of all team progress and game status.</p>
                <div className="monitor-content">
                    <p>Game monitoring interface coming soon...</p>
                </div>
            </div>
        </div>
    );
}

/**
 * Game panel for players
 * 
 * @returns {React.Component} Game content
 */
function GamePanel() {
    return (
        <div className="panel-container">
            <div className="panel-card">
                <h2>🎮 Current Game</h2>
                <div className="game-content">
                    <div className="game-info">
                        <h3>Welcome to Easter Quest!</h3>
                        <p>Your adventure begins here. Solve puzzles, complete challenges, and work with your team to win the Innovation Challenge.</p>
                    </div>
                    
                    <div className="game-status">
                        <div className="status-item">
                            <span>⏱️ Time Spent:</span>
                            <span>0h 5m</span>
                        </div>
                        <div className="status-item">
                            <span>💡 Hints Used:</span>
                            <span>0 / 3</span>
                        </div>
                        <div className="status-item">
                            <span>✅ Progress:</span>
                            <span>0%</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * Profile panel for user settings
 * 
 * @returns {React.Component} Profile content
 */
function ProfilePanel() {
    const { user } = useAuth();
    
    return (
        <div className="panel-container">
            <div className="panel-card">
                <h2>👤 User Profile</h2>
                <div className="profile-content">
                    <div className="profile-info">
                        <div className="info-row">
                            <label>Display Name:</label>
                            <span>{user?.display_name}</span>
                        </div>
                        <div className="info-row">
                            <label>Username:</label>
                            <span>{user?.username}</span>
                        </div>
                        <div className="info-row">
                            <label>Email:</label>
                            <span>{user?.email}</span>
                        </div>
                        <div className="info-row">
                            <label>Role:</label>
                            <span className={`role-badge ${user?.role}`}>{user?.role}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default MainWindow;