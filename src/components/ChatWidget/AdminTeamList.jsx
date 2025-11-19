/**
 * Component: AdminTeamList
 * Purpose: Display all teams with expandable member lists for admins
 * Part of: Easter Quest Frontend - Admin Team Chat
 *
 * Features:
 * - Shows all teams (not just user's team)
 * - Expandable to show team members
 * - Online/offline status for members
 * - Click member for private chat
 * - Click team for broadcast to team
 *
 * @since 2025-11-13
 */

import React, { useState, useEffect } from 'react';
import { useChat } from '../../contexts/ChatContext';
import './AdminTeamList.css';

/**
 * AdminTeamList - Shows all teams with expandable member lists (admin view)
 *
 * @param {Function} onSelectMember - Callback when member is selected for private chat
 * @param {Function} onSelectTeam - Callback when team is selected for broadcast
 * @returns {JSX.Element}
 */
const AdminTeamList = ({ onSelectMember, onSelectTeam }) => {
  const { user, selectedTeamMember, selectedTeam, selectTeam } = useChat();
  const [teams, setTeams] = useState([]);
  const [expandedTeams, setExpandedTeams] = useState(new Set());
  const [loading, setLoading] = useState(true);

  // Load all teams with members
  useEffect(() => {
    const loadTeams = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/teams/all-with-members', {
          method: 'GET',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        });

        if (response.ok) {
          const data = await response.json();
          setTeams(data.teams || []);
        } else {
          console.error('[AdminTeamList] Failed to load teams:', response.status);
          setTeams([]);
        }
      } catch (error) {
        console.error('[AdminTeamList] Error loading teams:', error);
        setTeams([]);
      } finally {
        setLoading(false);
      }
    };

    if (user && (user.role === 'admin' || user.role === 'super_admin')) {
      loadTeams();
    }
  }, [user]);

  const toggleTeamExpansion = (teamId) => {
    setExpandedTeams(prev => {
      const newSet = new Set(prev);
      if (newSet.has(teamId)) {
        newSet.delete(teamId);
      } else {
        newSet.add(teamId);
      }
      return newSet;
    });
  };

  const handleMemberClick = (member) => {
    // Use context function to select member (clears team selection automatically)
    if (onSelectMember) {
      onSelectMember(member);
    }
  };

  const handleTeamBroadcastClick = (team) => {
    // Use context function to select team (clears member selection automatically)
    selectTeam(team);
    if (onSelectTeam) {
      onSelectTeam(team);
    }
  };

  if (loading) {
    return (
      <div className="admin-team-list-loading">
        <p>Loading teams...</p>
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <div className="admin-team-list-empty">
        <p>No teams available</p>
      </div>
    );
  }

  return (
    <div className="admin-team-list">
      <div className="admin-team-list-header">
        <h4>All Teams</h4>
        <span className="admin-team-count">{teams.length} teams</span>
      </div>

      <div className="admin-team-list-items">
        {teams.map(team => {
          const isExpanded = expandedTeams.has(team.id);
          const totalCount = team.members?.length || 0;

          return (
            <div key={team.id} className="admin-team-item">
              {/* Team Header - Expandable */}
              <div
                className="admin-team-header"
                onClick={() => toggleTeamExpansion(team.id)}
              >
                <span className="admin-team-expand-icon">
                  {isExpanded ? '▼' : '►'}
                </span>
                <div className="admin-team-info">
                  <div className="admin-team-name">{team.name}</div>
                  <div className="admin-team-status">
                    {totalCount} members
                  </div>
                </div>
              </div>

              {/* Expanded: Show members + broadcast button */}
              {isExpanded && (
                <div className="admin-team-members">
                  {/* Broadcast Button */}
                  <button
                    className={`admin-team-broadcast-btn ${selectedTeam?.id === team.id ? 'selected' : ''}`}
                    onClick={() => handleTeamBroadcastClick(team)}
                  >
                    📢 Broadcast to {team.name}
                  </button>

                  {/* Member List */}
                  {team.members && team.members.length > 0 ? (
                    <div className="admin-team-member-list">
                      {team.members.map(member => (
                        <div
                          key={member.id}
                          className={`admin-team-member ${selectedTeamMember?.id === member.id ? 'selected' : ''}`}
                          onClick={() => handleMemberClick(member)}
                        >
                          <div className="admin-member-info">
                            <div className="admin-member-name">{member.display_name}</div>
                            <div className="admin-member-username">@{member.username}</div>
                          </div>
                          {member.role === 'team_leader' && (
                            <span className="admin-member-badge">Captain</span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="admin-team-no-members">No members</div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminTeamList;
