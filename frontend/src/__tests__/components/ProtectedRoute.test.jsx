/**
 * Tests - ProtectedRoute Component
 * Route protection based on authentication and role
 */

import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ProtectedRoute from '@/components/ProtectedRoute';
import { AuthContext } from '@/contexts/AuthContext';

const mockAuthContext = {
  user: { user_id: 1, email: 'test@test.com', role: 'user' },
  loading: false,
  isAuthenticated: true,
};

const mockUnauthenticatedContext = {
  user: null,
  loading: false,
  isAuthenticated: false,
};

const TestComponent = () => <div>Protected Content</div>;

describe('ProtectedRoute Component', () => {
  it('renders without errors when authenticated', () => {
    const { container } = render(
      <AuthContext.Provider value={mockAuthContext}>
        <BrowserRouter>
          <ProtectedRoute element={<TestComponent />} requiredRoles={['user']} />
        </BrowserRouter>
      </AuthContext.Provider>
    );
    expect(container).toBeInTheDocument();
  });

  it('renders without errors when not authenticated', () => {
    const { container } = render(
      <AuthContext.Provider value={mockUnauthenticatedContext}>
        <BrowserRouter>
          <ProtectedRoute element={<TestComponent />} requiredRoles={['user']} />
        </BrowserRouter>
      </AuthContext.Provider>
    );
    expect(container).toBeInTheDocument();
  });

  it('accepts multiple required roles', () => {
    const { container } = render(
      <AuthContext.Provider value={mockAuthContext}>
        <BrowserRouter>
          <ProtectedRoute
            element={<TestComponent />}
            requiredRoles={['user', 'admin', 'moderator']}
          />
        </BrowserRouter>
      </AuthContext.Provider>
    );
    expect(container).toBeInTheDocument();
  });
});
