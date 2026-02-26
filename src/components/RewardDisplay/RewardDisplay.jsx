/**
 * Component: RewardDisplay
 * Purpose: Display team rewards with unlock status and values
 * Part of: Easter Quest Frontend
 *
 * Features:
 * - Show locked and unlocked rewards
 * - Display decrypted reward values for unlocked rewards
 * - Copy to clipboard functionality
 * - Reward type icons and styling
 *
 * @since 2026-02-25
 */

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { logger } from '../../utils/logger';
import { getTeamRewards } from '../../services';
import './RewardDisplay.css';

/**
 * Get icon/emoji for reward type
 * @param {string} rewardType - Reward type
 * @returns {string} Emoji icon
 */
const getRewardIcon = (rewardType) => {
  const icons = {
    ssh_key: '🔑',
    api_token: '🎫',
    password: '🔐',
    certificate: '📜',
    url: '🔗',
    secret_text: '📝'
  };
  return icons[rewardType] || '🎁';
};

/**
 * Reward display component
 * @param {Object} props
 * @param {number} props.refreshKey - Key to trigger refresh
 * @returns {JSX.Element}
 */
const RewardDisplay = ({ refreshKey = 0 }) => {
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  /**
   * Load team rewards from API
   */
  const loadRewards = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getTeamRewards();
      setRewards(data);
      logger.debug('[RewardDisplay] Rewards loaded', { count: data.length });
    } catch (err) {
      logger.error('[RewardDisplay] Failed to load rewards', err);
      setError(err.message || 'Failed to load rewards');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRewards();
  }, [refreshKey]);

  /**
   * Copy reward value to clipboard
   * @param {string} value - Reward value to copy
   * @param {number} rewardId - Reward ID for tracking
   */
  const handleCopy = async (value, rewardId) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedId(rewardId);
      logger.debug('[RewardDisplay] Copied reward to clipboard', { rewardId });

      // Reset copied state after 2 seconds
      setTimeout(() => {
        setCopiedId(null);
      }, 2000);
    } catch (err) {
      logger.error('[RewardDisplay] Failed to copy to clipboard', err);
    }
  };

  if (loading) {
    return (
      <div className="reward-display">
        <div className="reward-header">
          <h3>🎁 Team Rewards</h3>
        </div>
        <div className="reward-loading">Loading rewards...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="reward-display">
        <div className="reward-header">
          <h3>🎁 Team Rewards</h3>
        </div>
        <div className="reward-error">Error: {error}</div>
      </div>
    );
  }

  if (rewards.length === 0) {
    return (
      <div className="reward-display">
        <div className="reward-header">
          <h3>🎁 Team Rewards</h3>
        </div>
        <div className="reward-empty">
          <p>No rewards available yet.</p>
          <p className="reward-hint">Complete games to unlock rewards!</p>
        </div>
      </div>
    );
  }

  const unlockedRewards = rewards.filter(r => r.is_unlocked);
  const lockedRewards = rewards.filter(r => !r.is_unlocked);

  return (
    <div className="reward-display">
      <div className="reward-header">
        <h3>🎁 Team Rewards</h3>
        <div className="reward-stats">
          <span className="reward-count">{unlockedRewards.length}/{rewards.length} Unlocked</span>
        </div>
      </div>

      {/* Unlocked Rewards */}
      {unlockedRewards.length > 0 && (
        <div className="reward-section">
          <h4 className="reward-section-title">✅ Unlocked</h4>
          {unlockedRewards.map((reward) => (
            <div key={reward.reward_id} className="reward-card reward-unlocked">
              <div className="reward-card-header">
                <span className="reward-icon">{getRewardIcon(reward.reward_type)}</span>
                <div className="reward-info">
                  <h5 className="reward-name">{reward.display_name}</h5>
                  {reward.game_name && (
                    <span className="reward-game">From: {reward.game_name}</span>
                  )}
                </div>
              </div>

              {reward.description && (
                <p className="reward-description">{reward.description}</p>
              )}

              {reward.decrypted_value && (
                <div className="reward-value-container">
                  <div className="reward-value-header">
                    <span className="reward-value-label">Reward Value:</span>
                    <button
                      className={`reward-copy-btn ${copiedId === reward.reward_id ? 'copied' : ''}`}
                      onClick={() => handleCopy(reward.decrypted_value, reward.reward_id)}
                      title="Copy to clipboard"
                    >
                      {copiedId === reward.reward_id ? '✓ Copied!' : '📋 Copy'}
                    </button>
                  </div>
                  <pre className="reward-value">{reward.decrypted_value}</pre>
                </div>
              )}

              {reward.unlocked_at && (
                <div className="reward-timestamp">
                  Unlocked: {new Date(reward.unlocked_at).toLocaleString()}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Locked Rewards */}
      {lockedRewards.length > 0 && (
        <div className="reward-section">
          <h4 className="reward-section-title">🔒 Locked</h4>
          {lockedRewards.map((reward) => (
            <div key={reward.reward_id} className="reward-card reward-locked">
              <div className="reward-card-header">
                <span className="reward-icon">{getRewardIcon(reward.reward_type)}</span>
                <div className="reward-info">
                  <h5 className="reward-name">{reward.display_name}</h5>
                  {reward.game_name && (
                    <span className="reward-game">From: {reward.game_name}</span>
                  )}
                </div>
                <span className="reward-lock">🔒</span>
              </div>

              {reward.description && (
                <p className="reward-description">{reward.description}</p>
              )}

              <div className="reward-locked-message">
                Complete the game to unlock this reward!
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * PropTypes validation
 */
RewardDisplay.propTypes = {
  refreshKey: PropTypes.number
};

export default RewardDisplay;
