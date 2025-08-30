/**
 * Component: TeamCreation
 * Purpose: Team management interface with CSV upload and team building
 * Part of: Easter Quest 2025 Frontend Dashboard
 */

import React, { useState, useEffect } from 'react';
import CSVUploader from './CSVUploader';
import TeamBuilder from './TeamBuilder';
import UserTable from './UserTable';
import './TeamCreation.css';

/**
 * Team creation and management component.
 * @param {Object} props
 * @param {Object} props.user - Current authenticated user
 * @returns {JSX.Element}
 */
const TeamCreation = ({ user }) => {
    const [users, setUsers] = useState([]);
    const [teams, setTeams] = useState([]);

    useEffect(() => {
        loadUsersAndTeams();
    }, []);

    /**
     * Load all users and teams from API.
     * @async
     * @returns {Promise<void>}
     */
    async function loadUsersAndTeams() {
        // TODO: Implement API calls
    }

    return (
        <div className="team-creation">
            <div className="team-creation-grid">
                <CSVUploader onUpload={loadUsersAndTeams} />
                <TeamBuilder 
                    users={users}
                    teams={teams}
                    onTeamCreate={loadUsersAndTeams}
                />
            </div>
            
            <UserTable 
                users={users}
                teams={teams}
                onUserUpdate={loadUsersAndTeams}
            />
        </div>
    );
};

export default TeamCreation;