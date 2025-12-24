/**
 * Provider Selector Component
 *
 * File: components/AISettings/ProviderSelector.jsx
 *
 * Dropdown to select AI provider (Ollama, Claude, OpenAI, etc.)
 *
 * @since 2025-12-10
 */

import React from 'react';
import { logger } from '../../utils/logger';
import './ProviderSelector.css';

const ProviderSelector = ({ providers, activeProvider, onSelect, disabled }) => {
  const handleChange = (e) => {
    const newProvider = e.target.value;
    const providerDetails = providers.find(p => p.name === newProvider);

    logger.info('ai_provider_selected', {
      previousProvider: activeProvider,
      newProvider,
      providerDisplayName: providerDetails?.display_name,
      supportsDynamicModels: providerDetails?.supports_dynamic_models,
      module: 'ProviderSelector'
    });

    onSelect(newProvider);
  };

  return (
    <div className="provider-selector">
      <label htmlFor="provider-select" className="provider-selector-label">
        AI Provider
        <span className="label-required">*</span>
      </label>
      <select
        id="provider-select"
        className="provider-select"
        value={activeProvider}
        onChange={handleChange}
        disabled={disabled}
      >
        <option value="" disabled>Select a provider...</option>
        {providers.map(provider => (
          <option key={provider.name} value={provider.name}>
            {provider.display_name}
            {provider.supports_dynamic_models && ' (Dynamic Models)'}
          </option>
        ))}
      </select>
      <p className="provider-selector-help">
        Choose which AI service to use for game assistance.
        {activeProvider && (() => {
          const current = providers.find(p => p.name === activeProvider);
          return current ? ` Currently: ${current.display_name}` : '';
        })()}
      </p>
    </div>
  );
};

export default ProviderSelector;
