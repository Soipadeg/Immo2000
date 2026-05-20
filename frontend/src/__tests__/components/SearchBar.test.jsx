import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import SearchBar from '@/components/SearchBar/SearchBar';

describe('SearchBar Component', () => {
  it('renders search input', () => {
    render(
      <SearchBar
        value=""
        onChange={() => {}}
      />
    );
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('displays placeholder', () => {
    render(
      <SearchBar
        placeholder="Search items..."
        value=""
        onChange={() => {}}
      />
    );
    expect(screen.getByPlaceholderText('Search items...')).toBeInTheDocument();
  });

  it('calls onChange when input changes', () => {
    const handleChange = vi.fn();
    render(
      <SearchBar
        value=""
        onChange={handleChange}
      />
    );
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'test' } });
    expect(handleChange).toHaveBeenCalled();
  });

  it('displays current value', () => {
    render(
      <SearchBar
        value="search term"
        onChange={() => {}}
      />
    );
    expect(screen.getByDisplayValue('search term')).toBeInTheDocument();
  });

  it('calls onSearch when Enter pressed', () => {
    const handleSearch = vi.fn();
    render(
      <SearchBar
        value="query"
        onChange={() => {}}
        onSearch={handleSearch}
      />
    );
    const input = screen.getByRole('textbox');
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(handleSearch).toHaveBeenCalled();
  });

  it('disables input when disabled prop true', () => {
    render(
      <SearchBar
        value=""
        onChange={() => {}}
        disabled={true}
      />
    );
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('applies custom className', () => {
    const { container } = render(
      <SearchBar
        value=""
        onChange={() => {}}
        className="custom-search"
      />
    );
    expect(container.querySelector('.custom-search')).toBeInTheDocument();
  });

  it('displays icon when provided', () => {
    render(
      <SearchBar
        value=""
        onChange={() => {}}
        icon="🔍"
      />
    );
    expect(screen.getByText('🔍')).toBeInTheDocument();
  });

  it('handles empty search', () => {
    render(
      <SearchBar
        value=""
        onChange={() => {}}
      />
    );
    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('');
  });

  it('triggers onSearch with current value', () => {
    const handleSearch = vi.fn();
    render(
      <SearchBar
        value="search"
        onChange={() => {}}
        onSearch={handleSearch}
      />
    );
    const input = screen.getByRole('textbox');
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
    expect(handleSearch).toHaveBeenCalled();
  });
});
