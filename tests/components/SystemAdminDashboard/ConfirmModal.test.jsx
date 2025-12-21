/**
 * Module: ConfirmModal.test.jsx
 * Purpose: Tests for ConfirmModal component
 * Part of: Easter Quest Frontend Testing
 *
 * @since 2025-12-20
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ConfirmModal from '../../../src/components/SystemAdminDashboard/ConfirmModal';

describe('ConfirmModal Component', () => {
  const mockPendingChange = {
    config: {
      key: 'auth.access_token_minutes',
      value: '15'
    },
    newValue: '30'
  };

  const mockHandlers = {
    onConfirm: jest.fn(),
    onClose: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    test('renders modal title', () => {
      render(<ConfirmModal pendingChange={mockPendingChange} {...mockHandlers} />);

      expect(screen.getByText(/Confirm Configuration Change/i)).toBeInTheDocument();
    });

    test('displays config key', () => {
      render(<ConfirmModal pendingChange={mockPendingChange} {...mockHandlers} />);

      expect(screen.getByText(/auth.access_token_minutes/i)).toBeInTheDocument();
    });

    test('displays current value', () => {
      render(<ConfirmModal pendingChange={mockPendingChange} {...mockHandlers} />);

      expect(screen.getByText(/Current Value:/i)).toBeInTheDocument();
      expect(screen.getByText('15')).toBeInTheDocument();
    });

    test('displays new value', () => {
      render(<ConfirmModal pendingChange={mockPendingChange} {...mockHandlers} />);

      expect(screen.getByText(/New Value:/i)).toBeInTheDocument();
      expect(screen.getByText('30')).toBeInTheDocument();
    });

    test('displays warning message', () => {
      render(<ConfirmModal pendingChange={mockPendingChange} {...mockHandlers} />);

      expect(screen.getByText(/This change will take effect immediately/i)).toBeInTheDocument();
    });
  });

  describe('Actions', () => {
    test('renders confirm button', () => {
      render(<ConfirmModal pendingChange={mockPendingChange} {...mockHandlers} />);

      expect(screen.getByRole('button', { name: /Confirm Change/i })).toBeInTheDocument();
    });

    test('renders cancel button', () => {
      render(<ConfirmModal pendingChange={mockPendingChange} {...mockHandlers} />);

      expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
    });

    test('calls onConfirm when confirm button clicked', () => {
      render(<ConfirmModal pendingChange={mockPendingChange} {...mockHandlers} />);

      const confirmButton = screen.getByRole('button', { name: /Confirm Change/i });
      fireEvent.click(confirmButton);

      expect(mockHandlers.onConfirm).toHaveBeenCalled();
    });

    test('calls onClose when cancel button clicked', () => {
      render(<ConfirmModal pendingChange={mockPendingChange} {...mockHandlers} />);

      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      fireEvent.click(cancelButton);

      expect(mockHandlers.onClose).toHaveBeenCalled();
    });
  });

  describe('Modal Overlay', () => {
    test('calls onClose when clicking overlay', () => {
      const { container } = render(<ConfirmModal pendingChange={mockPendingChange} {...mockHandlers} />);

      const overlay = container.querySelector('.modal-overlay');
      fireEvent.click(overlay);

      expect(mockHandlers.onClose).toHaveBeenCalled();
    });

    test('does not close when clicking modal content', () => {
      const { container } = render(<ConfirmModal pendingChange={mockPendingChange} {...mockHandlers} />);

      const content = container.querySelector('.modal-content');
      fireEvent.click(content);

      expect(mockHandlers.onClose).not.toHaveBeenCalled();
    });
  });

  describe('Component Structure', () => {
    test('has correct CSS classes', () => {
      const { container } = render(<ConfirmModal pendingChange={mockPendingChange} {...mockHandlers} />);

      expect(container.querySelector('.modal-overlay')).toBeInTheDocument();
      expect(container.querySelector('.modal-content')).toBeInTheDocument();
      expect(container.querySelector('.modal-body')).toBeInTheDocument();
      expect(container.querySelector('.modal-actions')).toBeInTheDocument();
    });
  });
});
