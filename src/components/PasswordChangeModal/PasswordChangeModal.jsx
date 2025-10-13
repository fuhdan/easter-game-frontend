/**
 * Component: PasswordChangeModal
 * Purpose: Handle password change for scenarios 2 & 3 (account activation)
 * Part of: Easter Quest 2025 Frontend
 * Location: frontend/src/components/PasswordChangeModal/PasswordChangeModal.jsx
 */

import React, { useState } from 'react';
import './PasswordChangeModal.css';

const PasswordChangeModal = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  username, 
  requiresOTP,
  currentPassword,
  loading = false
}) => {
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: '',
    otp: ''
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  // Don't render if not open
  if (!isOpen) return null;

  /**
   * Handle input changes
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear specific error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  /**
   * Validate form
   */
  const validateForm = () => {
    const newErrors = {};

    if (!formData.newPassword.trim()) {
      newErrors.newPassword = 'New password is required';
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = 'Please confirm your new password';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (requiresOTP && !formData.otp.trim()) {
      newErrors.otp = 'OTP is required';
    } else if (requiresOTP && formData.otp.length !== 8) {
      newErrors.otp = 'OTP must be 6 digits';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const activationData = {
      username: username,
      current_password: currentPassword,
      new_password: formData.newPassword,
      confirm_password: formData.confirmPassword
    };

    // Add OTP if required (scenario 3)
    if (requiresOTP) {
      activationData.otp = formData.otp;
    }

    await onSuccess(activationData);
  };

  /**
   * Handle modal close
   */
  const handleClose = () => {
    if (loading) return; // Prevent closing during loading
    
    setFormData({
      newPassword: '',
      confirmPassword: '',
      otp: ''
    });
    setErrors({});
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Account Activation Required</h2>
          <button 
            className="modal-close-btn"
            onClick={handleClose}
            disabled={loading}
          >
            ×
          </button>
        </div>

        <div className="modal-body">
          <div className="activation-info">
            <p>Welcome <strong>{username}</strong>!</p>
            <p>
              {requiresOTP 
                ? 'Please set a new password and enter your one-time password to activate your account.'
                : 'Please set a new password to activate your account.'
              }
            </p>
          </div>

          <form onSubmit={handleSubmit} className="activation-form">
            {/* New Password Field */}
            <div className="form-group">
              <label className="form-label">New Password</label>
              <div className="password-input-container">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="newPassword"
                  className={`form-control ${errors.newPassword ? 'error' : ''}`}
                  placeholder="Enter your new password"
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  disabled={loading}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              {errors.newPassword && (
                <div className="error-text">{errors.newPassword}</div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                name="confirmPassword"
                className={`form-control ${errors.confirmPassword ? 'error' : ''}`}
                placeholder="Confirm your new password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                disabled={loading}
                autoComplete="new-password"
              />
              {errors.confirmPassword && (
                <div className="error-text">{errors.confirmPassword}</div>
              )}
            </div>

            {/* OTP Field (only for scenario 3) */}
            {requiresOTP && (
              <div className="form-group">
                <label className="form-label">One-Time Password</label>
                <input
                  type="text"
                  name="otp"
                  className={`form-control otp-input ${errors.otp ? 'error' : ''}`}
                  placeholder="Enter 8-digit OTP"
                  value={formData.otp}
                  onChange={handleInputChange}
                  disabled={loading}
                  maxLength="8"
                  pattern="[0-9A-Za-z]{8}"
                />
                {errors.otp && (
                  <div className="error-text">{errors.otp}</div>
                )}
                <div className="otp-help">
                  Check your email for the 6-digit one-time password
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="form-actions">
              <button 
                type="submit" 
                className="btn btn-primary activation-btn"
                disabled={loading}
              >
                {loading ? 'Activating Account...' : 'Activate Account'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PasswordChangeModal;