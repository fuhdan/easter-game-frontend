import React, { useState, useEffect } from 'react';

const TEAM_NAMES = {
  1: 'Team Alpha',
  2: 'Team Beta',
  3: 'Team Gamma'
};

const TeamManagementCard = ({ user }) => {
  const [teamMembers, setTeamMembers] = useState([
    // Team Alpha
    { id: 1, username: 'jane.smith', email: 'jane.smith@ypsomed.com', display_name: 'Jane Smith', status: 'active', team_id: 1, activation_code: null, last_login: '2025-08-29T10:30:00Z' },
    { id: 2, username: 'mike.wilson', email: 'mike.wilson@ypsomed.com', display_name: 'Mike Wilson', status: 'expired', team_id: 1, activation_code: null, last_login: null },
    { id: 3, username: 'alice.johnson', email: 'alice.johnson@ypsomed.com', display_name: 'Alice Johnson', status: 'pending', team_id: 1, activation_code: 'TMA-101-AAA', code_expires_at: new Date(Date.now() + 3 * 60 * 1000).toISOString(), last_login: null },
    { id: 4, username: 'bob.miller', email: 'bob.miller@ypsomed.com', display_name: 'Bob Miller', status: 'new', team_id: 1, activation_code: null, last_login: null },

    // Team Beta
    { id: 5, username: 'sarah.davis', email: 'sarah.davis@ypsomed.com', display_name: 'Sarah Davis', status: 'pending', team_id: 2, activation_code: 'TMA-789-XYZ', code_expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(), last_login: null },
    { id: 6, username: 'lucy.brown', email: 'lucy.brown@ypsomed.com', display_name: 'Lucy Brown', status: 'new', team_id: 2, activation_code: null, last_login: null },
    { id: 7, username: 'charlie.green', email: 'charlie.green@ypsomed.com', display_name: 'Charlie Green', status: 'active', team_id: 2, activation_code: null, last_login: '2025-08-30T12:00:00Z' },
    { id: 8, username: 'diana.white', email: 'diana.white@ypsomed.com', display_name: 'Diana White', status: 'expired', team_id: 2, activation_code: null, last_login: null },

    // Team Gamma
    { id: 9, username: 'tom.harris', email: 'tom.harris@ypsomed.com', display_name: 'Tom Harris', status: 'pending', team_id: 3, activation_code: 'TMA-456-ABC', code_expires_at: new Date(Date.now() + 1 * 60 * 1000).toISOString(), last_login: null },
    { id: 10, username: 'emma.jones', email: 'emma.jones@ypsomed.com', display_name: 'Emma Jones', status: 'new', team_id: 3, activation_code: null, last_login: null },
    { id: 11, username: 'frank.lee', email: 'frank.lee@ypsomed.com', display_name: 'Frank Lee', status: 'active', team_id: 3, activation_code: null, last_login: '2025-08-30T08:15:00Z' },
    { id: 12, username: 'grace.kim', email: 'grace.kim@ypsomed.com', display_name: 'Grace Kim', status: 'expired', team_id: 3, activation_code: null, last_login: null }
  ]);

  const [copySuccess, setCopySuccess] = useState({});
  const [codeTimers, setCodeTimers] = useState({});

  useEffect(() => {
    console.log('Logged-in user:', user);
  }, [user]);

  useEffect(() => {
    const timers = {};
    teamMembers.forEach(member => {
      if (member.activation_code && member.code_expires_at) {
        timers[member.id] = setInterval(() => updateExpirationTimer(member.id, member.code_expires_at), 1000);
      }
    });
    return () => Object.values(timers).forEach(timer => clearInterval(timer));
  }, [teamMembers]);

  const updateExpirationTimer = (memberId, expiresAt) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry - now;

    if (diff <= 0) {
      setTeamMembers(prev =>
        prev.map(member =>
          member.id === memberId ? { ...member, status: 'expired', activation_code: null, code_expires_at: null } : member
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
    const code = `TMA-${Math.floor(Math.random() * 1000)}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    setTeamMembers(prev =>
      prev.map(member =>
        member.id === memberId ? { ...member, status: 'pending', activation_code: code, code_expires_at: expiresAt } : member
      )
    );
    console.log(`Generated code for member ${memberId}: ${code}`);
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
    return <span className={`status-badge ${statusConfig[status]?.class || 'status-new'}`}>{statusConfig[status]?.text || 'NEW'}</span>;
  };

  const renderActivationCode = member => {
    if (!member.activation_code) return null;
    const expired = new Date(member.code_expires_at) < new Date();
    return (
      <div className="activation-code">
        <span>{member.activation_code}</span>
        {!expired && (
          <button className="copy-btn" onClick={() => copyToClipboard(member.activation_code, member.id)} title="Copy to clipboard">
            {copySuccess[member.id] ? '✓' : '📋'}
          </button>
        )}
        <small className="expiry-timer">{expired ? 'Expired' : `Expires in: ${codeTimers[member.id]}`}</small>
      </div>
    );
  };

  const renderActionButton = member => {
    if (member.status === 'active') return <span className="action-text">Account Active</span>;
    if (!member.activation_code)
      return <button className="btn-primary" onClick={() => generateActivationCode(member.id)}>Generate Code</button>;
    const expired = new Date(member.code_expires_at) < new Date();
    return <button className="btn-secondary" onClick={() => generateActivationCode(member.id)}>{expired ? 'Regenerate Code' : 'New Code'}</button>;
  };

  // --- Attach team_name dynamically ---
  const membersWithTeamName = teamMembers.map(m => ({ ...m, team_name: TEAM_NAMES[m.team_id] || 'Unknown' }));

  const visibleMembers = membersWithTeamName.filter(member => {
    if (['super_admin', 'admin'].includes(user?.role)) return true;
    return Number(member.team_id) === Number(user.team_id);
  });

  return (
    <div className="profile-card">
      <div className="card-header">👥 Team Management</div>
      <div className="card-body">
        <div className="team-info">
          {['super_admin', 'admin'].includes(user?.role) ? (
            <p className="global-text">
              You are logged in as a {user.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}.<br />
              This panel shows all teams and individual member states, including activation codes and expiration timers.
            </p>
          ) : (
            <>
              <h4>Team: {TEAM_NAMES[user.team_id] || 'Team Alpha'}</h4>
              <p>Manage your team members and activation codes</p>
            </>
          )}
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
            {visibleMembers.map(member => (
              <tr key={member.id}>
                <td>
                  <div className="member-info">
                    <div className="member-name">{member.display_name}</div>
                    <div className="member-email">{member.email}</div>
                    {['super_admin', 'admin'].includes(user?.role) && (
                      <div className="member-details">
                        {member.team_name} | Status: {member.status.toUpperCase()}
                        {member.last_login && ` | Last login: ${new Date(member.last_login).toLocaleString()}`}
                      </div>
                    )}
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
          <div className="stat-item"><strong>Total Members:</strong> {visibleMembers.length}</div>
          <div className="stat-item"><strong>Active:</strong> {visibleMembers.filter(m => m.status === 'active').length}</div>
          <div className="stat-item"><strong>Pending:</strong> {visibleMembers.filter(m => m.status === 'pending').length}</div>
          <div className="stat-item"><strong>Expired:</strong> {visibleMembers.filter(m => m.status === 'expired').length}</div>
          <div className="stat-item"><strong>New:</strong> {visibleMembers.filter(m => m.status === 'new').length}</div>
        </div>
      </div>
    </div>
  );
};

export default TeamManagementCard;
