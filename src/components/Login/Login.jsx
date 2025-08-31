/**
 * Component: Login (Optimized)
 * Purpose: User authentication interface with Ypsomed branding
 * Part of: Easter Quest - Ypsomed AG Easter Challenge Frontend
 * 
 * Optimizations:
 * - Removed inline styles (moved to CSS)
 * - Better error handling
 * - Cleaner logo fallback mechanism
 * - Consistent with global button styles
 * 
 * Props:
 * - onLogin(username, password): Function called on login attempt
 * - loading: External loading state
 * - error: External error message
 */

import React, { useState } from 'react';
import './Login.css';

const Login = ({ onLogin, loading = false, error = null }) => {
  const [credentials, setCredentials] = useState({
    username: 'admin',
    password: 'demo'
  });
  
  const [logoError, setLogoError] = useState(false);

  /**
   * Handle input changes and clear external errors.
   * @param {Event} e - Input change event
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
  };

  /**
   * Handle form submission.
   * @param {Event} e - Form submit event
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!credentials.username.trim() || !credentials.password.trim()) {
      return;
    }
    
    // Call parent login handler
    await onLogin(credentials.username, credentials.password);
  };

  /**
   * Handle logo loading error - show CSS fallback.
   * @param {Event} e - Image error event
   */
  const handleLogoError = (e) => {
    setLogoError(true);
    e.target.style.display = 'none';
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <div className={`login-logo ${logoError ? 'fallback' : ''}`}>
            {!logoError ? (
              <img 
                src="/assets/ypsomed-logo.png" 
                alt="Ypsomed Logo" 
                onError={handleLogoError}
              />
            ) : (
              <div className="logo-fallback">Y</div>
            )}
          </div>
          <h1>Easter Quest 2026</h1>
          <p>Ypsomed Innovation Challenge</p>
        </div>
        
        <form onSubmit={handleSubmit} className={`login-form ${loading ? 'loading' : ''}`}>
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          
          <div className="form-group">
            <input
              type="text"
              name="username"
              className="form-control"
              placeholder="Username (try: admin)"
              value={credentials.username}
              onChange={handleInputChange}
              required
              disabled={loading}
              autoComplete="username"
            />
          </div>
          
          <div className="form-group">
            <input
              type="password"
              name="password"
              className="form-control"
              placeholder="Password (try: demo)"
              value={credentials.password}
              onChange={handleInputChange}
              required
              disabled={loading}
              autoComplete="current-password"
            />
          </div>
          
          <button 
            type="submit" 
            className="btn btn-primary login-btn" 
            disabled={loading || !credentials.username.trim() || !credentials.password.trim()}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <p className="welcome-text">
          Welcome to the Ypsomed Easter Challenge 2026 Dashboard. Please log in to continue.
        </p>
      </div>
    </div>
  );
};

export default Login;