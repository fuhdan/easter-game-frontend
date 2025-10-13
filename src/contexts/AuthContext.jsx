/**
 * Component: AuthContext
 * Purpose: React Context for authentication state management
 * Part of: Easter Quest - Ypsomed AG Easter Challenge Frontend
 * 
 * Features:
 * - User authentication state
 * - Login/logout functions
 * - HTTPOnly cookie-based auth
 * - Automatic token validation
 * - Loading states
 * - Uses centralized API service
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
import api from '../services/api';

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
     * Validates HTTPOnly cookie with backend using API service
     */
    useEffect(() => {
        checkAuthStatus();
    }, []);

    /**
     * Validate current authentication status
     * Uses api.auth.verify() to check HTTPOnly cookie
     */
    async function checkAuthStatus() {
        try {
            setLoading(true);
            const userData = await api.auth.verify();
            setUser(userData);
        } catch (err) {
            console.error('Auth check failed:', err);
            setUser(null);
        } finally {
            setLoading(false);
        }
    }

    /**
     * Login user with credentials using API service
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

            const response = await api.auth.login({
                username: username.trim(),
                password: password
            });

            if (response.success) {
                setUser(response.user);
                return { success: true, message: response.message };
            } else {
                const errorMsg = response.detail || response.message || 'Login failed';
                setError(errorMsg);
                return { success: false, message: errorMsg };
            }
        } catch (err) {
            console.error('Login error:', err);
            const errorMsg = err.message || 'Network error. Please try again.';
            setError(errorMsg);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }

    /**
     * Logout current user using API service
     * Clears HTTPOnly cookie and local state
     * 
     * @returns {Promise<void>}
     */
    async function logout() {
        try {
            setLoading(true);
            
            await api.auth.logout();

            // Clear local state
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