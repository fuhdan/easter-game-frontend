/**
 * Component: SystemAdminDashboard
 * Purpose: System configuration management interface (admin only)
 * Part of: Easter Quest 2025 Frontend - System Administration
 *
 * Features:
 * - View all system configuration parameters
 * - Edit configuration values with validation
 * - Group by category (Auth, Rate Limits, Security, AI, etc.)
 * - Real-time updates without server restart
 * - Configuration change confirmation
 *
 * Security:
 * - Only accessible to admin role
 * - All changes confirmed via modal
 * - Type validation on client and server
 *
 * @module components/SystemAdminDashboard
 * @since 2025-11-06
 */

import React, { useState, useEffect } from 'react';
import './SystemAdminDashboard.css';
import { getConfig, updateConfig, reloadConfig } from '../../services';
import { validateValue, convertToType } from '../../utils/validators/configValidator';
import GamePackageManagement from '../GamePackageManagement/GamePackageManagement';
import ConfigCategoryFilter from './ConfigCategoryFilter';
import ConfigItem from './ConfigItem';
import ConfirmModal from './ConfirmModal';

function SystemAdminDashboard() {
  // State management
  const [activeTab, setActiveTab] = useState('events'); // 'events', 'system-config'
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
   * Load configuration on component mount
   */
  useEffect(() => {
    _loadConfiguration();
  }, []);

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
   */
  const renderTabNavigation = () => {
    const tabs = [
      { id: 'events', label: '🎮 Events' },
      { id: 'system-config', label: '⚙️ System Config' }
    ];

    return (
      <div className="system-dashboard-tabs">
        {tabs.map((tab) => (
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
   */
  const renderTabContent = () => {
    switch (activeTab) {
      case 'events':
        return <GamePackageManagement />;

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

export default SystemAdminDashboard;
