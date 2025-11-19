/**
 * Component: SystemAdminDashboard
 * Purpose: System configuration management interface (super_admin only)
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
 * - Only accessible to super_admin role
 * - All changes confirmed via modal
 * - Type validation on client and server
 *
 * @module components/SystemAdminDashboard
 * @since 2025-11-06
 */

import React, { useState, useEffect } from 'react';
import './SystemAdminDashboard.css';
import api from '../../services/api';
import GamePackageManagement from '../GamePackageManagement/GamePackageManagement';

/**
 * Convert config key to user-friendly label
 * @param {string} key - Configuration key (e.g., "rate_limits.login.max_attempts")
 * @returns {string} - Friendly label (e.g., "Max Login Attempts")
 */
const getConfigLabel = (key) => {
  // Custom labels for specific keys
  const customLabels = {
    'auth.access_token_minutes': 'Access Token Lifetime',
    'auth.refresh_token_days': 'Refresh Token Lifetime',
    'auth.session_timeout_seconds': 'Session Timeout',
    'auth.login_max_attempts': 'Max Login Attempts',
    'auth.login_window_seconds': 'Login Rate Limit Window',
    'auth.login_ban_duration_seconds': 'Login Ban Duration',
    'rate_limits.api.max_requests': 'Max API Requests',
    'rate_limits.api.window_seconds': 'API Rate Limit Window',
    'rate_limits.ai.max_requests': 'Max AI Requests',
    'rate_limits.ai.window_minutes': 'AI Rate Limit Window',
    'rate_limits.chat.max_messages': 'Max Chat Messages',
    'rate_limits.chat.window_minutes': 'Chat Rate Limit Window',
    'rate_limits.admin_chat.max_messages': 'Max Admin Chat Messages',
    'rate_limits.admin_chat.window_minutes': 'Admin Chat Rate Limit Window',
    'rate_limits.escalations.max_requests': 'Max Escalation Requests',
    'rate_limits.escalations.window_minutes': 'Escalation Rate Limit Window',
    'security.prompt_injection_threshold': 'Prompt Injection Threshold',
    'security.safe_context_reduction': 'Safe Context Score Reduction',
    'security.max_message_length': 'Max Message Length',
    'security.password_reset_ttl': 'Password Reset Token TTL',
    'ai.ollama_timeout': 'Ollama API Timeout',
    'ai.max_tokens': 'Max AI Response Tokens',
    'ai.temperature': 'AI Temperature',
    'ai.top_p': 'AI Top P (nucleus sampling)',
    'ai.health_check_timeout': 'AI Health Check Timeout',
    'websocket.message_timeout': 'WebSocket Message Timeout',
    'websocket.max_reconnect_attempts': 'Max WebSocket Reconnect Attempts',
    'websocket.reconnect_delay_ms': 'WebSocket Reconnect Delay',
    'cache.team_context_ttl': 'Team Context Cache TTL',
    'game.stuck_threshold_medium_minutes': 'Medium Stuck Threshold',
    'game.stuck_threshold_high_minutes': 'High Stuck Threshold',
    'notifications.deduplication_window_minutes': 'Notification Dedup Window',
  };

  // Return custom label if exists
  if (customLabels[key]) {
    return customLabels[key];
  }

  // Fallback: Convert last part of key to title case
  const lastPart = key.split('.').pop();
  return lastPart
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

function SystemAdminDashboard() {
  // State management
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
    loadConfiguration();
  }, []);

  /**
   * Fetch configuration from backend API
   */
  const loadConfiguration = async () => {
    try {
      setLoading(true);
      setError(null);

      // GET /api/system/config via api.system.getConfig()
      const response = await api.system.getConfig();

      setConfigs(response.configs);
      setCategories(['all', ...response.categories]);

      console.log(`Loaded ${response.total} configuration entries`);
    } catch (error) {
      console.error('Failed to load configuration:', error);
      setError('Failed to load configuration. Please check your permissions.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Start editing a configuration value
   */
  const handleEditStart = (config) => {
    setEditingKey(config.key);
    setEditValue(config.value);
  };

  /**
   * Cancel editing
   */
  const handleEditCancel = () => {
    setEditingKey(null);
    setEditValue('');
  };

  /**
   * Save edited value (opens confirmation modal)
   */
  const handleEditSave = (config) => {
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
   * Validate configuration value
   */
  const validateValue = (value, valueType, config) => {
    // Type validation
    if (valueType === 'int') {
      const intValue = parseInt(value);
      if (isNaN(intValue)) {
        return 'Value must be an integer';
      }

      // Min/max validation
      if (config.min_value !== null && intValue < config.min_value) {
        return `Value must be >= ${config.min_value}`;
      }
      if (config.max_value !== null && intValue > config.max_value) {
        return `Value must be <= ${config.max_value}`;
      }
    } else if (valueType === 'float') {
      const floatValue = parseFloat(value);
      if (isNaN(floatValue)) {
        return 'Value must be a number';
      }

      // Min/max validation
      if (config.min_value !== null && floatValue < config.min_value) {
        return `Value must be >= ${config.min_value}`;
      }
      if (config.max_value !== null && floatValue > config.max_value) {
        return `Value must be <= ${config.max_value}`;
      }
    } else if (valueType === 'bool') {
      const lowerValue = value.toLowerCase();
      if (!['true', 'false', '1', '0'].includes(lowerValue)) {
        return 'Value must be true/false or 1/0';
      }
    }

    return null; // No error
  };

  /**
   * Confirm and apply configuration change
   */
  const confirmChange = async () => {
    try {
      const { config, newValue } = pendingChange;

      // Convert value to appropriate type
      let typedValue = newValue;
      if (config.value_type === 'int') {
        typedValue = parseInt(newValue);
      } else if (config.value_type === 'float') {
        typedValue = parseFloat(newValue);
      } else if (config.value_type === 'bool') {
        typedValue = newValue === 'true' || newValue === '1';
      }

      // PATCH /api/system/config/{key} via api.system.updateConfig()
      await api.system.updateConfig(config.key, typedValue);

      // Reload configuration to show updated value
      await loadConfiguration();

      // Reset editing state
      setEditingKey(null);
      setEditValue('');
      setShowConfirmModal(false);
      setPendingChange(null);

      // Show success message
      console.log(`✅ Configuration updated: ${config.key} = ${typedValue}`);
    } catch (error) {
      console.error('Failed to update configuration:', error);
      alert(`❌ Failed to update configuration: ${error.response?.data?.detail || error.message}`);
    }
  };

  /**
   * Reload configuration cache (force refresh)
   */
  const handleReloadCache = async () => {
    if (!window.confirm('🔄 Reload configuration cache? This will clear all cached values.')) {
      return;
    }

    try {
      // POST /api/system/config/reload via api.system.reloadConfig()
      await api.system.reloadConfig();
      await loadConfiguration();
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

  return (
    <div className="system-admin-dashboard">
      {/* Game Package Management Card (includes AI Training and System Prompts) */}
      <GamePackageManagement />

      {/* System Configuration Card */}
      <div className="system-config-card">
        <div className="card-header">
          ⚙️ System Configuration
          <div className="header-actions">
            <button className="btn-header-action" onClick={loadConfiguration}>
              🔄 Reload
            </button>
            <button className="btn-header-action" onClick={handleReloadCache}>
              💾 Clear Cache
            </button>
          </div>
        </div>

        <div className="card-body">
          {/* Category Filter */}
          <div className="category-filter">
            {categories.map(cat => (
              <button
                key={cat}
                className={`category-btn ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat === 'all' ? 'All Categories' : cat}
              </button>
            ))}
          </div>

          {/* Configuration Sections by Category */}
          {Object.entries(groupedConfigs).map(([category, categoryConfigs]) => (
            <div key={category} className="config-category-section">
              <div className="section-header">
                <h3>{category}</h3>
              </div>
          <div className="config-grid">
            {categoryConfigs.map(config => (
              <div key={config.key} className="config-item">
                <div className="config-label">
                  <div className="config-title">
                    {getConfigLabel(config.key)}
                    <span className="config-type">{config.value_type}</span>
                  </div>
                </div>
                <div className="config-key">
                  {config.key}
                </div>
                <div className="config-description">{config.description}</div>

                {/* Editing Mode */}
                {editingKey === config.key ? (
                  <div className="config-edit">
                    {config.value_type === 'bool' ? (
                      <select
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="config-input"
                      >
                        <option value="true">true</option>
                        <option value="false">false</option>
                      </select>
                    ) : (
                      <input
                        type={config.value_type === 'int' || config.value_type === 'float' ? 'number' : 'text'}
                        step={config.value_type === 'float' ? '0.1' : '1'}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="config-input"
                      />
                    )}
                    <button className="btn btn-success btn-sm" onClick={() => handleEditSave(config)}>
                      ✓ Save
                    </button>
                    <button className="btn btn-outline btn-sm" onClick={handleEditCancel}>
                      ✕ Cancel
                    </button>
                  </div>
                ) : (
                  /* Display Mode */
                  <div className="config-display">
                    <span className="config-value">{config.value}</span>
                    <button className="btn btn-primary btn-sm" onClick={() => handleEditStart(config)}>
                      ✏️ Edit
                    </button>
                  </div>
                )}

                {/* Metadata */}
                {config.updated_by && (
                  <div className="config-meta">
                    Last updated by {config.updated_by} on {new Date(config.updated_at).toLocaleString()}
                  </div>
                )}

                {/* Constraints */}
                {(config.min_value !== null || config.max_value !== null) && (
                  <div className="config-constraints">
                    {config.min_value !== null && <span>Min: {config.min_value}</span>}
                    {config.max_value !== null && <span>Max: {config.max_value}</span>}
                  </div>
                )}
              </div>
            ))}
          </div>
            </div>
          ))}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && pendingChange && (
        <div className="modal-overlay" onClick={() => setShowConfirmModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>⚠️ Confirm Configuration Change</h3>
            <div className="modal-body">
              <p><strong>Key:</strong> {pendingChange.config.key}</p>
              <p><strong>Current Value:</strong> {pendingChange.config.value}</p>
              <p><strong>New Value:</strong> {pendingChange.newValue}</p>
              <p className="warning-text">
                ⚠️ This change will take effect immediately for all users. Are you sure?
              </p>
            </div>
            <div className="modal-actions">
              <button className="btn btn-success" onClick={confirmChange}>
                ✓ Confirm Change
              </button>
              <button className="btn btn-outline" onClick={() => setShowConfirmModal(false)}>
                ✕ Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SystemAdminDashboard;
