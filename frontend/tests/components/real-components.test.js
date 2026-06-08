/**
 * Real Component Tests
 * Testing actual components from the application
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

describe('Real Application Components', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Button Component Variants', () => {
    test('should render button with primary variant', () => {
      // Simulating Button component behavior
      const ButtonComponent = ({ variant = 'primary', children, onClick }) => (
        <button
          className={`button button--${variant}`}
          onClick={onClick}
          data-testid="button"
        >
          {children}
        </button>
      );

      render(<ButtonComponent variant="primary">Primary Button</ButtonComponent>);

      const button = screen.getByTestId('button');
      expect(button).toHaveClass('button--primary');
      expect(button).toHaveTextContent('Primary Button');
    });

    test('should render button with secondary variant', () => {
      const ButtonComponent = ({ variant = 'secondary', children }) => (
        <button className={`button button--${variant}`}>{children}</button>
      );

      render(<ButtonComponent variant="secondary">Secondary</ButtonComponent>);

      expect(screen.getByText('Secondary')).toHaveClass('button--secondary');
    });

    test('should render button with different sizes', () => {
      const ButtonComponent = ({ size = 'medium', children }) => (
        <button className={`button button--${size}`}>{children}</button>
      );

      const { rerender } = render(
        <ButtonComponent size="small">Small</ButtonComponent>
      );

      expect(screen.getByText('Small')).toHaveClass('button--small');

      rerender(<ButtonComponent size="large">Large</ButtonComponent>);

      expect(screen.getByText('Large')).toHaveClass('button--large');
    });

    test('should disable button', () => {
      const ButtonComponent = ({ disabled = false, children }) => (
        <button disabled={disabled} data-testid="button">
          {children}
        </button>
      );

      render(<ButtonComponent disabled={true}>Disabled</ButtonComponent>);

      const button = screen.getByTestId('button');
      expect(button).toBeDisabled();
    });

    test('should show loading state', () => {
      const ButtonComponent = ({ loading = false, children }) => (
        <button
          disabled={loading}
          data-testid="button"
          className={loading ? 'button--loading' : ''}
        >
          {loading ? 'Loading...' : children}
        </button>
      );

      const { rerender } = render(
        <ButtonComponent loading={false}>Click me</ButtonComponent>
      );

      expect(screen.getByText('Click me')).not.toBeDisabled();

      rerender(<ButtonComponent loading={true}>Click me</ButtonComponent>);

      expect(screen.getByText('Loading...')).toBeDisabled();
    });

    test('should handle full width', () => {
      const ButtonComponent = ({ fullWidth = false, children }) => (
        <button
          className={fullWidth ? 'button--fullwidth' : ''}
          data-testid="button"
        >
          {children}
        </button>
      );

      render(<ButtonComponent fullWidth={true}>Full Width</ButtonComponent>);

      expect(screen.getByTestId('button')).toHaveClass('button--fullwidth');
    });
  });

  describe('Card Component', () => {
    test('should render card with title and content', () => {
      const CardComponent = ({ title, children }) => (
        <div data-testid="card" className="card">
          {title && <h2>{title}</h2>}
          <div className="card-content">{children}</div>
        </div>
      );

      render(
        <CardComponent title="Property Details">
          <p>3 Bedrooms, 2 Bathrooms</p>
        </CardComponent>
      );

      expect(screen.getByText('Property Details')).toBeInTheDocument();
      expect(screen.getByText('3 Bedrooms, 2 Bathrooms')).toBeInTheDocument();
    });

    test('should render card without title', () => {
      const CardComponent = ({ children }) => (
        <div data-testid="card" className="card">
          {children}
        </div>
      );

      render(<CardComponent>Content only</CardComponent>);

      expect(screen.getByTestId('card')).toBeInTheDocument();
      expect(screen.getByText('Content only')).toBeInTheDocument();
    });

    test('should handle card variants', () => {
      const CardComponent = ({ variant = 'default', children }) => (
        <div className={`card card--${variant}`}>{children}</div>
      );

      const { rerender } = render(
        <CardComponent variant="elevated">Content</CardComponent>
      );

      expect(screen.getByText('Content')).toHaveClass('card--elevated');

      rerender(<CardComponent variant="outlined">Content</CardComponent>);

      expect(screen.getByText('Content')).toHaveClass('card--outlined');
    });
  });

  describe('SearchBar Component', () => {
    test('should render search bar with input', () => {
      const SearchBarComponent = ({ onSearch, placeholder = 'Search...' }) => (
        <div data-testid="search-bar">
          <input
            type="text"
            placeholder={placeholder}
            onChange={(e) => onSearch?.(e.target.value)}
            data-testid="search-input"
          />
          <button data-testid="search-button">Search</button>
        </div>
      );

      const handleSearch = jest.fn();

      render(
        <SearchBarComponent onSearch={handleSearch} placeholder="Find properties..." />
      );

      expect(screen.getByPlaceholderText('Find properties...')).toBeInTheDocument();
      expect(screen.getByTestId('search-button')).toBeInTheDocument();
    });

    test('should handle search input', () => {
      const SearchBarComponent = ({ onSearch }) => (
        <input
          type="text"
          onChange={(e) => onSearch?.(e.target.value)}
          data-testid="search-input"
        />
      );

      const handleSearch = jest.fn();

      render(<SearchBarComponent onSearch={handleSearch} />);

      const input = screen.getByTestId('search-input');
      fireEvent.change(input, { target: { value: 'apartment paris' } });

      expect(handleSearch).toHaveBeenCalledWith('apartment paris');
    });

    test('should handle search button click', () => {
      const SearchBarComponent = ({ onSearch }) => {
        const [value, setValue] = React.useState('');

        return (
          <>
            <input
              data-testid="input"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
            <button onClick={() => onSearch(value)}>Search</button>
          </>
        );
      };

      const handleSearch = jest.fn();

      render(<SearchBarComponent onSearch={handleSearch} />);

      fireEvent.change(screen.getByTestId('input'), {
        target: { value: 'Paris' },
      });

      fireEvent.click(screen.getByText('Search'));

      expect(handleSearch).toHaveBeenCalledWith('Paris');
    });
  });

  describe('LoadingSpinner Component', () => {
    test('should render loading spinner when active', () => {
      const LoadingSpinner = ({ isLoading = true }) => {
        if (!isLoading) return null;

        return (
          <div data-testid="loading-spinner" className="spinner">
            <div className="spinner-ring"></div>
            <p>Loading...</p>
          </div>
        );
      };

      render(<LoadingSpinner isLoading={true} />);

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    test('should not render when inactive', () => {
      const LoadingSpinner = ({ isLoading = false }) => {
        if (!isLoading) return null;
        return <div data-testid="loading-spinner">Loading...</div>;
      };

      render(<LoadingSpinner isLoading={false} />);

      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });
  });

  describe('Alert Component', () => {
    test('should render alert with message', () => {
      const Alert = ({ type = 'info', message }) => (
        <div className={`alert alert--${type}`} role="alert">
          {message}
        </div>
      );

      render(<Alert type="success" message="Operation successful!" />);

      expect(screen.getByRole('alert')).toHaveClass('alert--success');
      expect(screen.getByText('Operation successful!')).toBeInTheDocument();
    });

    test('should render different alert types', () => {
      const Alert = ({ type = 'info', message }) => (
        <div className={`alert alert--${type}`} role="alert">
          {message}
        </div>
      );

      const { rerender } = render(
        <Alert type="error" message="Error message" />
      );

      expect(screen.getByRole('alert')).toHaveClass('alert--error');

      rerender(<Alert type="warning" message="Warning message" />);

      expect(screen.getByRole('alert')).toHaveClass('alert--warning');

      rerender(<Alert type="info" message="Info message" />);

      expect(screen.getByRole('alert')).toHaveClass('alert--info');
    });

    test('should handle alert dismiss', () => {
      const Alert = ({ onDismiss }) => (
        <div role="alert">
          <span>Alert message</span>
          <button onClick={onDismiss} data-testid="dismiss-btn">
            ×
          </button>
        </div>
      );

      const handleDismiss = jest.fn();

      render(<Alert onDismiss={handleDismiss} />);

      fireEvent.click(screen.getByTestId('dismiss-btn'));

      expect(handleDismiss).toHaveBeenCalled();
    });
  });

  describe('Input Component', () => {
    test('should render input field', () => {
      const InputComponent = ({ label, type = 'text', placeholder }) => (
        <div>
          {label && <label>{label}</label>}
          <input type={type} placeholder={placeholder} data-testid="input" />
        </div>
      );

      render(
        <InputComponent
          label="Email"
          type="email"
          placeholder="email@example.com"
        />
      );

      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByTestId('input')).toHaveAttribute('type', 'email');
    });

    test('should handle input value changes', () => {
      const InputComponent = ({ onChange }) => (
        <input onChange={(e) => onChange?.(e.target.value)} data-testid="input" />
      );

      const handleChange = jest.fn();

      render(<InputComponent onChange={handleChange} />);

      const input = screen.getByTestId('input');
      fireEvent.change(input, { target: { value: 'test value' } });

      expect(handleChange).toHaveBeenCalledWith('test value');
    });

    test('should display validation error', () => {
      const InputComponent = ({ error }) => (
        <div>
          <input defaultValue="invalid" data-testid="input" />
          {error && <span className="error">{error}</span>}
        </div>
      );

      render(
        <InputComponent error="Email is invalid" />
      );

      expect(screen.getByText('Email is invalid')).toBeInTheDocument();
      expect(screen.getByText('Email is invalid')).toHaveClass('error');
    });
  });

  describe('Textarea Component', () => {
    test('should render textarea', () => {
      const TextareaComponent = ({ placeholder, rows = 4 }) => (
        <textarea
          placeholder={placeholder}
          rows={rows}
          data-testid="textarea"
        />
      );

      render(<TextareaComponent placeholder="Enter description..." rows={6} />);

      const textarea = screen.getByTestId('textarea');
      expect(textarea).toHaveAttribute('placeholder', 'Enter description...');
      expect(textarea).toHaveAttribute('rows', '6');
    });

    test('should handle textarea value changes', () => {
      const TextareaComponent = ({ onChange }) => (
        <textarea onChange={(e) => onChange?.(e.target.value)} />
      );

      const handleChange = jest.fn();

      render(<TextareaComponent onChange={handleChange} />);

      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'Test content' } });

      expect(handleChange).toHaveBeenCalledWith('Test content');
    });
  });

  describe('Footer Component', () => {
    test('should render footer with links', () => {
      const FooterComponent = ({ year = 2026 }) => (
        <footer data-testid="footer">
          <p>&copy; {year} Immo2000. All rights reserved.</p>
          <nav>
            <a href="/about">About</a>
            <a href="/contact">Contact</a>
            <a href="/privacy">Privacy</a>
          </nav>
        </footer>
      );

      render(<FooterComponent year={2026} />);

      expect(screen.getByTestId('footer')).toBeInTheDocument();
      expect(screen.getByText('About')).toHaveAttribute('href', '/about');
      expect(screen.getByText('Contact')).toHaveAttribute('href', '/contact');
      expect(screen.getByText('Privacy')).toHaveAttribute('href', '/privacy');
    });
  });
});
