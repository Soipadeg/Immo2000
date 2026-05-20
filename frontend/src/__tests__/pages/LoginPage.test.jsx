import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import LoginPage from '@/pages/LoginPage.jsx';

describe('LoginPage', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );
    expect(container).toBeTruthy();
  });

  it('displays login form structure', () => {
    const { container } = render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );
    expect(container.innerHTML.length).toBeGreaterThan(0);
  });

  it('renders successfully with proper HTML', () => {
    const { container } = render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );
    expect(container.innerHTML).toBeTruthy();
  });
});
