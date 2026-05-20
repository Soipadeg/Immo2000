/**
 * Tests - Alert Component
 * Alert notifications with different severity levels
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Alert from '@/components/Alert/Alert';

describe('Alert Component', () => {
  it('does not render when isOpen is false', () => {
    const { container } = render(<Alert isOpen={false} type="success">Success message</Alert>);
    expect(container.firstChild).toBeNull();
  });

  it('renders success alert by default when isOpen', () => {
    render(<Alert isOpen={true} type="success">Success message</Alert>);
    expect(screen.getByText('Success message')).toBeInTheDocument();
  });

  it('renders error alert', () => {
    render(<Alert isOpen={true} type="error">Error message</Alert>);
    expect(screen.getByText('Error message')).toBeInTheDocument();
  });

  it('renders warning alert', () => {
    render(<Alert isOpen={true} type="warning">Warning message</Alert>);
    expect(screen.getByText('Warning message')).toBeInTheDocument();
  });

  it('renders info alert', () => {
    render(<Alert isOpen={true} type="info">Info message</Alert>);
    expect(screen.getByText('Info message')).toBeInTheDocument();
  });

  it('renders with title and message', () => {
    render(
      <Alert isOpen={true} type="success" title="Success" message="Operation completed" />
    );
    expect(screen.getByText('Success')).toBeInTheDocument();
    expect(screen.getByText('Operation completed')).toBeInTheDocument();
  });

  it('renders close button when dismissible is true', () => {
    render(
      <Alert isOpen={true} type="success" dismissible={true}>
        Message
      </Alert>
    );
    const closeButton = screen.getByRole('button');
    expect(closeButton).toBeInTheDocument();
  });

  it('calls onClose when close button clicked', async () => {
    const handleClose = vi.fn();
    render(
      <Alert isOpen={true} type="success" dismissible={true} onClose={handleClose}>
        Message
      </Alert>
    );
    const closeButton = screen.getByRole('button');
    await userEvent.click(closeButton);
    expect(handleClose).toHaveBeenCalledOnce();
  });

  it('auto-dismisses after specified duration', async () => {
    const handleClose = vi.fn();
    render(
      <Alert
        isOpen={true}
        type="success"
        autoDismiss={true}
        duration={100}
        onClose={handleClose}
      >
        Message
      </Alert>
    );

    await waitFor(() => {
      expect(handleClose).toHaveBeenCalledOnce();
    }, { timeout: 200 });
  });

  it('accepts custom className', () => {
    const { container } = render(
      <Alert isOpen={true} type="success" className="custom-alert">
        Message
      </Alert>
    );
    const alert = container.querySelector('.custom-alert');
    expect(alert).toBeInTheDocument();
  });
});
