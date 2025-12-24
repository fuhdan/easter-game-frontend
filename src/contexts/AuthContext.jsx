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
 * - Automatic token refresh (via api.js)
 * - Session expiry handling
 * - Loading states
 * - Uses centralized API service
 *
 * STEP 8: Session Expiry Handling
 * - Listens for 401 errors from API layer
 * - Automatically logs out when refresh token expires
 * - Provides session timeout notifications
 * - Integrates with automatic token refresh in api.js
 *
 * Usage:
 * - Wrap App with AuthProvider
 * - Use useAuth() hook in components
 *
 * Security:
 * - HTTPOnly cookies prevent XSS access
 * - Automatic session validation
 * - Secure logout with cookie clearing
 * - Session expiry detection and handling
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { API_CONFIG } from '../config/apiConfig';
import { login, logout } from '../services';
import { logger } from '../utils/logger';

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
    const [sessionExpired, setSessionExpired] = useState(false);

    /**
     * STEP 8: Handle session expiry
     * Called when refresh token expires or is revoked
     *
     * @param {string} reason - Reason for session expiry (optional)
     */
    const handleSessionExpiry = useCallback((reason = 'Session expired') => {
        logger.warn('auth_session_expired', {
            reason,
            module: 'AuthContext'
        });
        setUser(null);
        setSessionExpired(true);
        setError('Your session has expired. Please log in again.');
    }, []);

    /**
     * Check if user is authenticated on app load
     * Validates HTTPOnly cookie with backend using API service
     */
    useEffect(() => {
        checkAuthStatus();
    }, []);

    /**
     * STEP 8: Listen for global 401 errors (session expiry)
     * This catches 401 errors that couldn't be recovered by auto-refresh
     */
    useEffect(() => {
        const handleUnauthorized = (event) => {
            // Only handle if user was previously authenticated
            if (user) {
                logger.warn('auth_unauthorized_event', {
                    userId: user.id,
                    username: user.username,
                    module: 'AuthContext'
                });
                handleSessionExpiry('Authentication failed');
            }
        };

        // Listen for custom auth-error events from API layer
        window.addEventListener('auth-error', handleUnauthorized);

        return () => {
            window.removeEventListener('auth-error', handleUnauthorized);
        };
    }, [user, handleSessionExpiry]);

    /**
     * Validate current authentication status
     * Uses /api/auth/me to check HTTPOnly cookie
     *
     * STEP 8: Updated to use /auth/me instead of /auth/verify
     */
    async function checkAuthStatus() {
        try {
            setLoading(true);
            // Use /auth/me to validate session (benefits from auto-refresh)
            const response = await fetch(API_CONFIG.ENDPOINTS.AUTH.ME, {
                method: 'GET',
                credentials: 'include'
            });

            if (response.ok) {
                const userData = await response.json();
                setUser(userData);
                setSessionExpired(false);
            } else {
                setUser(null);
            }
        } catch (err) {
            logger.error('auth_check_failed', {
                errorMessage: err.message,
                module: 'AuthContext'
            }, err);
            setUser(null);
        } finally {
            setLoading(false);
        }
    }

    /**
     * Login user with credentials using API service
     *
     * STEP 8: Clears session expiry flag on successful login
     *
     * @param {string} username - User login name
     * @param {string} password - User password
     * @returns {Promise<Object>} Login result with success status
     * @throws {Error} If login fails
     */
    async function _login(username, password) {
        try {
            setError(null);
            setLoading(true);
            setSessionExpired(false);  // STEP 8: Clear expiry flag on login attempt

            const response = await login({
                username: username.trim(),
                password: password
            });

            if (response.success) {
                setUser(response.user);
                logger.info('auth_login_success', {
                    userId: response.user.id,
                    username: response.user.username,
                    role: response.user.role,
                    module: 'AuthContext'
                });
                return { success: true, message: response.message };
            } else {
                const errorMsg = response.detail || response.message || 'Login failed';
                setError(errorMsg);
                logger.warn('auth_login_failed', {
                    username: username.trim(),
                    errorMessage: errorMsg,
                    module: 'AuthContext'
                });
                return { success: false, message: errorMsg };
            }
        } catch (err) {
            logger.error('auth_login_error', {
                username: username.trim(),
                errorMessage: err.message,
                module: 'AuthContext'
            }, err);
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
     * STEP 8: Also clears session expiry flag
     *
     * @returns {Promise<void>}
     */
    async function _logout() {
        try {
            setLoading(true);

            await logout();

            // Clear local state
            setUser(null);
            setError(null);
            setSessionExpired(false);  // STEP 8: Clear expiry flag

            logger.info('auth_logout_success', {
                module: 'AuthContext'
            });
        } catch (err) {
            logger.warn('auth_logout_api_failed', {
                errorMessage: err.message,
                localLogoutSucceeded: true,
                module: 'AuthContext'
            }, err);
            // Still clear local state even if API call fails
            setUser(null);
            setError(null);
            setSessionExpired(false);
        } finally {
            setLoading(false);
        }
    }

    /**
     * Clear error state
     *
     * STEP 8: Also clears session expiry flag
     */
    function clearError() {
        setError(null);
        setSessionExpired(false);
    }

    const value = {
        user,
        login: _login,
        logout: _logout,
        loading,
        error,
        clearError,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        isPlayer: user?.role === 'player',
        sessionExpired,  // STEP 8: Expose session expiry state
        handleSessionExpiry  // STEP 8: Expose expiry handler for components
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}