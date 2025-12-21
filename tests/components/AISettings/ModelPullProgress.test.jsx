/**
 * Module: ModelPullProgress.test.jsx
 * Purpose: Tests for ModelPullProgress component
 * Part of: Easter Quest Frontend Testing
 *
 * @since 2025-12-20
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ModelPullProgress from '../../../src/components/AISettings/ModelPullProgress';

describe('ModelPullProgress Component', () => {
  describe('Rendering', () => {
    test('renders model name', () => {
      render(
        <ModelPullProgress
          modelName="llama3.2:3b"
          progress={50}
          status="downloading"
          message="Downloading layers..."
        />
      );

      expect(screen.getByText('llama3.2:3b')).toBeInTheDocument();
    });

    test('renders progress percentage', () => {
      render(
        <ModelPullProgress
          modelName="llama3.2:3b"
          progress={75}
          status="downloading"
          message="Almost done..."
        />
      );

      expect(screen.getByText('75%')).toBeInTheDocument();
    });

    test('renders status message', () => {
      render(
        <ModelPullProgress
          modelName="llama3.2:3b"
          progress={25}
          status="downloading"
          message="Downloading layers..."
        />
      );

      expect(screen.getByText('Downloading layers...')).toBeInTheDocument();
    });

    test('renders with default props', () => {
      render(<ModelPullProgress modelName="test-model" />);

      expect(screen.getByText('test-model')).toBeInTheDocument();
      expect(screen.getByText('0%')).toBeInTheDocument();
      expect(screen.getByText('Starting download...')).toBeInTheDocument();
    });
  });

  describe('Status Icons', () => {
    test('displays downloading icon for downloading status', () => {
      render(
        <ModelPullProgress
          modelName="test-model"
          progress={50}
          status="downloading"
          message="Downloading..."
        />
      );

      expect(screen.getByText('⏳')).toBeInTheDocument();
    });

    test('displays success icon for completed status', () => {
      render(
        <ModelPullProgress
          modelName="test-model"
          progress={100}
          status="completed"
          message="Download complete"
        />
      );

      expect(screen.getByText('✓')).toBeInTheDocument();
    });

    test('displays error icon for failed status', () => {
      render(
        <ModelPullProgress
          modelName="test-model"
          progress={60}
          status="failed"
          message="Download failed"
        />
      );

      expect(screen.getByText('✗')).toBeInTheDocument();
    });

    test('displays default icon for unknown status', () => {
      render(
        <ModelPullProgress
          modelName="test-model"
          progress={30}
          status="unknown"
          message="Processing..."
        />
      );

      expect(screen.getByText('⏳')).toBeInTheDocument();
    });
  });

  describe('Progress Bar', () => {
    test('sets progress bar width based on progress prop', () => {
      const { container } = render(
        <ModelPullProgress
          modelName="test-model"
          progress={65}
          status="downloading"
        />
      );

      const progressBar = container.querySelector('.progress-bar-fill');
      expect(progressBar).toHaveStyle({ width: '65%' });
    });

    test('displays 0% width when progress is 0', () => {
      const { container } = render(
        <ModelPullProgress
          modelName="test-model"
          progress={0}
          status="downloading"
        />
      );

      const progressBar = container.querySelector('.progress-bar-fill');
      expect(progressBar).toHaveStyle({ width: '0%' });
    });

    test('displays 100% width when progress is 100', () => {
      const { container } = render(
        <ModelPullProgress
          modelName="test-model"
          progress={100}
          status="completed"
        />
      );

      const progressBar = container.querySelector('.progress-bar-fill');
      expect(progressBar).toHaveStyle({ width: '100%' });
    });

    test('includes shimmer effect element', () => {
      const { container } = render(
        <ModelPullProgress
          modelName="test-model"
          progress={50}
          status="downloading"
        />
      );

      const shimmer = container.querySelector('.progress-bar-shimmer');
      expect(shimmer).toBeInTheDocument();
    });
  });

  describe('Status Badges', () => {
    test('displays completion badge when status is completed', () => {
      render(
        <ModelPullProgress
          modelName="test-model"
          progress={100}
          status="completed"
          message="Download complete"
        />
      );

      expect(screen.getByText('Complete!')).toBeInTheDocument();
    });

    test('displays failure badge when status is failed', () => {
      render(
        <ModelPullProgress
          modelName="test-model"
          progress={50}
          status="failed"
          message="Download failed"
        />
      );

      expect(screen.getByText('Failed')).toBeInTheDocument();
    });

    test('does not display badges when downloading', () => {
      render(
        <ModelPullProgress
          modelName="test-model"
          progress={50}
          status="downloading"
          message="Downloading..."
        />
      );

      expect(screen.queryByText('Complete!')).not.toBeInTheDocument();
      expect(screen.queryByText('Failed')).not.toBeInTheDocument();
    });
  });

  describe('CSS Classes', () => {
    test('applies downloading class when status is downloading', () => {
      const { container } = render(
        <ModelPullProgress
          modelName="test-model"
          progress={50}
          status="downloading"
        />
      );

      const progressComponent = container.querySelector('.model-pull-progress');
      expect(progressComponent).toHaveClass('downloading');
    });

    test('applies completed class when status is completed', () => {
      const { container } = render(
        <ModelPullProgress
          modelName="test-model"
          progress={100}
          status="completed"
        />
      );

      const progressComponent = container.querySelector('.model-pull-progress');
      expect(progressComponent).toHaveClass('completed');
    });

    test('applies failed class when status is failed', () => {
      const { container } = render(
        <ModelPullProgress
          modelName="test-model"
          progress={50}
          status="failed"
        />
      );

      const progressComponent = container.querySelector('.model-pull-progress');
      expect(progressComponent).toHaveClass('failed');
    });

    test('applies correct classes to all elements', () => {
      const { container } = render(
        <ModelPullProgress
          modelName="test-model"
          progress={50}
          status="downloading"
          message="Downloading..."
        />
      );

      expect(container.querySelector('.model-pull-progress')).toBeInTheDocument();
      expect(container.querySelector('.pull-progress-header')).toBeInTheDocument();
      expect(container.querySelector('.progress-icon')).toBeInTheDocument();
      expect(container.querySelector('.progress-model-name')).toBeInTheDocument();
      expect(container.querySelector('.progress-percentage')).toBeInTheDocument();
      expect(container.querySelector('.progress-bar-container')).toBeInTheDocument();
      expect(container.querySelector('.progress-bar-fill')).toBeInTheDocument();
      expect(container.querySelector('.pull-progress-details')).toBeInTheDocument();
      expect(container.querySelector('.progress-message')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    test('handles negative progress', () => {
      const { container } = render(
        <ModelPullProgress
          modelName="test-model"
          progress={-10}
          status="downloading"
        />
      );

      expect(screen.getByText('-10%')).toBeInTheDocument();
      const progressBar = container.querySelector('.progress-bar-fill');
      expect(progressBar).toHaveStyle({ width: '-10%' });
    });

    test('handles progress over 100', () => {
      const { container } = render(
        <ModelPullProgress
          modelName="test-model"
          progress={150}
          status="downloading"
        />
      );

      expect(screen.getByText('150%')).toBeInTheDocument();
      const progressBar = container.querySelector('.progress-bar-fill');
      expect(progressBar).toHaveStyle({ width: '150%' });
    });

    test('handles empty model name', () => {
      render(
        <ModelPullProgress
          modelName=""
          progress={50}
          status="downloading"
        />
      );

      const { container } = render(
        <ModelPullProgress
          modelName=""
          progress={50}
          status="downloading"
        />
      );

      const modelNameElement = container.querySelector('.progress-model-name');
      expect(modelNameElement).toBeInTheDocument();
      expect(modelNameElement.textContent).toBe('');
    });

    test('handles empty message', () => {
      render(
        <ModelPullProgress
          modelName="test-model"
          progress={50}
          status="downloading"
          message=""
        />
      );

      const { container } = render(
        <ModelPullProgress
          modelName="test-model"
          progress={50}
          status="downloading"
          message=""
        />
      );

      const messageElement = container.querySelector('.progress-message');
      expect(messageElement).toBeInTheDocument();
      expect(messageElement.textContent).toBe('');
    });

    test('handles decimal progress values', () => {
      render(
        <ModelPullProgress
          modelName="test-model"
          progress={45.67}
          status="downloading"
        />
      );

      expect(screen.getByText('45.67%')).toBeInTheDocument();
    });

    test('handles long model names', () => {
      const longName = 'very-long-model-name-that-might-cause-layout-issues-v1.2.3-beta';
      render(
        <ModelPullProgress
          modelName={longName}
          progress={50}
          status="downloading"
        />
      );

      expect(screen.getByText(longName)).toBeInTheDocument();
    });

    test('handles long messages', () => {
      const longMessage = 'This is a very long status message that might wrap to multiple lines and could potentially cause layout issues if not handled properly';
      render(
        <ModelPullProgress
          modelName="test-model"
          progress={50}
          status="downloading"
          message={longMessage}
        />
      );

      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('renders all text content as accessible text', () => {
      render(
        <ModelPullProgress
          modelName="llama3.2:3b"
          progress={75}
          status="downloading"
          message="Downloading model layers..."
        />
      );

      expect(screen.getByText('llama3.2:3b')).toBeVisible();
      expect(screen.getByText('75%')).toBeVisible();
      expect(screen.getByText('Downloading model layers...')).toBeVisible();
    });

    test('progress bar has appropriate structure for screen readers', () => {
      const { container } = render(
        <ModelPullProgress
          modelName="test-model"
          progress={50}
          status="downloading"
        />
      );

      const progressBarContainer = container.querySelector('.progress-bar-container');
      const progressBarFill = container.querySelector('.progress-bar-fill');

      expect(progressBarContainer).toBeInTheDocument();
      expect(progressBarFill).toBeInTheDocument();
    });
  });
});
