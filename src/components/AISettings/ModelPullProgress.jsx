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

import React, { useEffect, useRef } from 'react';
import { logger } from '../../utils/logger';
import './ModelPullProgress.css';

const ModelPullProgress = ({ modelName, progress = 0, status = 'downloading', message = 'Starting download...' }) => {
  const previousStatusRef = useRef(status);
  const previousProgressRef = useRef(progress);

  // Log status changes
  useEffect(() => {
    if (previousStatusRef.current !== status) {
      logger.info('model_pull_status_changed', {
        modelName,
        previousStatus: previousStatusRef.current,
        newStatus: status,
        progress,
        module: 'ModelPullProgress'
      });
      previousStatusRef.current = status;
    }
  }, [status, modelName, progress]);

  // Log progress milestones
  useEffect(() => {
    const prevProgress = previousProgressRef.current;
    const milestones = [25, 50, 75, 100];

    for (const milestone of milestones) {
      if (prevProgress < milestone && progress >= milestone) {
        logger.debug('model_pull_progress_milestone', {
          modelName,
          milestone,
          progress,
          status,
          module: 'ModelPullProgress'
        });
      }
    }

    previousProgressRef.current = progress;
  }, [progress, modelName, status]);

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
