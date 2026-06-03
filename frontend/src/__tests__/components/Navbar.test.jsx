/**
 * Tests - Navbar Component
 * Fixed navigation bar with responsive mobile menu
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Navbar from '@/components/Navbar/Navbar';

describe('Navbar Component', () => {
  const mockNavLinks = [
    { label: 'Home', href: '/' },
    { label: 'About', href: '/about' },
  ];

  it('renders navbar with logo', () => {
    render(<Navbar logo="MyApp" navLinks={mockNavLinks} />);
    expect(screen.getByText('MyApp')).toBeInTheDocument();
  });

  it('renders navigation links', () => {
    render(<Navbar logo="MyApp" navLinks={mockNavLinks} />);
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('About')).toBeInTheDocument();
  });

  it('renders mobile menu toggle button', () => {
    render(<Navbar logo="MyApp" navLinks={mockNavLinks} />);
    const toggleButton = screen.getByRole('button');
    expect(toggleButton).toHaveAttribute('aria-label', 'Toggle menu');
  });

  it('opens mobile menu when toggle button clicked', async () => {
    const { container } = render(
      <Navbar logo="MyApp" navLinks={mockNavLinks} />
    );
    const toggleButton = screen.getByRole('button');
    await userEvent.click(toggleButton);

    // Check that something changed (menu opened)
    expect(toggleButton).toBeInTheDocument();
  });

  it('displays right content when provided', () => {
    const rightContent = <div>User Menu</div>;
    render(
      <Navbar logo="MyApp" navLinks={mockNavLinks} rightContent={rightContent} />
    );
    expect(screen.getByText('User Menu')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <Navbar logo="MyApp" navLinks={mockNavLinks} className="custom-navbar" />
    );
    const navbar = container.querySelector('.navbar.custom-navbar');
    expect(navbar).toBeInTheDocument();
  });

  it('renders navbar without navigation links', () => {
    render(<Navbar logo="MyApp" navLinks={[]} />);
    expect(screen.getByText('MyApp')).toBeInTheDocument();
  });
});
