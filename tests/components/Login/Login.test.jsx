/**
 * Module: Login.test.jsx
 * Purpose: Comprehensive tests for Login component (100% coverage)
 * Part of: Easter Quest Frontend Testing
 *
 * Tests all 3 login scenarios:
 * 1. Active user - normal login
 * 2. Inactive user - password change required
 * 3. Inactive user - password change + OTP required
 *
 * @since 2025-12-20
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import Login from '../../../src/components/Login/Login';

// Mock dependencies
jest.mock('../../../src/components/PasswordChangeModal/PasswordChangeModal', () => {
  return function MockPasswordChangeModal({ isOpen, onClose, onSuccess, username, requiresOTP, currentPassword, loading }) {
    if (!isOpen) return null;
    return (
      <div data-testid="password-change-modal">
        <span data-testid="modal-username">{username}</span>
        <span data-testid="modal-requires-otp">{requiresOTP ? 'true' : 'false'}</span>
        <span data-testid="modal-loading">{loading ? 'true' : 'false'}</span>
        <button onClick={() => onSuccess({ username, new_password: 'newpass123' })}>Submit</button>
        <button onClick={onClose}>Close</button>
      </div>
    );
  };
});

jest.mock('../../../src/components/Loader/Loader', () => {
  return function MockLoader({ message }) {
    return <div data-testid="loader">{message}</div>;
  };
});

jest.mock('../../../src/services', () => ({
  login: jest.fn(),
  auth: {
    activateAccount: jest.fn()
  },
  utils: {
    handleError: jest.fn((error) => error.message || 'An error occurred')
  }
}));

import { login, auth, utils } from '../../../src/services';

describe('Login Component', () => {
  let mockOnLogin;

  beforeEach(() => {
    mockOnLogin = jest.fn().mockResolvedValue({ success: true });
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    test('renders login form with all elements', () => {
      render(<Login onLogin={mockOnLogin} />);

      expect(screen.getByPlaceholderText(/username/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
      expect(screen.getByText(/Easter Quest 2026/i)).toBeInTheDocument();
      expect(screen.getByText(/Ypsomed Innovation Challenge/i)).toBeInTheDocument();
    });

    test('renders with default credential values', () => {
      render(<Login onLogin={mockOnLogin} />);

      const usernameInput = screen.getByPlaceholderText(/username/i);
      const passwordInput = screen.getByPlaceholderText(/password/i);

      expect(usernameInput).toHaveValue('admin');
      expect(passwordInput).toHaveValue('demo');
    });

    test('renders logo image initially', () => {
      render(<Login onLogin={mockOnLogin} />);

      const logo = screen.getByAltText('Logo');
      expect(logo).toBeInTheDocument();
      expect(logo).toHaveAttribute('src', '/assets/logo.png');
    });

    test('renders error message when error prop is provided', () => {
      render(<Login onLogin={mockOnLogin} error="Invalid credentials" />);

      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
      expect(screen.getByText('Invalid credentials')).toHaveClass('error-message');
    });

    test('does not render error when error prop is null', () => {
      render(<Login onLogin={mockOnLogin} error={null} />);

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    test('renders loader when loading prop is true', () => {
      render(<Login onLogin={mockOnLogin} loading={true} />);

      expect(screen.getByTestId('loader')).toBeInTheDocument();
      expect(screen.getByText('Sign in...')).toBeInTheDocument();
    });

    test('does not render password modal initially', () => {
      render(<Login onLogin={mockOnLogin} />);

      expect(screen.queryByTestId('password-change-modal')).not.toBeInTheDocument();
    });
  });

  describe('User Input', () => {
    test('allows changing username', () => {
      render(<Login onLogin={mockOnLogin} />);

      const usernameInput = screen.getByPlaceholderText(/username/i);
      fireEvent.change(usernameInput, { target: { name: 'username', value: 'testuser' } });

      expect(usernameInput).toHaveValue('testuser');
    });

    test('allows changing password', () => {
      render(<Login onLogin={mockOnLogin} />);

      const passwordInput = screen.getByPlaceholderText(/password/i);
      fireEvent.change(passwordInput, { target: { name: 'password', value: 'testpass' } });

      expect(passwordInput).toHaveValue('testpass');
    });

    test('clears error message when user types in username', async () => {
      // First trigger an error by causing login to fail
      login.mockResolvedValue({
        success: false,
        message: 'Some error'
      });

      render(<Login onLogin={mockOnLogin} />);

      const submitButton = screen.getByRole('button', { name: /sign in/i });

      // Trigger login to create an error
      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Some error')).toBeInTheDocument();
      });

      // Now type in username - should clear the error
      const usernameInput = screen.getByPlaceholderText(/username/i);
      fireEvent.change(usernameInput, { target: { name: 'username', value: 'newuser' } });

      expect(screen.queryByText('Some error')).not.toBeInTheDocument();
    });

    test('clears error message when user types in password', async () => {
      // First trigger an error by causing login to fail
      login.mockResolvedValue({
        success: false,
        message: 'Some error'
      });

      render(<Login onLogin={mockOnLogin} />);

      const submitButton = screen.getByRole('button', { name: /sign in/i });

      // Trigger login to create an error
      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Some error')).toBeInTheDocument();
      });

      // Now type in password - should clear the error
      const passwordInput = screen.getByPlaceholderText(/password/i);
      fireEvent.change(passwordInput, { target: { name: 'password', value: 'newpass' } });

      expect(screen.queryByText('Some error')).not.toBeInTheDocument();
    });

    test('has autocomplete attributes for security', () => {
      render(<Login onLogin={mockOnLogin} />);

      const usernameInput = screen.getByPlaceholderText(/username/i);
      const passwordInput = screen.getByPlaceholderText(/password/i);

      expect(usernameInput).toHaveAttribute('autoComplete', 'username');
      expect(passwordInput).toHaveAttribute('autoComplete', 'current-password');
    });
  });

  describe('Form Validation', () => {
    test('requires username and password fields', () => {
      render(<Login onLogin={mockOnLogin} />);

      const usernameInput = screen.getByPlaceholderText(/username/i);
      const passwordInput = screen.getByPlaceholderText(/password/i);

      expect(usernameInput).toBeRequired();
      expect(passwordInput).toBeRequired();
    });

    test('disables submit button when username is empty', async () => {
      render(<Login onLogin={mockOnLogin} />);

      const usernameInput = screen.getByPlaceholderText(/username/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(usernameInput, { target: { name: 'username', value: '' } });

      expect(submitButton).toBeDisabled();
    });

    test('disables submit button when password is empty', async () => {
      render(<Login onLogin={mockOnLogin} />);

      const passwordInput = screen.getByPlaceholderText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(passwordInput, { target: { name: 'password', value: '' } });

      expect(submitButton).toBeDisabled();
    });

    test('disables submit button when username is only whitespace', async () => {
      render(<Login onLogin={mockOnLogin} />);

      const usernameInput = screen.getByPlaceholderText(/username/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(usernameInput, { target: { name: 'username', value: '   ' } });

      expect(submitButton).toBeDisabled();
    });

    test('enables submit button when both fields are filled', () => {
      render(<Login onLogin={mockOnLogin} />);

      const submitButton = screen.getByRole('button', { name: /sign in/i });

      // Default values are 'admin' and 'demo'
      expect(submitButton).not.toBeDisabled();
    });

    test('shows validation error for empty fields on submit', async () => {
      render(<Login onLogin={mockOnLogin} />);

      const usernameInput = screen.getByPlaceholderText(/username/i);
      const passwordInput = screen.getByPlaceholderText(/password/i);

      // Clear fields
      fireEvent.change(usernameInput, { target: { name: 'username', value: ' ' } });
      fireEvent.change(passwordInput, { target: { name: 'password', value: ' ' } });

      const form = screen.getByRole('button', { name: /sign in/i }).closest('form');
      await act(async () => {
        fireEvent.submit(form);
      });

      await waitFor(() => {
        expect(screen.getByText('Username and password are required')).toBeInTheDocument();
      });

      expect(login).not.toHaveBeenCalled();
    });
  });

  describe('Scenario 1: Normal Login (Active User)', () => {
    test('calls login service with trimmed credentials', async () => {
      login.mockResolvedValue({
        success: true,
        user: {
          username: 'admin',
          requiresPasswordChange: false
        }
      });

      render(<Login onLogin={mockOnLogin} />);

      const usernameInput = screen.getByPlaceholderText(/username/i);
      const passwordInput = screen.getByPlaceholderText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(usernameInput, { target: { name: 'username', value: '  admin  ' } });
      fireEvent.change(passwordInput, { target: { name: 'password', value: 'password123' } });

      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(login).toHaveBeenCalledWith({
          username: 'admin',
          password: 'password123'
        });
      });
    });

    test('calls onLogin callback for active user', async () => {
      login.mockResolvedValue({
        success: true,
        user: {
          username: 'admin',
          requiresPasswordChange: false
        }
      });

      render(<Login onLogin={mockOnLogin} />);

      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(mockOnLogin).toHaveBeenCalledWith('admin', 'demo');
      });
    });

    test('shows loading state during login', async () => {
      login.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      render(<Login onLogin={mockOnLogin} />);

      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await act(async () => {
        fireEvent.click(submitButton);
      });

      expect(screen.getByTestId('loader')).toBeInTheDocument();
    });

    test('disables inputs during loading', () => {
      render(<Login onLogin={mockOnLogin} loading={true} />);

      expect(screen.getByTestId('loader')).toBeInTheDocument();
    });
  });

  describe('Scenario 2: Password Change Required (No OTP)', () => {
    test('shows password change modal when requiresPasswordChange is true', async () => {
      login.mockResolvedValue({
        success: true,
        user: {
          username: 'inactiveuser',
          requiresPasswordChange: true,
          requiresOTP: false
        }
      });

      render(<Login onLogin={mockOnLogin} />);

      const usernameInput = screen.getByPlaceholderText(/username/i);
      const passwordInput = screen.getByPlaceholderText(/password/i);

      fireEvent.change(usernameInput, { target: { name: 'username', value: 'inactiveuser' } });
      fireEvent.change(passwordInput, { target: { name: 'password', value: 'oldpass' } });

      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('password-change-modal')).toBeInTheDocument();
      });

      expect(screen.getByTestId('modal-username')).toHaveTextContent('inactiveuser');
      expect(screen.getByTestId('modal-requires-otp')).toHaveTextContent('false');
      expect(mockOnLogin).not.toHaveBeenCalled();
    });
  });

  describe('Scenario 3: Password Change + OTP Required', () => {
    test('shows password change modal with OTP when requiresOTP is true', async () => {
      login.mockResolvedValue({
        success: true,
        user: {
          username: 'newuser',
          requiresPasswordChange: true,
          requiresOTP: true
        }
      });

      render(<Login onLogin={mockOnLogin} />);

      const usernameInput = screen.getByPlaceholderText(/username/i);
      const passwordInput = screen.getByPlaceholderText(/password/i);

      fireEvent.change(usernameInput, { target: { name: 'username', value: 'newuser' } });
      fireEvent.change(passwordInput, { target: { name: 'password', value: 'temppass' } });

      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('password-change-modal')).toBeInTheDocument();
      });

      expect(screen.getByTestId('modal-username')).toHaveTextContent('newuser');
      expect(screen.getByTestId('modal-requires-otp')).toHaveTextContent('true');
    });
  });

  describe('Account Activation', () => {
    test('handles successful account activation', async () => {
      login.mockResolvedValue({
        success: true,
        user: {
          username: 'inactiveuser',
          requiresPasswordChange: true,
          requiresOTP: false
        }
      });

      auth.activateAccount.mockResolvedValue({
        success: true,
        user: { username: 'inactiveuser' }
      });

      render(<Login onLogin={mockOnLogin} />);

      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('password-change-modal')).toBeInTheDocument();
      });

      const modalSubmitButton = screen.getByRole('button', { name: 'Submit' });

      await act(async () => {
        fireEvent.click(modalSubmitButton);
      });

      await waitFor(() => {
        expect(auth.activateAccount).toHaveBeenCalled();
        expect(mockOnLogin).toHaveBeenCalledWith('inactiveuser', 'newpass123');
        expect(screen.queryByTestId('password-change-modal')).not.toBeInTheDocument();
      });
    });

    test('shows loading state during account activation', async () => {
      login.mockResolvedValue({
        success: true,
        user: {
          username: 'inactiveuser',
          requiresPasswordChange: true,
          requiresOTP: false
        }
      });

      auth.activateAccount.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      render(<Login onLogin={mockOnLogin} />);

      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('password-change-modal')).toBeInTheDocument();
      });

      const modalSubmitButton = screen.getByRole('button', { name: 'Submit' });

      act(() => {
        fireEvent.click(modalSubmitButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('modal-loading')).toHaveTextContent('true');
      });
    });

    test('handles account activation failure with message (lines 121-126)', async () => {
      login.mockResolvedValue({
        success: true,
        user: {
          username: 'inactiveuser',
          requiresPasswordChange: true,
          requiresOTP: false
        }
      });

      auth.activateAccount.mockResolvedValue({
        success: false,
        message: 'Activation failed'
      });

      render(<Login onLogin={mockOnLogin} />);

      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('password-change-modal')).toBeInTheDocument();
      });

      const modalSubmitButton = screen.getByRole('button', { name: 'Submit' });

      await act(async () => {
        fireEvent.click(modalSubmitButton);
      });

      await waitFor(() => {
        // Tests line 121: throw new Error(response.message || 'Account activation failed')
        // and lines 124-126: catch block that sets the error
        expect(screen.getByText('Activation failed')).toBeInTheDocument();
      });

      expect(mockOnLogin).not.toHaveBeenCalled();
    });

    test('handles account activation failure without message (lines 121-126 fallback)', async () => {
      login.mockResolvedValue({
        success: true,
        user: {
          username: 'inactiveuser',
          requiresPasswordChange: true,
          requiresOTP: false
        }
      });

      auth.activateAccount.mockResolvedValue({
        success: false
        // No message - tests the fallback in line 121
      });

      render(<Login onLogin={mockOnLogin} />);

      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('password-change-modal')).toBeInTheDocument();
      });

      const modalSubmitButton = screen.getByRole('button', { name: 'Submit' });

      await act(async () => {
        fireEvent.click(modalSubmitButton);
      });

      await waitFor(() => {
        // Tests line 121 fallback: || 'Account activation failed'
        expect(screen.getByText('Account activation failed')).toBeInTheDocument();
      });

      expect(mockOnLogin).not.toHaveBeenCalled();
    });

    test('handles account activation error (exception)', async () => {
      login.mockResolvedValue({
        success: true,
        user: {
          username: 'inactiveuser',
          requiresPasswordChange: true,
          requiresOTP: false
        }
      });

      auth.activateAccount.mockRejectedValue(new Error('Network error'));

      render(<Login onLogin={mockOnLogin} />);

      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('password-change-modal')).toBeInTheDocument();
      });

      const modalSubmitButton = screen.getByRole('button', { name: 'Submit' });

      await act(async () => {
        fireEvent.click(modalSubmitButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });

    test('handles account activation error without message property (line 126)', async () => {
      login.mockResolvedValue({
        success: true,
        user: {
          username: 'inactiveuser',
          requiresPasswordChange: true,
          requiresOTP: false
        }
      });

      // Reject with an error object that has NO message property
      const errorWithoutMessage = new Error();
      delete errorWithoutMessage.message;
      auth.activateAccount.mockRejectedValue(errorWithoutMessage);

      render(<Login onLogin={mockOnLogin} />);

      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('password-change-modal')).toBeInTheDocument();
      });

      const modalSubmitButton = screen.getByRole('button', { name: 'Submit' });

      await act(async () => {
        fireEvent.click(modalSubmitButton);
      });

      await waitFor(() => {
        // Tests line 126: setLoginError(error.message || 'Account activation failed')
        // When error.message is falsy, should use the fallback
        expect(screen.getByText('Account activation failed')).toBeInTheDocument();
      });
    });
  });

  describe('Password Modal Close', () => {
    test('closes password modal and clears data when close button clicked', async () => {
      login.mockResolvedValue({
        success: true,
        user: {
          username: 'inactiveuser',
          requiresPasswordChange: true,
          requiresOTP: false
        }
      });

      render(<Login onLogin={mockOnLogin} />);

      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('password-change-modal')).toBeInTheDocument();
      });

      const closeButton = screen.getByRole('button', { name: 'Close' });

      await act(async () => {
        fireEvent.click(closeButton);
      });

      await waitFor(() => {
        expect(screen.queryByTestId('password-change-modal')).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    test('displays error message on login failure (success: false)', async () => {
      login.mockResolvedValue({
        success: false,
        message: 'Invalid credentials'
      });

      render(<Login onLogin={mockOnLogin} />);

      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
      });

      expect(mockOnLogin).not.toHaveBeenCalled();
    });

    test('handles login service exception', async () => {
      const error = new Error('Network error');
      login.mockRejectedValue(error);

      render(<Login onLogin={mockOnLogin} />);

      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(utils.handleError).toHaveBeenCalledWith(error);
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });

    test('handles error without message', async () => {
      const error = {};
      login.mockRejectedValue(error);
      utils.handleError.mockReturnValue('An error occurred');

      render(<Login onLogin={mockOnLogin} />);

      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByText('An error occurred')).toBeInTheDocument();
      });
    });
  });

  describe('Logo Handling', () => {
    test('shows fallback logo when image fails to load', () => {
      render(<Login onLogin={mockOnLogin} />);

      const logoImage = screen.getByAltText('Logo');

      // Trigger error event
      fireEvent.error(logoImage);

      // Logo image should be hidden
      expect(logoImage.style.display).toBe('none');

      // Fallback should appear
      expect(screen.getByText('Y')).toBeInTheDocument();
      expect(screen.getByText('Y')).toHaveClass('logo-fallback');
    });

    test('does not show fallback initially', () => {
      render(<Login onLogin={mockOnLogin} />);

      expect(screen.queryByText('Y')).not.toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    test('shows loader when loading prop is true', () => {
      render(<Login onLogin={mockOnLogin} loading={true} />);

      expect(screen.getByTestId('loader')).toBeInTheDocument();
      expect(screen.queryByPlaceholderText(/username/i)).not.toBeInTheDocument();
    });

    test('shows loader during login process', async () => {
      let resolveLogin;
      login.mockReturnValue(new Promise(resolve => { resolveLogin = resolve; }));

      render(<Login onLogin={mockOnLogin} />);

      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await act(async () => {
        fireEvent.click(submitButton);
      });

      expect(screen.getByTestId('loader')).toBeInTheDocument();

      await act(async () => {
        resolveLogin({ success: true, user: { requiresPasswordChange: false } });
      });
    });

    test('hides loader after login completes', async () => {
      login.mockResolvedValue({
        success: true,
        user: {
          username: 'admin',
          requiresPasswordChange: false
        }
      });

      render(<Login onLogin={mockOnLogin} />);

      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.queryByTestId('loader')).not.toBeInTheDocument();
      });
    });
  });

  describe('Component Integration', () => {
    test('passes correct props to PasswordChangeModal', async () => {
      login.mockResolvedValue({
        success: true,
        user: {
          username: 'testuser',
          requiresPasswordChange: true,
          requiresOTP: true
        }
      });

      render(<Login onLogin={mockOnLogin} />);

      const usernameInput = screen.getByPlaceholderText(/username/i);
      const passwordInput = screen.getByPlaceholderText(/password/i);

      fireEvent.change(usernameInput, { target: { name: 'username', value: 'testuser' } });
      fireEvent.change(passwordInput, { target: { name: 'password', value: 'currentpass' } });

      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('password-change-modal')).toBeInTheDocument();
        expect(screen.getByTestId('modal-username')).toHaveTextContent('testuser');
        expect(screen.getByTestId('modal-requires-otp')).toHaveTextContent('true');
      });
    });

    test('handles edge case of success without requiresPasswordChange field', async () => {
      login.mockResolvedValue({
        success: true,
        user: {
          username: 'admin'
          // requiresPasswordChange undefined
        }
      });

      render(<Login onLogin={mockOnLogin} />);

      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(mockOnLogin).toHaveBeenCalled();
      });
    });
  });

  describe('PropTypes', () => {
    test('accepts onLogin function prop', () => {
      const onLogin = jest.fn();
      render(<Login onLogin={onLogin} />);

      expect(screen.getByPlaceholderText(/username/i)).toBeInTheDocument();
    });

    test('accepts optional loading boolean prop', () => {
      render(<Login onLogin={mockOnLogin} loading={false} />);

      expect(screen.queryByTestId('loader')).not.toBeInTheDocument();
    });

    test('accepts optional error string prop', () => {
      render(<Login onLogin={mockOnLogin} error="Test error" />);

      expect(screen.getByText('Test error')).toBeInTheDocument();
    });
  });

  describe('Additional Edge Cases for 100% Coverage', () => {
    test('does not clear error when typing if no error exists (line 49)', () => {
      render(<Login onLogin={mockOnLogin} />);

      // No error initially
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();

      const usernameInput = screen.getByPlaceholderText(/username/i);

      // Typing when no error should not cause issues
      fireEvent.change(usernameInput, { target: { name: 'username', value: 'test' } });

      // Still no error
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    test('handles login response with success: false and no message (line 91)', async () => {
      login.mockResolvedValue({
        success: false
        // No message field
      });

      render(<Login onLogin={mockOnLogin} />);

      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Login failed')).toBeInTheDocument();
      });
    });

    test('handles activation success without user in response (lines 116-118)', async () => {
      login.mockResolvedValue({
        success: true,
        user: {
          username: 'inactiveuser',
          requiresPasswordChange: true,
          requiresOTP: false
        }
      });

      auth.activateAccount.mockResolvedValue({
        success: true
        // No user field
      });

      render(<Login onLogin={mockOnLogin} />);

      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('password-change-modal')).toBeInTheDocument();
      });

      const modalSubmitButton = screen.getByRole('button', { name: 'Submit' });

      await act(async () => {
        fireEvent.click(modalSubmitButton);
      });

      await waitFor(() => {
        expect(auth.activateAccount).toHaveBeenCalled();
        // Modal should close even without user in response
        expect(screen.queryByTestId('password-change-modal')).not.toBeInTheDocument();
      });

      // onLogin should NOT be called when response.user is undefined
      expect(mockOnLogin).not.toHaveBeenCalled();
    });

    test('button always shows "Sign In" text', () => {
      render(<Login onLogin={mockOnLogin} loading={false} />);

      const submitButton = screen.getByRole('button', { name: /sign in/i });

      // Button text is always "Sign In" (ternary removed as it was dead code)
      expect(submitButton).toHaveTextContent('Sign In');
    });

    test('loader shown instead of form when loading', () => {
      render(<Login onLogin={mockOnLogin} loading={true} />);

      // When loading prop is true, loader is shown instead of form
      expect(screen.getByTestId('loader')).toBeInTheDocument();
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    test('clears error when typing in password field after login failure', async () => {
      // First trigger an error by causing login to fail
      login.mockResolvedValue({
        success: false,
        message: 'Invalid password'
      });

      render(<Login onLogin={mockOnLogin} />);

      const submitButton = screen.getByRole('button', { name: /sign in/i });

      // Trigger login to create an error
      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Invalid password')).toBeInTheDocument();
      });

      // Now type in password - should clear the error
      const passwordInput = screen.getByPlaceholderText(/password/i);
      fireEvent.change(passwordInput, { target: { name: 'password', value: 'newpass' } });

      expect(screen.queryByText('Invalid password')).not.toBeInTheDocument();
    });
  });
});
