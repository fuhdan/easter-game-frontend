/**
 * Component: SystemPromptModal
 * Purpose: Modal for creating/editing AI system prompts
 * Part of: Easter Quest 2025 Frontend - Game Package Management
 *
 * Features:
 * - Create/edit system prompts
 * - Select category and priority
 * - Edit prompt content
 *
 * @since 2025-11-20
 */

import React from 'react';

const PROMPT_CATEGORIES = [
  { value: 'core_rules', label: 'Core Rules' },
  { value: 'company_context', label: 'Company Context' },
  { value: 'hint_strategy', label: 'Hint Strategy' },
  { value: 'response_templates', label: 'Response Templates' },
  { value: 'game_story', label: 'Game Story' }
];

function SystemPromptModal({ prompt, formData, onFormChange, onSave, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
        <h3>{prompt ? '✏️ Edit' : '➕ Create'} System Prompt</h3>
        <div className="modal-body">
          <div className="form-group">
            <label>Category *</label>
            <select
              value={formData.category}
              onChange={(e) => onFormChange({ ...formData, category: e.target.value })}
              disabled={!!prompt}
            >
              {PROMPT_CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => onFormChange({ ...formData, name: e.target.value })}
              placeholder="e.g., progressive_hints"
              disabled={!!prompt}
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => onFormChange({ ...formData, description: e.target.value })}
              placeholder="What does this prompt do?"
              rows="2"
            />
          </div>

          <div className="form-group">
            <label>Content *</label>
            <textarea
              value={formData.content}
              onChange={(e) => onFormChange({ ...formData, content: e.target.value })}
              placeholder="The actual prompt text for the AI..."
              rows="8"
            />
          </div>

          <div className="form-group">
            <label>Priority</label>
            <input
              type="number"
              value={formData.priority}
              onChange={(e) => onFormChange({ ...formData, priority: parseInt(e.target.value) })}
              placeholder="Lower = higher priority (default: 100)"
            />
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn btn-success" onClick={onSave}>
            ✓ {prompt ? 'Save Changes' : 'Create Prompt'}
          </button>
          <button className="btn btn-outline" onClick={onClose}>
            ✕ Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default SystemPromptModal;
