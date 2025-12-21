import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ChatFooter from '../../../src/components/ChatWidget/ChatFooter';
import { ChatProvider } from '../../../src/contexts/ChatContext';

describe('ChatFooter Component', () => {
  test('renders component', () => {
    render(
      <ChatProvider>
        <ChatFooter mode="AI" onSendMessage={jest.fn()} isLoading={false} />
      </ChatProvider>
    );
    expect(screen.getByLabelText(/Message input/i)).toBeInTheDocument();
  });
});
