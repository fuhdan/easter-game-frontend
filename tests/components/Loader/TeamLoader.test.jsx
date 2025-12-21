import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import TeamLoader from '../../../src/components/Loader/TeamLoader';

describe('TeamLoader Component', () => {
  test('renders without crashing', () => {
    const { container } = render(<TeamLoader />);
    expect(container.firstChild).toBeTruthy();
  });
});
