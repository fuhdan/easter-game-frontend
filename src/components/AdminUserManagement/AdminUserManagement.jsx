/**
 * Module: components/AdminUserManagement/AdminUserManagement.jsx
 * Purpose: Admin user management interface for admin.db
 * Part of: Easter Quest 2025 Frontend - System Admin Panel
 *
 * Features:
 * - List all admin users from admin.db
 * - Create new admin users (initial password = username)
 * - Edit admin details (email, display_name, role, is_active)
 * - Reset admin passwords (password = username)
 * - Delete admin users (with safety checks)
 * - All actions logged via backend application logging
 *
 * Access: system_admin role only
 *
 * @since 2026-03-18
 * @updated 2026-03-18 - Removed audit log (backend logging only)
 */

import React, { useState, useEffect } from 'react';
import { logger } from '../../utils/logger';
import {
  listAdminUsers,
  createAdminUser,
  updateAdminUser,
  resetAdminPassword,
  deleteAdminUser
} from '../../services/admin';
import UserTable from './UserTable';
import UserModal from './UserModal';
import './AdminUserManagement.css';

const AdminUserManagement = ({ user }) => {
  // State management
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
  const [selectedUser, setSelectedUser] = useState(null);

  // Load users on mount
  useEffect(() => {
    _loadUsers();
  }, []);

  /**
   * Load all admin users
   * @private
   */
  const _loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      logger.info('admin_load_users', { module: 'AdminUserManagement' });

      const response = await listAdminUsers();
      setUsers(response);

      logger.info('admin_users_loaded', {
        count: response.length,
        module: 'AdminUserManagement'
      });
    } catch (err) {
      logger.error('admin_load_users_failed', {
        error: err.message,
        module: 'AdminUserManagement'
      }, err);
      setError(err.getUserMessage ? err.getUserMessage() : 'Failed to load admin users');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle create new user button click
   * @private
   */
  const _handleCreateClick = () => {
    setModalMode('create');
    setSelectedUser(null);
    setShowModal(true);
    logger.info('admin_open_create_modal', { module: 'AdminUserManagement' });
  };

  /**
   * Handle edit user button click
   * @private
   * @param {Object} user - User to edit
   */
  const _handleEditClick = (user) => {
    setModalMode('edit');
    setSelectedUser(user);
    setShowModal(true);
    logger.info('admin_open_edit_modal', {
      userId: user.id,
      module: 'AdminUserManagement'
    });
  };

  /**
   * Handle reset password button click
   * @private
   * @param {Object} user - User whose password to reset
   */
  const _handleResetPasswordClick = async (user) => {
    if (!window.confirm(
      `Reset password for ${user.username}?\n\n` +
      `Password will be reset to the username (${user.username}).\n` +
      `User will be forced to change password on next login.`
    )) {
      return;
    }

    try {
      logger.info('admin_reset_password_start', {
        userId: user.id,
        module: 'AdminUserManagement'
      });

      const response = await resetAdminPassword(user.id);

      logger.info('admin_reset_password_success', {
        userId: user.id,
        module: 'AdminUserManagement'
      });

      await _loadUsers();
    } catch (err) {
      logger.error('admin_reset_password_failed', {
        userId: user.id,
        error: err.message,
        module: 'AdminUserManagement'
      }, err);
      alert(err.getUserMessage ? err.getUserMessage() : 'Failed to reset password');
    }
  };

  /**
   * Handle delete user button click
   * @private
   * @param {Object} user - User to delete
   */
  const _handleDeleteClick = async (user) => {
    if (!window.confirm(
      `Delete admin user '${user.username}'?\n\n` +
      `This action cannot be undone.`
    )) {
      return;
    }

    try {
      logger.warn('admin_delete_user_start', {
        userId: user.id,
        module: 'AdminUserManagement'
      });

      await deleteAdminUser(user.id);

      logger.info('admin_delete_user_success', {
        userId: user.id,
        module: 'AdminUserManagement'
      });

      await _loadUsers();
    } catch (err) {
      logger.error('admin_delete_user_failed', {
        userId: user.id,
        error: err.message,
        module: 'AdminUserManagement'
      }, err);

      if (err.status === 400) {
        alert(
          'Cannot delete this admin user:\n\n' +
          (err.data?.detail || 'You cannot delete yourself or the last admin.')
        );
      } else {
        alert(err.getUserMessage ? err.getUserMessage() : 'Failed to delete user');
      }
    }
  };

  /**
   * Handle modal save (create or edit)
   * @private
   * @param {Object} userData - User data from modal
   */
  const _handleModalSave = async (userData) => {
    try {
      if (modalMode === 'create') {
        logger.info('admin_create_user_start', {
          username: userData.username,
          module: 'AdminUserManagement'
        });

        await createAdminUser(userData);

        logger.info('admin_create_user_success', {
          module: 'AdminUserManagement'
        });
      } else {
        logger.info('admin_update_user_start', {
          userId: selectedUser.id,
          module: 'AdminUserManagement'
        });

        await updateAdminUser(selectedUser.id, userData);

        logger.info('admin_update_user_success', {
          userId: selectedUser.id,
          module: 'AdminUserManagement'
        });
      }

      setShowModal(false);
      await _loadUsers();
    } catch (err) {
      logger.error(`admin_${modalMode}_user_failed`, {
        error: err.message,
        module: 'AdminUserManagement'
      }, err);

      if (err.status === 400 && err.data?.detail?.includes('already exists')) {
        alert('Username already exists. Please choose a different username.');
      } else {
        alert(err.getUserMessage ? err.getUserMessage() : `Failed to ${modalMode} user`);
      }
    }
  };

  /**
   * Handle modal cancel
   * @private
   */
  const _handleModalCancel = () => {
    setShowModal(false);
    setSelectedUser(null);
    logger.debug('admin_modal_cancelled', { module: 'AdminUserManagement' });
  };

  // Render loading state
  if (loading && users.length === 0) {
    return (
      <div className="admin-user-management-container">
        <div className="loading-spinner">Loading admin users...</div>
      </div>
    );
  }

  return (
    <div className="admin-user-management-container">
      {/* Header */}
      <div className="admin-users-header">
        <div className="header-info">
          <h2>👤 Admin User Management</h2>
          <p className="header-description">
            Create and manage administrator accounts with different permission levels.
          </p>
        </div>
        <button
          className="btn-primary btn-create-user"
          onClick={_handleCreateClick}
        >
          ➕ Create New Admin
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="error-banner">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
          <button className="btn-retry" onClick={_loadUsers}>
            🔄 Retry
          </button>
        </div>
      )}

      {/* User table */}
      <UserTable
        users={users}
        currentUserId={user.id}
        onEdit={_handleEditClick}
        onResetPassword={_handleResetPasswordClick}
        onDelete={_handleDeleteClick}
      />

      {/* User modal (create/edit) */}
      {showModal && (
        <UserModal
          mode={modalMode}
          user={selectedUser}
          onSave={_handleModalSave}
          onCancel={_handleModalCancel}
        />
      )}
    </div>
  );
};

export default AdminUserManagement;
