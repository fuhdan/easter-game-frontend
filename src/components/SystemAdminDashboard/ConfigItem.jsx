/**
 * Component: ConfigItem
 * Purpose: Individual configuration item display and edit
 * Part of: Easter Quest 2025 Frontend - System Administration
 *
 * Features:
 * - Display config label, key, description, value
 * - Switch between display and edit modes
 * - Show metadata (last updated by/when)
 * - Show constraints (min/max values)
 *
 * @since 2025-11-20
 */

import React from 'react';
import ConfigEditForm from './ConfigEditForm';

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

/**
 * ConfigItem - Individual configuration parameter display/edit
 *
 * @param {Object} props
 * @param {Object} props.config - Configuration object
 * @param {boolean} props.isEditing - Whether this config is being edited
 * @param {string} props.editValue - Current edit value (when editing)
 * @param {Function} props.onEditStart - Start editing callback
 * @param {Function} props.onEditCancel - Cancel editing callback
 * @param {Function} props.onEditSave - Save changes callback
 * @param {Function} props.onEditValueChange - Edit value change callback
 * @returns {JSX.Element}
 *
 * @example
 * <ConfigItem
 *   config={config}
 *   isEditing={editingKey === config.key}
 *   editValue={editValue}
 *   onEditStart={handleEditStart}
 *   onEditCancel={handleEditCancel}
 *   onEditSave={handleEditSave}
 *   onEditValueChange={setEditValue}
 * />
 */
function ConfigItem({
  config,
  isEditing,
  editValue,
  onEditStart,
  onEditCancel,
  onEditSave,
  onEditValueChange
}) {
  return (
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
      {isEditing ? (
        <ConfigEditForm
          config={config}
          editValue={editValue}
          onValueChange={onEditValueChange}
          onSave={() => onEditSave(config)}
          onCancel={onEditCancel}
        />
      ) : (
        /* Display Mode */
        <div className="config-display">
          <span className="config-value">{config.value}</span>
          <button className="btn btn-primary btn-sm" onClick={() => onEditStart(config)}>
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
  );
}

export default ConfigItem;
