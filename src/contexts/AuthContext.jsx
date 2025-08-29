/**
 * Component: AuthContext
 * Purpose: React Context for authentication state management
 * Part of: Easter Quest 2025 Frontend
 * 
 * Features:
 * - User authentication state
 * - Login/logout functions
 * - HTTPOnly cookie-based auth
 * - Automatic token validation
 * - Loading states
 * 
 * Usage:
 * - Wrap App with AuthProvider
 * - Use useAuth() hook in components
 * 
 * Security:
 * - HTTPOnly cookies prevent XSS access
 * - Automatic session validation
 * - Secure logout with cookie clearing
 */

import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

/**
 * Hook to access authentication context
 * 
 * @returns {Object} Auth context value with user, login, logout, loading
 * @throws {Error} If used outside AuthProvider
 */
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

/**
 * Authentication context provider component
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @returns {React.Component} AuthContext.Provider
 */
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    /**
     * Check if user is authenticated on app load
     * Validates HTTPOnly cookie with backend
     */
    useEffect(() => {
        checkAuthStatus();
    }, []);

    /**
     * Validate current authentication status
     * Calls /api/auth/me to check HTTPOnly cookie
     */
    async function checkAuthStatus() {
        try {
            setLoading(true);
            const response = await fetch('/api/auth/me', {
                method: 'GET',
                credentials: 'include', // Include HTTPOnly cookies
                headers: {
                    'Content-Type': 'application/json',
                }
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
     * Login user with credentials
     * 
     * @param {string} username - User login name
     * @param {string} password - User password
     * @returns {Promise<Object>} Login result with success status
     * @throws {Error} If login fails
     */
    async function login(username, password) {
        try {
            setError(null);
            setLoading(true);

            const response = await fetch('/api/auth/login', {
                method: 'POST',
                credentials: 'include', // Include HTTPOnly cookies
                headers: {
                    'Content-Type': 'application/json',
                },
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
     * Logout current user
     * Clears HTTPOnly cookie and local state
     * 
     * @returns {Promise<void>}
     */
    async function logout() {
        try {
            setLoading(true);
            
            await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include', // Include HTTPOnly cookies
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            // Clear local state regardless of API response
            setUser(null);
            setError(null);
        } catch (err) {
            console.error('Logout error:', err);
            // Still clear local state even if API call fails
            setUser(null);
            setError(null);
        } finally {
            setLoading(false);
        }
    }

    /**
     * Clear error state
     */
    function clearError() {
        setError(null);
    }

    const value = {
        user,
        login,
        logout,
        loading,
        error,
        clearError,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        isPlayer: user?.role === 'player'
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}