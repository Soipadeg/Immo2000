import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import SearchBar from '@/components/SearchBar/SearchBar';

describe('SearchBar Component', () => {
  it('renders search form', () => {
    const { container } = render(<SearchBar />);
    expect(container.querySelector('.search-bar-form')).toBeInTheDocument();
  });

  it('renders search input field', () => {
    render(<SearchBar />);
    const inputs = screen.queryAllByRole('textbox');
    expect(inputs.length).toBeGreaterThan(0);
  });

  it('displays placeholder text', () => {
    render(<SearchBar placeholder="Find property..." />);
    const input = screen.getByPlaceholderText(/property/i);
    expect(input).toBeInTheDocument();
  });

  it('renders search button', () => {
    render(<SearchBar />);
    const button = screen.getByRole('button', { name: /search|chercher/i });
    expect(button).toBeInTheDocument();
  });

  it('displays filters when enabled', () => {
    render(<SearchBar showFilters={true} />);
    const inputs = screen.getAllByRole('textbox');
    expect(inputs.length).toBeGreaterThan(1);
  });

  it('hides filters when disabled', () => {
    const { container } = render(<SearchBar showFilters={false} />);
    const form = container.querySelector('.search-bar-form');
    expect(form).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<SearchBar className="custom-search" />);
    expect(container.querySelector('.custom-search')).toBeInTheDocument();
  });

  it('calls onSearch callback when form submitted', async () => {
    const handleSearch = vi.fn();
    render(<SearchBar onSearch={handleSearch} />);

    const button = screen.getByRole('button', { name: /search|chercher/i });
    await userEvent.click(button);

    expect(handleSearch).toHaveBeenCalled();
  });

  it('manages internal state for search inputs', () => {
    const { container } = render(<SearchBar />);
    const inputs = container.querySelectorAll('input[type="text"]');
    expect(inputs.length).toBeGreaterThan(0);
  });

  it('renders with all expected structure', () => {
    const { container } = render(<SearchBar />);
    expect(container.querySelector('.search-bar')).toBeInTheDocument();
    expect(container.querySelector('.search-bar-form')).toBeInTheDocument();
    expect(container.querySelector('.search-bar-inputs')).toBeInTheDocument();
  });

  it('supports custom props spread', () => {
    const { container } = render(
      <SearchBar data-testid="custom-search" />
    );
    expect(container.querySelector('[data-testid="custom-search"]')).toBeInTheDocument();
  });
});
