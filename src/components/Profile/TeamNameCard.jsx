/**
 * Component: TeamNameCard
 * Purpose: Allow team leaders to change their team name
 * Part of: Easter Quest - Ypsomed AG Easter Challenge Frontend
 *
 * Features:
 * - Self-contained form state
 * - Form validation (3-50 characters, unique name)
 * - API integration
 * - Loading states and success feedback
 * - Only visible to team leaders
 *
 * @since 2025-11-12
 */

import React, { useState } from 'react';
import { logger } from '../../utils/logger';
import { updateMyTeamName } from '../../services';

/**
 * TeamNameCard component - Allow team leaders to change their team name
 *
 * @param {Object} props - Component props
 * @param {Object} props.user - Current user object
 * @param {string} props.user.team_name - Current team name
 * @returns {JSX.Element} Team name change form
 *
 * @example
 * <TeamNameCard user={currentUser} />
 */
const TeamNameCard = ({ user }) => {
  const [teamName, setTeamName] = useState(user?.team_name || '');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  /**
   * Validate team name according to business rules
   *
   * @param {string} name - Team name to validate
   * @returns {Object} Validation errors object (empty if valid)
   * @returns {string} errors.name - Error message if validation fails
   */
  const validateTeamName = (name) => {
    const errors = {};

    if (!name.trim()) {
      errors.name = 'Team name is required';
    } else if (name.trim().length < 3) {
      errors.name = 'Team name must be at least 3 characters';
    } else if (name.trim().length > 50) {
      errors.name = 'Team name must not exceed 50 characters';
    }

    return errors;
  };

  /**
   * Handle form submission for team name change
   *
   * @param {Event} e - Form submission event
   * @returns {Promise<void>}
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    setErrors({});
    setSuccess(false);

    const validationErrors = validateTeamName(teamName);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      setLoading(true);

      const response = await updateMyTeamName(teamName.trim());

      if (response.success) {
        setSuccess(true);
        // Update user's team name in parent if needed
        if (user && user.team_name !== response.new_name) {
          user.team_name = response.new_name;
        }
        setTimeout(() => setSuccess(false), 3000);
      }

    } catch (error) {
      logger.error('Team name update error:', error);
      if (error.data?.detail) {
        setErrors({ name: error.data.detail });
      } else if (error.message) {
        setErrors({ name: error.message });
      } else {
        setErrors({ name: 'Failed to update team name. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle input change
   */
  const handleInputChange = (value) => {
    setTeamName(value);

    if (errors.name) {
      setErrors({});
    }
  };

  /**
   * Reset form
   */
  const handleReset = () => {
    setTeamName(user?.team_name || '');
    setErrors({});
    setSuccess(false);
  };

  return (
    <div className="profile-card">
      <div className="card-header">
        🏷️ Team Name
      </div>
      <div className="card-body">
        {success && (
          <div className="success-message">
            ✅ Team name updated successfully!
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Team Name</label>
            <input
              type="text"
              className={`form-control ${errors.name ? 'form-control-error' : ''}`}
              value={teamName}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder="Enter your team name"
              disabled={loading}
              maxLength={50}
            />
            {errors.name && (
              <div className="form-error">{errors.name}</div>
            )}
            <div className="form-hint">
              Choose a unique team name (3-50 characters)
            </div>
          </div>

          <div className="form-buttons">
            <button
              type="submit"
              className="btn-primary"
              disabled={loading || teamName === user?.team_name}
            >
              {loading ? 'Updating...' : 'Update Team Name'}
            </button>

            <button
              type="button"
              className="btn-secondary"
              onClick={handleReset}
              disabled={loading}
            >
              Reset
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TeamNameCard;
