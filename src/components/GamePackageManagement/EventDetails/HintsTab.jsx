/**
 * Component: HintsTab
 * Purpose: Wrapper for hints management via AITrainingManagement
 * Part of: Easter Quest 2025 Frontend - Game Package Management
 *
 * Features:
 * - Displays AITrainingManagement with hints tab active
 * - No tabs shown (integrated view)
 *
 * @since 2025-11-20
 */

import React from 'react';
import PropTypes from 'prop-types';
import AITrainingManagement from '../../AITrainingManagement/AITrainingManagement';

function HintsTab({ eventYear }) {
  return (
    <div className="hints-tab-wrapper">
      <AITrainingManagement initialTab="hints" showTabs={false} eventYear={eventYear} />
    </div>
  );
}

HintsTab.propTypes = {
  eventYear: PropTypes.number
};

export default HintsTab;
