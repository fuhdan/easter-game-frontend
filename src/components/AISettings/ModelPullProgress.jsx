/**
 * Model Pull Progress Component
 *
 * File: components/AISettings/ModelPullProgress.jsx
 *
 * Real-time progress bar for Ollama model downloads.
 * Receives progress updates via SSE from parent component.
 *
 * @since 2025-12-10
 */

import React from 'react';
import './ModelPullProgress.css';

const ModelPullProgress = ({ modelName, progress = 0, status = 'downloading', message = 'Starting download...' }) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'downloading':
        return '⏳';
      case 'completed':
        return '✓';
      case 'failed':
        return '✗';
      default:
        return '⏳';
    }
  };

  const getStatusClass = () => {
    switch (status) {
      case 'completed':
        return 'completed';
      case 'failed':
        return 'failed';
      default:
        return 'downloading';
    }
  };

  return (
    <div className={`model-pull-progress ${getStatusClass()}`}>
      <div className="pull-progress-header">
        <span className="progress-icon">{getStatusIcon()}</span>
        <span className="progress-model-name">{modelName}</span>
        <span className="progress-percentage">{progress}%</span>
      </div>

      <div className="progress-bar-container">
        <div
          className="progress-bar-fill"
          style={{ width: `${progress}%` }}
        >
          <div className="progress-bar-shimmer"></div>
        </div>
      </div>

      <div className="pull-progress-details">
        <span className="progress-message">{message}</span>
        {status === 'completed' && (
          <span className="progress-complete-badge">Complete!</span>
        )}
        {status === 'failed' && (
          <span className="progress-failed-badge">Failed</span>
        )}
      </div>
    </div>
  );
};

export default ModelPullProgress;
