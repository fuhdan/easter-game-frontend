/**
 * Component: GamesTab
 * Purpose: Wrapper for games management via AITrainingManagement
 * Part of: Easter Quest 2025 Frontend - Game Package Management
 *
 * Features:
 * - Displays AITrainingManagement with games tab active
 * - No tabs shown (integrated view)
 *
 * @since 2025-11-20
 */

import React from 'react';
import AITrainingManagement from '../../AITrainingManagement/AITrainingManagement';

function GamesTab() {
  return (
    <div className="games-tab-wrapper">
      <AITrainingManagement initialTab="games" showTabs={false} />
    </div>
  );
}

export default GamesTab;
