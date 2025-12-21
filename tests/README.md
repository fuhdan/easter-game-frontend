# Frontend Testing Module

**Created:** 2025-12-18
**Framework:** React Testing Library + Jest
**Purpose:** Unit and integration testing for Easter Quest React components

---

## 📁 Directory Structure

```
frontend/
├── src/
│   ├── setupTests.js              # Jest configuration (auto-loaded)
│   └── components/                # Components to test
├── tests/
│   ├── Header.test.jsx            # Example: Header component tests
│   ├── test-utils.js              # Shared test utilities
│   └── README.md                  # This file
└── package.json                   # Test scripts defined here
```

---

## 🚀 Running Tests

### Run All Tests

```bash
cd frontend
npm test
```

This starts Jest in **watch mode** - tests re-run automatically when files change.

### Run Tests Once (CI Mode)

```bash
npm test -- --watchAll=false
```

### Run Specific Test File

```bash
npm test Header.test
```

### Run Tests with Coverage

```bash
npm test -- --coverage --watchAll=false
```

Coverage report will be in `frontend/coverage/lcov-report/index.html`

### Update Snapshots

```bash
npm test -- -u
```

---

## 📝 Test File Examples

### 1. Header.test.jsx ✅

**Location:** `tests/Header.test.jsx`

**Tests:**
- Component rendering
- Props validation
- User interactions (button clicks)
- Conditional rendering
- Accessibility
- Snapshot testing

**Run:**
```bash
npm test Header.test
```

**Expected Output:**
```
PASS  tests/Header.test.jsx
  Header Component
    ✓ renders Header component (45ms)
    ✓ displays user name and role (12ms)
    ✓ displays username when display_name is missing (8ms)
    ✓ formats user role with proper capitalization (7ms)
    ✓ renders logout button (6ms)
    ✓ calls onLogout when logout button is clicked (15ms)
    ✓ displays correct user avatar initials (9ms)
    ✓ uses username for avatar when display_name is missing (8ms)
    ✓ displays correct branding text (7ms)
    ✓ logout button is keyboard accessible (11ms)
    ✓ renders with correct CSS classes (8ms)
    ✓ formats underscored role name correctly (7ms)
    ✓ matches snapshot (10ms)

Test Suites: 1 passed, 1 total
Tests:       13 passed, 13 total
Snapshots:   1 passed, 1 total
Time:        2.456s
```

---

## 🛠️ Writing New Tests

### Basic Template

```jsx
/**
 * Test Suite: MyComponent
 * Purpose: Tests for MyComponent
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import MyComponent from '../src/components/MyComponent';

describe('MyComponent', () => {

  test('renders component', () => {
    render(<MyComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  test('handles button click', () => {
    const handleClick = jest.fn();
    render(<MyComponent onClick={handleClick} />);

    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

});
```

### Using Test Utilities

```jsx
import { createMockUser, renderWithProviders } from './test-utils';

test('renders with mock user', () => {
  const mockUser = createMockUser({ username: 'johndoe' });

  renderWithProviders(<Profile user={mockUser} />);

  expect(screen.getByText('johndoe')).toBeInTheDocument();
});
```

---

## 🧪 Testing Best Practices

### 1. Test User Behavior, Not Implementation

❌ **Bad:**
```jsx
test('state updates', () => {
  const { container } = render(<Counter />);
  expect(container.state.count).toBe(0); // Testing implementation
});
```

✅ **Good:**
```jsx
test('increments counter on button click', () => {
  render(<Counter />);
  const button = screen.getByRole('button', { name: /increment/i });
  fireEvent.click(button);
  expect(screen.getByText('Count: 1')).toBeInTheDocument();
});
```

### 2. Use Accessible Queries

Priority order (from React Testing Library):
1. `getByRole` - Most accessible (preferred)
2. `getByLabelText` - Forms
3. `getByPlaceholderText` - Forms
4. `getByText` - Non-interactive content
5. `getByTestId` - Last resort

❌ **Bad:**
```jsx
container.querySelector('.button-class')
```

✅ **Good:**
```jsx
screen.getByRole('button', { name: /submit/i })
```

### 3. Mock External Dependencies

```jsx
// Mock API calls
jest.mock('../src/services/api', () => ({
  fetchUser: jest.fn(() => Promise.resolve({ username: 'test' }))
}));

// Mock localStorage
beforeEach(() => {
  global.localStorage = mockLocalStorage;
});
```

### 4. Clean Up After Tests

```jsx
afterEach(() => {
  jest.clearAllMocks();
  cleanup(); // React Testing Library does this automatically
});
```

---

## 📚 Available Matchers (jest-dom)

```jsx
// Presence
expect(element).toBeInTheDocument()
expect(element).not.toBeInTheDocument()

// Visibility
expect(element).toBeVisible()
expect(element).not.toBeVisible()

// State
expect(button).toBeEnabled()
expect(button).toBeDisabled()
expect(checkbox).toBeChecked()

// Content
expect(element).toHaveTextContent('text')
expect(input).toHaveValue('value')
expect(element).toHaveClass('class-name')

// Forms
expect(input).toHaveFocus()
expect(form).toHaveFormValues({ username: 'john' })

// Attributes
expect(element).toHaveAttribute('href', '/path')
```

---

## 🎯 Testing Checklist

For each component, test:

- [ ] **Rendering** - Component renders without crashing
- [ ] **Props** - Component receives and displays props correctly
- [ ] **Events** - User interactions trigger correct behavior
- [ ] **Conditional** - Conditional rendering works as expected
- [ ] **Accessibility** - Keyboard navigation, ARIA labels
- [ ] **Edge Cases** - Empty states, loading states, errors
- [ ] **Integration** - Component works with parent/child components

---

## 📊 Coverage Goals

| Coverage Type | Target | Current |
|---------------|--------|---------|
| **Statements** | 80% | 0% → TBD |
| **Branches** | 75% | 0% → TBD |
| **Functions** | 80% | 0% → TBD |
| **Lines** | 80% | 0% → TBD |

**Run coverage:**
```bash
npm test -- --coverage --watchAll=false
```

---

## 🐛 Debugging Tests

### Enable Debug Mode

```jsx
import { render, screen } from '@testing-library/react';

test('debug test', () => {
  const { debug } = render(<MyComponent />);

  // Print entire component tree
  debug();

  // Print specific element
  debug(screen.getByRole('button'));
});
```

### Use screen.logTestingPlaygroundURL()

```jsx
test('find queries', () => {
  render(<MyComponent />);
  screen.logTestingPlaygroundURL();
  // Opens browser with suggested queries
});
```

---

## 📖 References

- [React Testing Library Docs](https://testing-library.com/docs/react-testing-library/intro/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [jest-dom Matchers](https://github.com/testing-library/jest-dom)
- [Common Mistakes](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

---

## ✅ Next Steps

1. **Run the example test:**
   ```bash
   cd frontend
   npm test Header.test
   ```

2. **Create more tests** using Header.test.jsx as a template

3. **Aim for 80% coverage** across all components

4. **Integrate into CI/CD:**
   ```yaml
   # .github/workflows/test.yml
   - name: Run frontend tests
     run: |
       cd frontend
       npm test -- --coverage --watchAll=false
   ```

---

**Happy Testing!** 🧪✨
