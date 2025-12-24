/**
 * Ollama Model Manager Component
 *
 * File: components/AISettings/OllamaModelManager.jsx
 *
 * Features:
 * - List installed Ollama models
 * - Pull (download) new models with progress bar
 * - Delete unused models
 * - Real-time download progress tracking
 *
 * @since 2025-12-10
 */

import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import ModelPullProgress from './ModelPullProgress';
import { logger } from '../../utils/logger';
import './OllamaModelManager.css';

const OllamaModelManager = ({ activeModel, onModelInstalled }) => {
  const [installedModels, setInstalledModels] = useState([]);
  const [availableModels, setAvailableModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ollamaReachable, setOllamaReachable] = useState(true);
  const [selectedModel, setSelectedModel] = useState('');
  const [pullingTasks, setPullingTasks] = useState({}); // taskId -> { taskId, modelName, progress, status, message }
  const [error, setError] = useState(null);
  const eventSourceRef = React.useRef(null);

  useEffect(() => {
    loadModels();
    restoreActivePulls();
    setupSSE();

    return () => {
      // Cleanup SSE connection on unmount
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const loadModels = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.listOllamaModels();
      setInstalledModels(response.installed || []);
      setAvailableModels(response.available || []);
      setOllamaReachable(response.ollama_reachable !== false);
    } catch (err) {
      logger.error('ollama_models_load_failed', {
        errorMessage: err.message,
        module: 'OllamaModelManager'
      }, err);
      setError('Failed to load Ollama models');
      setOllamaReachable(false);
    } finally {
      setLoading(false);
    }
  };

  const restoreActivePulls = async () => {
    try {
      const response = await api.getActivePulls();
      const activePulls = response.active_pulls || [];

      if (activePulls.length > 0) {
        const restoredTasks = {};
        activePulls.forEach(pull => {
          restoredTasks[pull.task_id] = {
            taskId: pull.task_id,
            modelName: pull.model_name,
            progress: pull.progress || 0,
            status: pull.status || 'downloading',
            message: pull.message || 'Downloading...'
          };
        });
        setPullingTasks(restoredTasks);
      }
    } catch (err) {
      logger.error('ollama_active_pulls_restore_failed', {
        errorMessage: err.message,
        module: 'OllamaModelManager'
      }, err);
    }
  };

  const setupSSE = () => {
    // Close existing connection if any
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    // Create new EventSource connection
    const eventSource = new EventSource('/api/v1/sse/model-downloads/stream', {
      withCredentials: true
    });

    eventSource.addEventListener('progress', (event) => {
      const data = JSON.parse(event.data);
      setPullingTasks(prev => ({
        ...prev,
        [data.task_id]: {
          taskId: data.task_id,
          modelName: data.model_name,
          progress: data.progress || 0,
          status: data.status || 'downloading',
          message: data.message || 'Downloading...'
        }
      }));
    });

    eventSource.addEventListener('completed', (event) => {
      const data = JSON.parse(event.data);
      setPullingTasks(prev => {
        const updated = { ...prev };
        delete updated[data.task_id];
        return updated;
      });
      loadModels(); // Reload to show new model
      if (onModelInstalled) {
        onModelInstalled();
      }
    });

    eventSource.addEventListener('failed', (event) => {
      const data = JSON.parse(event.data);
      setPullingTasks(prev => {
        const updated = { ...prev };
        delete updated[data.task_id];
        return updated;
      });
      setError(`Failed to download ${data.model_name}: ${data.error || 'Unknown error'}`);
    });

    eventSource.addEventListener('error', (event) => {
      logger.error('ollama_sse_connection_error', {
        module: 'OllamaModelManager'
      });
      // EventSource will automatically reconnect
    });

    eventSourceRef.current = eventSource;
  };

  const handlePullModel = async () => {
    if (!selectedModel) return;

    logger.debug('ollama_model_pull_started', {
      modelName: selectedModel,
      module: 'OllamaModelManager'
    });
    setError(null);
    try {
      const response = await api.pullOllamaModel(selectedModel);
      logger.debug('ollama_model_pull_initiated', {
        modelName: selectedModel,
        taskId: response.task_id,
        module: 'OllamaModelManager'
      });
      if (response.success) {
        // Add to pulling tasks
        setPullingTasks(prev => ({
          ...prev,
          [response.task_id]: {
            taskId: response.task_id,
            modelName: response.model_name,
            status: 'downloading',
            progress: 0
          }
        }));
        setSelectedModel(''); // Reset selection
      }
    } catch (err) {
      logger.error('ollama_model_pull_failed', {
        modelName: selectedModel,
        errorMessage: err.message,
        errorDetail: err.data?.detail,
        module: 'OllamaModelManager'
      }, err);
      const errorMsg = err.data?.detail || err.data?.message || err.message || 'Unknown error';
      const errors = err.data?.errors;
      if (errors && errors.length > 0) {
        const validationErrors = errors.map(e => e.msg).join(', ');
        setError(`Validation error: ${validationErrors}`);
      } else {
        setError(`Failed to start download: ${errorMsg}`);
      }
    }
  };


  const handleDeleteModel = async (modelName) => {
    if (!window.confirm(`Are you sure you want to delete ${modelName}? This will free disk space but you'll need to re-download it if needed later.`)) {
      return;
    }

    setError(null);
    try {
      const response = await api.deleteOllamaModel(modelName);
      if (response.success) {
        // Wait a moment for Ollama to update its internal state
        await new Promise(resolve => setTimeout(resolve, 500));
        // Reload models list
        await loadModels();
      } else {
        setError(`Failed to delete model: ${response.message || 'Unknown error'}`);
      }
    } catch (err) {
      logger.error('ollama_model_delete_failed', {
        modelName,
        errorMessage: err.message,
        module: 'OllamaModelManager'
      }, err);
      setError(`Failed to delete model: ${err.message || 'Unknown error'}`);
    }
  };

  if (!ollamaReachable) {
    return (
      <div className="ollama-model-manager">
        <div className="ollama-unreachable">
          <span className="unreachable-icon">⚠️</span>
          <div>
            <strong>Ollama is not reachable</strong>
            <p>Make sure the Ollama Docker container is running.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ollama-model-manager">
      {error && (
        <div className="model-manager-error">
          {error}
        </div>
      )}

      {/* Active Pulling Tasks */}
      {Object.keys(pullingTasks).length > 0 && (
        <div className="pulling-tasks">
          <h4>Downloads in Progress</h4>
          {Object.values(pullingTasks).map(task => (
            <ModelPullProgress
              key={task.taskId}
              modelName={task.modelName}
              progress={task.progress}
              status={task.status}
              message={task.message}
            />
          ))}
        </div>
      )}

      {/* Pull New Model */}
      <div className="pull-model-section">
        <h4>Download New Model</h4>
        <div className="pull-model-form">
          <select
            className="model-pull-select"
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            disabled={loading}
          >
            <option value="">Select a model to download...</option>
            {availableModels.map(model => (
              <option key={model.name} value={model.name}>
                {model.display_name || model.name}
                {model.size_gb && ` (${model.size_gb}GB)`}
              </option>
            ))}
          </select>
          <button
            className="btn-pull-model"
            onClick={handlePullModel}
            disabled={!selectedModel || loading}
          >
            Download
          </button>
        </div>
        {selectedModel && (() => {
          const model = availableModels.find(m => m.name === selectedModel);
          return model ? (
            <p className="pull-model-info">
              {model.description}
              {model.size_gb && ` • Download size: ${model.size_gb}GB`}
            </p>
          ) : null;
        })()}
      </div>

      {/* Installed Models */}
      <div className="installed-models-section">
        <h4>Installed Models ({installedModels.length})</h4>
        {loading ? (
          <p className="loading-text">Loading models...</p>
        ) : installedModels.length === 0 ? (
          <p className="no-models">No models installed. Download one above to get started.</p>
        ) : (
          <div className="installed-models-list">
            {installedModels.map(model => (
              <div key={model.name} className={`installed-model-card ${model.name === activeModel ? 'active' : ''}`}>
                <div className="model-card-header">
                  <span className="model-name">{model.name}</span>
                  {model.name === activeModel && (
                    <span className="active-badge">Active</span>
                  )}
                </div>
                <div className="model-card-details">
                  <span className="model-size">{model.size_gb}GB</span>
                  {model.modified_at && (
                    <span className="model-modified">
                      Updated: {new Date(model.modified_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <button
                  className="btn-delete-model"
                  onClick={() => handleDeleteModel(model.name)}
                  disabled={model.name === activeModel}
                  title={model.name === activeModel ? "Cannot delete active model" : "Delete this model"}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OllamaModelManager;
