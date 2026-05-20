/**
 * Tests - Input Component
 * Text input with label, error state, and icon support
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Input from '@/components/Input/Input';

describe('Input Component', () => {
  it('renders input field', () => {
    render(<Input type="text" />);
    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
  });

  it('renders with label', () => {
    render(<Input label="Email" type="email" />);
    const label = screen.getByText('Email');
    expect(label).toBeInTheDocument();
  });

  it('renders required indicator', () => {
    render(<Input label="Username" required />);
    const required = screen.getByText('*');
    expect(required).toBeInTheDocument();
  });

  it('updates value on change', async () => {
    const handleChange = vi.fn();
    render(<Input type="text" onChange={handleChange} />);
    const input = screen.getByRole('textbox');

    await userEvent.type(input, 'test');
    expect(handleChange).toHaveBeenCalled();
  });

  it('displays error message', () => {
    render(<Input error errorMessage="This field is required" />);
    const error = screen.getByText('This field is required');
    expect(error).toBeInTheDocument();
  });

  it('displays hint text', () => {
    render(<Input hint="Enter a valid email" />);
    const hint = screen.getByText('Enter a valid email');
    expect(hint).toBeInTheDocument();
  });

  it('renders disabled input', () => {
    render(<Input disabled placeholder="Disabled input" />);
    const input = screen.getByPlaceholderText('Disabled input');
    expect(input).toBeDisabled();
  });

  it('renders with placeholder', () => {
    render(<Input placeholder="Enter text here" />);
    const input = screen.getByPlaceholderText('Enter text here');
    expect(input).toBeInTheDocument();
  });

  it('renders with custom className', () => {
    const { container } = render(<Input className="custom-input" />);
    const wrapper = container.querySelector('.input-wrapper.custom-input');
    expect(wrapper).toBeInTheDocument();
  });

  it('supports different input types', () => {
    const { rerender } = render(<Input type="email" />);
    let input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('type', 'email');

    rerender(<Input type="text" placeholder="text input" />);
    input = screen.getByPlaceholderText('text input');
    expect(input).toHaveAttribute('type', 'text');
  });
});
