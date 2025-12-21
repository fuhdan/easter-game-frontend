# Frontend Testing Quick Reference

## 🚀 How to Run Tests

### Option 1: Interactive Watch Mode (Recommended for Development)
```bash
cd frontend
npm test
```
- Tests re-run automatically when you save files
- Press `a` to run all tests
- Press `p` to filter by filename
- Press `t` to filter by test name
- Press `q` to quit

### Option 2: Run All Tests Once (CI/CD)
```bash
cd frontend
npm test -- --watchAll=false
```

### Option 3: Run Specific Test File
```bash
cd frontend
npm test Header.test
```

### Option 4: Run with Coverage Report
```bash
cd frontend
npm test -- --coverage --watchAll=false
```
Then open: `frontend/coverage/lcov-report/index.html`

### Option 5: Update Snapshots
```bash
cd frontend
npm test -- -u
```

---

## 📁 Test Files Created

```
frontend/
├── src/
│   └── setupTests.js              ✅ Jest global configuration
├── tests/
│   ├── __mocks__/
│   │   └── fileMock.js            ✅ Mock for image imports
│   ├── Header.test.jsx            ✅ 13 tests for Header component
│   ├── test-utils.js              ✅ Shared testing utilities
│   └── README.md                  ✅ Detailed testing guide
├── jest.config.js                 ✅ Jest configuration
└── TESTING.md                     ✅ This file
```

---

## ✅ Example Test: Header.test.jsx

**13 tests covering:**
1. ✅ Component rendering
2. ✅ User name display
3. ✅ Username fallback
4. ✅ Role formatting
5. ✅ Logout button presence
6. ✅ Logout button click handler
7. ✅ User avatar initials
8. ✅ Avatar username fallback
9. ✅ Branding text
10. ✅ Keyboard accessibility
11. ✅ CSS classes
12. ✅ Underscored role formatting
13. ✅ Snapshot test

---

## 📊 Expected Output

When you run `npm test Header.test`, you should see:

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
Ran all test suites matching /Header.test/i.
```

---

## 🛠️ Creating More Tests

Use `Header.test.jsx` as a template:

```jsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import YourComponent from '../src/components/YourComponent';

describe('YourComponent', () => {
  test('renders correctly', () => {
    render(<YourComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

---

## 🎯 Next Steps

1. **Run the example test:**
   ```bash
   cd frontend
   npm test Header.test
   ```

2. **Create tests for other components** using the same pattern

3. **Use test utilities** from `tests/test-utils.js`:
   ```jsx
   import { createMockUser, renderWithProviders } from './test-utils';
   ```

4. **Aim for 80% coverage:**
   ```bash
   npm test -- --coverage --watchAll=false
   ```

---

## 📚 More Info

See `tests/README.md` for:
- Detailed testing guide
- Best practices
- Available matchers
- Debugging tips
- References

---

**Happy Testing!** 🧪✨
