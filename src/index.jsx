/**
 * Easter Game Frontend - Application Entry Point
 * File: frontend/src/index.jsx
 * Description: React application entry point and DOM rendering
 * Author: Daniel Fuhrer
 * Created: 2025
 * License: MIT
 *
 * Features:
 * - React 18 createRoot API
 * - StrictMode for development warnings
 * - App component mounting
 * - Sentry error tracking initialization
 * - Centralized logging system
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { initializeSentry } from './utils/sentry';

// SECURITY: Initialize Sentry for error tracking (production only)
initializeSentry();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);