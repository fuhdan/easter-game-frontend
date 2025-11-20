/**
 * Component: ConfigEditForm
 * Purpose: Inline editing form for configuration values
 * Part of: Easter Quest 2025 Frontend - System Administration
 *
 * Features:
 * - Type-specific input fields (int, float, bool, string)
 * - Client-side validation
 * - Save/Cancel actions
 *
 * @since 2025-11-20
 */

import React from 'react';

/**
 * ConfigEditForm - Inline editing form for config values
 *
 * @param {Object} props
 * @param {Object} props.config - Configuration object being edited
 * @param {string} props.editValue - Current edit value
 * @param {Function} props.onValueChange - Value change callback
 * @param {Function} props.onSave - Save button callback
 * @param {Function} props.onCancel - Cancel button callback
 * @returns {JSX.Element}
 *
 * @example
 * <ConfigEditForm
 *   config={config}
 *   editValue="42"
 *   onValueChange={(val) => setEditValue(val)}
 *   onSave={() => handleSave(config)}
 *   onCancel={() => setEditingKey(null)}
 * />
 */
function ConfigEditForm({ config, editValue, onValueChange, onSave, onCancel }) {
  return (
    <div className="config-edit">
      {/* Boolean input - dropdown */}
      {config.value_type === 'bool' ? (
        <select
          value={editValue}
          onChange={(e) => onValueChange(e.target.value)}
          className="config-input"
        >
          <option value="true">true</option>
          <option value="false">false</option>
        </select>
      ) : (
        /* Number/String input */
        <input
          type={config.value_type === 'int' || config.value_type === 'float' ? 'number' : 'text'}
          step={config.value_type === 'float' ? '0.1' : '1'}
          value={editValue}
          onChange={(e) => onValueChange(e.target.value)}
          className="config-input"
        />
      )}
      <button className="btn btn-success btn-sm" onClick={onSave}>
        ✓ Save
      </button>
      <button className="btn btn-outline btn-sm" onClick={onCancel}>
        ✕ Cancel
      </button>
    </div>
  );
}

export default ConfigEditForm;
