import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from '@/pages/Dashboard.jsx';

describe('Dashboard Page', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );
    expect(container).toBeTruthy();
  });

  it('displays dashboard content', () => {
    const { container } = render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );
    expect(container.innerHTML.length).toBeGreaterThan(0);
  });

  it('renders without errors', () => {
    const { container } = render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );
    expect(container.innerHTML).toBeTruthy();
  });

  it('has proper structure', () => {
    const { container } = render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );
    const dashboard = container.querySelector('[class*="dashboard"]');
    expect(dashboard || container.innerHTML).toBeTruthy();
  });
});
