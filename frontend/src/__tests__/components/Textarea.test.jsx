import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Textarea from '@/components/Textarea/Textarea';

describe('Textarea Component', () => {
  it('renders textarea with label', () => {
    render(
      <Textarea
        label="Message"
        value=""
        onChange={() => {}}
      />
    );
    expect(screen.getByText('Message')).toBeInTheDocument();
  });

  it('displays placeholder text', () => {
    render(
      <Textarea
        placeholder="Enter your message"
        value=""
        onChange={() => {}}
      />
    );
    expect(screen.getByPlaceholderText('Enter your message')).toBeInTheDocument();
  });

  it('calls onChange handler', () => {
    const handleChange = vi.fn();
    const { container } = render(
      <Textarea
        value=""
        onChange={handleChange}
      />
    );
    const textarea = container.querySelector('textarea');
    fireEvent.change(textarea, { target: { value: 'test' } });
    expect(handleChange).toHaveBeenCalled();
  });

  it('displays current value', () => {
    render(
      <Textarea
        value="Hello World"
        onChange={() => {}}
      />
    );
    expect(screen.getByDisplayValue('Hello World')).toBeInTheDocument();
  });

  it('shows error state with message', () => {
    render(
      <Textarea
        value=""
        onChange={() => {}}
        error={true}
        errorMessage="This field is required"
      />
    );
    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });

  it('disables textarea when disabled prop true', () => {
    const { container } = render(
      <Textarea
        value=""
        onChange={() => {}}
        disabled={true}
      />
    );
    expect(container.querySelector('textarea')).toBeDisabled();
  });

  it('shows required indicator', () => {
    render(
      <Textarea
        label="Required Field"
        value=""
        onChange={() => {}}
        required={true}
      />
    );
    expect(screen.getByText(/Required Field/)).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <Textarea
        value=""
        onChange={() => {}}
        className="custom-textarea"
      />
    );
    expect(container.querySelector('.custom-textarea')).toBeInTheDocument();
  });

  it('shows hint text', () => {
    render(
      <Textarea
        value=""
        onChange={() => {}}
        hint="Maximum 500 characters"
      />
    );
    expect(screen.getByText('Maximum 500 characters')).toBeInTheDocument();
  });

  it('handles rows prop', () => {
    const { container } = render(
      <Textarea
        value=""
        onChange={() => {}}
        rows={5}
      />
    );
    expect(container.querySelector('textarea')).toHaveAttribute('rows', '5');
  });
});
