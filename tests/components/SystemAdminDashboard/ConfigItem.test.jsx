import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import ConfigItem from '../../../src/components/SystemAdminDashboard/ConfigItem';

describe('ConfigItem Component', () => {
  test('renders without crashing', () => {
    const mockConfig = { key: 'test_key', value: '123', value_type: 'integer', category: 'test' };
    const { container } = render(<ConfigItem config={mockConfig} onEdit={jest.fn()} onSave={jest.fn()} />);
    expect(container.firstChild).toBeTruthy();
  });
});
