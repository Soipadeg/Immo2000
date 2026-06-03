/**
 * Tests - Modal Component
 * Accessible modal dialog with overlay
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Modal from '@/components/Modal/Modal';

describe('Modal Component', () => {
  it('renders nothing when not open', () => {
    const { container } = render(
      <Modal isOpen={false} onClose={vi.fn()}>
        Modal content
      </Modal>
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders modal when open', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()}>
        Modal content
      </Modal>
    );
    expect(screen.getByText('Modal content')).toBeInTheDocument();
  });

  it('renders with title', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} title="Modal Title">
        Modal content
      </Modal>
    );
    expect(screen.getByText('Modal Title')).toBeInTheDocument();
  });

  it('calls onClose when close button clicked', async () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} closeButton>
        Modal content
      </Modal>
    );
    const closeButton = screen.getByLabelText('Close modal');
    await userEvent.click(closeButton);
    expect(handleClose).toHaveBeenCalledOnce();
  });

  it('renders footer when provided', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} footer={<button>Save</button>}>
        Modal content
      </Modal>
    );
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });

  it('renders modal with children', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()}>
        <div>Test paragraph</div>
      </Modal>
    );
    expect(screen.getByText('Test paragraph')).toBeInTheDocument();
  });
});
