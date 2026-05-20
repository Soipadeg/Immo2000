/**
 * Tests - HomePage
 * Main landing page with search and navigation
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import HomePage from '@/pages/HomePage';

// Mock the API services
vi.mock('@/services/api', () => ({
  listingsApi: {
    getFeatured: vi.fn(() => Promise.resolve({
      data: {
        data: [
          {
            annonce_id: 1,
            titre: 'Appartement Paris',
            prix: 350000,
            adresse: '123 Rue de Paris',
            images: [{ url: 'image1.jpg' }],
          },
        ],
      },
    })),
  },
}));

describe('HomePage', () => {
  it('renders home page', () => {
    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );

    // Should render without crashing
    const page = screen.getByRole('main', { hidden: true });
    expect(page).toBeTruthy();
  });

  it('renders without errors', () => {
    const { container } = render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );

    // Page should have content
    expect(container.firstChild).toBeInTheDocument();
  });
});
