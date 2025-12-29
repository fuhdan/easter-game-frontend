/**
 * Component: Login (Updated for 3 Scenarios)
 * Purpose: User authentication interface with account activation support
 * Part of: Easter Quest - Ypsomed AG Easter Challenge Frontend
 * 
 * Handles 3 login scenarios:
 * 1. Active user - normal login
 * 2. Inactive user - password change required
 * 3. Inactive user - password change + OTP required
 */

import React, { useState } from 'react';
import { logger } from '../../utils/logger';
import PropTypes from 'prop-types';
import PasswordChangeModal from '../PasswordChangeModal/PasswordChangeModal.jsx';
import { login, auth, utils } from '../../services';
import Loader from '../Loader/Loader.jsx';
import './Login.css';

const Login = ({ onLogin, loading = false, error = null }) => {
  const [credentials, setCredentials] = useState({
    username: 'admin',
    password: 'demo'
  });
  
  const [logoError, setLogoError] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState(null);
  
  // Password change modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [modalData, setModalData] = useState({
    username: '',
    currentPassword: '',
    requiresOTP: false
  });
  const [activationLoading, setActivationLoading] = useState(false);

  /**
   * Handle input changes and clear errors.
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear errors when user types
    if (loginError) setLoginError(null);
  };

  /**
   * Handle form submission with 3-scenario support.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!credentials.username.trim() || !credentials.password.trim()) {
      setLoginError('Username and password are required');
      return;
    }
    
    setLoginLoading(true);
    setLoginError(null);
    
    try {
      // Call login API
      const response = await login({
        username: credentials.username.trim(),
        password: credentials.password
      });
      
      // All successful responses have success: true now
      if (response.success) {
        // Check if password change is required
        if (response.user.requiresPasswordChange) {
          // User is authenticated but needs password change
          setModalData({
            username: response.user.username,
            currentPassword: credentials.password,
            requiresOTP: response.user.requiresOTP || false
          });
          setShowPasswordModal(true);
        } else {
          // Normal successful login - proceed to dashboard
          // Token refresh will be started automatically by AuthContext
          await onLogin(credentials.username, credentials.password);
        }
      } else {
        // This shouldn't happen with the new unified approach
        setLoginError(response.message || 'Login failed');
      }
      
    } catch (error) {
      logger.error('Login error:', error);
      setLoginError(utils.handleError(error));
    } finally {
      setLoginLoading(false);
    }
  };

  /**
   * Handle account activation (password change)
   */
  const handleAccountActivation = async (activationData) => {
    setActivationLoading(true);

    try {
      const response = await auth.activateAccount(activationData);

      if (response.success) {
        // Account activated successfully - close modal and login
        setShowPasswordModal(false);

        // Auto-login with new credentials or use the response
        if (response.user) {
          await onLogin(activationData.username, activationData.new_password);
        }
      } else {
        // Handle activation error
        throw new Error(response.message || 'Account activation failed');
      }

    } catch (error) {
      logger.error('Account activation error:', error);
      setLoginError(error.message || 'Account activation failed');
    } finally {
      setActivationLoading(false);
    }
  };

  /**
   * Handle password modal close
   */
  const handlePasswordModalClose = () => {
    setShowPasswordModal(false);
    setModalData({
      username: '',
      currentPassword: '',
      requiresOTP: false
    });
  };

  /**
   * Handle logo loading error - show CSS fallback.
   */
  const handleLogoError = (e) => {
    setLogoError(true);
    e.target.style.display = 'none';
  };

  const isLoading = loading || loginLoading;
  const currentError = error || loginError;

  // ✅ Show global loader if login is in progress
  if (isLoading) {
    return <Loader message="Sign in..." />;
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <div className={`login-logo ${logoError ? 'fallback' : ''}`}>
            {!logoError ? (
              <img 
                src="/assets/logo.png" 
                alt="Logo" 
                onError={handleLogoError}
              />
            ) : (
              <div className="logo-fallback">Y</div>
            )}
          </div>
          <h1>Easter Quest 2026</h1>
          <p>Ypsomed Innovation Challenge</p>
        </div>
        
        <form onSubmit={handleSubmit} className="login-form">
          {currentError && (
            <div className="error-message">
              {currentError}
            </div>
          )}
          
          <div className="form-group">
            <input
              type="text"
              name="username"
              className="form-control"
              placeholder="Username"
              value={credentials.username}
              onChange={handleInputChange}
              required
              disabled={isLoading}
              autoComplete="username"
            />
          </div>
          
          <div className="form-group">
            <input
              type="password"
              name="password"
              className="form-control"
              placeholder="Password"
              value={credentials.password}
              onChange={handleInputChange}
              required
              disabled={isLoading}
              autoComplete="current-password"
            />
          </div>
          
          <button
            type="submit"
            className="btn btn-primary login-btn"
            disabled={isLoading || !credentials.username.trim() || !credentials.password.trim()}
          >
            Sign In
          </button>
        </form>

        <p className="welcome-text">
          Welcome to the Ypsomed Easter Challenge 2026 Dashboard. Please log in to continue.
        </p>
      </div>

      {/* Password Change Modal for scenarios 2 & 3 - Only render when needed */}
      {showPasswordModal && (
        <PasswordChangeModal
          isOpen={showPasswordModal}
          onClose={handlePasswordModalClose}
          onSuccess={handleAccountActivation}
          username={modalData.username}
          requiresOTP={modalData.requiresOTP}
          currentPassword={modalData.currentPassword}
          loading={activationLoading}
        />
      )}
    </div>
  );
};

/**
 * PropTypes validation for Login component
 */
Login.propTypes = {
  onLogin: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  error: PropTypes.string
};

export default Login;