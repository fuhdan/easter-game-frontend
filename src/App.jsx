/**
 * Module: App.jsx  
 * Purpose: Main application router with authentication state management
 * Part of: Easter Quest 2025 Frontend (React)
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
import Login from './components/Login/Login';
import Header from './components/Header/Header';
import Navigation from './components/Navigation/Navigation';
import AdminDashboard from './components/AdminDashboard/AdminDashboard';
/**import TeamCreation from './components/TeamCreation/TeamCreation';
import GamePanel from './components/GamePanel/GamePanel';
import Profile from './components/Profile/Profile'; */
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
    const [activeTab, setActiveTab] = useState('dashboard');

    useEffect(() => {
        checkAuthStatus();
    }, []);

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

    // Loading state
    if (loading) {
        return (
            <div className="loading">
                <div className="ypsomed-logo">
                    <img src="/assets/ypsomed-logo.png" alt="Ypsomed Logo" />
                </div>
                <p>Loading Easter Quest 2026...</p>
            </div>
        );
    }

    // Unauthenticated state
    if (!user) {
        return (
            <Login 
                onLogin={login}
                loading={loading}
                error={error}
            />
        );
    }

    // Authenticated state - component router
    return (
        <div className="app" style={{maxWidth: '1200px'}}>
            <Header 
                user={user} 
                onLogout={logout} 
            />
            
            <Navigation 
                activeTab={activeTab}
                onTabChange={setActiveTab}
            />
            
            {/* Route to appropriate component based on active tab */}
            {activeTab === 'dashboard' && (
                <AdminDashboard user={user} />
            )}
        </div>
    );
};

export default App;