/**
 * Component: Login
 * Purpose: User authentication interface with Ypsomed branding
 * Part of: Easter Quest 2025 Frontend
 * 
 * Features:
 * - Demo credentials (admin/demo)
 * - Ypsomed logo integration
 * - Form validation
 * - Responsive design
 * 
 * Props:
 * - onLogin(credentials): Function called on successful login
 */

import React, { useState } from 'react';
import './Login.css';

const Login = ({ onLogin }) => {
  const [credentials, setCredentials] = useState({
    username: 'admin',
    password: 'demo'
  });
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Handle input changes
   * @param {Event} e - Input change event
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user types
    if (error) setError('');
  };

  /**
   * Handle form submission
   * @param {Event} e - Form submit event
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      // Validate credentials
      if (!credentials.username.trim() || !credentials.password.trim()) {
        throw new Error('Please enter both username and password');
      }
      
      // Demo validation - in production, this would be an API call
      if (credentials.username === 'admin' && credentials.password === 'demo') {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        onLogin(credentials);
      } else {
        throw new Error('Invalid credentials. Use admin/demo for demo access.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <div className="login-logo">
            <img 
              src="/assets/ypsomed-logo.png" 
              alt="Ypsomed Logo" 
              onError={(e) => {
                // Fallback if logo doesn't load
                e.target.style.display = 'none';
                e.target.parentNode.innerHTML = '<div class="logo-fallback">Y</div>';
              }}
              className='ypsomed-logo'
            />
          </div>
          <h1 style={{ color: 'var(--primary-blue)', fontSize: '1.75rem', marginBottom: '0.5rem' }}>
            Easter Quest 2025
          </h1>
        </div>
        
        <form onSubmit={handleSubmit} className="login-form">
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
              disabled={isLoading}
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
              disabled={isLoading}
            />
          </div>
          
          <button 
            type="submit" 
            className="btn btn-primary login-btn" 
            disabled={isLoading}
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
        <p className="welcome-text">
          Welcome to the Ypsomed Easter Challenge 2025! Please log in to continue.
        </p>
      </div>
    </div>
  );
};

export default Login;