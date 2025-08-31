/**
 * Component: CurrentGame
 * Purpose: Display current game challenge and solution input
 * Part of: Easter Quest - Ypsomed AG Easter Challenge Frontend
 */

import React from 'react';

const CurrentGame = ({ gameState, onSubmitSolution }) => {
  return (
    <div className="profile-card">
      <div className="card-header">
        🎮 Current Game
      </div>
      <div className="card-body">
        <p>Current game interface will be implemented later</p>
        <p><small>Features: Challenge description, solution input, hints</small></p>
      </div>
    </div>
  );
};

export default CurrentGame;