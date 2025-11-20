/**
 * Component: ErrorBoundary
 * Purpose: Catch and handle React component errors gracefully
 * Part of: Easter Quest 2025 Frontend
 *
 * Features:
 * - Catches JavaScript errors in child component tree
 * - Logs error details to console in development
 * - Displays fallback UI instead of white screen
 * - Allows user to reload the application
 * - Shows detailed error information in development mode
 *
 * Usage:
 * Wrap any component tree that should be protected:
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 *
 * @since 2025-11-20
 */

import React from 'react';
import './ErrorBoundary.css';

/**
 * Error Boundary component to catch React errors
 *
 * Note: Error boundaries do NOT catch errors for:
 * - Event handlers (use try-catch instead)
 * - Asynchronous code (setTimeout, promises)
 * - Server-side rendering
 * - Errors thrown in the error boundary itself
 *
 * @class ErrorBoundary
 * @extends {React.Component}
 */
class ErrorBoundary extends React.Component {
  /**
   * Initialize error boundary state
   * @param {Object} props - Component props
   */
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  /**
   * Update state when an error is caught
   * This is called during the render phase
   *
   * @static
   * @param {Error} error - The error that was thrown
   * @returns {Object} New state with hasError flag
   */
  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  /**
   * Log error details and update state
   * This is called during the commit phase
   *
   * @param {Error} error - The error that was thrown
   * @param {Object} errorInfo - Component stack trace information
   */
  componentDidCatch(error, errorInfo) {
    // SECURITY: Log error to console in development only
    if (process.env.NODE_ENV === 'development') {
      console.error('Error caught by ErrorBoundary:', error);
      console.error('Component stack:', errorInfo.componentStack);
    }

    // TODO(2025-11-20): Send to error tracking service (Sentry, LogRocket, etc.)
    // Example: Sentry.captureException(error, { contexts: { react: errorInfo } });

    // Store error details in state for display
    this.setState({
      error,
      errorInfo
    });
  }

  /**
   * Handle reload button click
   * Reloads the entire application
   */
  handleReload = () => {
    window.location.reload();
  };

  /**
   * Render fallback UI or children
   * @returns {JSX.Element}
   */
  render() {
    if (this.state.hasError) {
      // Fallback UI when error is caught
      return (
        <div className="error-boundary">
          <div className="error-boundary-card">
            <div className="error-icon">⚠️</div>
            <h1>Something Went Wrong</h1>
            <p className="error-message">
              We're sorry, but something unexpected happened. The error has been logged
              and we'll look into it.
            </p>

            <div className="error-actions">
              <button
                className="btn btn-primary"
                onClick={this.handleReload}
              >
                🔄 Reload Application
              </button>
              <button
                className="btn btn-outline"
                onClick={() => window.history.back()}
              >
                ← Go Back
              </button>
            </div>

            {/* Show detailed error information in development mode only */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="error-details">
                <summary>🔧 Developer Information</summary>
                <div className="error-details-content">
                  <div className="error-section">
                    <h3>Error Message:</h3>
                    <pre className="error-text">
                      {this.state.error.toString()}
                    </pre>
                  </div>
                  {this.state.errorInfo && (
                    <div className="error-section">
                      <h3>Component Stack:</h3>
                      <pre className="error-stack">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    // No error, render children normally
    return this.props.children;
  }
}

export default ErrorBoundary;
