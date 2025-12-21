/**
 * Module: PasswordChangeCard.test.jsx  
 * Purpose: Tests for PasswordChangeCard component
 * Part of: Easter Quest Frontend Testing
 *
 * @since 2025-12-20
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import PasswordChangeCard from '../../../src/components/Profile/PasswordChangeCard';

// Helper to get password fields by index
const getPasswordFields = () => {
  const fields = screen.getAllByPlaceholderText(/password/i);
  return {
    current: fields[0],
    new: fields[1],
    confirm: fields[2]
  };
};

describe('PasswordChangeCard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    test('renders card header', () => {
      render(<PasswordChangeCard />);
      expect(screen.getByText(/🔐 Change Password/i)).toBeInTheDocument();
    });

    test('renders all three password input fields', () => {
      render(<PasswordChangeCard />);
      const fields = screen.getAllByPlaceholderText(/password/i);
      expect(fields).toHaveLength(3);
    });

    test('renders submit button', () => {
      render(<PasswordChangeCard />);
      expect(screen.getByRole('button', { name: /Change Password/i })).toBeInTheDocument();
    });

    test('renders reset button', () => {
      render(<PasswordChangeCard />);
      expect(screen.getByRole('button', { name: /Reset/i })).toBeInTheDocument();
    });
  });

  describe('Input Changes', () => {
    test('allows entering passwords', () => {
      render(<PasswordChangeCard />);
      const { current, new: newPwd, confirm } = getPasswordFields();

      fireEvent.change(current, { target: { value: 'oldpass' } });
      fireEvent.change(newPwd, { target: { value: 'newpass123' } });
      fireEvent.change(confirm, { target: { value: 'newpass123' } });

      expect(current.value).toBe('oldpass');
      expect(newPwd.value).toBe('newpass123');
      expect(confirm.value).toBe('newpass123');
    });
  });

  describe('Form Validation', () => {
    test('shows error when fields are empty', async () => {
      render(<PasswordChangeCard />);
      
      fireEvent.click(screen.getByRole('button', { name: /Change Password/i }));

      await waitFor(() => {
        expect(screen.getByText(/Current password is required/i)).toBeInTheDocument();
      });
    });

    test('shows error for short password', async () => {
      render(<PasswordChangeCard />);
      const { current, new: newPwd, confirm } = getPasswordFields();

      fireEvent.change(current, { target: { value: 'demo' } });
      fireEvent.change(newPwd, { target: { value: 'short' } });
      fireEvent.change(confirm, { target: { value: 'short' } });

      fireEvent.click(screen.getByRole('button', { name: /Change Password/i }));

      await waitFor(() => {
        expect(screen.getByText(/must be at least 8 characters/i)).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    test('shows success on valid submission', async () => {
      render(<PasswordChangeCard />);
      const { current, new: newPwd, confirm } = getPasswordFields();

      fireEvent.change(current, { target: { value: 'demo' } });
      fireEvent.change(newPwd, { target: { value: 'newpass123' } });
      fireEvent.change(confirm, { target: { value: 'newpass123' } });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /Change Password/i }));
      });

      await waitFor(() => {
        expect(screen.getByText(/Password changed successfully/i)).toBeInTheDocument();
      }, { timeout: 2000 });
    });
  });

  describe('Reset Functionality', () => {
    test('reset button clears all fields', () => {
      render(<PasswordChangeCard />);
      const { current, new: newPwd, confirm } = getPasswordFields();

      fireEvent.change(current, { target: { value: 'test' } });
      fireEvent.change(newPwd, { target: { value: 'test123' } });
      fireEvent.change(confirm, { target: { value: 'test123' } });

      fireEvent.click(screen.getByRole('button', { name: /Reset/i }));

      expect(current.value).toBe('');
      expect(newPwd.value).toBe('');
      expect(confirm.value).toBe('');
    });
  });
});
