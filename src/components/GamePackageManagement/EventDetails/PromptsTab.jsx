/**
 * Component: PromptsTab
 * Purpose: Manage AI system prompts
 * Part of: Easter Quest 2025 Frontend - Game Package Management
 *
 * Features:
 * - List prompts grouped by category
 * - Create/edit/delete prompts
 * - Toggle active status
 *
 * @since 2025-11-20
 */

import React, { useState } from 'react';
import { createSystemPrompt, updateSystemPrompt, deleteSystemPrompt } from '../../../services';
import SystemPromptModal from '../Modals/SystemPromptModal';

const PROMPT_CATEGORY_ORDER = [
  'core_rules',
  'hint_strategy',
  'game_story',
  'company_context',
  'response_templates'
];

function PromptsTab({ systemPrompts, onPromptsChanged }) {
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [promptToDelete, setPromptToDelete] = useState(null);
  const [promptFormData, setPromptFormData] = useState({
    id: null,
    category: 'core_rules',
    name: '',
    content: '',
    description: '',
    priority: 100
  });

  const _handleCreatePrompt = () => {
    setPromptFormData({
      id: null,
      category: 'core_rules',
      name: '',
      content: '',
      description: '',
      priority: 100
    });
    setShowPromptModal(true);
  };

  const _handleEditPrompt = (prompt) => {
    setPromptFormData({
      id: prompt.id,
      category: prompt.category,
      name: prompt.name,
      content: prompt.content,
      description: prompt.description || '',
      priority: prompt.priority
    });
    setShowPromptModal(true);
  };

  const _handleSavePrompt = async () => {
    try {
      if (!promptFormData.category || !promptFormData.name || !promptFormData.content) {
        alert('Please fill in Category, Name, and Content');
        return;
      }

      if (promptFormData.id) {
        await updateSystemPrompt(promptFormData.id, {
          content: promptFormData.content,
          description: promptFormData.description,
          priority: promptFormData.priority
        });
        console.log(`✅ System prompt updated: ${promptFormData.id}`);
      } else {
        await createSystemPrompt(promptFormData);
        console.log(`✅ System prompt created`);
      }

      setShowPromptModal(false);
      if (onPromptsChanged) onPromptsChanged();
    } catch (error) {
      console.error('Failed to save system prompt:', error);
      alert(`❌ Failed to save system prompt: ${error.response?.data?.detail || error.message}`);
    }
  };

  const _handleDeletePrompt = (prompt) => {
    setPromptToDelete(prompt);
    setShowDeleteModal(true);
  };

  const _confirmDeletePrompt = async () => {
    try {
      await deleteSystemPrompt(promptToDelete.id);
      console.log(`✅ System prompt deleted: ${promptToDelete.id}`);

      setShowDeleteModal(false);
      setPromptToDelete(null);
      if (onPromptsChanged) onPromptsChanged();
    } catch (error) {
      console.error('Failed to delete prompt:', error);
      alert(`❌ Failed to delete prompt: ${error.response?.data?.detail || error.message}`);
    }
  };

  const _handleTogglePromptActive = async (prompt) => {
    try {
      const newStatus = !prompt.is_active;
      await updateSystemPrompt(prompt.id, { is_active: newStatus });
      console.log(`✅ System prompt ${newStatus ? 'activated' : 'deactivated'}: ${prompt.id}`);
      if (onPromptsChanged) onPromptsChanged();
    } catch (error) {
      console.error('Failed to toggle prompt status:', error);
      alert(`❌ Failed to update prompt status`);
    }
  };

  const _getGroupedPrompts = () => {
    const grouped = systemPrompts.reduce((acc, prompt) => {
      if (!acc[prompt.category]) acc[prompt.category] = [];
      acc[prompt.category].push(prompt);
      return acc;
    }, {});

    return PROMPT_CATEGORY_ORDER
      .filter(cat => grouped[cat])
      .map(cat => [cat, grouped[cat]]);
  };

  return (
    <>
      <div className="prompts-section">
        <div className="prompts-header">
          <button className="btn btn-success" onClick={_handleCreatePrompt}>
            ➕ Create New System Prompt
          </button>
        </div>

        <div className="prompts-list">
          {_getGroupedPrompts().map(([category, prompts]) => (
            <div key={category} className="prompt-category-group">
              <h4 className="category-header">{category}</h4>
              {prompts.map(prompt => (
                <div key={prompt.id} className={`prompt-card ${!prompt.is_active ? 'inactive' : ''}`}>
                  <div className="prompt-header">
                    <div className="prompt-title">
                      <strong>{prompt.name}</strong>
                      <span className="priority-badge">Priority: {prompt.priority}</span>
                    </div>
                    <div className="prompt-status">
                      {prompt.is_active ? (
                        <span className="badge badge-success">Active</span>
                      ) : (
                        <span className="badge badge-secondary">Inactive</span>
                      )}
                    </div>
                  </div>

                  {prompt.description && (
                    <p className="prompt-description">{prompt.description}</p>
                  )}

                  <div className="prompt-content">
                    {prompt.content.substring(0, 200)}
                    {prompt.content.length > 200 && '...'}
                  </div>

                  <div className="prompt-meta">
                    <span>Version: {prompt.version}</span>
                    {prompt.times_used > 0 && (
                      <span>Used: {prompt.times_used} times</span>
                    )}
                  </div>

                  <div className="prompt-actions">
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => _handleEditPrompt(prompt)}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      className={`btn btn-sm ${prompt.is_active ? 'btn-warning' : 'btn-success'}`}
                      onClick={() => _handleTogglePromptActive(prompt)}
                    >
                      {prompt.is_active ? '⏸️ Deactivate' : '▶️ Activate'}
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => _handleDeletePrompt(prompt)}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ))}

          {systemPrompts.length === 0 && (
            <div className="empty-state">
              <p>No system prompts found. Create prompts to control AI behavior!</p>
            </div>
          )}
        </div>
      </div>

      {showPromptModal && (
        <SystemPromptModal
          prompt={promptFormData.id ? promptFormData : null}
          formData={promptFormData}
          onFormChange={setPromptFormData}
          onSave={_handleSavePrompt}
          onClose={() => setShowPromptModal(false)}
        />
      )}

      {showDeleteModal && promptToDelete && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>⚠️ Delete System Prompt</h3>
            <div className="modal-body">
              <p><strong>Name:</strong> {promptToDelete.name}</p>
              <p><strong>Category:</strong> {promptToDelete.category}</p>
              <p><strong>Priority:</strong> {promptToDelete.priority}</p>
              <p className="warning-text">
                ⚠️ This will permanently delete this system prompt.
                This action cannot be undone!
              </p>
            </div>
            <div className="modal-actions">
              <button className="btn btn-outline danger" onClick={_confirmDeletePrompt}>
                🗑️ Delete Prompt
              </button>
              <button className="btn btn-outline" onClick={() => setShowDeleteModal(false)}>
                ✕ Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default PromptsTab;
