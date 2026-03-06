/**
 * Component: ProvisionTriggerModal
 * Purpose: Modal for creating/editing provision triggers
 * Part of: Easter Quest Frontend - AI Training Management
 *
 * Features:
 * - Create/edit provision trigger for a reward
 * - Select trigger game
 * - Configure API URL and bearer token
 * - Set trigger order
 *
 * @since 2026-03-06
 */

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { logger } from '../../../utils/logger';
import { createProvisionTrigger, updateProvisionTrigger, deleteProvisionTrigger } from '../../../services/rewards';
import './ProvisionTriggerModal.css';

/**
 * Provision Trigger Modal Component
 *
 * @param {Object} props
 * @param {Object} props.reward - The reward this trigger belongs to
 * @param {Object} props.trigger - The trigger being edited (null for new trigger)
 * @param {Array} props.games - List of all games
 * @param {Function} props.onSave - Callback when trigger is saved
 * @param {Function} props.onClose - Callback to close modal
 * @returns {JSX.Element}
 */
function ProvisionTriggerModal({ reward, trigger, games, onSave, onClose }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    trigger_on_game_id: '',
    api_url: '',
    api_bearer_token: '',
    trigger_order: 0
  });

  // Initialize form when editing existing trigger
  useEffect(() => {
    if (trigger) {
      setForm({
        trigger_on_game_id: trigger.trigger_on_game_id || '',
        api_url: trigger.api_url || '',
        api_bearer_token: '', // Don't pre-fill token for security
        trigger_order: trigger.trigger_order || 0
      });
    }
  }, [trigger, reward]);

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.trigger_on_game_id) {
      alert('Please select a trigger game');
      return;
    }

    // Validate API URL for non-internal reward types
    const internalRewardTypes = ['password', 'secret_text'];
    if (!internalRewardTypes.includes(reward.reward_type) && !form.api_url) {
      alert('Please enter an API URL for external provisioning');
      return;
    }

    setLoading(true);

    try {
      if (trigger) {
        // Update existing trigger
        await updateProvisionTrigger(trigger.id, form);
        logger.info('provision_trigger_updated', {
          extra: {
            trigger_id: trigger.id,
            reward_id: reward.id,
            module: 'ProvisionTriggerModal'
          }
        });
      } else {
        // Create new trigger
        const internalRewardTypes = ['password', 'secret_text'];
        const isInternalReward = internalRewardTypes.includes(reward.reward_type);

        await createProvisionTrigger({
          reward_id: reward.id,
          trigger_on_game_id: parseInt(form.trigger_on_game_id),
          // For internal rewards, send null instead of empty string
          api_url: isInternalReward ? null : (form.api_url || null),
          api_bearer_token: isInternalReward ? null : (form.api_bearer_token || null),
          trigger_order: form.trigger_order
        });
        logger.info('provision_trigger_created', {
          extra: {
            reward_id: reward.id,
            module: 'ProvisionTriggerModal'
          }
        });
      }

      onSave();
    } catch (error) {
      logger.error('provision_trigger_save_failed', {
        extra: {
          error: error.message,
          module: 'ProvisionTriggerModal'
        }
      });
      alert(`Failed to save provision trigger: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle trigger deletion
   */
  const handleDelete = async () => {
    if (!trigger) return;

    if (!window.confirm(`Delete this provision trigger?\n\nThis cannot be undone.`)) {
      return;
    }

    setLoading(true);

    try {
      await deleteProvisionTrigger(trigger.id);
      logger.info('provision_trigger_deleted', {
        extra: {
          trigger_id: trigger.id,
          module: 'ProvisionTriggerModal'
        }
      });
      onSave();
    } catch (error) {
      logger.error('provision_trigger_delete_failed', {
        extra: {
          error: error.message,
          module: 'ProvisionTriggerModal'
        }
      });
      alert(`Failed to delete provision trigger: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content provision-trigger-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            {trigger ? '✏️ Edit Provision Trigger' : '⚡ Add Provision Trigger'}
          </h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          <div className="reward-context">
            <strong>Reward:</strong> {reward.display_name} ({reward.reward_type})
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="trigger-game">🎯 Trigger Game *</label>
              <select
                id="trigger-game"
                value={form.trigger_on_game_id}
                onChange={(e) => setForm({ ...form, trigger_on_game_id: e.target.value })}
                className="form-control"
                required
              >
                <option value="">-- Select game --</option>
                {games && games.map(g => (
                  <option key={g.id} value={g.id}>
                    {g.title}
                  </option>
                ))}
              </select>
              <small className="form-hint">
                This reward will be provisioned when the team activates this game
              </small>
            </div>

            {/* Show webhook fields for external provisioning only */}
            {!['password', 'secret_text'].includes(reward.reward_type) && (
              <>
                <div className="form-group">
                  <label htmlFor="api-url">🔗 Webhook API URL *</label>
                  <input
                    type="text"
                    id="api-url"
                    value={form.api_url}
                    onChange={(e) => setForm({ ...form, api_url: e.target.value })}
                    className="form-control"
                    placeholder="https://server.example.com/api/provision"
                    required
                  />
                  <small className="form-hint">
                    HTTPS URL to POST provision request to
                  </small>
                </div>

                <div className="form-group">
                  <label htmlFor="bearer-token">🔑 Bearer Token</label>
                  <input
                    type="password"
                    id="bearer-token"
                    value={form.api_bearer_token}
                    onChange={(e) => setForm({ ...form, api_bearer_token: e.target.value })}
                    className="form-control"
                    placeholder="your-secret-bearer-token"
                  />
                  <small className="form-hint">
                    Optional authentication token for webhook
                  </small>
                </div>
              </>
            )}

            {/* Info message for internal provisioning */}
            {['password', 'secret_text'].includes(reward.reward_type) && (
              <div className="form-group">
                <div style={{
                  padding: '12px',
                  background: '#e7f3ff',
                  border: '1px solid #b3d9ff',
                  borderRadius: '6px',
                  fontSize: '14px',
                  color: '#004085'
                }}>
                  <strong>ℹ️ Internal Provisioning</strong>
                  <p style={{ margin: '8px 0 0 0', fontSize: '13px' }}>
                    This reward type ({reward.reward_type}) is provisioned internally by the system.
                    No external webhook URL is required.
                  </p>
                </div>
              </div>
            )}

            {/* Trigger Order */}
            <div className="form-group">
              <label htmlFor="trigger-order">📊 Trigger Order</label>
              <input
                type="number"
                id="trigger-order"
                value={form.trigger_order}
                onChange={(e) => setForm({ ...form, trigger_order: parseInt(e.target.value) || 0 })}
                className="form-control"
                min="0"
              />
              <small className="form-hint">
                Execution order when multiple triggers fire on same game (0 = first, 1 = second, etc.)
              </small>
            </div>
          </form>
        </div>

        <div className="modal-footer">
          <div className="modal-footer-left">
            {trigger && (
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleDelete}
                disabled={loading}
              >
                🗑️ Delete Trigger
              </button>
            )}
          </div>
          <div className="modal-footer-right">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? 'Saving...' : (trigger ? 'Update Trigger' : 'Create Trigger')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * PropTypes validation
 */
ProvisionTriggerModal.propTypes = {
  reward: PropTypes.shape({
    id: PropTypes.number.isRequired,
    reward_type: PropTypes.string.isRequired,
    display_name: PropTypes.string.isRequired,
    api_url: PropTypes.string
  }).isRequired,
  trigger: PropTypes.shape({
    id: PropTypes.number.isRequired,
    trigger_on_game_id: PropTypes.number.isRequired,
    api_url: PropTypes.string,
    trigger_order: PropTypes.number
  }),
  games: PropTypes.array.isRequired,
  onSave: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired
};

export default ProvisionTriggerModal;
