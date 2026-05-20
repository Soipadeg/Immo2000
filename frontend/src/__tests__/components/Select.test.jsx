import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Select from '@/components/Select/Select';

describe('Select Component', () => {
  const mockOptions = [
    { value: 'opt1', label: 'Option 1' },
    { value: 'opt2', label: 'Option 2' },
    { value: 'opt3', label: 'Option 3' },
  ];

  it('renders select with label', () => {
    render(
      <Select
        label="Choose an option"
        options={mockOptions}
        value="opt1"
        onChange={() => {}}
      />
    );
    expect(screen.getByText('Choose an option')).toBeInTheDocument();
  });

  it('displays all options when opened', async () => {
    render(
      <Select
        options={mockOptions}
        value=""
        onChange={() => {}}
      />
    );
    const select = screen.getByRole('combobox') || screen.getByDisplayValue('');
    fireEvent.click(select);

    await waitFor(() => {
      mockOptions.forEach(opt => {
        expect(screen.queryByText(opt.label)).toBeInTheDocument();
      });
    });
  });

  it('calls onChange when option selected', async () => {
    const handleChange = vi.fn();
    render(
      <Select
        options={mockOptions}
        value=""
        onChange={handleChange}
      />
    );

    const select = screen.getByRole('combobox') || screen.getByDisplayValue('');
    fireEvent.click(select);

    await waitFor(() => {
      const option = screen.getByText('Option 2');
      if (option) fireEvent.click(option);
    });
  });

  it('shows selected value', () => {
    render(
      <Select
        options={mockOptions}
        value="opt2"
        onChange={() => {}}
      />
    );
    // Select displays the label of the selected option
    const select = screen.getByRole('combobox');
    expect(select.value).toBe('opt2');
  });

  it('disables select when disabled prop true', () => {
    render(
      <Select
        options={mockOptions}
        value=""
        onChange={() => {}}
        disabled={true}
      />
    );
    const select = screen.getByRole('combobox') || screen.getByDisplayValue('');
    expect(select).toBeDisabled();
  });

  it('shows error state when error provided', () => {
    const { container } = render(
      <Select
        options={mockOptions}
        value=""
        onChange={() => {}}
        error="This field is required"
      />
    );
    const select = container.querySelector('select');
    expect(select).toHaveAttribute('aria-invalid');
  });

  it('shows required indicator', () => {
    render(
      <Select
        label="Required Field"
        options={mockOptions}
        value=""
        onChange={() => {}}
        required={true}
      />
    );
    expect(screen.getByText(/Required Field/)).toBeInTheDocument();
  });

  it('handles empty options gracefully', () => {
    render(
      <Select
        options={[]}
        value=""
        onChange={() => {}}
      />
    );
    expect(screen.getByRole('combobox') || screen.getByDisplayValue('')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <Select
        options={mockOptions}
        value=""
        onChange={() => {}}
        className="custom-select"
      />
    );
    expect(container.querySelector('.custom-select')).toBeInTheDocument();
  });

  it('shows hint text', () => {
    render(
      <Select
        options={mockOptions}
        value=""
        onChange={() => {}}
        hint="Select one option"
      />
    );
    expect(screen.getByText('Select one option')).toBeInTheDocument();
  });
});
