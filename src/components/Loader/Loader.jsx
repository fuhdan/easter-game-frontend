/**
 * Component: Loader
 * Purpose: General-purpose loading indicator with Ypsomed branding
 * Part of: Easter Quest Frontend
 *
 * Features:
 * - Ypsomed logo display
 * - Customizable loading message
 * - Centered overlay display
 * - Used for app initialization and general loading states
 *
 * @since 2025-08-27
 */

import React from "react";
import "./Loader.css";

/**
 * Loader component - displays loading state with Ypsomed logo
 *
 * @param {Object} props - Component props
 * @param {string} [props.message="Loading..."] - Loading message to display
 * @returns {JSX.Element}
 */
const Loader = ({ message = "Loading..." }) => {
  return (
    <div className="loading">
      <div className="ypsomed-logo">
        <img src="/assets/ypsomed-logo.png" alt="Ypsomed Logo" />
      </div>
      <p>{message}</p>
    </div>
  );
};

export default Loader;
