import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import Loader from '../../../src/components/Loader/Loader';

describe('Loader Component', () => {
  test('renders without crashing', () => {
    const { container } = render(<Loader />);
    expect(container.firstChild).toBeTruthy();
  });
});
