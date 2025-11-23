/**
 * Component: ActivationCodesTab
 * Purpose: Display and manage activation codes for team members
 * Part of: Easter Quest 2025 Frontend - Team Management
 *
 * Features:
 * - Admin view: All activation codes across all teams
 * - Captain view: Only their team's activation codes
 * - Generate new codes
 * - Copy codes to clipboard
 * - Real-time expiration tracking
 * - Filter by status (Active, Pending, Expired, New)
 *
 * @module components/TeamManagement/ActivationCodesTab
 * @since 2025-11-23
 */

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { getMyTeamPlayers, getAllTeams, generateOtp } from '../../services';
import './ActivationCodesTab.css';

/**
 * ActivationCodesTab component - Focused view of activation codes
 *
 * @param {Object} props - Component props
 * @param {Object} props.user - Current authenticated user
 * @param {string} props.user.role - User role (admin, game_admin, team_captain)
 * @param {number} [props.user.team_id] - Team ID (for captains)
 * @returns {JSX.Element} Activation codes interface
 */
function ActivationCodesTab({ user }) {
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copySuccess, setCopySuccess] = useState({});
  const [codeTimers, setCodeTimers] = useState({});
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all'); // all, new, pending, active, expired

  // Load team members on component mount
  useEffect(() => {
    loadTeamMembers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Update expiration timers
  useEffect(() => {
    const timers = {};
    teamMembers.forEach(member => {
      if (member.otp_expires) {
        timers[member.id] = setInterval(() =>
          updateExpirationTimer(member.id, member.otp_expires), 1000
        );
      }
    });
    return () => Object.values(timers).forEach(timer => clearInterval(timer));
  }, [teamMembers]);

  /**
   * Load team members from backend API
   */
  const loadTeamMembers = async () => {
    setLoading(true);
    setError(null);

    try {
      if (user.role === 'team_captain') {
        const response = await getMyTeamPlayers();
        if (response.success) {
          setTeamMembers(response.players || []);
        } else {
          throw new Error('Failed to load team members');
        }
      } else if (['admin', 'game_admin'].includes(user.role)) {
        const teamsResponse = await getAllTeams();
        if (teamsResponse.success) {
          const allMembers = [];
          teamsResponse.teams.forEach(team => {
            if (team.members && Array.isArray(team.members)) {
              team.members.forEach(member => {
                allMembers.push({
                  ...member,
                  team_id: team.id,
                  team_name: team.name,
                  is_active: member.is_active,
                  has_otp: member.has_otp || false,
                  otp_expires: member.otp_expires || null
                });
              });
            }
          });
          setTeamMembers(allMembers);
        } else {
          throw new Error('Failed to load teams');
        }
      }
    } catch (error) {
      console.error('Failed to load team members:', error);
      setError('Failed to load team members');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Generate activation code for a team member
   */
  const generateActivationCode = async (memberId) => {
    try {
      const response = await generateOtp(memberId);

      if (response.success) {
        setTeamMembers(prev => prev.map(member =>
          member.id === memberId
            ? { ...member, has_otp: true, otp_expires: response.expires, activation_code: response.otp }
            : member
        ));
      }
    } catch (error) {
      console.error('Failed to generate activation code:', error);
    }
  };

  /**
   * Update expiration timer display
   */
  const updateExpirationTimer = (memberId, expiresAt) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry - now;

    if (diff <= 0) {
      setTeamMembers(prev => prev.map(member =>
        member.id === memberId
          ? { ...member, has_otp: false, otp_expires: null, activation_code: null }
          : member
      ));
      setCodeTimers(prev => ({ ...prev, [memberId]: 'Expired' }));
    } else {
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      const mm = String(minutes).padStart(2, '0');
      const ss = String(seconds).padStart(2, '0');
      const timeStr = hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
      setCodeTimers(prev => ({ ...prev, [memberId]: timeStr }));
    }
  };

  /**
   * Copy activation code to clipboard
   */
  const copyToClipboard = async (code, memberId) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopySuccess(prev => ({ ...prev, [memberId]: true }));
      setTimeout(() => setCopySuccess(prev => ({ ...prev, [memberId]: false })), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  /**
   * Get member status
   */
  const getMemberStatus = (member) => {
    if (member.is_active) return 'active';
    if (member.has_otp && member.otp_expires) {
      const now = new Date();
      const expiry = new Date(member.otp_expires);
      if (expiry > now) return 'pending';
      return 'expired';
    }
    return 'new';
  };

  // Filter members by status and exclude admin/game_admin roles
  const filteredMembers = teamMembers.filter(member => {
    // Exclude admins and game_admins
    if (['admin', 'game_admin'].includes(member.role)) return false;

    // Filter by status
    if (filterStatus !== 'all') {
      const status = getMemberStatus(member);
      if (status !== filterStatus) return false;
    }

    return true;
  });

  // Loading state
  if (loading) {
    return (
      <div className="activation-codes-loading">
        <div className="loading-spinner"></div>
        <p>Loading activation codes...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="activation-codes-error">
        <p>Error: {error}</p>
        <button className="btn-primary" onClick={loadTeamMembers}>Retry</button>
      </div>
    );
  }

  return (
    <div className="activation-codes-tab">
      {/* Header with filter */}
      <div className="codes-header">
        <div className="header-info">
          <h3>🔑 Activation Codes</h3>
          <p>
            {user.role === 'admin' || user.role === 'game_admin'
              ? 'All activation codes across all teams'
              : 'Activation codes for your team members'}
          </p>
        </div>

        <div className="filter-controls">
          <label htmlFor="status-filter">Filter by status:</label>
          <select
            id="status-filter"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="status-filter"
          >
            <option value="all">All ({teamMembers.filter(m => !['admin', 'game_admin'].includes(m.role)).length})</option>
            <option value="new">New ({teamMembers.filter(m => getMemberStatus(m) === 'new' && !['admin', 'game_admin'].includes(m.role)).length})</option>
            <option value="pending">Pending ({teamMembers.filter(m => getMemberStatus(m) === 'pending' && !['admin', 'game_admin'].includes(m.role)).length})</option>
            <option value="active">Active ({teamMembers.filter(m => getMemberStatus(m) === 'active' && !['admin', 'game_admin'].includes(m.role)).length})</option>
            <option value="expired">Expired ({teamMembers.filter(m => getMemberStatus(m) === 'expired' && !['admin', 'game_admin'].includes(m.role)).length})</option>
          </select>
        </div>
      </div>

      {/* Codes grid */}
      {filteredMembers.length === 0 ? (
        <div className="no-codes">
          <p>No activation codes found for the selected filter.</p>
        </div>
      ) : (
        <div className="codes-grid">
          {filteredMembers.map(member => {
            const status = getMemberStatus(member);

            return (
              <div key={member.id} className={`code-card status-${status}`}>
                <div className="code-card-header">
                  <div className="member-details">
                    <div className="member-name">{member.display_name || member.username}</div>
                    <div className="member-meta">
                      {member.username}
                      {(user.role === 'admin' || user.role === 'game_admin') && (
                        <span className="team-badge">{member.team_name}</span>
                      )}
                    </div>
                  </div>
                  <span className={`status-badge status-${status}`}>
                    {status.toUpperCase()}
                  </span>
                </div>

                <div className="code-card-body">
                  {status === 'active' ? (
                    <div className="code-info">
                      <span className="code-label">Account Active</span>
                      <span className="code-check">✓</span>
                    </div>
                  ) : member.activation_code ? (
                    <div className="code-display-section">
                      <div className="code-value">
                        <span className="code-text">{member.activation_code}</span>
                        <button
                          className="copy-button"
                          onClick={() => copyToClipboard(member.activation_code, member.id)}
                          title="Copy to clipboard"
                        >
                          {copySuccess[member.id] ? '✓ Copied' : '📋 Copy'}
                        </button>
                      </div>
                      <div className="code-expiry">
                        Expires in: <strong>{codeTimers[member.id] || 'Calculating...'}</strong>
                      </div>
                    </div>
                  ) : (
                    <div className="no-code-message">
                      {status === 'expired' ? 'Code expired' : 'No code generated'}
                    </div>
                  )}
                </div>

                <div className="code-card-footer">
                  {status !== 'active' && (
                    <button
                      className="btn-generate"
                      onClick={() => generateActivationCode(member.id)}
                    >
                      {member.has_otp && status !== 'expired' ? 'Generate New Code' : 'Generate Code'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * PropTypes validation
 */
ActivationCodesTab.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.number.isRequired,
    role: PropTypes.oneOf(['admin', 'game_admin', 'team_captain']).isRequired,
    team_id: PropTypes.number
  }).isRequired
};

export default ActivationCodesTab;
