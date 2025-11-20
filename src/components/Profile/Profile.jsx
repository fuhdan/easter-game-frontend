/**
 * Component: Profile
 * Purpose: User profile management with role-based functionality
 * Part of: Easter Quest - Ypsomed AG Easter Challenge Frontend
 *
 * Features:
 * - All roles: Password change
 * - Team Captains: Team management + game rating
 * - Admins: Team management
 * - Super Admins: System administration
 * 
 * Notes:
 * - Uses proper grid layout for team management
 * - Team management gets full width when present
 * - Responsive design with mobile support
 */

import React from 'react';
import PropTypes from 'prop-types';
import PasswordChangeCard from './PasswordChangeCard';
import TeamManagementCard from './TeamManagementCard';
import GameRatingCard from './GameRatingCard';
import TeamNameCard from './TeamNameCard';
import './Profile.css';

/**
 * Profile component - User profile management with role-based functionality
 *
 * Displays different interface elements based on user role:
 * - All users: Password change functionality
 * - Team Captains: Team name editing, team management, game rating
 * - Admins: Team management
 * - Super Admins: System administration access
 *
 * @param {Object} props - Component props
 * @param {Object} props.user - Current authenticated user object
 * @param {number} props.user.id - User ID
 * @param {string} props.user.username - Username
 * @param {string} props.user.email - Email address
 * @param {string} props.user.display_name - Display name
 * @param {string} props.user.role - User role (player/team_captain/admin/super_admin)
 * @param {number} [props.user.team_id] - Team ID (if user is in a team)
 * @param {string} [props.user.team_name] - Team name (if user is in a team)
 * @returns {JSX.Element} Profile interface with role-appropriate features
 *
 * @example
 * <Profile user={currentUser} />
 */
const Profile = ({ user }) => {
    // SECURITY: Validate user prop and required fields
    if (!user) {
        console.error('Profile component: user prop is required');
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
        console.error('Profile component: user object missing required fields', {
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

    // Check if user has team management access
    const hasTeamManagement = currentUser.role === 'team_captain' || 
                             currentUser.role === 'super_admin' || 
                             currentUser.role === 'admin';

    /**
     * SuperAdminCard - Placeholder for super admin features
     *
     * @returns {JSX.Element} Super admin card placeholder
     * @note Future implementation will include system administration features
     */
    const SuperAdminCard = () => (
        <div className="profile-card">
            <div className="card-header">
                🔧 System Administration
            </div>
            <div className="card-body">
                <p>Super admin features will be implemented later</p>
                <p><small>Note: Full system access and admin management</small></p>
            </div>
        </div>
    );

    return (
        <div className="profile">
            {hasTeamManagement ? (
                // Layout with team management - uses full width layout
                <div className="profile-grid-with-team">
                    {/* Top row: Smaller cards side by side */}
                    <div className="profile-grid-team-row">
                        <PasswordChangeCard />
                        {currentUser.role === 'team_captain' && <TeamNameCard user={currentUser} />}
                        {currentUser.role === 'team_captain' && <GameRatingCard />}
                    </div>

                    {/* Full width: Team Management */}
                    <div className="team-management-full">
                        <TeamManagementCard user={currentUser} />
                    </div>

                    {/* Super admin card if needed */}
                    {currentUser.role === 'super_admin' && <SuperAdminCard />}
                </div>
            ) : (
                // Simple layout for basic users - standard grid
                <div className="profile-grid">
                    <PasswordChangeCard />
                </div>
            )}

            <div className="role-info">
                <h4 className="role-title">
                    Current Role: {currentUser.role.replace('_', ' ').toUpperCase()}
                </h4>
                <p className="role-description">
                    {currentUser.role === 'player' && 'You can change your password.'}
                    {currentUser.role === 'team_captain' && 'You can manage your team members, change your team name, change your password, and rate games.'}
                    {currentUser.role === 'admin' && 'You can change your password and manage team members.'}
                    {currentUser.role === 'super_admin' && 'You have full system access including admin management and system configuration.'}
                </p>
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
        role: PropTypes.oneOf(['player', 'team_captain', 'admin', 'super_admin']).isRequired,
        team_id: PropTypes.number,
        team_name: PropTypes.string,
        is_team_leader: PropTypes.bool
    }).isRequired
};

export default Profile;