/**
 * Component: CategoryModal
 * Purpose: Modal for creating/editing game categories
 * Part of: Easter Quest 2025 Frontend - Game Package Management
 *
 * Features:
 * - Create/edit category
 * - Visual customization (icon, color)
 * - Display order management
 *
 * @since 2025-11-20
 */

import React from 'react';

function CategoryModal({ category, formData, onFormChange, onSave, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>{category ? '✏️ Edit' : '➕ Create'} Game Category</h3>
        <div className="modal-body">
          <div className="form-group">
            <label>Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => onFormChange({ ...formData, name: e.target.value })}
              placeholder="e.g., Puzzle, Network, SQL"
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => onFormChange({ ...formData, description: e.target.value })}
              placeholder="Brief description of this category..."
              rows="2"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Icon (Emoji)</label>
              <input
                type="text"
                value={formData.icon}
                onChange={(e) => onFormChange({ ...formData, icon: e.target.value })}
                placeholder="🎮"
                maxLength="2"
              />
            </div>

            <div className="form-group">
              <label>Color (Hex)</label>
              <input
                type="color"
                value={formData.color}
                onChange={(e) => onFormChange({ ...formData, color: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Order Index</label>
              <input
                type="number"
                value={formData.order_index}
                onChange={(e) => onFormChange({ ...formData, order_index: parseInt(e.target.value) })}
                min="0"
              />
            </div>
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn btn-success" onClick={onSave}>
            ✓ {category ? 'Save Changes' : 'Create Category'}
          </button>
          <button className="btn btn-outline" onClick={onClose}>
            ✕ Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default CategoryModal;
