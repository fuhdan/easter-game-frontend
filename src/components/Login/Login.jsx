/**
 * Component: Login
 * Purpose: User authentication form with Ypsomed branding
 * Part of: Easter Quest 2025 Frontend
 * 
 * Features:
 * - Style A card-based design
 * - Ypsomed logo and colors
 * - Form validation
 * - Loading states
 * - Error handling
 * - Demo credentials display
 * 
 * Design:
 * - Card layout with shadows
 * - Gradient header
 * - Blue primary (#005da0) + Red accent (#c41e3a)
 * - 12px border radius
 * - Responsive layout
 */

import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './Login.css';

/**
 * Login form component
 * 
 * @returns {React.Component} Login form with Ypsomed branding
 */
function Login() {
    const { login, loading, error, clearError } = useAuth();
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });
    const [formError, setFormError] = useState('');

    /**
     * Handle form input changes
     * 
     * @param {Event} e - Input change event
     */
    function handleInputChange(e) {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        
        // Clear errors when user starts typing
        if (formError) setFormError('');
        if (error) clearError();
    }

    /**
     * Handle form submission
     * 
     * @param {Event} e - Form submit event
     */
    async function handleSubmit(e) {
        e.preventDefault();
        
        // Basic validation
        if (!formData.username.trim() || !formData.password) {
            setFormError('Please enter both username and password');
            return;
        }

        const result = await login(formData.username, formData.password);
        
        if (!result.success) {
            setFormError(result.message);
        }
    }

    /**
     * Fill demo credentials
     * 
     * @param {string} username - Demo username
     * @param {string} password - Demo password
     */
    function fillDemoCredentials(username, password) {
        setFormData({ username, password });
        if (formError) setFormError('');
        if (error) clearError();
    }

    return (
        <div className="login-container">
            <div className="login-card">
                {/* Header with Ypsomed branding */}
                <div className="login-header">
                    <div className="ypsomed-logo">
                        <img 
                            src="/assets/ypsomed-logo.png" 
                            alt="Ypsomed Logo" 
                            className="logo-image"
                        />
                    </div>
                    <h1>Easter Quest 2025</h1>
                    <p>Welcome to the Ypsomed Innovation Challenge</p>
                </div>

                {/* Login form */}
                <form className="login-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="username">Username</label>
                        <input
                            type="text"
                            id="username"
                            name="username"
                            value={formData.username}
                            onChange={handleInputChange}
                            placeholder="Enter your username"
                            disabled={loading}
                            autoComplete="username"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            placeholder="Enter your password"
                            disabled={loading}
                            autoComplete="current-password"
                        />
                    </div>

                    {/* Error display */}
                    {(formError || error) && (
                        <div className="error-message">
                            {formError || error}
                        </div>
                    )}

                    {/* Submit button */}
                    <button 
                        type="submit" 
                        className="login-button"
                        disabled={loading}
                    >
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>

                {/* Demo credentials */}
                <div className="demo-credentials">
                    <h3>Demo Accounts</h3>
                    <div className="demo-buttons">
                        <button 
                            type="button"
                            className="demo-button admin"
                            onClick={() => fillDemoCredentials('admin', 'demo')}
                            disabled={loading}
                        >
                            Admin Demo
                        </button>
                        <button 
                            type="button"
                            className="demo-button player"
                            onClick={() => fillDemoCredentials('player1', 'demo')}
                            disabled={loading}
                        >
                            Player Demo
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;