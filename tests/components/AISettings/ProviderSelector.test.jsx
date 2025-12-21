import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProviderSelector from '../../../src/components/AISettings/ProviderSelector';

describe('ProviderSelector Component', () => {
  test('renders without crashing', () => {
    const mockProviders = [
      { name: 'ollama', display_name: 'Ollama (Local)', supports_dynamic_models: true }
    ];
    const { container } = render(
      <ProviderSelector
        selectedProvider="ollama"
        onProviderChange={jest.fn()}
        providers={mockProviders}
      />
    );
    expect(container.firstChild).toBeTruthy();
  });
});
