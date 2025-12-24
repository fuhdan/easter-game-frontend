/**
 * Component: Profile
 * Purpose: User profile management with tab-based interface
 * Part of: Easter Quest - Ypsomed AG Easter Challenge Frontend
 *
 * Features:
 * - All roles: Password change
 * - Team Captains: Team settings + game rating
 * - Tab-based design matching other dashboards
 *
 * Notes:
 * - Team management moved to TeamManagement panel
 * - Card-based design with rounded tabs
 * - Role-based tab visibility
 *
 * @since 2025-08-27
 * @updated 2025-11-23 - Refactored to tab-based design
 */

import React, { useState } from 'react';
import { logger } from '../../utils/logger';
import PropTypes from 'prop-types';
import PasswordChangeCard from './PasswordChangeCard';
import GameRatingCard from './GameRatingCard';
import TeamNameCard from './TeamNameCard';
import './Profile.css';

/**
 * Profile component - User profile management with tab-based interface
 *
 * Displays tabs based on user role:
 * - All users: Password tab
 * - Team Captains: Password, Team Settings, Game Rating tabs
 *
 * @param {Object} props - Component props
 * @param {Object} props.user - Current authenticated user object
 * @param {number} props.user.id - User ID
 * @param {string} props.user.username - Username
 * @param {string} props.user.email - Email address
 * @param {string} props.user.display_name - Display name
 * @param {string} props.user.role - User role (player/team_captain/game_admin/admin)
 * @param {number} [props.user.team_id] - Team ID (if user is in a team)
 * @param {string} [props.user.team_name] - Team name (if user is in a team)
 * @returns {JSX.Element} Profile interface with role-appropriate features
 *
 * @example
 * <Profile user={currentUser} />
 */
const Profile = ({ user }) => {
    // State for active tab
    const [activeTab, setActiveTab] = useState('password');

    // SECURITY: Validate user prop and required fields
    if (!user) {
        logger.error('Profile component: user prop is required');
        return (
            <div className="profile-card">
                <div className="card-header">⚠️ Error</div>
                <div className="card-body">
                    <p>User data not available. Please try logging in again.</p>
                </div>
            </div>
        );
    }

    // Validate required user fields
    if (!user.id || !user.username || !user.role) {
        logger.error('Profile component: user object missing required fields', {
            hasId: !!user.id,
            hasUsername: !!user.username,
            hasRole: !!user.role
        });
        return (
            <div className="profile-card">
                <div className="card-header">⚠️ Error</div>
                <div className="card-body">
                    <p>Invalid user data. Please try logging in again.</p>
                </div>
            </div>
        );
    }

    const currentUser = user;

    /**
     * Render tab navigation buttons
     * Tabs shown based on user role:
     * - All: Password
     * - Team Captain: Password, Team Settings, Game Rating
     *
     * @returns {JSX.Element} Tab navigation
     */
    const renderTabNavigation = () => {
        const tabs = [];

        // Password tab - All users
        tabs.push({ id: 'password', label: '🔒 Password' });

        // Team Settings tab - Team captains only
        if (currentUser.role === 'team_captain') {
            tabs.push({ id: 'team-settings', label: '✏️ Team Settings' });
        }

        // Game Rating tab - Team captains only
        if (currentUser.role === 'team_captain') {
            tabs.push({ id: 'game-rating', label: '⭐ Game Rating' });
        }

        return (
            <div className="profile-tabs">
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
            case 'password':
                return <PasswordChangeCard />;

            case 'team-settings':
                return <TeamNameCard user={currentUser} />;

            case 'game-rating':
                return <GameRatingCard />;

            default:
                return <PasswordChangeCard />;
        }
    };

    return (
        <div className="profile">
            <div className="profile-card-container">
                {/* Card Header */}
                <div className="card-header">
                    <div className="header-title-group">
                        <span>👤 PROFILE</span>
                    </div>
                </div>

                {/* Card Body with Tabs */}
                <div className="card-body">
                    {renderTabNavigation()}
                    <div className="profile-content">
                        {renderTabContent()}
                    </div>
                </div>
            </div>
        </div>
    );
};

/**
 * PropTypes validation for Profile component
 * Validates user prop structure and required fields
 */
Profile.propTypes = {
    user: PropTypes.shape({
        id: PropTypes.number.isRequired,
        username: PropTypes.string.isRequired,
        email: PropTypes.string.isRequired,
        display_name: PropTypes.string,
        role: PropTypes.oneOf(['player', 'team_captain', 'game_admin', 'admin']).isRequired,
        team_id: PropTypes.number,
        team_name: PropTypes.string,
        is_team_leader: PropTypes.bool
    }).isRequired
};

export default Profile;
