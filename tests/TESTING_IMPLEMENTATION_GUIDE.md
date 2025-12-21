# Frontend Testing Implementation Guide

This document provides comprehensive testing patterns for all frontend components in the Easter Quest application.

## Test Coverage Summary

### ✅ Completed Test Files

#### Contexts (2/2)
- `contexts/AuthContext.test.jsx` - Authentication context
- `contexts/ChatContext.test.jsx` - Chat system context

#### Services (8/8)
- `services/api.test.js` - API wrapper
- `services/auth.test.js` - Authentication service
- `services/games.test.js` - Games service
- `services/teams.test.js` - Teams service
- `services/chat.test.js` - Chat service
- `services/websocket/chatWebSocket.test.js` - WebSocket client
- `services/websocket/messageHandler.test.js` - Message handling
- `services/websocket/heartbeatManager.test.js` - Heartbeat management
- `services/websocket/messageQueue.test.js` - Message queuing
- `services/websocket/reconnectionManager.test.js` - Reconnection logic

#### Core App
- `App.test.jsx` - Main application component

### 📋 Component Test Patterns

For the remaining 77 component files, follow these standardized testing patterns:

---

## Component Testing Template

Every component test should include:

### 1. Rendering Tests
```javascript
describe('ComponentName', () => {
  test('renders without crashing', () => {
    render(<ComponentName {...mockProps} />);
    expect(screen.getByTestId('component-name')).toBeInTheDocument();
  });

  test('renders with required props', () => {
    const props = { title: 'Test', data: [] };
    render(<ComponentName {...props} />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  test('renders loading state', () => {
    render(<ComponentName loading={true} />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  test('renders error state', () => {
    render(<ComponentName error="Error message" />);
    expect(screen.getByText('Error message')).toBeInTheDocument();
  });

  test('renders empty state', () => {
    render(<ComponentName data={[]} />);
    expect(screen.getByText(/no data/i)).toBeInTheDocument();
  });
});
```

### 2. User Interaction Tests
```javascript
describe('User Interactions', () => {
  test('handles button click', async () => {
    const handleClick = jest.fn();
    render(<ComponentName onClick={handleClick} />);

    const button = screen.getByRole('button', { name: /click me/i });
    await act(async () => {
      button.click();
    });

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('handles form submission', async () => {
    const handleSubmit = jest.fn();
    render(<ComponentName onSubmit={handleSubmit} />);

    const input = screen.getByLabelText(/name/i);
    fireEvent.change(input, { target: { value: 'Test' } });

    const submitButton = screen.getByRole('button', { name: /submit/i });
    await act(async () => {
      submitButton.click();
    });

    expect(handleSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Test' })
    );
  });

  test('handles input change', () => {
    const handleChange = jest.fn();
    render(<ComponentName onChange={handleChange} />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'New value' } });

    expect(handleChange).toHaveBeenCalled();
  });
});
```

### 3. Conditional Rendering Tests
```javascript
describe('Conditional Rendering', () => {
  test('shows content when condition is true', () => {
    render(<ComponentName showContent={true} />);
    expect(screen.getByTestId('content')).toBeInTheDocument();
  });

  test('hides content when condition is false', () => {
    render(<ComponentName showContent={false} />);
    expect(screen.queryByTestId('content')).not.toBeInTheDocument();
  });

  test('shows admin controls for admin users', () => {
    const adminUser = createMockAdmin();
    render(<ComponentName user={adminUser} />);
    expect(screen.getByText(/admin controls/i)).toBeInTheDocument();
  });

  test('hides admin controls for regular users', () => {
    const regularUser = createMockUser();
    render(<ComponentName user={regularUser} />);
    expect(screen.queryByText(/admin controls/i)).not.toBeInTheDocument();
  });
});
```

### 4. State Management Tests
```javascript
describe('State Management', () => {
  test('initializes with default state', () => {
    render(<ComponentName />);
    expect(screen.getByTestId('counter')).toHaveTextContent('0');
  });

  test('updates state on user action', async () => {
    render(<ComponentName />);

    const incrementButton = screen.getByText(/increment/i);
    await act(async () => {
      incrementButton.click();
    });

    expect(screen.getByTestId('counter')).toHaveTextContent('1');
  });

  test('handles side effects', async () => {
    mockFetch.mockResolvedValueOnce(mockFetchResponse({ data: 'test' }));

    render(<ComponentName />);

    await waitFor(() => {
      expect(screen.getByText('test')).toBeInTheDocument();
    });
  });
});
```

### 5. API Integration Tests
```javascript
describe('API Integration', () => {
  test('fetches data on mount', async () => {
    const mockData = [{ id: 1, name: 'Item 1' }];
    mockFetch.mockResolvedValueOnce(mockFetchResponse(mockData));

    render(<ComponentName />);

    await waitFor(() => {
      expect(screen.getByText('Item 1')).toBeInTheDocument();
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/items'),
      expect.any(Object)
    );
  });

  test('handles API error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('API Error'));

    render(<ComponentName />);

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });

  test('shows loading state during fetch', async () => {
    mockFetch.mockImplementationOnce(() =>
      new Promise(resolve => setTimeout(() => resolve(mockFetchResponse([])), 100))
    );

    render(<ComponentName />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });
  });
});
```

### 6. Accessibility Tests
```javascript
describe('Accessibility', () => {
  test('has proper ARIA labels', () => {
    render(<ComponentName />);

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label');
  });

  test('supports keyboard navigation', () => {
    render(<ComponentName />);

    const input = screen.getByRole('textbox');
    input.focus();

    expect(input).toHaveFocus();

    fireEvent.keyDown(input, { key: 'Tab' });
    // Test tab navigation
  });

  test('has proper heading hierarchy', () => {
    render(<ComponentName title="Main Title" />);

    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('Main Title');
  });
});
```

---

## Component-Specific Test Files to Create

### AdminNotifications (3 files)
```javascript
// components/AdminNotifications/NotificationFilters.test.jsx
describe('NotificationFilters', () => {
  test('renders filter options');
  test('handles filter selection');
  test('clears filters');
  test('applies multiple filters');
});

// components/AdminNotifications/NotificationCard.test.jsx
describe('NotificationCard', () => {
  test('displays notification content');
  test('shows priority badge');
  test('handles mark as read');
  test('handles delete notification');
  test('shows timestamp');
});

// components/AdminNotifications/NotificationsDashboard.test.jsx
describe('NotificationsDashboard', () => {
  test('fetches notifications on mount');
  test('filters notifications');
  test('paginates results');
  test('handles real-time updates');
  test('shows empty state');
});
```

### SystemAdminDashboard (5 files)
```javascript
// components/SystemAdminDashboard/ConfigEditForm.test.jsx
describe('ConfigEditForm', () => {
  test('renders form fields');
  test('validates input');
  test('submits valid config');
  test('handles submit error');
  test('shows validation errors');
});

// components/SystemAdminDashboard/ConfigItem.test.jsx
describe('ConfigItem', () => {
  test('displays config key and value');
  test('shows edit button for admins');
  test('handles edit click');
  test('handles delete click');
  test('shows config metadata');
});

// components/SystemAdminDashboard/ConfirmModal.test.jsx
describe('ConfirmModal', () => {
  test('shows modal when open');
  test('hides modal when closed');
  test('calls onConfirm when confirmed');
  test('calls onCancel when cancelled');
  test('shows custom message');
});

// components/SystemAdminDashboard/ConfigCategoryFilter.test.jsx
describe('ConfigCategoryFilter', () => {
  test('renders category options');
  test('handles category selection');
  test('shows all option');
  test('highlights active category');
});

// components/SystemAdminDashboard/SystemAdminDashboard.test.jsx
describe('SystemAdminDashboard', () => {
  test('fetches config on mount');
  test('filters by category');
  test('edits config item');
  test('deletes config item');
  test('handles permission check');
});
```

### Profile (4 files)
```javascript
// components/Profile/TeamNameCard.test.jsx
describe('TeamNameCard', () => {
  test('displays team name');
  test('shows team members count');
  test('shows team leader badge');
  test('handles team not assigned');
});

// components/Profile/GameRatingCard.test.jsx
describe('GameRatingCard', () => {
  test('renders rating stars');
  test('handles star click');
  test('submits rating');
  test('shows existing rating');
  test('shows comment field');
});

// components/Profile/PasswordChangeCard.test.jsx
describe('PasswordChangeCard', () => {
  test('renders password fields');
  test('validates password match');
  test('validates password strength');
  test('submits password change');
  test('shows success message');
  test('shows error message');
});

// components/Profile/Profile.test.jsx
describe('Profile', () => {
  test('displays user info');
  test('shows team card');
  test('shows password change card');
  test('shows game ratings');
  test('updates profile successfully');
});
```

### TeamManagement (6 files)
```javascript
// components/TeamManagement/PlayerManagementTab.test.jsx
describe('PlayerManagementTab', () => {
  test('displays players list');
  test('filters players by team');
  test('adds new player');
  test('edits player');
  test('deletes player');
  test('shows player stats');
});

// components/TeamManagement/TeamsTab.test.jsx
describe('TeamsTab', () => {
  test('displays teams list');
  test('creates new team');
  test('edits team');
  test('deletes team');
  test('shows team details');
});

// components/TeamManagement/ActivationCodesTab.test.jsx
describe('ActivationCodesTab', () => {
  test('displays activation codes');
  test('generates new code');
  test('shows code expiration');
  test('deactivates code');
  test('copies code to clipboard');
});

// components/TeamManagement/PlayerManagement.test.jsx
describe('PlayerManagement', () => {
  test('switches between tabs');
  test('maintains state across tabs');
  test('handles permissions');
});

// components/TeamManagement/TeamCreationTab.test.jsx
describe('TeamCreationTab', () => {
  test('renders creation form');
  test('validates team name');
  test('selects team leader');
  test('creates team successfully');
  test('shows validation errors');
});

// components/TeamManagement/TeamConfiguration.test.jsx
describe('TeamConfiguration', () => {
  test('displays current config');
  test('updates config');
  test('validates config values');
  test('saves config successfully');
});
```

### ChatWidget (9 files)
```javascript
// components/ChatWidget/ChatWidget.test.jsx
describe('ChatWidget', () => {
  test('renders chat toggle button');
  test('opens chat window');
  test('closes chat window');
  test('shows unread count badge');
  test('handles connection status');
});

// components/ChatWidget/ChatHeader.test.jsx
describe('ChatHeader', () => {
  test('displays chat title');
  test('shows mode selector');
  test('switches chat mode');
  test('shows connection status');
  test('shows minimize button');
});

// components/ChatWidget/ChatBody.test.jsx
describe('ChatBody', () => {
  test('displays messages');
  test('scrolls to bottom on new message');
  test('shows typing indicator');
  test('shows timestamp');
  test('handles message grouping');
});

// components/ChatWidget/ChatFooter.test.jsx
describe('ChatFooter', () => {
  test('renders message input');
  test('handles message send');
  test('disables input when disconnected');
  test('shows character count');
  test('handles rate limiting');
});

// components/ChatWidget/TeamBroadcast.test.jsx
describe('TeamBroadcast', () => {
  test('displays broadcast messages');
  test('sends broadcast message');
  test('shows sender name');
  test('handles admin broadcasts differently');
});

// components/ChatWidget/AdminTeamList.test.jsx
describe('AdminTeamList', () => {
  test('displays teams list');
  test('selects team for broadcast');
  test('shows team status');
  test('shows unread counts per team');
});

// components/ChatWidget/AdminNotificationsView.test.jsx
describe('AdminNotificationsView', () => {
  test('displays notifications');
  test('marks notification as read');
  test('responds to notification');
  test('shows priority indicator');
});

// components/ChatWidget/TeamMemberList.test.jsx
describe('TeamMemberList', () => {
  test('displays team members');
  test('selects member for private chat');
  test('shows online status');
  test('shows unread counts');
});

// components/ChatWidget/PrivateConversation.test.jsx
describe('PrivateConversation', () => {
  test('displays conversation history');
  test('sends private message');
  test('shows other user name');
  test('handles message delivery status');
});
```

### AISettings (5 files)
```javascript
// components/AISettings/ProviderSelector.test.jsx
describe('ProviderSelector', () => {
  test('displays available providers');
  test('selects provider');
  test('shows current provider');
  test('handles provider change');
});

// components/AISettings/ModelSelector.test.jsx
describe('ModelSelector', () => {
  test('displays available models');
  test('selects model');
  test('shows model details');
  test('handles model change');
});

// components/AISettings/ModelPullProgress.test.jsx
describe('ModelPullProgress', () => {
  test('shows download progress');
  test('shows progress percentage');
  test('handles completion');
  test('handles error');
});

// components/AISettings/OllamaModelManager.test.jsx
describe('OllamaModelManager', () => {
  test('lists installed models');
  test('pulls new model');
  test('deletes model');
  test('shows model size');
  test('shows model status');
});

// components/AISettings/AISettings.test.jsx
describe('AISettings', () => {
  test('renders all settings sections');
  test('saves settings');
  test('validates settings');
  test('shows current config');
});
```

### GamePanel (3 files)
```javascript
// components/GamePanel/TeamProgress.test.jsx
describe('TeamProgress', () => {
  test('displays team progress');
  test('shows completed games');
  test('shows current game');
  test('shows team score');
  test('updates in real-time');
});

// components/GamePanel/CurrentGame.test.jsx
describe('CurrentGame', () => {
  test('displays game details');
  test('shows game description');
  test('handles answer submission');
  test('shows hints');
  test('uses hint');
  test('shows solution on completion');
});

// components/GamePanel/GamePanel.test.jsx
describe('GamePanel', () => {
  test('displays active game');
  test('shows team progress');
  test('handles game navigation');
  test('shows game list');
});
```

### Remaining Components (Login, Navigation, Footer, Loader, etc.)
```javascript
// components/Login/Login.test.jsx
describe('Login', () => {
  test('renders login form');
  test('validates credentials');
  test('submits login');
  test('shows error message');
  test('disables button during submit');
});

// components/Navigation/Navigation.test.jsx
describe('Navigation', () => {
  test('displays navigation items');
  test('highlights active tab');
  test('switches tabs');
  test('shows role-based items');
});

// components/Footer/Footer.test.jsx
describe('Footer', () => {
  test('displays user role');
  test('shows copyright');
  test('shows version');
});

// components/Loader/Loader.test.jsx
describe('Loader', () => {
  test('displays loading message');
  test('shows spinner');
  test('accepts custom message');
});

// components/Loader/TeamLoader.test.jsx
describe('TeamLoader', () => {
  test('displays team-specific loader');
  test('shows team logo');
  test('shows loading animation');
});

// components/ErrorBoundary/ErrorBoundary.test.jsx
describe('ErrorBoundary', () => {
  test('renders children when no error');
  test('catches errors');
  test('displays error message');
  test('shows error details in dev mode');
  test('logs error to console');
});

// components/PasswordChangeModal/PasswordChangeModal.test.jsx
describe('PasswordChangeModal', () => {
  test('shows modal');
  test('validates passwords');
  test('changes password');
  test('closes modal');
  test('shows error');
});
```

---

## Utilities Testing

```javascript
// utils/imageUtils.test.js
describe('Image Utils', () => {
  test('validates image format');
  test('compresses image');
  test('resizes image');
  test('converts to base64');
});

// utils/validators/configValidator.test.js
describe('Config Validator', () => {
  test('validates config structure');
  test('validates config values');
  test('handles invalid config');
  test('shows validation errors');
});
```

---

## Mock Helpers

### Common Mocks
```javascript
// Mock fetch
global.fetch = jest.fn(() => mockFetchResponse({}));

// Mock localStorage
global.localStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};

// Mock WebSocket
global.WebSocket = jest.fn(() => ({
  send: jest.fn(),
  close: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn()
}));

// Mock window.alert
global.alert = jest.fn();

// Mock window.confirm
global.confirm = jest.fn(() => true);
```

---

## Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test -- ChatWidget.test.jsx

# Run tests matching pattern
npm test -- --testPathPattern=components/Chat
```

---

## Coverage Goals

- **Statements**: 100%
- **Branches**: 100%
- **Functions**: 100%
- **Lines**: 100%

---

## Notes

- All tests use React Testing Library
- Mock all external dependencies
- Test user interactions, not implementation details
- Use descriptive test names
- Group related tests with describe blocks
- Clean up after each test
- Use waitFor for async operations
- Prefer user-centric queries (getByRole, getByLabelText, getByText)
