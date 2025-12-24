/**
 * AI Settings Admin Page
 *
 * File: components/AISettings/AISettings.jsx
 *
 * Features:
 * - Select AI provider (Ollama, Claude, etc.)
 * - Select model within provider
 * - For Ollama: manage local models (pull/delete)
 * - Test provider connection
 * - Hot-swap providers without restart
 *
 * Access: system_admin and admin roles only
 *
 * @since 2025-12-10
 */

import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import ProviderSelector from './ProviderSelector';
import ModelSelector from './ModelSelector';
import OllamaModelManager from './OllamaModelManager';
import { logger } from '../../utils/logger';
import './AISettings.css';

const AISettings = () => {
  const [providers, setProviders] = useState([]);
  const [activeProvider, setActiveProvider] = useState('');
  const [activeModel, setActiveModel] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [error, setError] = useState(null);
  const [modelRefreshKey, setModelRefreshKey] = useState(0);

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.listAIProviders();
      setProviders(response.providers || []);
      setActiveProvider(response.active_provider || '');
      setActiveModel(response.active_model || '');
    } catch (err) {
      logger.error('ai_providers_load_failed', {
        errorMessage: err.message,
        module: 'AISettings'
      }, err);
      setError('Failed to load AI providers. Please check your permissions.');
    } finally {
      setLoading(false);
    }
  };

  const handleProviderChange = async (providerName) => {
    setSaving(true);
    setTestResult(null);
    setError(null);
    try {
      const response = await api.setActiveProvider(providerName);
      if (response.success) {
        setActiveProvider(providerName);

        // Reset model to default for new provider
        const provider = providers.find(p => p.name === providerName);
        if (provider && provider.available_models && provider.available_models.length > 0) {
          const defaultModel = provider.available_models[0].name;
          setActiveModel(defaultModel);
        }

        // Reload providers to get updated info
        await loadProviders();
      }
    } catch (err) {
      logger.error('ai_provider_change_failed', {
        providerName,
        errorMessage: err.message,
        module: 'AISettings'
      }, err);
      setError(`Failed to change provider: ${err.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleModelChange = async (modelName) => {
    setSaving(true);
    setTestResult(null);
    setError(null);
    try {
      const response = await api.setActiveModel(modelName);
      if (response.success) {
        setActiveModel(modelName);
      }
    } catch (err) {
      logger.error('ai_model_change_failed', {
        modelName,
        errorMessage: err.message,
        module: 'AISettings'
      }, err);
      setError(`Failed to change model: ${err.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTestResult({ status: 'testing' });
    setError(null);
    try {
      const response = await api.testProvider(activeProvider);
      setTestResult({
        status: response.healthy ? 'success' : 'failed',
        message: response.message,
        model: response.model
      });
    } catch (err) {
      setTestResult({
        status: 'failed',
        message: err.message || 'Connection test failed'
      });
    }
  };

  const currentProvider = providers.find(p => p.name === activeProvider);

  if (loading) {
    return (
      <div className="ai-settings">
        <div className="ai-settings-loading">
          <div className="loading-spinner"></div>
          <p>Loading AI settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ai-settings">
      <div className="ai-settings-header">
        <h2>AI Provider Settings</h2>
        <p className="ai-settings-description">
          Configure which AI provider and model to use for the game assistant.
          Changes take effect immediately without restart.
        </p>
      </div>

      {error && (
        <div className="ai-settings-error">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      <div className="ai-settings-form">
        {/* Provider and Model Selection */}
        <div className="provider-model-row">
          <ProviderSelector
            providers={providers}
            activeProvider={activeProvider}
            onSelect={handleProviderChange}
            disabled={saving}
          />

          {currentProvider && (
            <ModelSelector
              key={modelRefreshKey}
              provider={currentProvider}
              activeModel={activeModel}
              onSelect={handleModelChange}
              disabled={saving}
            />
          )}
        </div>

        {/* Test Connection Button */}
        <div className="ai-settings-actions">
          <button
            className="btn-test-connection"
            onClick={handleTestConnection}
            disabled={saving || testResult?.status === 'testing'}
          >
            {testResult?.status === 'testing' ? 'Testing...' : 'Test Connection'}
          </button>

          {testResult && testResult.status !== 'testing' && (
            <div className={`test-result test-result-${testResult.status}`}>
              <span className="test-result-icon">
                {testResult.status === 'success' ? '✓' : '✗'}
              </span>
              {testResult.message}
              {testResult.model && (
                <span className="test-result-model"> (Model: {testResult.model})</span>
              )}
            </div>
          )}
        </div>

        {/* Ollama Model Manager (only show for Ollama provider) */}
        {currentProvider && currentProvider.name === 'ollama' && currentProvider.supports_dynamic_models && (
          <div className="ai-settings-section">
            <h3>Ollama Model Management</h3>
            <p className="section-description">
              Download additional models or remove unused ones to free disk space.
            </p>
            <OllamaModelManager
              activeModel={activeModel}
              onModelInstalled={() => {
                loadProviders();
                setModelRefreshKey(prev => prev + 1);
              }}
            />
          </div>
        )}
      </div>

      <div className="ai-settings-info">
        <h4>About AI Providers</h4>
        <div className="provider-info-grid">
          {providers.map(provider => (
            <div
              key={provider.name}
              className={`provider-info-card ${provider.name === activeProvider ? 'active' : ''}`}
            >
              <h5>{provider.display_name}</h5>
              <p>{provider.description}</p>
              <div className="provider-stats">
                <span className="stat">
                  {provider.model_count} {provider.model_count === 1 ? 'model' : 'models'}
                </span>
                {provider.supports_dynamic_models && (
                  <span className="stat dynamic">Dynamic models</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AISettings;
