/**
 * Component: TeamMemberList
 * Purpose: Display list of team members with online status
 * Part of: Easter Quest Frontend - Team Chat
 *
 * Features:
 * - Shows all active team members
 * - Green/gray indicator for online/offline status
 * - Click to open private chat
 * - Shows current user differently
 *
 * @since 2025-11-09
 */

import React from 'react';
import { useChat } from '../../contexts/ChatContext';
import './TeamMemberList.css';

/**
 * TeamMemberList - Shows team members with online status
 *
 * @returns {JSX.Element}
 */
const TeamMemberList = () => {
  const { teamMembers, selectedTeamMember, selectTeamMember, user } = useChat();

  const teamName = user?.team_name || 'Team';

  const handleHeaderClick = () => {
    // Clear selection to show team broadcast
    selectTeamMember(null);
  };

  // Check if header should be highlighted (viewing team broadcast)
  const isHeaderSelected = !selectedTeamMember;

  return (
    <div className="team-member-list">
      <div
        className={`team-member-list-header ${isHeaderSelected ? 'selected' : ''}`}
        onClick={handleHeaderClick}
        style={{ cursor: 'pointer' }}
      >
        <h4>{teamName}</h4>
        <span className="team-member-count">{teamMembers.length}</span>
      </div>

      {teamMembers.length === 0 ? (
        <div className="team-member-list-empty">
          <p>No other team members</p>
        </div>
      ) : (
        <div className="team-member-list-items">
          {teamMembers.map(member => (
            <div
              key={member.id}
              className={`team-member-item ${selectedTeamMember?.id === member.id ? 'selected' : ''}`}
              onClick={() => selectTeamMember(member)}
            >
              <div className="team-member-info">
                <div className="team-member-name">{member.display_name}</div>
                <div className="team-member-username">@{member.username}</div>
              </div>
              {member.role === 'team_leader' && (
                <span className="team-member-badge">Leader</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default React.memo(TeamMemberList);
