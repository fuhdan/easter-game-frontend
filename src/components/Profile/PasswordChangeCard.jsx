/**
 * Component: PasswordChangeCard
 * Purpose: Password change form with validation
 * Part of: Easter Quest - Ypsomed AG Easter Challenge Frontend
 * 
 * Features:
 * - Self-contained form state (no parent re-renders)
 * - Form validation and API calls
 * - Loading states and success feedback
 */

import React, { useState } from 'react';
import { logger } from '../../utils/logger';

/**
 * PasswordChangeCard component - Password change form
 *
 * @returns {JSX.Element} Password change form card
 *
 * @example
 * <PasswordChangeCard />
 */
const PasswordChangeCard = () => {
  // Move ALL password state back into this component
  const [passwordForm, setPasswordForm] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  /**
   * Validate password change form fields
   *
   * @returns {Object} Validation errors object (empty if valid)
   * @returns {string} [errors.current] - Current password error
   * @returns {string} [errors.new] - New password error
   * @returns {string} [errors.confirm] - Confirmation error
   */
  const validatePasswordForm = () => {
    const errors = {};

    if (!passwordForm.current.trim()) {
      errors.current = 'Current password is required';
    }

    if (!passwordForm.new.trim()) {
      errors.new = 'New password is required';
    } else if (passwordForm.new.length < 8) {
      errors.new = 'New password must be at least 8 characters';
    } else if (passwordForm.new === passwordForm.current) {
      errors.new = 'New password must be different from current password';
    }

    if (!passwordForm.confirm.trim()) {
      errors.confirm = 'Please confirm your new password';
    } else if (passwordForm.confirm !== passwordForm.new) {
      errors.confirm = 'Password confirmation does not match';
    }

    return errors;
  };

  /**
   * Handle password change form submission
   *
   * @param {Event} e - Form submit event
   * @returns {Promise<void>}
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setPasswordErrors({});
    setPasswordSuccess(false);

    const errors = validatePasswordForm();
    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }

    try {
      setPasswordLoading(true);

      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const MOCK_CURRENT_PASSWORD = "demo";
      const isCurrentPasswordCorrect = passwordForm.current === MOCK_CURRENT_PASSWORD;

      if (isCurrentPasswordCorrect) {
        setPasswordSuccess(true);
        setPasswordForm({ current: '', new: '', confirm: '' });
        setTimeout(() => setPasswordSuccess(false), 3000);
      } else {
        setPasswordErrors({ 
          current: `Current password is incorrect. (Hint: try "${MOCK_CURRENT_PASSWORD}" for testing)` 
        });
      }

    } catch (error) {
      logger.error('Password change error:', error);
      setPasswordErrors({ 
        current: 'Network error. Please try again.' 
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  /**
   * Handle input changes
   */
  const handleInputChange = (field, value) => {
    setPasswordForm(prev => ({ ...prev, [field]: value }));
    
    if (passwordErrors[field]) {
      setPasswordErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  /**
   * Reset form
   */
  const handleReset = () => {
    setPasswordForm({ current: '', new: '', confirm: '' });
    setPasswordErrors({});
    setPasswordSuccess(false);
  };

  return (
    <div className="profile-card">
      <div className="card-header">
        🔐 Change Password
      </div>
      <div className="card-body">
        {passwordSuccess && (
          <div className="success-message">
            ✅ Password changed successfully!
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Current Password</label>
            <input
              type="password"
              className={`form-control ${passwordErrors.current ? 'form-control-error' : ''}`}
              value={passwordForm.current}
              onChange={(e) => handleInputChange('current', e.target.value)}
              placeholder="Enter your current password"
              disabled={passwordLoading}
            />
            {passwordErrors.current && (
              <div className="form-error">{passwordErrors.current}</div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">New Password</label>
            <input
              type="password"
              className={`form-control ${passwordErrors.new ? 'form-control-error' : ''}`}
              value={passwordForm.new}
              onChange={(e) => handleInputChange('new', e.target.value)}
              placeholder="Enter new password (min 8 characters)"
              disabled={passwordLoading}
            />
            {passwordErrors.new && (
              <div className="form-error">{passwordErrors.new}</div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Confirm New Password</label>
            <input
              type="password"
              className={`form-control ${passwordErrors.confirm ? 'form-control-error' : ''}`}
              value={passwordForm.confirm}
              onChange={(e) => handleInputChange('confirm', e.target.value)}
              placeholder="Confirm your new password"
              disabled={passwordLoading}
            />
            {passwordErrors.confirm && (
              <div className="form-error">{passwordErrors.confirm}</div>
            )}
          </div>

          <div className="form-buttons">
            <button 
              type="submit" 
              className="btn-primary"
              disabled={passwordLoading}
            >
              {passwordLoading ? 'Changing...' : 'Change Password'}
            </button>
            
            <button 
              type="button" 
              className="btn-secondary"
              onClick={handleReset}
              disabled={passwordLoading}
            >
              Reset
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PasswordChangeCard;