import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ChatHeader from '../../../src/components/ChatWidget/ChatHeader';
import { ChatProvider } from '../../../src/contexts/ChatContext';

describe('ChatHeader Component', () => {
  test('renders component', () => {
    render(
      <ChatProvider>
        <ChatHeader mode="AI" onClose={jest.fn()} onModeChange={jest.fn()} />
      </ChatProvider>
    );
    expect(screen.getByText(/AI Assistant/i)).toBeInTheDocument();
  });
});
