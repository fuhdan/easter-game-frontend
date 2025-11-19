/**
 * Component: AdminContacts
 * Purpose: Display list of admins who have contacted the user
 * Part of: Easter Quest Frontend - Team Chat
 *
 * Features:
 * - Shows admins who have sent messages
 * - Click to open conversation with admin
 * - Shows admin badge
 *
 * @since 2025-11-15
 */

import React from 'react';
import { useChat } from '../../contexts/ChatContext';
import './AdminContacts.css';

/**
 * AdminContacts - Shows admin contacts
 *
 * @returns {JSX.Element}
 */
const AdminContacts = () => {
  const { adminContacts, selectedTeamMember, selectTeamMember, viewingAdminBroadcast, setViewingAdminBroadcast } = useChat();


  const handleHeaderClick = () => {
    // Show admin broadcast view
    selectTeamMember(null);
    if (setViewingAdminBroadcast) {
      setViewingAdminBroadcast(true);
    }
  };

  // Check if header should be highlighted (viewing admin broadcast with no member selected)
  const isHeaderSelected = viewingAdminBroadcast && !selectedTeamMember;

  return (
    <div className="admin-contacts">
      <div
        className={`admin-contacts-header ${isHeaderSelected ? 'selected' : ''}`}
        onClick={handleHeaderClick}
        style={{ cursor: 'pointer' }}
      >
        <h4>Admin Support</h4>
        <span className="admin-contacts-count">{adminContacts?.length || 0}</span>
      </div>

      {!adminContacts || adminContacts.length === 0 ? (
        <div className="admin-contacts-empty">
          <p>No admin messages yet</p>
        </div>
      ) : (
        <div className="admin-contacts-items">
          {adminContacts.map(admin => (
            <div
              key={admin.id}
              className={`admin-contact-item ${selectedTeamMember?.id === admin.id ? 'selected' : ''}`}
              onClick={() => selectTeamMember(admin)}
            >
              <div className="admin-contact-info">
                <div className="admin-contact-name">{admin.display_name}</div>
                <div className="admin-contact-username">@{admin.username}</div>
              </div>
              <span className="admin-contact-badge">Admin</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default React.memo(AdminContacts);
