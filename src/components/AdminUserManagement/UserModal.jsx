/**
 * Module: components/AdminUserManagement/UserModal.jsx
 * Purpose: Modal for creating/editing admin users
 * Part of: Easter Quest 2025 Frontend - Admin User Management
 *
 * Features:
 * - Create mode: All fields required, password auto-generated
 * - Edit mode: Update email, display_name, role, is_active only
 * - Form validation
 * - Role selector with descriptions
 * - Active/inactive toggle
 *
 * @since 2026-03-18
 */

import React, { useState, useEffect } from 'react';

const ROLES = [
  {
    value: 'admin',
    label: 'Admin',
    description: 'Full system access (recommended for most admins)'
  },
  {
    value: 'game_admin',
    label: 'Game Admin',
    description: 'Can manage game content and monitor game dashboard'
  },
  {
    value: 'system_admin',
    label: 'System Admin',
    description: 'Can manage system configuration and admin users'
  },
  {
    value: 'content_admin',
    label: 'Content Admin',
    description: 'Can manage game events and content only'
  }
];

const UserModal = ({ mode, user, onSave, onCancel }) => {
  // Form state
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    display_name: '',
    role: 'admin',
    is_active: true
  });

  const [errors, setErrors] = useState({});

  // Initialize form data for edit mode
  useEffect(() => {
    if (mode === 'edit' && user) {
      setFormData({
        username: user.username,
        email: user.email,
        display_name: user.display_name,
        role: user.role,
        is_active: user.is_active
      });
    }
  }, [mode, user]);

  /**
   * Handle field change
   * @param {string} field - Field name
   * @param {any} value - New value
   */
  const _handleFieldChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));

    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  /**
   * Validate form data
   * @returns {boolean} True if valid
   */
  const _validateForm = () => {
    const newErrors = {};

    // Username validation (create mode only)
    if (mode === 'create') {
      if (!formData.username || formData.username.length < 3) {
        newErrors.username = 'Username must be at least 3 characters';
      } else if (formData.username.length > 50) {
        newErrors.username = 'Username must be at most 50 characters';
      } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
        newErrors.username = 'Username can only contain letters, numbers, and underscore';
      }
    }

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    // Display name validation
    if (!formData.display_name || formData.display_name.length < 3) {
      newErrors.display_name = 'Display name must be at least 3 characters';
    } else if (formData.display_name.length > 100) {
      newErrors.display_name = 'Display name must be at most 100 characters';
    }

    // Role validation
    if (!formData.role) {
      newErrors.role = 'Role is required';
    } else if (!ROLES.find((r) => r.value === formData.role)) {
      newErrors.role = 'Invalid role selected';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submit
   * @param {Event} e - Form event
   */
  const _handleSubmit = (e) => {
    e.preventDefault();

    if (!_validateForm()) {
      return;
    }

    // For edit mode, only send changed fields
    if (mode === 'edit') {
      const changedData = {};
      if (formData.email !== user.email) changedData.email = formData.email;
      if (formData.display_name !== user.display_name) changedData.display_name = formData.display_name;
      if (formData.role !== user.role) changedData.role = formData.role;
      if (formData.is_active !== user.is_active) changedData.is_active = formData.is_active;

      onSave(changedData);
    } else {
      onSave(formData);
    }
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>
            {mode === 'create' ? '➕ Create New Admin User' : '✏️ Edit Admin User'}
          </h3>
          <button className="modal-close-btn" onClick={onCancel}>
            ✕
          </button>
        </div>

        <form className="modal-body" onSubmit={_handleSubmit}>
          {/* Username (create mode only) */}
          {mode === 'create' && (
            <div className="form-group">
              <label htmlFor="username">
                Username <span className="required">*</span>
              </label>
              <input
                type="text"
                id="username"
                value={formData.username}
                onChange={(e) => _handleFieldChange('username', e.target.value)}
                placeholder="Enter username"
                className={errors.username ? 'input-error' : ''}
                autoFocus
              />
              {errors.username && (
                <div className="error-message">{errors.username}</div>
              )}
              <div className="field-hint">
                3-50 characters, letters, numbers, underscore only
              </div>
            </div>
          )}

          {/* Email */}
          <div className="form-group">
            <label htmlFor="email">
              Email <span className="required">*</span>
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => _handleFieldChange('email', e.target.value)}
              placeholder="Enter email address"
              className={errors.email ? 'input-error' : ''}
            />
            {errors.email && (
              <div className="error-message">{errors.email}</div>
            )}
          </div>

          {/* Display Name */}
          <div className="form-group">
            <label htmlFor="display_name">
              Display Name <span className="required">*</span>
            </label>
            <input
              type="text"
              id="display_name"
              value={formData.display_name}
              onChange={(e) => _handleFieldChange('display_name', e.target.value)}
              placeholder="Enter display name"
              className={errors.display_name ? 'input-error' : ''}
            />
            {errors.display_name && (
              <div className="error-message">{errors.display_name}</div>
            )}
            <div className="field-hint">
              Full name or display name (3-100 characters)
            </div>
          </div>

          {/* Role */}
          <div className="form-group">
            <label htmlFor="role">
              Role <span className="required">*</span>
            </label>
            <select
              id="role"
              value={formData.role}
              onChange={(e) => _handleFieldChange('role', e.target.value)}
              className={errors.role ? 'input-error' : ''}
            >
              {ROLES.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
            {errors.role && (
              <div className="error-message">{errors.role}</div>
            )}
            <div className="field-hint">
              {ROLES.find((r) => r.value === formData.role)?.description}
            </div>
          </div>

          {/* Active Status */}
          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => _handleFieldChange('is_active', e.target.checked)}
              />
              <span>Account is active</span>
            </label>
            <div className="field-hint">
              Inactive accounts cannot log in
            </div>
          </div>

          {/* Password info for create mode */}
          {mode === 'create' && (
            <div className="info-box">
              <strong>🔐 Password:</strong> The initial password will be set to the username.
              The user will be forced to change their password on first login.
            </div>
          )}
        </form>

        <div className="modal-footer">
          <button
            type="button"
            className="btn-secondary"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary"
            onClick={_handleSubmit}
          >
            {mode === 'create' ? '➕ Create Admin' : '💾 Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserModal;
