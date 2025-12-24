/**
 * Model Selector Component
 *
 * File: components/AISettings/ModelSelector.jsx
 *
 * Dropdown to select model within active provider.
 * For Ollama: Shows only downloaded models
 * For Claude: Shows all available models
 *
 * @since 2025-12-10
 */

import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { logger } from '../../utils/logger';
import './ModelSelector.css';

const ModelSelector = ({ provider, activeModel, onSelect, disabled }) => {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (provider) {
      loadModels();
    }
  }, [provider?.name]);

  const loadModels = async () => {
    if (!provider) return;

    // For Ollama: Fetch only downloaded models
    if (provider.name === 'ollama') {
      setLoading(true);
      try {
        const response = await api.listOllamaModels();
        const downloadedModels = response.installed || [];
        const transformedModels = downloadedModels.map(m => ({
          name: m.name,
          display_name: m.name,
          size_gb: (m.size / (1024 * 1024 * 1024)).toFixed(2)
        }));
        setModels(transformedModels);
      } catch (err) {
        logger.error('ollama_models_load_failed', {
          errorMessage: err.message,
          module: 'ModelSelector'
        }, err);
        setModels([]);
      } finally {
        setLoading(false);
      }
    } else {
      // For Claude: Use registry models
      setModels(provider.available_models || []);
    }
  };

  const handleChange = (e) => {
    onSelect(e.target.value);
  };

  if (!provider) {
    return (
      <div className="model-selector">
        <label className="model-selector-label">AI Model</label>
        <p className="model-selector-empty">No provider selected.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="model-selector">
        <label className="model-selector-label">AI Model</label>
        <p className="model-selector-empty">Loading...</p>
      </div>
    );
  }

  if (models.length === 0) {
    return (
      <div className="model-selector">
        <label className="model-selector-label">AI Model</label>
        <p className="model-selector-empty">No models available.</p>
      </div>
    );
  }

  return (
    <div className="model-selector">
      <label htmlFor="model-select" className="model-selector-label">
        AI Model
        <span className="label-required">*</span>
      </label>
      <select
        id="model-select"
        className="model-select"
        value={activeModel}
        onChange={handleChange}
        disabled={disabled}
      >
        <option value="" disabled>Select a model...</option>
        {models.map(model => (
          <option key={model.name} value={model.name}>
            {model.display_name || model.name}
            {model.size_gb && ` (${model.size_gb}GB)`}
          </option>
        ))}
      </select>
      <div className="model-info">
        {activeModel && (() => {
          const currentModel = models.find(m => m.name === activeModel);
          if (!currentModel) return null;

          return (
            <div className="model-details">
              <p className="model-description">{currentModel.description}</p>
              <div className="model-specs">
                {currentModel.size_gb && (
                  <span className="spec">Size: {currentModel.size_gb}GB</span>
                )}
                {currentModel.context_window && (
                  <span className="spec">Context: {currentModel.context_window.toLocaleString()} tokens</span>
                )}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};

export default ModelSelector;
