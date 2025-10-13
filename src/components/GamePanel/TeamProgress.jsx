/**
 * Component: TeamProgress
 * Purpose: Show team's overall game progress and scores
 * Part of: Easter Quest - Ypsomed AG Easter Challenge Frontend
 */

import React from 'react';

const TeamProgress = ({ teamId, gameState }) => {
  return (
    <div className="profile-card">
      <div className="card-header">
        👥 Team Progress
      </div>
      <div className="card-body">
        <p>Team progress display will be implemented later</p>
        <p><small>Features: Game completion, scores, team standings</small></p>
      </div>
    </div>
  );
};

export default TeamProgress;