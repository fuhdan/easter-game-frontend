import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ChatToggleButton from '../../../src/components/ChatWidget/ChatToggleButton';
import { ChatProvider } from '../../../src/contexts/ChatContext';

describe('ChatToggleButton Component', () => {
  test('renders button', () => {
    render(
      <ChatProvider>
        <ChatToggleButton onClick={jest.fn()} unreadCount={0} />
      </ChatProvider>
    );
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });
});
