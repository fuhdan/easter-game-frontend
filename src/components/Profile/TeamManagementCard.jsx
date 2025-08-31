/**
 * Component: TeamManagementCard
 * Purpose: Team member activation and management for captains
 * Part of: Easter Quest - Ypsomed AG Easter Challenge Frontend
 * 
 * Features:
 * - Team member status display
 * - Activation code generation
 * - Copy-to-clipboard functionality
 * - Code expiration countdown
 * - Status management (new, pending, expired, active)
 */

import React, { useState, useEffect } from 'react';

const TeamManagementCard = ({ user }) => {
  const [teamMembers, setTeamMembers] = useState([
    {
      id: 2,
      username: 'jane.smith',
      email: 'jane.smith@ypsomed.com',
      display_name: 'Jane Smith',
      status: 'active',
      activation_code: null,
      last_login: '2025-08-29T10:30:00Z'
    },
    {
      id: 3,
      username: 'mike.wilson',
      email: 'mike.wilson@ypsomed.com',
      display_name: 'Mike Wilson',
      status: 'expired',
      activation_code: null,
      last_login: null
    },
    {
      id: 4,
      username: 'sarah.davis',
      email: 'sarah.davis@ypsomed.com',
      display_name: 'Sarah Davis',
      status: 'pending',
      activation_code: 'TMA-789-XYZ',
      code_expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      last_login: null
    },
    {
      id: 5,
      username: 'lucy.brown',
      email: 'lucy.brown@ypsomed.com',
      display_name: 'Lucy Brown',
      status: 'new',
      activation_code: null,
      last_login: null
    }
  ]);

  const [copySuccess, setCopySuccess] = useState({});
  const [codeTimers, setCodeTimers] = useState({});

  useEffect(() => {
    const timers = {};
    teamMembers.forEach(member => {
      if (member.activation_code && member.code_expires_at) {
        timers[member.id] = setInterval(() => {
          updateExpirationTimer(member.id, member.code_expires_at);
        }, 1000);
      }
    });
    return () => {
      Object.values(timers).forEach(timer => clearInterval(timer));
    };
  }, [teamMembers]);

  const updateExpirationTimer = (memberId, expiresAt) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry - now;

    if (diff <= 0) {
      // Expired: clear code and update status
      setTeamMembers(prev =>
        prev.map(member =>
          member.id === memberId
            ? { ...member, status: 'expired', activation_code: null, code_expires_at: null }
            : member
        )
      );
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

  const generateActivationCode = memberId => {
    const code = `TMA-${Math.floor(Math.random() * 1000)}-${Math.random()
      .toString(36)
      .substring(2, 5)
      .toUpperCase()}`;
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    setTeamMembers(prev =>
      prev.map(member =>
        member.id === memberId
          ? {
              ...member,
              status: 'pending',
              activation_code: code,
              code_expires_at: expiresAt
            }
          : member
      )
    );
  };

  const copyToClipboard = async (code, memberId) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopySuccess(prev => ({ ...prev, [memberId]: true }));
      setTimeout(() => setCopySuccess(prev => ({ ...prev, [memberId]: false })), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const getStatusBadge = status => {
    const statusConfig = {
      new: { class: 'status-new', text: 'NEW' },
      pending: { class: 'status-pending', text: 'PENDING' },
      expired: { class: 'status-expired', text: 'EXPIRED' },
      active: { class: 'status-active', text: 'ACTIVE' }
    };
    const config = statusConfig[status] || statusConfig.new;
    return <span className={`status-badge ${config.class}`}>{config.text}</span>;
  };

  const renderActivationCode = member => {
    if (!member.activation_code) return null;

    const expired = new Date(member.code_expires_at) < new Date();

    return (
      <div className="activation-code">
        <span>{member.activation_code}</span>
        {!expired && (
          <button
            className="copy-btn"
            onClick={() => copyToClipboard(member.activation_code, member.id)}
            title="Copy to clipboard"
          >
            {copySuccess[member.id] ? '✓' : '📋'}
          </button>
        )}
        <small className="expiry-timer">
          {expired ? 'Expired' : `Expires in: ${codeTimers[member.id]}`}
        </small>
      </div>
    );
  };

  const renderActionButton = member => {
    if (member.status === 'active') {
      return <span className="action-text">Account Active</span>;
    }

    if (!member.activation_code) {
      return (
        <button className="btn-primary" onClick={() => generateActivationCode(member.id)}>
          Generate Code
        </button>
      );
    }

    const expired = new Date(member.code_expires_at) < new Date();

    return (
      <button className="btn-secondary" onClick={() => generateActivationCode(member.id)}>
        {expired ? 'Regenerate Code' : 'New Code'}
      </button>
    );
  };

  return (
    <div className="profile-card">
      <div className="card-header">👥 Team Management</div>
      <div className="card-body">
        <div className="team-info">
          <h4>Team: {user?.team_name || 'Team Alpha'}</h4>
          <p>Manage your team members and activation codes</p>
        </div>

        <table className="team-table">
          <thead>
            <tr>
              <th>Member</th>
              <th>Status</th>
              <th>Activation Code</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {teamMembers.map(member => (
              <tr key={member.id}>
                <td>
                  <div className="member-info">
                    <div className="member-name">{member.display_name}</div>
                    <div className="member-email">{member.email}</div>
                  </div>
                </td>
                <td>{getStatusBadge(member.status)}</td>
                <td>{renderActivationCode(member)}</td>
                <td>{renderActionButton(member)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="team-stats">
          <div className="stat-item">
            <strong>Total Members:</strong> {teamMembers.length}
          </div>
          <div className="stat-item">
            <strong>Active:</strong> {teamMembers.filter(m => m.status === 'active').length}
          </div>
          <div className="stat-item">
            <strong>Pending:</strong> {teamMembers.filter(m => m.status === 'pending').length}
          </div>
          <div className="stat-item">
            <strong>Expired:</strong> {teamMembers.filter(m => m.status === 'expired').length}
          </div>
          <div className="stat-item">
            <strong>New:</strong> {teamMembers.filter(m => m.status === 'new').length}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamManagementCard;
