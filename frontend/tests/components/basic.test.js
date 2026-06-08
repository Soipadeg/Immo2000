/**
 * Component Tests - Simple examples for Phase 9
 * Testing basic component rendering and user interactions
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock component tests - these test component structure and interactions

describe('Basic Component Tests', () => {
  // ============================================================
  // Simple Button Component Test
  // ============================================================

  test('renders a button with text', () => {
    const handleClick = jest.fn();

    const { container } = render(
      <button onClick={handleClick}>Click me</button>
    );

    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
  });

  test('button click fires callback', async () => {
    const handleClick = jest.fn();

    render(<button onClick={handleClick}>Click</button>);

    const button = screen.getByRole('button', { name: /click/i });
    fireEvent.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  // ============================================================
  // Form Component Test
  // ============================================================

  test('renders input field and captures text', async () => {
    const handleChange = jest.fn();

    const TestForm = () => (
      <input
        type="text"
        placeholder="Enter text"
        onChange={(e) => handleChange(e.target.value)}
      />
    );

    render(<TestForm />);

    const input = screen.getByPlaceholderText('Enter text');
    expect(input).toBeInTheDocument();

    await userEvent.type(input, 'Hello World');
    expect(input.value).toBe('Hello World');
  });

  test('form submission works', async () => {
    const handleSubmit = jest.fn();

    const TestForm = () => (
      <form onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}>
        <input type="text" defaultValue="test" />
        <button type="submit">Submit</button>
      </form>
    );

    render(<TestForm />);

    const submitButton = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(submitButton);

    expect(handleSubmit).toHaveBeenCalledTimes(1);
  });

  // ============================================================
  // List Component Test
  // ============================================================

  test('renders list with items', () => {
    const items = ['Item 1', 'Item 2', 'Item 3'];

    const TestList = () => (
      <ul>
        {items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    );

    render(<TestList />);

    items.forEach((item) => {
      expect(screen.getByText(item)).toBeInTheDocument();
    });
  });

  // ============================================================
  // Conditional Rendering Test
  // ============================================================

  test('shows/hides element based on condition', () => {
    const TestConditional = ({ show }) => (
      <div>
        {show ? <p>Visible</p> : <p>Hidden</p>}
      </div>
    );

    const { rerender } = render(<TestConditional show={true} />);
    expect(screen.getByText('Visible')).toBeInTheDocument();

    rerender(<TestConditional show={false} />);
    expect(screen.getByText('Hidden')).toBeInTheDocument();
  });

  // ============================================================
  // Async Loading Test
  // ============================================================

  test('handles async data loading', async () => {
    const AsyncComponent = () => {
      const [data, setData] = React.useState(null);
      const [loading, setLoading] = React.useState(true);

      React.useEffect(() => {
        setTimeout(() => {
          setData('Loaded data');
          setLoading(false);
        }, 100);
      }, []);

      return (
        <div>
          {loading ? <p>Loading...</p> : <p>{data}</p>}
        </div>
      );
    };

    render(<AsyncComponent />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Loaded data')).toBeInTheDocument();
    });

    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });
});
