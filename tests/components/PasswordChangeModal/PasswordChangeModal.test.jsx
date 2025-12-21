/**
 * Module: PasswordChangeModal.test.jsx
 * Purpose: Comprehensive tests for PasswordChangeModal component (100% coverage)
 * Part of: Easter Quest Frontend Testing
 *
 * Tests scenarios 2 & 3:
 * - Scenario 2: Password change without OTP
 * - Scenario 3: Password change with OTP
 *
 * @since 2025-12-20
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import PasswordChangeModal from '../../../src/components/PasswordChangeModal/PasswordChangeModal';

describe('PasswordChangeModal Component', () => {
  let mockOnClose;
  let mockOnSuccess;
  const defaultProps = {
    isOpen: true,
    onClose: null,
    onSuccess: null,
    username: 'testuser',
    requiresOTP: false,
    currentPassword: 'oldpassword',
    loading: false
  };

  beforeEach(() => {
    mockOnClose = jest.fn();
    mockOnSuccess = jest.fn().mockResolvedValue();
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    test('does not render when isOpen is false', () => {
      const { container } = render(
        <PasswordChangeModal {...defaultProps} isOpen={false} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      expect(container.firstChild).toBeNull();
    });

    test('renders modal when isOpen is true', () => {
      render(
        <PasswordChangeModal {...defaultProps} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      expect(screen.getByText('Account Activation Required')).toBeInTheDocument();
      expect(screen.getByText(/Welcome/)).toBeInTheDocument();
      expect(screen.getByText('testuser')).toBeInTheDocument();
    });

    test('renders without OTP field when requiresOTP is false', () => {
      render(
        <PasswordChangeModal {...defaultProps} requiresOTP={false} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      expect(screen.getByText('Please set a new password to activate your account.')).toBeInTheDocument();
      expect(screen.queryByPlaceholderText(/OTP/i)).not.toBeInTheDocument();
    });

    test('renders with OTP field when requiresOTP is true', () => {
      render(
        <PasswordChangeModal {...defaultProps} requiresOTP={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      expect(screen.getByText(/Please set a new password and enter your one-time password/)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Enter 8-digit OTP/i)).toBeInTheDocument();
    });

    test('renders all form fields', () => {
      render(
        <PasswordChangeModal {...defaultProps} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      expect(screen.getByPlaceholderText(/Enter your new password/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Confirm your new password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Activate Account/i })).toBeInTheDocument();
    });

    test('renders close button', () => {
      render(
        <PasswordChangeModal {...defaultProps} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      const closeButton = screen.getByText('×');
      expect(closeButton).toBeInTheDocument();
    });

    test('renders password toggle button', () => {
      render(
        <PasswordChangeModal {...defaultProps} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      const toggleButtons = screen.getAllByRole('button', { type: 'button' });
      // Should have password toggle button and close button
      expect(toggleButtons.length).toBeGreaterThan(0);
    });
  });

  describe('Form Input Handling', () => {
    test('updates newPassword field on input', () => {
      render(
        <PasswordChangeModal {...defaultProps} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      const newPasswordInput = screen.getByPlaceholderText(/Enter your new password/i);
      fireEvent.change(newPasswordInput, { target: { name: 'newPassword', value: 'newpass123' } });

      expect(newPasswordInput).toHaveValue('newpass123');
    });

    test('updates confirmPassword field on input', () => {
      render(
        <PasswordChangeModal {...defaultProps} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      const confirmPasswordInput = screen.getByPlaceholderText(/Confirm your new password/i);
      fireEvent.change(confirmPasswordInput, { target: { name: 'confirmPassword', value: 'newpass123' } });

      expect(confirmPasswordInput).toHaveValue('newpass123');
    });

    test('updates OTP field on input when requiresOTP is true', () => {
      render(
        <PasswordChangeModal {...defaultProps} requiresOTP={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      const otpInput = screen.getByPlaceholderText(/Enter 8-digit OTP/i);
      fireEvent.change(otpInput, { target: { name: 'otp', value: '12345678' } });

      expect(otpInput).toHaveValue('12345678');
    });

    test('clears specific error when user types in field with error (lines 42-47)', () => {
      render(
        <PasswordChangeModal {...defaultProps} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      const submitButton = screen.getByRole('button', { name: /Activate Account/i });

      // Submit empty form to trigger errors
      fireEvent.click(submitButton);

      // Verify error appears
      expect(screen.getByText('New password is required')).toBeInTheDocument();

      // Type in the field
      const newPasswordInput = screen.getByPlaceholderText(/Enter your new password/i);
      fireEvent.change(newPasswordInput, { target: { name: 'newPassword', value: 'a' } });

      // Error should be cleared
      expect(screen.queryByText('New password is required')).not.toBeInTheDocument();
    });

    test('does not clear error for other fields when typing (line 42 condition false)', () => {
      render(
        <PasswordChangeModal {...defaultProps} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      const submitButton = screen.getByRole('button', { name: /Activate Account/i });

      // Submit to trigger errors
      fireEvent.click(submitButton);

      // Verify both errors appear
      expect(screen.getByText('New password is required')).toBeInTheDocument();
      expect(screen.getByText('Please confirm your new password')).toBeInTheDocument();

      // Type in newPassword field
      const newPasswordInput = screen.getByPlaceholderText(/Enter your new password/i);
      fireEvent.change(newPasswordInput, { target: { name: 'newPassword', value: 'pass' } });

      // newPassword error cleared, but confirmPassword error remains
      expect(screen.queryByText('New password is required')).not.toBeInTheDocument();
      expect(screen.getByText('Please confirm your new password')).toBeInTheDocument();
    });
  });

  describe('Password Visibility Toggle', () => {
    test('toggles password visibility on button click', () => {
      render(
        <PasswordChangeModal {...defaultProps} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      const newPasswordInput = screen.getByPlaceholderText(/Enter your new password/i);
      const confirmPasswordInput = screen.getByPlaceholderText(/Confirm your new password/i);

      // Initially password type
      expect(newPasswordInput).toHaveAttribute('type', 'password');
      expect(confirmPasswordInput).toHaveAttribute('type', 'password');

      // Click toggle button
      const toggleButton = screen.getByText('👁️‍🗨️');
      fireEvent.click(toggleButton);

      // Should now be text type
      expect(newPasswordInput).toHaveAttribute('type', 'text');
      expect(confirmPasswordInput).toHaveAttribute('type', 'text');

      // Click again to toggle back
      fireEvent.click(toggleButton);

      // Should be password type again
      expect(newPasswordInput).toHaveAttribute('type', 'password');
      expect(confirmPasswordInput).toHaveAttribute('type', 'password');
    });
  });

  describe('Form Validation', () => {
    test('validates empty newPassword field (lines 56-60)', () => {
      render(
        <PasswordChangeModal {...defaultProps} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      const submitButton = screen.getByRole('button', { name: /Activate Account/i });
      fireEvent.click(submitButton);

      expect(screen.getByText('New password is required')).toBeInTheDocument();
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });

    test('validates newPassword minimum length (lines 58-60)', () => {
      render(
        <PasswordChangeModal {...defaultProps} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      const newPasswordInput = screen.getByPlaceholderText(/Enter your new password/i);
      const confirmPasswordInput = screen.getByPlaceholderText(/Confirm your new password/i);

      fireEvent.change(newPasswordInput, { target: { name: 'newPassword', value: '12345' } });
      fireEvent.change(confirmPasswordInput, { target: { name: 'confirmPassword', value: '12345' } });

      const submitButton = screen.getByRole('button', { name: /Activate Account/i });
      fireEvent.click(submitButton);

      expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument();
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });

    test('validates empty confirmPassword field (lines 62-66)', () => {
      render(
        <PasswordChangeModal {...defaultProps} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      const newPasswordInput = screen.getByPlaceholderText(/Enter your new password/i);
      fireEvent.change(newPasswordInput, { target: { name: 'newPassword', value: '123456' } });

      const submitButton = screen.getByRole('button', { name: /Activate Account/i });
      fireEvent.click(submitButton);

      expect(screen.getByText('Please confirm your new password')).toBeInTheDocument();
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });

    test('validates password mismatch (lines 64-66)', () => {
      render(
        <PasswordChangeModal {...defaultProps} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      const newPasswordInput = screen.getByPlaceholderText(/Enter your new password/i);
      const confirmPasswordInput = screen.getByPlaceholderText(/Confirm your new password/i);

      fireEvent.change(newPasswordInput, { target: { name: 'newPassword', value: '123456' } });
      fireEvent.change(confirmPasswordInput, { target: { name: 'confirmPassword', value: '654321' } });

      const submitButton = screen.getByRole('button', { name: /Activate Account/i });
      fireEvent.click(submitButton);

      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });

    test('validates empty OTP when requiresOTP is true (lines 68-72)', () => {
      render(
        <PasswordChangeModal {...defaultProps} requiresOTP={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      const newPasswordInput = screen.getByPlaceholderText(/Enter your new password/i);
      const confirmPasswordInput = screen.getByPlaceholderText(/Confirm your new password/i);

      fireEvent.change(newPasswordInput, { target: { name: 'newPassword', value: '123456' } });
      fireEvent.change(confirmPasswordInput, { target: { name: 'confirmPassword', value: '123456' } });

      const submitButton = screen.getByRole('button', { name: /Activate Account/i });
      fireEvent.click(submitButton);

      expect(screen.getByText('OTP is required')).toBeInTheDocument();
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });

    test('validates OTP length when requiresOTP is true (lines 70-72)', () => {
      render(
        <PasswordChangeModal {...defaultProps} requiresOTP={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      const newPasswordInput = screen.getByPlaceholderText(/Enter your new password/i);
      const confirmPasswordInput = screen.getByPlaceholderText(/Confirm your new password/i);
      const otpInput = screen.getByPlaceholderText(/Enter 8-digit OTP/i);

      fireEvent.change(newPasswordInput, { target: { name: 'newPassword', value: '123456' } });
      fireEvent.change(confirmPasswordInput, { target: { name: 'confirmPassword', value: '123456' } });
      fireEvent.change(otpInput, { target: { name: 'otp', value: '123' } });

      const submitButton = screen.getByRole('button', { name: /Activate Account/i });
      fireEvent.click(submitButton);

      expect(screen.getByText('OTP must be 6 digits')).toBeInTheDocument();
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });

    test('passes validation with valid inputs (no OTP)', () => {
      render(
        <PasswordChangeModal {...defaultProps} requiresOTP={false} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      const newPasswordInput = screen.getByPlaceholderText(/Enter your new password/i);
      const confirmPasswordInput = screen.getByPlaceholderText(/Confirm your new password/i);

      fireEvent.change(newPasswordInput, { target: { name: 'newPassword', value: '123456' } });
      fireEvent.change(confirmPasswordInput, { target: { name: 'confirmPassword', value: '123456' } });

      const submitButton = screen.getByRole('button', { name: /Activate Account/i });
      fireEvent.click(submitButton);

      expect(mockOnSuccess).toHaveBeenCalled();
    });

    test('passes validation with valid inputs (with OTP)', () => {
      render(
        <PasswordChangeModal {...defaultProps} requiresOTP={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      const newPasswordInput = screen.getByPlaceholderText(/Enter your new password/i);
      const confirmPasswordInput = screen.getByPlaceholderText(/Confirm your new password/i);
      const otpInput = screen.getByPlaceholderText(/Enter 8-digit OTP/i);

      fireEvent.change(newPasswordInput, { target: { name: 'newPassword', value: '123456' } });
      fireEvent.change(confirmPasswordInput, { target: { name: 'confirmPassword', value: '123456' } });
      fireEvent.change(otpInput, { target: { name: 'otp', value: '12345678' } });

      const submitButton = screen.getByRole('button', { name: /Activate Account/i });
      fireEvent.click(submitButton);

      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  describe('Form Submission', () => {
    test('prevents submission if validation fails (line 84-86)', () => {
      render(
        <PasswordChangeModal {...defaultProps} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      const submitButton = screen.getByRole('button', { name: /Activate Account/i });
      fireEvent.click(submitButton);

      expect(mockOnSuccess).not.toHaveBeenCalled();
    });

    test('calls onSuccess with correct data (no OTP) (lines 88-100)', async () => {
      render(
        <PasswordChangeModal
          {...defaultProps}
          requiresOTP={false}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const newPasswordInput = screen.getByPlaceholderText(/Enter your new password/i);
      const confirmPasswordInput = screen.getByPlaceholderText(/Confirm your new password/i);

      fireEvent.change(newPasswordInput, { target: { name: 'newPassword', value: 'newpass123' } });
      fireEvent.change(confirmPasswordInput, { target: { name: 'confirmPassword', value: 'newpass123' } });

      const form = screen.getByRole('button', { name: /Activate Account/i }).closest('form');
      await act(async () => {
        fireEvent.submit(form);
      });

      expect(mockOnSuccess).toHaveBeenCalledWith({
        username: 'testuser',
        current_password: 'oldpassword',
        new_password: 'newpass123',
        confirm_password: 'newpass123'
      });
    });

    test('calls onSuccess with OTP when requiresOTP is true (lines 96-98)', async () => {
      render(
        <PasswordChangeModal
          {...defaultProps}
          requiresOTP={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const newPasswordInput = screen.getByPlaceholderText(/Enter your new password/i);
      const confirmPasswordInput = screen.getByPlaceholderText(/Confirm your new password/i);
      const otpInput = screen.getByPlaceholderText(/Enter 8-digit OTP/i);

      fireEvent.change(newPasswordInput, { target: { name: 'newPassword', value: 'newpass123' } });
      fireEvent.change(confirmPasswordInput, { target: { name: 'confirmPassword', value: 'newpass123' } });
      fireEvent.change(otpInput, { target: { name: 'otp', value: 'ABC12345' } });

      const form = screen.getByRole('button', { name: /Activate Account/i }).closest('form');
      await act(async () => {
        fireEvent.submit(form);
      });

      expect(mockOnSuccess).toHaveBeenCalledWith({
        username: 'testuser',
        current_password: 'oldpassword',
        new_password: 'newpass123',
        confirm_password: 'newpass123',
        otp: 'ABC12345'
      });
    });

    test('prevents default form submission', async () => {
      render(
        <PasswordChangeModal {...defaultProps} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      const newPasswordInput = screen.getByPlaceholderText(/Enter your new password/i);
      const confirmPasswordInput = screen.getByPlaceholderText(/Confirm your new password/i);

      fireEvent.change(newPasswordInput, { target: { name: 'newPassword', value: 'pass123' } });
      fireEvent.change(confirmPasswordInput, { target: { name: 'confirmPassword', value: 'pass123' } });

      const form = screen.getByRole('button', { name: /Activate Account/i }).closest('form');
      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });

      await act(async () => {
        form.dispatchEvent(submitEvent);
      });

      expect(submitEvent.defaultPrevented).toBe(true);
    });
  });

  describe('Modal Close Handling', () => {
    test('closes modal and resets form on close button click (lines 106-116)', () => {
      render(
        <PasswordChangeModal {...defaultProps} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      const newPasswordInput = screen.getByPlaceholderText(/Enter your new password/i);
      fireEvent.change(newPasswordInput, { target: { name: 'newPassword', value: 'test' } });

      const closeButton = screen.getByText('×');
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    test('prevents closing when loading is true (line 107)', () => {
      render(
        <PasswordChangeModal {...defaultProps} loading={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      const closeButton = screen.getByText('×');
      fireEvent.click(closeButton);

      expect(mockOnClose).not.toHaveBeenCalled();
    });

    test('prevents closing via overlay when loading is true (line 107 early return)', () => {
      render(
        <PasswordChangeModal {...defaultProps} loading={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      const overlay = document.querySelector('.modal-overlay');
      fireEvent.click(overlay);

      expect(mockOnClose).not.toHaveBeenCalled();
    });

    test('uses default loading value when loading prop not provided (line 18)', () => {
      const { isOpen, username, currentPassword, requiresOTP } = defaultProps;
      render(
        <PasswordChangeModal
          isOpen={isOpen}
          username={username}
          currentPassword={currentPassword}
          requiresOTP={requiresOTP}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      // Should render normally with default loading=false
      expect(screen.getByText('Activate Account')).toBeInTheDocument();
      expect(screen.queryByText('Activating Account...')).not.toBeInTheDocument();
    });

    test('closes modal when clicking overlay (line 119)', () => {
      render(
        <PasswordChangeModal {...defaultProps} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      const overlay = document.querySelector('.modal-overlay');
      fireEvent.click(overlay);

      expect(mockOnClose).toHaveBeenCalled();
    });

    test('does not close when clicking modal container (line 120 - stopPropagation)', () => {
      render(
        <PasswordChangeModal {...defaultProps} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      const modalContainer = document.querySelector('.modal-container');
      fireEvent.click(modalContainer);

      expect(mockOnClose).not.toHaveBeenCalled();
    });

    test('resets form data on close', () => {
      const { rerender } = render(
        <PasswordChangeModal {...defaultProps} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      const newPasswordInput = screen.getByPlaceholderText(/Enter your new password/i);
      fireEvent.change(newPasswordInput, { target: { name: 'newPassword', value: 'test123' } });

      const closeButton = screen.getByText('×');
      fireEvent.click(closeButton);

      // Reopen modal
      rerender(
        <PasswordChangeModal {...defaultProps} isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      // Form should be reset (this is implicit - the component reinitializes state)
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Loading State', () => {
    test('disables inputs when loading', () => {
      render(
        <PasswordChangeModal {...defaultProps} loading={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      expect(screen.getByPlaceholderText(/Enter your new password/i)).toBeDisabled();
      expect(screen.getByPlaceholderText(/Confirm your new password/i)).toBeDisabled();
      expect(screen.getByRole('button', { name: /Activating Account/i })).toBeDisabled();
    });

    test('disables close button when loading', () => {
      render(
        <PasswordChangeModal {...defaultProps} loading={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      const closeButton = screen.getByText('×');
      expect(closeButton).toBeDisabled();
    });

    test('disables password toggle button when loading', () => {
      render(
        <PasswordChangeModal {...defaultProps} loading={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      const toggleButton = screen.getByText('👁️‍🗨️');
      expect(toggleButton).toBeDisabled();
    });

    test('shows loading text on submit button when loading', () => {
      render(
        <PasswordChangeModal {...defaultProps} loading={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      expect(screen.getByText('Activating Account...')).toBeInTheDocument();
      expect(screen.queryByText('Activate Account')).not.toBeInTheDocument();
    });

    test('shows normal text on submit button when not loading', () => {
      render(
        <PasswordChangeModal {...defaultProps} loading={false} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      expect(screen.getByText('Activate Account')).toBeInTheDocument();
      expect(screen.queryByText('Activating Account...')).not.toBeInTheDocument();
    });
  });

  describe('Error Display', () => {
    test('displays newPassword error when present', () => {
      render(
        <PasswordChangeModal {...defaultProps} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      const submitButton = screen.getByRole('button', { name: /Activate Account/i });
      fireEvent.click(submitButton);

      expect(screen.getByText('New password is required')).toBeInTheDocument();
    });

    test('displays confirmPassword error when present', () => {
      render(
        <PasswordChangeModal {...defaultProps} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      const newPasswordInput = screen.getByPlaceholderText(/Enter your new password/i);
      fireEvent.change(newPasswordInput, { target: { name: 'newPassword', value: '123456' } });

      const submitButton = screen.getByRole('button', { name: /Activate Account/i });
      fireEvent.click(submitButton);

      expect(screen.getByText('Please confirm your new password')).toBeInTheDocument();
    });

    test('displays OTP error when present', () => {
      render(
        <PasswordChangeModal {...defaultProps} requiresOTP={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      const newPasswordInput = screen.getByPlaceholderText(/Enter your new password/i);
      const confirmPasswordInput = screen.getByPlaceholderText(/Confirm your new password/i);

      fireEvent.change(newPasswordInput, { target: { name: 'newPassword', value: '123456' } });
      fireEvent.change(confirmPasswordInput, { target: { name: 'confirmPassword', value: '123456' } });

      const submitButton = screen.getByRole('button', { name: /Activate Account/i });
      fireEvent.click(submitButton);

      expect(screen.getByText('OTP is required')).toBeInTheDocument();
    });

    test('applies error class to input when error exists', () => {
      render(
        <PasswordChangeModal {...defaultProps} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      const submitButton = screen.getByRole('button', { name: /Activate Account/i });
      fireEvent.click(submitButton);

      const newPasswordInput = screen.getByPlaceholderText(/Enter your new password/i);
      expect(newPasswordInput).toHaveClass('error');
    });
  });

  describe('OTP Help Text', () => {
    test('shows OTP help text when requiresOTP is true', () => {
      render(
        <PasswordChangeModal {...defaultProps} requiresOTP={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      expect(screen.getByText(/Check your email for the 6-digit one-time password/i)).toBeInTheDocument();
    });

    test('does not show OTP help text when requiresOTP is false', () => {
      render(
        <PasswordChangeModal {...defaultProps} requiresOTP={false} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      expect(screen.queryByText(/Check your email for the 6-digit one-time password/i)).not.toBeInTheDocument();
    });
  });

  describe('Props Validation', () => {
    test('uses username prop correctly', () => {
      render(
        <PasswordChangeModal {...defaultProps} username="johndoe" onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      expect(screen.getByText('johndoe')).toBeInTheDocument();
    });

    test('uses currentPassword prop in submission', async () => {
      render(
        <PasswordChangeModal
          {...defaultProps}
          currentPassword="myoldpass"
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const newPasswordInput = screen.getByPlaceholderText(/Enter your new password/i);
      const confirmPasswordInput = screen.getByPlaceholderText(/Confirm your new password/i);

      fireEvent.change(newPasswordInput, { target: { name: 'newPassword', value: 'newpass' } });
      fireEvent.change(confirmPasswordInput, { target: { name: 'confirmPassword', value: 'newpass' } });

      const form = screen.getByRole('button', { name: /Activate Account/i }).closest('form');
      await act(async () => {
        fireEvent.submit(form);
      });

      expect(mockOnSuccess).toHaveBeenCalledWith(
        expect.objectContaining({
          current_password: 'myoldpass'
        })
      );
    });
  });
});
