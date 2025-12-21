import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import AISettings from '../../../src/components/AISettings/AISettings';

describe('AISettings Component', () => {
  test('renders component', () => {
    render(<AISettings />);
    expect(screen.getByText(/AI.*Settings/i)).toBeInTheDocument();
  });
});
