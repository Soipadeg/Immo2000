import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import HomePage from '@/pages/HomePage.jsx';

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
  it('renders home page without crashing', () => {
    const { container } = render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );
    expect(container).toBeTruthy();
  });

  it('renders page content', () => {
    const { container } = render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );
    expect(container.innerHTML.length).toBeGreaterThan(0);
  });
});
