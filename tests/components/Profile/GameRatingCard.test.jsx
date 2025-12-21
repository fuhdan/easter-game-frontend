import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import GameRatingCard from '../../../src/components/Profile/GameRatingCard';

describe('GameRatingCard Component', () => {
  test('renders without crashing', () => {
    const mockUser = { id: 1, role: 'player' };
    const { container } = render(<GameRatingCard user={mockUser} />);
    expect(container.firstChild).toBeTruthy();
  });
});
