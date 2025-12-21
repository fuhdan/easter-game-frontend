import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import SystemAdminDashboard from '../../../src/components/SystemAdminDashboard/SystemAdminDashboard';

describe('SystemAdminDashboard Component', () => {
  test('renders without crashing', () => {
    const mockUser = { role: 'admin' };
    const { container } = render(<SystemAdminDashboard user={mockUser} />);
    expect(container.firstChild).toBeTruthy();
  });
});
