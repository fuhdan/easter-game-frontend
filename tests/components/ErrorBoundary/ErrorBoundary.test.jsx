/**
 * Module: ErrorBoundary.test.jsx
 * Purpose: Tests for ErrorBoundary component
 * Part of: Easter Quest Frontend Testing
 *
 * @since 2025-12-20
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ErrorBoundary from '../../../src/components/ErrorBoundary/ErrorBoundary';

// Mock component that throws an error
const ThrowError = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

// Component that throws error on click
const ThrowErrorOnClick = () => {
  const [shouldThrow, setShouldThrow] = React.useState(false);

  if (shouldThrow) {
    throw new Error('Error after click');
  }

  return (
    <button onClick={() => setShouldThrow(true)} data-testid="throw-button">
      Throw Error
    </button>
  );
};

describe('ErrorBoundary Component', () => {
  // Suppress console errors in tests
  const originalError = console.error;
  const originalWarn = console.warn;

  beforeAll(() => {
    console.error = jest.fn();
    console.warn = jest.fn();
  });

  afterAll(() => {
    console.error = originalError;
    console.warn = originalWarn;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    test('renders children when there is no error', () => {
      render(
        <ErrorBoundary>
          <div data-testid="child">Child content</div>
        </ErrorBoundary>
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();
      expect(screen.getByTestId('child')).toHaveTextContent('Child content');
    });

    test('does not render error UI when children render successfully', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(screen.queryByText('Something Went Wrong')).not.toBeInTheDocument();
      expect(screen.getByText('No error')).toBeInTheDocument();
    });

    test('renders error UI when child throws error', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something Went Wrong')).toBeInTheDocument();
      expect(screen.queryByText('No error')).not.toBeInTheDocument();
    });

    test('displays error icon in fallback UI', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const errorIcon = screen.getByText('⚠️');
      expect(errorIcon).toBeInTheDocument();
      expect(errorIcon).toHaveClass('error-icon');
    });

    test('displays error message in fallback UI', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText(/We're sorry, but something unexpected happened/)).toBeInTheDocument();
    });

    test('renders reload button in fallback UI', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const reloadButton = screen.getByText(/Reload Application/);
      expect(reloadButton).toBeInTheDocument();
      expect(reloadButton).toHaveClass('btn');
    });

    test('renders go back button in fallback UI', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const goBackButton = screen.getByText(/Go Back/);
      expect(goBackButton).toBeInTheDocument();
      expect(goBackButton).toHaveClass('btn');
    });
  });

  describe('Error Handling', () => {
    test('catches errors from child components', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something Went Wrong')).toBeInTheDocument();
    });

    test('calls componentDidCatch when error is thrown', () => {
      const componentDidCatchSpy = jest.spyOn(ErrorBoundary.prototype, 'componentDidCatch');

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(componentDidCatchSpy).toHaveBeenCalled();
      componentDidCatchSpy.mockRestore();
    });

    test('calls getDerivedStateFromError when error is thrown', () => {
      const getDerivedStateFromErrorSpy = jest.spyOn(ErrorBoundary, 'getDerivedStateFromError');

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(getDerivedStateFromErrorSpy).toHaveBeenCalled();
      getDerivedStateFromErrorSpy.mockRestore();
    });

    test('handles errors after user interaction', () => {
      render(
        <ErrorBoundary>
          <ThrowErrorOnClick />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('throw-button')).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('throw-button'));

      expect(screen.getByText('Something Went Wrong')).toBeInTheDocument();
    });
  });

  describe('Development Mode Error Details', () => {
    const originalEnv = process.env.NODE_ENV;

    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    test('shows developer information in development mode', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const devInfo = screen.getByText(/Developer Information/);
      expect(devInfo).toBeInTheDocument();
    });

    test('displays error message in development details', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText(/Error Message:/)).toBeInTheDocument();
      expect(screen.getByText(/Error: Test error/)).toBeInTheDocument();
    });

    test('displays component stack in development details', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText(/Component Stack:/)).toBeInTheDocument();
    });

    test('logs error to console in development mode', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error caught by ErrorBoundary:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Production Mode Behavior', () => {
    const originalEnv = process.env.NODE_ENV;

    beforeEach(() => {
      process.env.NODE_ENV = 'production';
    });

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    test('does not show developer information in production mode', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.queryByText(/Developer Information/)).not.toBeInTheDocument();
    });

    test('does not log error details to console in production', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      // Should still have React's error logging, but not our custom logging
      expect(consoleErrorSpy).not.toHaveBeenCalledWith(
        'Error caught by ErrorBoundary:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('User Actions', () => {
    test('reload button calls window.location.reload', () => {
      const reloadMock = jest.fn();
      delete window.location;
      window.location = { reload: reloadMock };

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const reloadButton = screen.getByText(/Reload Application/);
      fireEvent.click(reloadButton);

      expect(reloadMock).toHaveBeenCalled();
    });

    test('go back button calls window.history.back', () => {
      const backMock = jest.fn();
      window.history.back = backMock;

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const goBackButton = screen.getByText(/Go Back/);
      fireEvent.click(goBackButton);

      expect(backMock).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    test('handles multiple children', () => {
      render(
        <ErrorBoundary>
          <div data-testid="child1">Child 1</div>
          <div data-testid="child2">Child 2</div>
          <div data-testid="child3">Child 3</div>
        </ErrorBoundary>
      );

      expect(screen.getByTestId('child1')).toBeInTheDocument();
      expect(screen.getByTestId('child2')).toBeInTheDocument();
      expect(screen.getByTestId('child3')).toBeInTheDocument();
    });

    test('handles nested ErrorBoundaries', () => {
      render(
        <ErrorBoundary>
          <div>Outer</div>
          <ErrorBoundary>
            <div data-testid="inner">Inner</div>
          </ErrorBoundary>
        </ErrorBoundary>
      );

      expect(screen.getByTestId('inner')).toBeInTheDocument();
    });

    test('only inner boundary catches error when nested', () => {
      render(
        <ErrorBoundary>
          <div data-testid="outer">Outer content</div>
          <ErrorBoundary>
            <ThrowError shouldThrow={true} />
          </ErrorBoundary>
        </ErrorBoundary>
      );

      // Outer content should still be visible
      expect(screen.getByTestId('outer')).toBeInTheDocument();
      // Error UI should be shown
      expect(screen.getByText('Something Went Wrong')).toBeInTheDocument();
    });

    test('handles null children', () => {
      render(
        <ErrorBoundary>
          {null}
        </ErrorBoundary>
      );

      expect(screen.queryByText('Something Went Wrong')).not.toBeInTheDocument();
    });

    test('handles undefined children', () => {
      render(
        <ErrorBoundary>
          {undefined}
        </ErrorBoundary>
      );

      expect(screen.queryByText('Something Went Wrong')).not.toBeInTheDocument();
    });

    test('handles empty children', () => {
      render(<ErrorBoundary></ErrorBoundary>);

      expect(screen.queryByText('Something Went Wrong')).not.toBeInTheDocument();
    });
  });

  describe('CSS Classes', () => {
    test('error boundary has correct class', () => {
      const { container } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const errorBoundary = container.querySelector('.error-boundary');
      expect(errorBoundary).toBeInTheDocument();
    });

    test('error card has correct class', () => {
      const { container } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const errorCard = container.querySelector('.error-boundary-card');
      expect(errorCard).toBeInTheDocument();
    });

    test('error actions container has correct class', () => {
      const { container } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const errorActions = container.querySelector('.error-actions');
      expect(errorActions).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('buttons have proper text content', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const reloadButton = screen.getByText(/Reload Application/);
      const goBackButton = screen.getByText(/Go Back/);

      expect(reloadButton).toHaveAccessibleName();
      expect(goBackButton).toHaveAccessibleName();
    });

    test('error message is readable', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const errorMessage = screen.getByText(/We're sorry, but something unexpected happened/);
      expect(errorMessage).toHaveClass('error-message');
    });
  });
});
