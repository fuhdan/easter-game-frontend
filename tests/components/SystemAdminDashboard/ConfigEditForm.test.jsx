/**
 * Module: ConfigEditForm.test.jsx
 * Purpose: Tests for ConfigEditForm component
 * Part of: Easter Quest Frontend Testing
 *
 * @since 2025-12-20
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ConfigEditForm from '../../../src/components/SystemAdminDashboard/ConfigEditForm';

describe('ConfigEditForm Component', () => {
  const mockHandlers = {
    onValueChange: jest.fn(),
    onSave: jest.fn(),
    onCancel: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Boolean Input', () => {
    const boolConfig = {
      key: 'feature.enabled',
      value: 'true',
      value_type: 'bool'
    };

    test('renders select dropdown for boolean type', () => {
      render(
        <ConfigEditForm
          config={boolConfig}
          editValue="true"
          {...mockHandlers}
        />
      );

      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    test('shows true and false options', () => {
      render(
        <ConfigEditForm
          config={boolConfig}
          editValue="true"
          {...mockHandlers}
        />
      );

      expect(screen.getByText('true')).toBeInTheDocument();
      expect(screen.getByText('false')).toBeInTheDocument();
    });

    test('calls onValueChange when selection changes', () => {
      render(
        <ConfigEditForm
          config={boolConfig}
          editValue="true"
          {...mockHandlers}
        />
      );

      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'false' } });

      expect(mockHandlers.onValueChange).toHaveBeenCalledWith('false');
    });
  });

  describe('Integer Input', () => {
    const intConfig = {
      key: 'auth.max_attempts',
      value: '5',
      value_type: 'int'
    };

    test('renders number input for integer type', () => {
      render(
        <ConfigEditForm
          config={intConfig}
          editValue="5"
          {...mockHandlers}
        />
      );

      const input = screen.getByRole('spinbutton');
      expect(input).toHaveAttribute('type', 'number');
    });

    test('has step of 1 for integers', () => {
      render(
        <ConfigEditForm
          config={intConfig}
          editValue="5"
          {...mockHandlers}
        />
      );

      const input = screen.getByRole('spinbutton');
      expect(input).toHaveAttribute('step', '1');
    });

    test('calls onValueChange when value changes', () => {
      render(
        <ConfigEditForm
          config={intConfig}
          editValue="5"
          {...mockHandlers}
        />
      );

      const input = screen.getByRole('spinbutton');
      fireEvent.change(input, { target: { value: '10' } });

      expect(mockHandlers.onValueChange).toHaveBeenCalledWith('10');
    });
  });

  describe('Float Input', () => {
    const floatConfig = {
      key: 'ai.temperature',
      value: '0.7',
      value_type: 'float'
    };

    test('renders number input for float type', () => {
      render(
        <ConfigEditForm
          config={floatConfig}
          editValue="0.7"
          {...mockHandlers}
        />
      );

      const input = screen.getByRole('spinbutton');
      expect(input).toHaveAttribute('type', 'number');
    });

    test('has step of 0.1 for floats', () => {
      render(
        <ConfigEditForm
          config={floatConfig}
          editValue="0.7"
          {...mockHandlers}
        />
      );

      const input = screen.getByRole('spinbutton');
      expect(input).toHaveAttribute('step', '0.1');
    });
  });

  describe('String Input', () => {
    const stringConfig = {
      key: 'app.name',
      value: 'Easter Quest',
      value_type: 'str'
    };

    test('renders text input for string type', () => {
      render(
        <ConfigEditForm
          config={stringConfig}
          editValue="Easter Quest"
          {...mockHandlers}
        />
      );

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'text');
    });

    test('calls onValueChange when typing', () => {
      render(
        <ConfigEditForm
          config={stringConfig}
          editValue="Easter Quest"
          {...mockHandlers}
        />
      );

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'New Name' } });

      expect(mockHandlers.onValueChange).toHaveBeenCalledWith('New Name');
    });
  });

  describe('Buttons', () => {
    const intConfig = {
      key: 'auth.max_attempts',
      value: '5',
      value_type: 'int'
    };

    test('renders save button', () => {
      render(
        <ConfigEditForm
          config={intConfig}
          editValue="5"
          {...mockHandlers}
        />
      );

      expect(screen.getByText(/Save/i)).toBeInTheDocument();
    });

    test('renders cancel button', () => {
      render(
        <ConfigEditForm
          config={intConfig}
          editValue="5"
          {...mockHandlers}
        />
      );

      expect(screen.getByText(/Cancel/i)).toBeInTheDocument();
    });

    test('calls onSave when save button clicked', () => {
      render(
        <ConfigEditForm
          config={intConfig}
          editValue="10"
          {...mockHandlers}
        />
      );

      const saveButton = screen.getByText(/Save/i);
      fireEvent.click(saveButton);

      expect(mockHandlers.onSave).toHaveBeenCalled();
    });

    test('calls onCancel when cancel button clicked', () => {
      render(
        <ConfigEditForm
          config={intConfig}
          editValue="10"
          {...mockHandlers}
        />
      );

      const cancelButton = screen.getByText(/Cancel/i);
      fireEvent.click(cancelButton);

      expect(mockHandlers.onCancel).toHaveBeenCalled();
    });
  });
});
