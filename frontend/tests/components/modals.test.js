/**
 * Modal Component Tests
 * Testing modal rendering, interactions, and lifecycle
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

describe('Modal Component Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should render modal when open', () => {
    const Modal = ({ isOpen, onClose, title, children }) => {
      if (!isOpen) return null;

      return (
        <div data-testid="modal" role="dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{title}</h2>
              <button onClick={onClose} data-testid="close-btn">
                ×
              </button>
            </div>
            <div className="modal-body">{children}</div>
          </div>
        </div>
      );
    };

    const { rerender } = render(
      <Modal isOpen={false} onClose={jest.fn()} title="Test Modal">
        Content
      </Modal>
    );

    expect(screen.queryByTestId('modal')).not.toBeInTheDocument();

    rerender(
      <Modal isOpen={true} onClose={jest.fn()} title="Test Modal">
        Content
      </Modal>
    );

    expect(screen.getByTestId('modal')).toBeInTheDocument();
    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  test('should close modal when clicking close button', () => {
    const handleClose = jest.fn();

    const Modal = ({ isOpen, onClose }) => {
      if (!isOpen) return null;

      return (
        <div data-testid="modal">
          <button onClick={onClose} data-testid="close-btn">
            Close
          </button>
        </div>
      );
    };

    render(<Modal isOpen={true} onClose={handleClose} />);

    const closeBtn = screen.getByTestId('close-btn');
    fireEvent.click(closeBtn);

    expect(handleClose).toHaveBeenCalled();
  });

  test('should close modal when clicking outside', () => {
    const handleClose = jest.fn();

    const Modal = ({ isOpen, onClose }) => {
      if (!isOpen) return null;

      return (
        <div data-testid="modal-overlay" onClick={onClose}>
          <div data-testid="modal-content" onClick={(e) => e.stopPropagation()}>
            Content
          </div>
        </div>
      );
    };

    render(<Modal isOpen={true} onClose={handleClose} />);

    const overlay = screen.getByTestId('modal-overlay');
    fireEvent.click(overlay);

    expect(handleClose).toHaveBeenCalled();
  });

  test('should not close modal when clicking inside content', () => {
    const handleClose = jest.fn();

    const Modal = ({ isOpen, onClose }) => {
      if (!isOpen) return null;

      return (
        <div data-testid="modal-overlay" onClick={onClose}>
          <div data-testid="modal-content" onClick={(e) => e.stopPropagation()}>
            <button>Action</button>
          </div>
        </div>
      );
    };

    render(<Modal isOpen={true} onClose={handleClose} />);

    const content = screen.getByTestId('modal-content');
    fireEvent.click(content);

    expect(handleClose).not.toHaveBeenCalled();
  });

  test('should handle modal with form', () => {
    const handleSubmit = jest.fn();

    const FormModal = ({ isOpen, onClose, onSubmit }) => {
      const [input, setInput] = React.useState('');

      if (!isOpen) return null;

      return (
        <div data-testid="form-modal">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSubmit(input);
              setInput('');
            }}
          >
            <input
              data-testid="modal-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button type="submit">Submit</button>
            <button type="button" onClick={onClose}>
              Cancel
            </button>
          </form>
        </div>
      );
    };

    render(
      <FormModal
        isOpen={true}
        onClose={jest.fn()}
        onSubmit={handleSubmit}
      />
    );

    fireEvent.change(screen.getByTestId('modal-input'), {
      target: { value: 'test value' },
    });

    fireEvent.click(screen.getByText('Submit'));

    expect(handleSubmit).toHaveBeenCalledWith('test value');
  });

  test('should handle confirmation modal', () => {
    const handleConfirm = jest.fn();
    const handleCancel = jest.fn();

    const ConfirmModal = ({ isOpen, onConfirm, onCancel, message }) => {
      if (!isOpen) return null;

      return (
        <div data-testid="confirm-modal" role="alertdialog">
          <p>{message}</p>
          <button onClick={onConfirm} data-testid="confirm-btn">
            Confirm
          </button>
          <button onClick={onCancel} data-testid="cancel-btn">
            Cancel
          </button>
        </div>
      );
    };

    render(
      <ConfirmModal
        isOpen={true}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        message="Are you sure?"
      />
    );

    fireEvent.click(screen.getByTestId('confirm-btn'));
    expect(handleConfirm).toHaveBeenCalled();

    fireEvent.click(screen.getByTestId('cancel-btn'));
    expect(handleCancel).toHaveBeenCalled();
  });

  test('should handle modal with loading state', async () => {
    const ModalWithLoading = ({ isOpen }) => {
      const [loading, setLoading] = React.useState(false);

      const handleAction = async () => {
        setLoading(true);
        await new Promise((r) => setTimeout(r, 100));
        setLoading(false);
      };

      if (!isOpen) return null;

      return (
        <div data-testid="loading-modal">
          <button
            onClick={handleAction}
            disabled={loading}
            data-testid="action-btn"
          >
            {loading ? 'Loading...' : 'Action'}
          </button>
        </div>
      );
    };

    render(<ModalWithLoading isOpen={true} />);

    const button = screen.getByTestId('action-btn');
    expect(button).toHaveTextContent('Action');
    expect(button).not.toBeDisabled();

    fireEvent.click(button);

    await waitFor(() => {
      expect(button).toHaveTextContent('Loading...');
      expect(button).toBeDisabled();
    });

    await waitFor(() => {
      expect(button).toHaveTextContent('Action');
      expect(button).not.toBeDisabled();
    });
  });

  test('should handle nested modals', () => {
    const ParentModal = () => {
      const [parent, setParent] = React.useState(true);
      const [child, setChild] = React.useState(false);

      return (
        <>
          {parent && (
            <div data-testid="parent-modal">
              <p>Parent Modal</p>
              <button onClick={() => setChild(true)}>Open Child</button>
              <button onClick={() => setParent(false)}>Close</button>
            </div>
          )}
          {child && (
            <div data-testid="child-modal">
              <p>Child Modal</p>
              <button onClick={() => setChild(false)}>Close Child</button>
            </div>
          )}
        </>
      );
    };

    render(<ParentModal />);

    expect(screen.getByTestId('parent-modal')).toBeInTheDocument();
    expect(screen.queryByTestId('child-modal')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('Open Child'));

    expect(screen.getByTestId('parent-modal')).toBeInTheDocument();
    expect(screen.getByTestId('child-modal')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Close Child'));

    expect(screen.getByTestId('parent-modal')).toBeInTheDocument();
    expect(screen.queryByTestId('child-modal')).not.toBeInTheDocument();
  });

  test('should handle modal animation states', () => {
    const AnimatedModal = ({ isOpen }) => {
      const [shouldRender, setShouldRender] = React.useState(isOpen);
      const [isVisible, setIsVisible] = React.useState(isOpen);

      React.useEffect(() => {
        if (isOpen) {
          setShouldRender(true);
          setIsVisible(true);
        } else {
          setIsVisible(false);
        }
      }, [isOpen]);

      if (!shouldRender) return null;

      return (
        <div
          data-testid="animated-modal"
          style={{ opacity: isVisible ? 1 : 0 }}
        >
          Modal Content
        </div>
      );
    };

    const { rerender } = render(<AnimatedModal isOpen={true} />);

    expect(screen.getByTestId('animated-modal')).toBeInTheDocument();

    rerender(<AnimatedModal isOpen={false} />);

    expect(screen.getByTestId('animated-modal')).toHaveStyle('opacity: 0');
  });
});
