/**
 * Module: components/AdminUserManagement/UserTable.jsx
 * Purpose: Display table of admin users with action buttons
 * Part of: Easter Quest 2025 Frontend - Admin User Management
 *
 * Features:
 * - Display all admin users in a table
 * - Show role badges with colors
 * - Show status indicators (active/inactive, password change required)
 * - Action buttons (Edit, Reset Password, Delete)
 * - Disable Delete button for current user
 * - Format timestamps for readability
 *
 * @since 2026-03-18
 */

import React from 'react';
import { formatDistanceToNow } from 'date-fns';

/**
 * Get role badge class based on role
 * @param {string} role - Admin role
 * @returns {string} CSS class name
 */
const getRoleBadgeClass = (role) => {
  switch (role) {
    case 'admin':
      return 'role-badge role-admin';
    case 'system_admin':
      return 'role-badge role-system-admin';
    case 'game_admin':
      return 'role-badge role-game-admin';
    case 'content_admin':
      return 'role-badge role-content-admin';
    default:
      return 'role-badge role-default';
  }
};

/**
 * Get user-friendly role label
 * @param {string} role - Admin role
 * @returns {string} Display label
 */
const getRoleLabel = (role) => {
  switch (role) {
    case 'admin':
      return 'Admin';
    case 'system_admin':
      return 'System Admin';
    case 'game_admin':
      return 'Game Admin';
    case 'content_admin':
      return 'Content Admin';
    default:
      return role;
  }
};

/**
 * Format timestamp to relative time
 * @param {string} timestamp - ISO timestamp
 * @returns {string} Relative time (e.g., "2 hours ago")
 */
const formatRelativeTime = (timestamp) => {
  if (!timestamp) return 'Never';
  try {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  } catch {
    return 'Invalid date';
  }
};

const UserTable = ({ users, currentUserId, onEdit, onResetPassword, onDelete }) => {
  if (users.length === 0) {
    return (
      <div className="user-table-empty">
        <p>No admin users found</p>
      </div>
    );
  }

  return (
    <div className="user-table-container">
      <table className="user-table">
        <thead>
          <tr>
            <th>Username</th>
            <th>Display Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>Created</th>
            <th>Last Login</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => {
            const isCurrentUser = user.id === currentUserId;

            return (
              <tr key={user.id} className={isCurrentUser ? 'current-user-row' : ''}>
                {/* Username */}
                <td className="username-cell">
                  {user.username}
                  {isCurrentUser && (
                    <span className="current-user-badge" title="This is you">
                      (You)
                    </span>
                  )}
                </td>

                {/* Display Name */}
                <td>{user.display_name}</td>

                {/* Email */}
                <td className="email-cell">{user.email}</td>

                {/* Role */}
                <td>
                  <span className={getRoleBadgeClass(user.role)}>
                    {getRoleLabel(user.role)}
                  </span>
                </td>

                {/* Status */}
                <td className="status-cell">
                  {user.is_active ? (
                    <span className="status-badge status-active">✓ Active</span>
                  ) : (
                    <span className="status-badge status-inactive">✗ Inactive</span>
                  )}
                  {user.requires_password_change && (
                    <span
                      className="status-badge status-password-change"
                      title="User must change password on next login"
                    >
                      🔐 Password Change Required
                    </span>
                  )}
                </td>

                {/* Created */}
                <td className="timestamp-cell" title={user.created_at}>
                  {formatRelativeTime(user.created_at)}
                </td>

                {/* Last Login */}
                <td className="timestamp-cell" title={user.last_login}>
                  {formatRelativeTime(user.last_login)}
                </td>

                {/* Actions */}
                <td className="actions-cell">
                  <button
                    className="btn-action btn-edit"
                    onClick={() => onEdit(user)}
                    title="Edit user details"
                  >
                    ✏️
                  </button>
                  <button
                    className="btn-action btn-reset-password"
                    onClick={() => onResetPassword(user)}
                    title="Reset password"
                  >
                    🔑
                  </button>
                  <button
                    className="btn-action btn-delete"
                    onClick={() => onDelete(user)}
                    disabled={isCurrentUser}
                    title={
                      isCurrentUser
                        ? 'You cannot delete yourself'
                        : 'Delete user'
                    }
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default UserTable;
