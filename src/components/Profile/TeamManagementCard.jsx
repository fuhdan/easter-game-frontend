/**
 * Component: TeamManagementCard.jsx
 * Purpose: Team member management with real database data
 * Part of: Easter Quest 2025 Frontend
 * Location: frontend/src/components/Profile/TeamManagementCard.jsx
 * 
 * Features:
 * - Load real team members from database
 * - Generate activation codes for team members
 * - Real-time code expiration tracking
 * - Role-based access (captains see their team, admins see all)
 * 
 * UPDATED: Uses real API data instead of mock data
 * 
 * @since 2025-08-31
 * @updated 2025-09-03 - Connected to real backend API
 */

import React, { useState, useEffect } from 'react';
import { getMyTeamPlayers, getAllTeams, generateOtp } from '../../services';

const TeamManagementCard = ({ user }) => {
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copySuccess, setCopySuccess] = useState({});
  const [codeTimers, setCodeTimers] = useState({});
  const [error, setError] = useState(null);

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
        // Team captains see only their team members
        const response = await getMyTeamPlayers();
        if (response.success) {
          setTeamMembers(response.players || []);
        } else {
          throw new Error('Failed to load team members');
        }
      } else if (['admin', 'super_admin'].includes(user.role)) {
        // Admins see all teams and members
        const teamsResponse = await getAllTeams();
        if (teamsResponse.success) {
          // Extract all members from all teams
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
      console.log('About to generate OTP for member ID:', memberId);
      const response = await generateOtp(memberId);
      
      if (response.success) {
        console.log('OTP response:', response);
        
        // Update local state with new OTP info
        setTeamMembers(prev => {
          console.log('Previous team members:', prev);
          const updated = prev.map(member => {
            if (member.id === memberId) {
              const updatedMember = { 
                ...member, 
                has_otp: true, 
                otp_expires: response.expires,
                activation_code: response.otp
              };
              console.log('Updating member:', updatedMember);
              return updatedMember;
            }
            return member;
          });
          console.log('Updated team members:', updated);
          return updated;
        });
        
        console.log(`Generated activation code for ${response.player_name}: ${response.otp}`);
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
      // Code expired - update member status
      setTeamMembers(prev => prev.map(member => 
        member.id === memberId 
          ? { ...member, has_otp: false, otp_expires: null, activation_code: null }
          : member
      ));
      setCodeTimers(prev => ({ ...prev, [memberId]: 'Expired' }));
    } else {
      // Format remaining time
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
      alert('Failed to copy to clipboard');
    }
  };

  /**
   * Get status based on member data
   */
  const getMemberStatus = (member) => {
    /* console.log(`Status check for ${member.display_name}:`, {
      is_active: member.is_active,
      has_otp: member.has_otp,
      otp_expires: member.otp_expires
    });*/
    
    if (member.is_active) return 'active';
    if (member.has_otp && member.otp_expires) {
      const now = new Date();
      const expiry = new Date(member.otp_expires);
      console.log(`Time check: now=${now.toISOString()}, expiry=${expiry.toISOString()}, valid=${expiry > now}`);
      if (expiry > now) return 'pending';
      return 'expired';
    }
    return 'new';
  };

  /**
   * Get status badge component
   */
  const getStatusBadge = (status) => {
    const statusConfig = {
      new: { class: 'status-badge status-help', text: 'NEW' },
      pending: { class: 'status-badge status-current', text: 'PENDING' },
      expired: { class: 'status-badge status-locked', text: 'EXPIRED' },
      active: { class: 'status-badge status-solved', text: 'ACTIVE' }
    };
    
    const config = statusConfig[status] || statusConfig.new;
    return <span className={config.class}>{config.text}</span>;
  };

  /**
   * Render activation code display
   */
  const renderActivationCode = (member) => {
    const status = getMemberStatus(member);
    
    if (status === 'active') return <span className="no-code">Account Active</span>;
    if (status === 'new' || status === 'expired') return <span className="no-code">No code generated</span>;
    
    if (member.activation_code) {
      return (
        <div className="activation-code">
          <span className="code-display">{member.activation_code}</span>
          <button 
            className="copy-btn" 
            onClick={() => copyToClipboard(member.activation_code, member.id)} 
            title="Copy to clipboard"
          >
            {copySuccess[member.id] ? '✓' : '📋'}
          </button>
          <div className="expiry-timer">
            Expires in: {codeTimers[member.id] || 'Calculating...'}
          </div>
        </div>
      );
    }
    
    return <span className="no-code">Code pending...</span>;
  };

  /**
   * Render action button
   */
  const renderActionButton = (member) => {
    const status = getMemberStatus(member);
    
    if (status === 'active') {
      return <span className="action-text">✓ Active</span>;
    }
    
    if (!member.has_otp || status === 'expired') {
      return (
        <button 
          className="btn btn-primary"
          onClick={() => generateActivationCode(member.id)}
          style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
        >
          Generate Code
        </button>
      );
    }
    
    return (
      <button 
        className="btn btn-secondary"
        onClick={() => generateActivationCode(member.id)}
        style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
      >
        New Code
      </button>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="profile-card">
        <div className="card-header">👥 Team Management</div>
        <div className="card-body">
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <div className="loading-spinner"></div>
            <p>Loading team members...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="profile-card">
        <div className="card-header">👥 Team Management</div>
        <div className="card-body">
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--danger)' }}>
            <p>Error: {error}</p>
            <button className="btn btn-primary" onClick={loadTeamMembers}>
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Filter visible members based on user role
  // SECURITY: Exclude system admins who don't play the game
  const visibleMembers = teamMembers.filter(member => {
    // Filter out admins and super_admins (they don't play)
    if (['super_admin', 'admin'].includes(member.role)) {
      return false;
    }

    // Admins can see all team members
    if (['super_admin', 'admin'].includes(user?.role)) return true;

    // Team captains see only their team
    return Number(member.team_id) === Number(user.team_id);
  });

  return (
    <div className="profile-card">
      <div className="card-header">👥 Team Management</div>
      <div className="card-body">
        
        {/* Team info header */}
        <div className="team-info" style={{ marginBottom: '1.5rem' }}>
          {['super_admin', 'admin'].includes(user?.role) ? (
            <div>
              <h4>All Teams Overview</h4>
              <p>You are logged in as <strong>{user.role.replace('_', ' ')}</strong>. 
                 This panel shows all teams and members with their activation status.</p>
            </div>
          ) : (
            <div>
              <h4>Your Team Management</h4>
              <p>Generate activation codes for your team members to enable their accounts.</p>
            </div>
          )}
        </div>

        {/* Members table */}
        {visibleMembers.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
            <p>No team members found.</p>
          </div>
        ) : (
          <>
            <div className="table-container" style={{ overflowX: 'auto', width: '100%' }}>
              <table className="table" style={{ width: '100%', tableLayout: 'auto', minWidth: '800px' }}>
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Status</th>
                    <th>Activation Code</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleMembers.map(member => {
                    const status = getMemberStatus(member);
                    
                    return (
                      <tr key={member.id}>
                        <td>
                          <div className="member-info">
                            <div className="member-name" style={{ fontWeight: 'bold' }}>
                              {member.display_name || member.username}
                            </div>
                            <div className="member-email" style={{ fontSize: '0.875rem', color: '#666' }}>
                              {member.email || `${member.username}@ypsomed.com`}
                            </div>
                            <div className="member-username" style={{ fontSize: '0.875rem', color: '#666' }}>
                              {member.username || 'No Username'}
                            </div>
                            <div className="member-department" style={{ fontSize: '0.875rem', color: '#666' }}>
                              {member.department || 'No Department'}
                            </div>
                            {['super_admin', 'admin'].includes(user?.role) && (
                              <div className="member-details" style={{ fontSize: '0.75rem', color: '#999' }}>
                                {member.team_name} | Role: {member.is_captain ? 'Team Captain 👑' : 'Player'}
                              </div>
                            )}
                          </div>
                        </td>
                        <td>{getStatusBadge(status)}</td>
                        <td>{renderActivationCode(member)}</td>
                        <td>{renderActionButton(member)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Team statistics */}
            <div className="team-stats" style={{ 
              marginTop: '1.5rem', 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
              gap: '1rem',
              padding: '1rem',
              background: 'var(--light-gray)',
              borderRadius: '8px'
            }}>
              <div className="stat-item">
                <strong>Total:</strong> {visibleMembers.length}
              </div>
              <div className="stat-item">
                <strong>Active:</strong> {visibleMembers.filter(m => getMemberStatus(m) === 'active').length}
              </div>
              <div className="stat-item">
                <strong>Pending:</strong> {visibleMembers.filter(m => getMemberStatus(m) === 'pending').length}
              </div>
              <div className="stat-item">
                <strong>New:</strong> {visibleMembers.filter(m => getMemberStatus(m) === 'new').length}
              </div>
              <div className="stat-item">
                <strong>Expired:</strong> {visibleMembers.filter(m => getMemberStatus(m) === 'expired').length}
              </div>
            </div>
          </>
        )}
        
      </div>
    </div>
  );
};

export default TeamManagementCard;