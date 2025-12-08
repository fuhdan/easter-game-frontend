/**
 * Component: TeamManagement
 * Purpose: Team creation and management interface
 * Part of: Easter Quest 2025 Frontend - Team Administration
 *
 * Features:
 * - Player Management (admin only) - Manage player list, CSV import
 * - Team Creation (admin only) - Team statistics summary + configuration panel
 * - Teams View (admin + game_admin: all teams, team_captain: own team)
 * - Activation Codes (admin + game_admin + team_captain) - Member activation codes
 * - Role-based tab visibility
 * - Card-based design matching other dashboards
 *
 * Tab Order: Player Management → Team Creation → Teams → Activation Codes
 *
 * Tab Structure:
 * - Admin: 4 tabs (Player Management, Team Creation, Teams, Activation Codes)
 * - Game Admin: 2 tabs (Teams, Activation Codes)
 * - Team Captain: 2 tabs (Teams, Activation Codes)
 *
 * Workflow:
 * 1. Player Management: Import/manage players
 * 2. Team Creation: Configure and generate teams
 * 3. Teams: View generated teams
 * 4. Activation Codes: Distribute codes to team members
 *
 * Security:
 * - Admins and game_admins see all teams and members
 * - Team captains see only their team
 * - Role-based tab filtering
 *
 * @module components/TeamManagement
 * @since 2025-11-23
 */

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import './TeamManagement.css';
import PlayerManagementTab from './PlayerManagementTab';
import TeamCreationTab from './TeamCreationTab';
import TeamsTab from './TeamsTab';
import ActivationCodesTab from './ActivationCodesTab';

/**
 * TeamManagement component - Team creation and management with role-based access
 *
 * @param {Object} props - Component props
 * @param {Object} props.user - Current authenticated user
 * @param {string} props.user.role - User role (admin, game_admin, team_captain)
 * @param {number} [props.user.team_id] - Team ID (for captains)
 * @returns {JSX.Element} Team management interface
 *
 * @example
 * <TeamManagement user={currentUser} />
 */
function TeamManagement({ user }) {
  // Determine default tab based on role
  const getDefaultTab = () => {
    if (user.role === 'admin') return 'player-management';
    if (user.role === 'game_admin' || user.role === 'team_captain') return 'teams';
    return 'teams'; // Fallback
  };

  // State management
  const [activeTab, setActiveTab] = useState(getDefaultTab());

  /**
   * Render tab navigation buttons
   * Tab order: Player Management, Team Creation, Teams, Activation Codes
   * Tabs shown based on user role:
   * - Admin: 4 tabs (Player Management, Team Creation, Teams, Activation Codes)
   * - Game Admin: 3 tabs (Player Management, Teams, Activation Codes)
   * - Team Captain: 2 tabs (Teams, Activation Codes)
   *
   * @returns {JSX.Element} Tab navigation
   */
  const renderTabNavigation = () => {
    const tabs = [];

    // Player Management tab - Admin only
    if (user.role === 'admin') {
      tabs.push({ id: 'player-management', label: '👤 Player Management' });
    }

    // Team Creation tab - Admin only
    if (user.role === 'admin') {
      tabs.push({ id: 'team-creation', label: '📋 Team Creation' });
    }

    // Teams tab - All roles (admin, game_admin, team_captain)
    tabs.push({ id: 'teams', label: '👥 Teams' });

    // Activation Codes tab - All roles (admin, game_admin, team_captain)
    tabs.push({ id: 'activation-codes', label: '🔑 Activation Codes' });

    return (
      <div className="team-management-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
            aria-label={`Switch to ${tab.label}`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    );
  };

  /**
   * Render content for active tab
   *
   * @returns {JSX.Element} Tab content
   */
  const renderTabContent = () => {
    switch (activeTab) {
      case 'player-management':
        return <PlayerManagementTab user={user} />;

      case 'team-creation':
        return <TeamCreationTab user={user} />;

      case 'teams':
        return <TeamsTab user={user} />;

      case 'activation-codes':
        return <ActivationCodesTab user={user} />;

      default:
        return null;
    }
  };

  return (
    <div className="team-management-dashboard">
      <div className="team-management-card-container">
        {/* Card Header */}
        <div className="card-header">
          <div className="header-title-group">
            <span>👥 TEAM MANAGEMENT</span>
          </div>
        </div>

        {/* Card Body with Tabs */}
        <div className="card-body">
          {renderTabNavigation()}
          <div className="dashboard-content">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * PropTypes validation for TeamManagement component
 */
TeamManagement.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.number.isRequired,
    username: PropTypes.string.isRequired,
    role: PropTypes.oneOf(['admin', 'game_admin', 'team_captain']).isRequired,
    team_id: PropTypes.number,
    team_name: PropTypes.string
  }).isRequired
};

export default TeamManagement;
