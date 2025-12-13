/**
 * Component: SystemAdminDashboard
 * Purpose: System configuration management interface
 * Part of: Easter Quest 2025 Frontend - System Administration
 *
 * Features:
 * - View all system configuration parameters
 * - Edit configuration values with validation
 * - Group by category (Auth, Rate Limits, Security, AI, etc.)
 * - Real-time updates without server restart
 * - Configuration change confirmation
 * - Role-based tab visibility
 *
 * Security:
 * - Accessible to admin, content_admin, system_admin roles
 * - content_admin: Events tab only (game/puzzle management)
 * - system_admin: System Config tab only
 * - admin: All tabs
 * - All changes confirmed via modal
 * - Type validation on client and server
 *
 * @module components/SystemAdminDashboard
 * @since 2025-11-06
 * @updated 2025-12-07 - Added role-based tab visibility
 */

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import './SystemAdminDashboard.css';
import { getConfig, updateConfig, reloadConfig } from '../../services';
import { validateValue, convertToType } from '../../utils/validators/configValidator';
import GamePackageManagement from '../GamePackageManagement/GamePackageManagement';
import ConfigCategoryFilter from './ConfigCategoryFilter';
import ConfigItem from './ConfigItem';
import ConfirmModal from './ConfirmModal';
import AISettings from '../AISettings/AISettings';

function SystemAdminDashboard({ user }) {
  /**
   * Determine default tab based on user role
   * - content_admin: Can only see Events
   * - system_admin: Can only see System Config
   * - admin: Defaults to Events but can see both
   */
  const getDefaultTab = () => {
    if (user?.role === 'system_admin') {
      return 'system-config';
    }
    // admin and content_admin both default to events
    return 'events';
  };

  // State management
  const [activeTab, setActiveTab] = useState(getDefaultTab); // 'events', 'system-config'
  const [configs, setConfigs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [editingKey, setEditingKey] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingChange, setPendingChange] = useState(null);
  const [error, setError] = useState(null);

  /**
   * Check if user can access a specific tab
   * - admin: All tabs
   * - content_admin: Events only
   * - system_admin: System Config and AI Settings
   *
   * @param {string} tabId - Tab identifier
   * @returns {boolean} Whether user can access the tab
   */
  const canAccessTab = (tabId) => {
    const role = user?.role;

    if (role === 'admin') {
      return true; // Admin can access all tabs
    }
    if (role === 'content_admin') {
      return tabId === 'events'; // Content admin only sees Events
    }
    if (role === 'system_admin') {
      return tabId === 'system-config' || tabId === 'ai-settings'; // System admin sees System Config and AI Settings
    }
    return false;
  };

  /**
   * Load configuration on component mount - only if user can access system-config tab
   * content_admin doesn't need system config, they only see Events
   */
  useEffect(() => {
    // Only load system configuration if user has access to system-config tab
    if (canAccessTab('system-config')) {
      _loadConfiguration();
    } else {
      // For content_admin, skip loading config and set loading to false
      setLoading(false);
    }
  }, [user?.role]);

  /**
   * Fetch configuration from backend API
   *
   * @private
   */
  const _loadConfiguration = async () => {
    try {
      setLoading(true);
      setError(null);

      // GET /api/system/config via getConfig()
      const response = await getConfig();

      setConfigs(response.configs);
      setCategories(['all', ...response.categories]);
    } catch (error) {
      console.error('Failed to load configuration:', error);
      setError('Failed to load configuration. Please check your permissions.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Start editing a configuration value
   *
   * @param {Object} config - Configuration to edit
   */
  const _handleEditStart = (config) => {
    setEditingKey(config.key);
    setEditValue(config.value);
  };

  /**
   * Cancel editing
   */
  const _handleEditCancel = () => {
    setEditingKey(null);
    setEditValue('');
  };

  /**
   * Save edited value (opens confirmation modal)
   *
   * @param {Object} config - Configuration being edited
   */
  const _handleEditSave = (config) => {
    // Validate value before showing modal
    const validationError = validateValue(editValue, config.value_type, config);
    if (validationError) {
      alert(`❌ Validation Error: ${validationError}`);
      return;
    }

    // Open confirmation modal
    setPendingChange({ config, newValue: editValue });
    setShowConfirmModal(true);
  };

  /**
   * Confirm and apply configuration change
   *
   * @private
   */
  const _confirmChange = async () => {
    try {
      const { config, newValue } = pendingChange;

      // Convert value to appropriate type using utility function
      const typedValue = convertToType(newValue, config.value_type);

      // PATCH /api/system/config/{key} via updateConfig()
      await updateConfig(config.key, typedValue);

      // Reload configuration to show updated value
      await _loadConfiguration();

      // Reset editing state
      setEditingKey(null);
      setEditValue('');
      setShowConfirmModal(false);
      setPendingChange(null);
    } catch (error) {
      console.error('Failed to update configuration:', error);
      alert(`❌ Failed to update configuration: ${error.response?.data?.detail || error.message}`);
    }
  };

  /**
   * Reload configuration cache (force refresh)
   *
   * @private
   */
  const _handleReloadCache = async () => {
    if (!window.confirm('🔄 Reload configuration cache? This will clear all cached values.')) {
      return;
    }

    try {
      // POST /api/system/config/reload via reloadConfig()
      await reloadConfig();
      await _loadConfiguration();
      alert('✅ Configuration cache reloaded successfully');
    } catch (error) {
      console.error('Failed to reload cache:', error);
      alert('❌ Failed to reload cache');
    }
  };

  /**
   * Filter configurations by selected category
   */
  const filteredConfigs = selectedCategory === 'all'
    ? configs
    : configs.filter(c => c.category === selectedCategory);

  /**
   * Group configurations by category
   */
  const groupedConfigs = filteredConfigs.reduce((acc, config) => {
    if (!acc[config.category]) {
      acc[config.category] = [];
    }
    acc[config.category].push(config);
    return acc;
  }, {});

  // Loading state
  if (loading) {
    return <div className="loading">Loading configuration...</div>;
  }

  // Error state
  if (error) {
    return <div className="error-message">{error}</div>;
  }

  /**
   * Render tab navigation
   * Filters tabs based on user role permissions
   */
  const renderTabNavigation = () => {
    const allTabs = [
      { id: 'events', label: '🎮 Events' },
      { id: 'system-config', label: '⚙️ System Config' },
      { id: 'ai-settings', label: '🤖 AI Settings' }
    ];

    // Filter tabs based on role permissions
    const visibleTabs = allTabs.filter(tab => canAccessTab(tab.id));

    // Don't show tab navigation if only one tab is accessible
    if (visibleTabs.length <= 1) {
      return null;
    }

    return (
      <div className="system-dashboard-tabs">
        {visibleTabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
            aria-label={`Switch to ${tab.label}`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    );
  };

  /**
   * Render tab content based on active tab
   * Includes security check to prevent unauthorized access
   */
  const renderTabContent = () => {
    // SECURITY: Verify tab access before rendering
    if (!canAccessTab(activeTab)) {
      return (
        <div className="error-message">
          You do not have permission to access this section.
        </div>
      );
    }

    switch (activeTab) {
      case 'events':
        return <GamePackageManagement user={user} />;

      case 'system-config':
        return (
          <div className="system-config-content">
            <div className="config-header-actions">
              <button className="btn-action" onClick={_loadConfiguration}>
                🔄 Reload
              </button>
              <button className="btn-action" onClick={_handleReloadCache}>
                💾 Clear Cache
              </button>
            </div>

            {/* Category Filter */}
            <ConfigCategoryFilter
              categories={categories}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
            />

            {/* Configuration Sections by Category */}
            {Object.entries(groupedConfigs).map(([category, categoryConfigs]) => (
              <div key={category} className="config-category-section">
                <div className="section-header">
                  <h3>{category}</h3>
                </div>
                <div className="config-grid">
                  {categoryConfigs.map(config => (
                    <ConfigItem
                      key={config.key}
                      config={config}
                      isEditing={editingKey === config.key}
                      editValue={editValue}
                      onEditStart={_handleEditStart}
                      onEditCancel={_handleEditCancel}
                      onEditSave={_handleEditSave}
                      onEditValueChange={setEditValue}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        );

      case 'ai-settings':
        return <AISettings />;

      default:
        return null;
    }
  };

  return (
    <div className="system-admin-dashboard">
      <div className="system-dashboard-card-container">
        <div className="card-header">
          <div className="header-title-group">
            <span>🔧 SYSTEM ADMIN DASHBOARD</span>
          </div>
        </div>
        <div className="card-body">
          {renderTabNavigation()}
          <div className="dashboard-content">
            {renderTabContent()}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && pendingChange && (
        <ConfirmModal
          pendingChange={pendingChange}
          onConfirm={_confirmChange}
          onClose={() => setShowConfirmModal(false)}
        />
      )}
    </div>
  );
}

/**
 * PropTypes validation for SystemAdminDashboard
 * Only admin, content_admin, and system_admin roles can access this component
 */
SystemAdminDashboard.propTypes = {
  user: PropTypes.shape({
    role: PropTypes.oneOf(['admin', 'content_admin', 'system_admin']).isRequired
  }).isRequired
};

export default SystemAdminDashboard;
