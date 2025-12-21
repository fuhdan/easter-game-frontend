import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import ModelSelector from '../../../src/components/AISettings/ModelSelector';

describe('ModelSelector Component', () => {
  test('renders without crashing', () => {
    const { container } = render(<ModelSelector provider="ollama" selectedModel="" onModelChange={jest.fn()} />);
    expect(container.firstChild).toBeTruthy();
  });
});
