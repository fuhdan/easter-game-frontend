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
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';
import Login from './components/Login/Login';
import Header from './components/Header/Header';
import Navigation from './components/Navigation/Navigation';
import AdminDashboard from './components/AdminDashboard/AdminDashboard';
import SystemAdminDashboard from './components/SystemAdminDashboard/SystemAdminDashboard';
import { NotificationsDashboard } from './components/AdminNotifications';
import TeamCreation from './components/TeamCreation/TeamCreation';
import GamePanel from './components/GamePanel/GamePanel';
import Profile from './components/Profile/Profile';
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
            if (user.role === 'super_admin') {
                setActiveTab('system_admin');
            } else if (user.role === 'admin') {
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
            const response = await fetch('/api/auth/me', {
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

            const response = await fetch('/api/auth/login', {
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
            await fetch('/api/auth/logout', {
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

                {/* System Admin Dashboard - Only super_admin can see this */}
                {activeTab === 'system_admin' && user.role === 'super_admin' && (
                    <SystemAdminDashboard user={user} />
                )}

                {/* Route to appropriate component based on active tab */}
                {activeTab === 'dashboard' && (user.role === 'super_admin' || user.role === 'admin') && (
                    <AdminDashboard user={user} />
                )}

                {/* Notifications Dashboard - Only admin and super_admin can see this */}
                {activeTab === 'notifications' && (user.role === 'super_admin' || user.role === 'admin') && (
                    <NotificationsDashboard user={user} />
                )}

                {/* ✅ Only super_admin can see this tab */}
                {activeTab === 'team_creation' && user.role === 'super_admin' && (
                    <TeamCreation user={user} />
                )}

                {/* Game Panel - All authenticated users */}
                {activeTab === 'game' && (
                    <GamePanel user={user} />
                )}

                {/* Profile always available */}
                {activeTab === 'profile' && (
                    <Profile user={user} />
                )}
                </div>

                {/* Chat Widget - Available to all authenticated users */}
                <ChatWidget />
            </ChatProvider>
        </ErrorBoundary>
    );
};

export default App;