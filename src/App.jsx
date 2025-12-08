/**
 * Module: App.jsx  
 * Purpose: Main application router with authentication state management
 * Part of: Easter Quest - Ypsomed AG Easter Challenge Frontend
 * 
 * Notes:
 * - Handles only authentication logic and component routing
 * - Each dashboard section is a separate component
 * - Follows "Split, Don't Lump" principle from coding guidelines
 * - Session management centralized here, passed down via props
 * 
 * @since 2025-08-27
 * @see ./components/ for individual dashboard components
 */

import React, { useState, useEffect } from 'react';
import { API_CONFIG } from './config/apiConfig';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';
import Login from './components/Login/Login';
import Header from './components/Header/Header';
import Navigation from './components/Navigation/Navigation';
import GameAdminDashboard from './components/AdminDashboard/GameAdminDashboard';
import SystemAdminDashboard from './components/SystemAdminDashboard/SystemAdminDashboard';
import { NotificationsDashboard } from './components/AdminNotifications';
import TeamManagement from './components/TeamManagement/TeamManagement';
import GamePanel from './components/GamePanel/GamePanel';
import Profile from './components/Profile/Profile';
import Footer from './components/Footer/Footer';
import Loader from './components/Loader/Loader';
import { ChatProvider } from './contexts/ChatContext';
import { ChatWidget } from './components/ChatWidget';
import './App.css';

/**
 * Main application component - authentication router only.
 * 
 * @component
 * @returns {JSX.Element} Login or authenticated app with routed components
 */
const App = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState(null);

    useEffect(() => {
        checkAuthStatus();
    }, []);

    /**
     * Set default tab based on user role when user logs in.
     */
    useEffect(() => {
        if (user && !activeTab) {
            // Set default tab based on role
            if (user.role === 'admin') {
                setActiveTab('system_admin');
            } else if (user.role === 'content_admin' || user.role === 'system_admin') {
                // Content admin and system admin go to system admin dashboard
                setActiveTab('system_admin');
            } else if (user.role === 'game_admin') {
                setActiveTab('dashboard');
            } else if (user.role === 'team_captain' || user.role === 'player') {
                setActiveTab('game');
            } else {
                setActiveTab('profile'); // Fallback
            }
        }
    }, [user, activeTab]);

    /**
     * Validate current user session with backend.
     * @async
     * @returns {Promise<void>}
     */
    async function checkAuthStatus() {
        try {
            setLoading(true);
            const response = await fetch(API_CONFIG.ENDPOINTS.AUTH.ME, {
                method: 'GET',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.ok) {
                const userData = await response.json();
                setUser(userData);
            } else {
                setUser(null);
            }
        } catch (err) {
            console.error('Auth check failed:', err);
            setUser(null);
        } finally {
            setLoading(false);
        }
    }

    /**
     * Authenticate user with credentials.
     * @param {string} username 
     * @param {string} password 
     * @returns {Promise<{success: boolean, message: string}>}
     */
    async function login(username, password) {
        try {
            setError(null);
            setLoading(true);

            const response = await fetch(API_CONFIG.ENDPOINTS.AUTH.LOGIN, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: username.trim(),
                    password: password
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setUser(data.user);
                return { success: true, message: data.message };
            } else {
                const errorMsg = data.detail || data.message || 'Login failed';
                setError(errorMsg);
                return { success: false, message: errorMsg };
            }
        } catch (err) {
            const errorMsg = 'Network error. Please try again.';
            setError(errorMsg);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }

    /**
     * Logout user and clear session.
     * @async
     * @returns {Promise<void>}
     */
    async function logout() {
        try {
            setLoading(true);
            await fetch(API_CONFIG.ENDPOINTS.AUTH.LOGOUT, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' }
            });
        } catch (err) {
            console.error('Logout error:', err);
        } finally {
            setUser(null);
            setError(null);
            setLoading(false);
        }
    }

    if (loading) {
        return <Loader message="Loading Easter Quest 2026..." />;
    }

    // Unauthenticated state
    if (!user) {
        return (
            <ErrorBoundary>
                <Login
                    onLogin={login}
                    error={error}
                />
            </ErrorBoundary>
        );
    }

    // Authenticated state - component router
    return (
        <ErrorBoundary>
            <ChatProvider user={user}>
                <div className="app">

                    <Header
                        user={user}
                        onLogout={logout}
                    />

                    <Navigation
                        activeTab={activeTab}
                        onTabChange={setActiveTab}
                        user={user}
                    />

                {/* System Admin Dashboard - admin, content_admin, system_admin can see this */}
                {activeTab === 'system_admin' && (user.role === 'admin' || user.role === 'content_admin' || user.role === 'system_admin') && (
                    <SystemAdminDashboard user={user} />
                )}

                {/* Game Admin Dashboard - Monitors running game progress */}
                {activeTab === 'dashboard' && (user.role === 'admin' || user.role === 'game_admin') && (
                    <GameAdminDashboard user={user} />
                )}

                {/* Notifications Dashboard - Only admin and game_admin can see this */}
                {activeTab === 'notifications' && (user.role === 'admin' || user.role === 'game_admin') && (
                    <NotificationsDashboard user={user} />
                )}

                {/* Team Management - Admin, game_admin, and team_captain can access */}
                {activeTab === 'team_management' && (user.role === 'admin' || user.role === 'game_admin' || user.role === 'team_captain') && (
                    <TeamManagement user={user} />
                )}

                {/* Game Panel - Only team_captain and player (NOT admin or game_admin) */}
                {activeTab === 'game' && (user.role === 'team_captain' || user.role === 'player') && (
                    <GamePanel user={user} />
                )}

                {/* Profile always available */}
                {activeTab === 'profile' && (
                    <Profile user={user} />
                )}

                {/* Footer - Shows current role and permissions on all pages */}
                <Footer user={user} />
                </div>

                {/* Chat Widget - Available to all authenticated users */}
                <ChatWidget />
            </ChatProvider>
        </ErrorBoundary>
    );
};

export default App;