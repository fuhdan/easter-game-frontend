/**
 * Component: TeamLoader
 * Purpose: Team creation loading indicator with rotating company logo
 * Part of: Easter Quest - Ypsomed AG Easter Challenge Frontend
 * 
 * Notes:
 * - Separate from main Loader to avoid affecting login/app loading states
 * - Uses rotating Ypsomed logo animation
 * - Only used during team processing operations
 * 
 * @since 2025-09-04
 * @see ../Loader/Loader.jsx for main app loading
 */

import React from "react";
import "./TeamLoader.css";

const TeamLoader = ({ message = "Processing...", progress = 0 }) => {
  return (
    <div className="loading-overlay">
      <div className="loading-content">
        <div className="loading-logo">
          <img src="/assets/ypsomed-logo.png" alt="Ypsomed Logo" />
        </div>
        <p>
          {message} {progress > 0 ? `${progress}%` : ""}
        </p>
      </div>
    </div>
  );
};

export default TeamLoader;