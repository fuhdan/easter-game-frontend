/**
 * Module: services/rewards.js
 * Purpose: Reward management API endpoints
 * Part of: Easter Quest 2025 Frontend Services
 *
 * Provides reward functionality:
 * - Get team rewards
 * - View unlocked reward values
 *
 * @since 2026-02-25
 */

import { request } from './api';

/**
 * Get all rewards for current user's team
 *
 * Returns both locked and unlocked rewards with encrypted values.
 * Unlocked rewards include the decrypted value.
 *
 * @returns {Promise<Array>} Array of team reward objects
 * @throws {APIError} 401 if not authenticated
 *
 * @example
 * const rewards = await getTeamRewards();
 * // Returns:
 * // [
 * //   {
 * //     reward_id: 1,
 * //     reward_type: "ssh_key",
 * //     display_name: "SSH Private Key",
 * //     description: "Use this to access...",
 * //     game_name: "Find Ishmael",
 * //     is_unlocked: true,
 * //     decrypted_value: "-----BEGIN RSA PRIVATE KEY-----\n...",
 * //     unlocked_at: "2026-02-25T22:00:00"
 * //   },
 * //   {
 * //     reward_id: 2,
 * //     reward_type: "api_token",
 * //     display_name: "API Access Token",
 * //     description: "Use this for...",
 * //     game_name: "Logic Puzzle",
 * //     is_unlocked: false,
 * //     decrypted_value: null,
 * //     unlocked_at: null
 * //   }
 * // ]
 */
export const getTeamRewards = () => request('GET', '/games/team/rewards');

/**
 * Get admin view of all rewards
 *
 * ADMIN ONLY
 *
 * @returns {Promise<Array>} Array of all reward templates
 * @throws {APIError} 403 if not admin
 */
export const getAllRewards = () => request('GET', '/admin/rewards');

/**
 * Create a new reward
 *
 * ADMIN ONLY
 *
 * @param {Object} rewardData - Reward data
 * @param {string} rewardData.reward_type - Type (ssh_key, api_token, password, etc.)
 * @param {string} rewardData.display_name - Human-readable name
 * @param {string} rewardData.description - Description
 * @param {number} [rewardData.game_id] - Associated game ID (optional)
 * @returns {Promise<Object>} Created reward object with ID
 * @throws {APIError} 400 if validation fails, 403 if not admin
 */
export const createReward = (rewardData) => request('POST', '/admin/rewards', rewardData);

/**
 * Grant a reward to a team
 *
 * ADMIN ONLY or EXTERNAL API
 *
 * @param {number} rewardId - Reward ID
 * @param {number} teamId - Team ID
 * @param {string} [customValue] - Optional custom value (if not provided, auto-generated)
 * @returns {Promise<Object>} Granted reward object
 * @throws {APIError} 400 if validation fails, 403 if not admin, 404 if not found
 */
export const grantReward = (rewardId, teamId, customValue = null) =>
  request('POST', '/admin/rewards/grant', { reward_id: rewardId, team_id: teamId, custom_value: customValue });

/**
 * Delete a reward
 *
 * ADMIN ONLY
 *
 * @param {number} rewardId - Reward ID to delete
 * @returns {Promise<void>}
 * @throws {APIError} 403 if not admin, 404 if not found
 */
export const deleteReward = (rewardId) => request('DELETE', `/admin/rewards/${rewardId}`);

/**
 * Update a reward
 *
 * ADMIN ONLY
 *
 * @param {number} rewardId - Reward ID to update
 * @param {Object} rewardData - Reward data to update
 * @param {string} [rewardData.display_name] - New display name
 * @param {string} [rewardData.description] - New description
 * @param {boolean} [rewardData.is_active] - Active status
 * @param {string} [rewardData.api_url] - Webhook URL (HTTPS only)
 * @param {string} [rewardData.api_bearer_token] - Bearer token for webhook
 * @returns {Promise<Object>} Updated reward object
 * @throws {APIError} 400 if validation fails, 403 if not admin, 404 if not found
 */
export const updateReward = (rewardId, rewardData) => request('PUT', `/admin/rewards/${rewardId}`, rewardData);

/**
 * Get rewards by game ID
 *
 * ADMIN ONLY
 *
 * @param {number} gameId - Game ID to filter by
 * @returns {Promise<Object>} Object with rewards array
 * @throws {APIError} 403 if not admin
 */
export const getRewardsByGame = async (gameId) => {
  const rewards = await request('GET', `/admin/rewards?game_id=${gameId}`);
  return { rewards }; // Wrap in object for consistent interface
};

/**
 * Export public keys for SSH server setup
 *
 * ADMIN ONLY
 *
 * For SSH key rewards, extracts all team public keys in a format
 * ready to paste into the target server's ~/.ssh/authorized_keys
 *
 * @param {number} rewardId - Reward ID (must be type: ssh_key)
 * @returns {Promise<Object>} Public keys data
 * @throws {APIError} 400 if not ssh_key type, 403 if not admin, 404 if not found
 *
 * @example
 * const data = await exportPublicKeys(1);
 * console.log(data.authorized_keys_format);
 * // # Paste into ~/.ssh/authorized_keys on target server
 * // ssh-rsa AAAAB3... # Team A
 * // ssh-rsa AAAAB3... # Team B
 */
export const exportPublicKeys = (rewardId) => request('GET', `/admin/rewards/${rewardId}/public-keys`);
