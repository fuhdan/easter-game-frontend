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
 * - Admin Notifications section for one-way admin broadcasts
 *
 * @since 2025-11-09
 */

import React from 'react';
import { useChat } from '../../contexts/ChatContext';
import { logger } from '../../utils/logger';
import './TeamMemberList.css';

/**
 * TeamMemberList - Shows team members with online status
 *
 * @returns {JSX.Element}
 */
const TeamMemberList = () => {
  const {
    teamMembers,
    selectedTeamMember,
    selectTeamMember,
    user,
    showingAdminNotifications,
    selectAdminNotifications,
    clearAdminNotifications,
    unreadCounts,
    adminNotifications,
    adminContacts,
    selectedAdminContact,
    selectAdminContact
  } = useChat();

  const teamName = user?.team_name || 'Team';

  const handleHeaderClick = () => {
    logger.info('team_broadcast_selected', {
      previousSelection: selectedTeamMember?.id || selectedAdminContact?.id || 'admin_notifications',
      module: 'TeamMemberList'
    });
    // Clear selection to show team broadcast
    selectTeamMember(null);
    clearAdminNotifications();
    selectAdminContact(null);
  };

  const handleTeamMemberClick = (member) => {
    logger.info('team_member_selected', {
      memberId: member.id,
      memberUsername: member.username,
      memberRole: member.role,
      module: 'TeamMemberList'
    });
    selectTeamMember(member);
  };

  const handleAdminNotificationsClick = () => {
    logger.info('admin_notifications_selected', {
      notificationCount: adminNotifications.length,
      unreadCount: unreadCounts.adminNotifications,
      module: 'TeamMemberList'
    });
    selectAdminNotifications();
  };

  const handleAdminContactClick = (admin) => {
    logger.info('admin_contact_selected', {
      adminId: admin.id,
      adminUsername: admin.username,
      unreadCount: unreadCounts.private[admin.id] || 0,
      module: 'TeamMemberList'
    });
    selectAdminContact(admin);
  };

  // Check if header should be highlighted (viewing team broadcast)
  const isHeaderSelected = !selectedTeamMember && !showingAdminNotifications && !selectedAdminContact;

  // Convert adminContacts object to array
  const adminContactsList = Object.values(adminContacts || {});

  return (
    <div className="team-member-list">
      {/* Team Broadcast Header */}
      <div
        className={`team-member-list-header ${isHeaderSelected ? 'selected' : ''}`}
        onClick={handleHeaderClick}
        style={{ cursor: 'pointer' }}
      >
        <span className="header-icon">📢</span>
        <h4>{teamName}</h4>
        <span className="team-member-count">{teamMembers.length}</span>
      </div>

      {/* Team Members */}
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
              onClick={() => handleTeamMemberClick(member)}
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

      {/* Admin Notifications Section */}
      <div className="admin-notifications-section">
        <div
          className={`admin-notifications-header ${showingAdminNotifications ? 'selected' : ''}`}
          onClick={handleAdminNotificationsClick}
          style={{ cursor: 'pointer' }}
        >
          <span className="header-icon">👑</span>
          <h4>Admin Notifications</h4>
          {unreadCounts.adminNotifications > 0 && (
            <span className="unread-badge">{unreadCounts.adminNotifications}</span>
          )}
          {adminNotifications.length > 0 && unreadCounts.adminNotifications === 0 && (
            <span className="notification-count">{adminNotifications.length}</span>
          )}
        </div>

        {/* Admin Contacts - Admins who have messaged this user */}
        {adminContactsList.length > 0 && (
          <div className="admin-contacts-list">
            {adminContactsList.map(admin => (
              <div
                key={admin.id}
                className={`admin-contact-item ${selectedAdminContact?.id === admin.id ? 'selected' : ''}`}
                onClick={() => handleAdminContactClick(admin)}
              >
                <div className="admin-contact-info">
                  <div className="admin-contact-name">{admin.display_name || admin.username}</div>
                  <div className="admin-contact-username">@{admin.username}</div>
                </div>
                <span className="admin-contact-badge">Admin</span>
                {unreadCounts.private[admin.id] > 0 && (
                  <span className="unread-badge">{unreadCounts.private[admin.id]}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(TeamMemberList);
