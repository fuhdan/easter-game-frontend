import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import OllamaModelManager from '../../../src/components/AISettings/OllamaModelManager';

// Mock EventSource for testing
global.EventSource = jest.fn(() => ({
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  close: jest.fn()
}));

describe('OllamaModelManager Component', () => {
  test('renders without crashing', () => {
    const { container } = render(<OllamaModelManager />);
    expect(container.firstChild).toBeTruthy();
  });
});
