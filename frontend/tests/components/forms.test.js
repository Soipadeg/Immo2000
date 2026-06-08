/**
 * Form Component Tests
 * Testing form rendering, validation, and submission
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

describe('Form Component Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should render login form', () => {
    const LoginForm = () => (
      <form data-testid="login-form">
        <div>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            placeholder="your@email.com"
            data-testid="email-input"
          />
        </div>
        <div>
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            placeholder="Password"
            data-testid="password-input"
          />
        </div>
        <button type="submit">Login</button>
      </form>
    );

    render(<LoginForm />);

    expect(screen.getByTestId('login-form')).toBeInTheDocument();
    expect(screen.getByTestId('email-input')).toBeInTheDocument();
    expect(screen.getByTestId('password-input')).toBeInTheDocument();
    expect(screen.getByText('Login')).toBeInTheDocument();
  });

  test('should validate email input', () => {
    const EmailInput = () => {
      const [email, setEmail] = React.useState('');
      const [error, setError] = React.useState('');

      const handleChange = (e) => {
        const value = e.target.value;
        setEmail(value);

        if (value && !value.includes('@')) {
          setError('Invalid email');
        } else {
          setError('');
        }
      };

      return (
        <div>
          <input
            data-testid="email-input"
            value={email}
            onChange={handleChange}
            type="email"
          />
          {error && <span data-testid="error">{error}</span>}
        </div>
      );
    };

    render(<EmailInput />);

    const input = screen.getByTestId('email-input');
    fireEvent.change(input, { target: { value: 'invalid' } });

    expect(screen.getByTestId('error')).toBeInTheDocument();
    expect(screen.getByText('Invalid email')).toBeInTheDocument();
  });

  test('should submit form with data', () => {
    const handleSubmit = jest.fn();

    const ContactForm = ({ onSubmit }) => {
      const [formData, setFormData] = React.useState({
        name: '',
        email: '',
        message: '',
      });

      const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
      };

      const handleFormSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
      };

      return (
        <form onSubmit={handleFormSubmit} data-testid="contact-form">
          <input
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Name"
            data-testid="name-input"
          />
          <input
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Email"
            data-testid="email-input"
          />
          <textarea
            name="message"
            value={formData.message}
            onChange={handleChange}
            placeholder="Message"
            data-testid="message-input"
          />
          <button type="submit">Send</button>
        </form>
      );
    };

    render(<ContactForm onSubmit={handleSubmit} />);

    fireEvent.change(screen.getByTestId('name-input'), {
      target: { value: 'John Doe' },
    });
    fireEvent.change(screen.getByTestId('email-input'), {
      target: { value: 'john@example.com' },
    });
    fireEvent.change(screen.getByTestId('message-input'), {
      target: { value: 'Hello!' },
    });

    fireEvent.click(screen.getByText('Send'));

    expect(handleSubmit).toHaveBeenCalledWith({
      name: 'John Doe',
      email: 'john@example.com',
      message: 'Hello!',
    });
  });

  test('should disable submit button while loading', () => {
    const SubmitForm = () => {
      const [loading, setLoading] = React.useState(false);

      const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        await new Promise((r) => setTimeout(r, 100));
        setLoading(false);
      };

      return (
        <form onSubmit={handleSubmit}>
          <button type="submit" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit'}
          </button>
        </form>
      );
    };

    render(<SubmitForm />);

    const button = screen.getByText('Submit');
    expect(button).not.toBeDisabled();

    fireEvent.click(button);

    expect(screen.getByText('Submitting...')).toBeDisabled();
  });

  test('should handle form field errors', () => {
    const FormWithErrors = () => {
      const [formData, setFormData] = React.useState({ name: '', email: '' });
      const [errors, setErrors] = React.useState({});

      const handleSubmit = (e) => {
        e.preventDefault();
        const newErrors = {};

        if (!formData.name) {
          newErrors.name = 'Name is required';
        }
        if (!formData.email) {
          newErrors.email = 'Email is required';
        }

        setErrors(newErrors);
      };

      return (
        <form onSubmit={handleSubmit} data-testid="form">
          <div>
            <input
              name="name"
              placeholder="Name"
              data-testid="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            {errors.name && (
              <span data-testid="name-error">{errors.name}</span>
            )}
          </div>
          <div>
            <input
              name="email"
              placeholder="Email"
              data-testid="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            {errors.email && (
              <span data-testid="email-error">{errors.email}</span>
            )}
          </div>
          <button type="submit">Submit</button>
        </form>
      );
    };

    render(<FormWithErrors />);

    fireEvent.click(screen.getByText('Submit'));

    expect(screen.getByTestId('name-error')).toBeInTheDocument();
    expect(screen.getByTestId('email-error')).toBeInTheDocument();
  });

  test('should handle form reset', () => {
    const ResetForm = () => {
      const [value, setValue] = React.useState('');

      return (
        <form
          onReset={() => setValue('')}
          data-testid="reset-form"
        >
          <input
            data-testid="input"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
          <button type="reset">Reset</button>
        </form>
      );
    };

    render(<ResetForm />);

    const input = screen.getByTestId('input');
    fireEvent.change(input, { target: { value: 'test' } });
    expect(input.value).toBe('test');

    fireEvent.click(screen.getByText('Reset'));
    expect(input.value).toBe('');
  });

  test('should handle multi-step form', () => {
    const MultiStepForm = () => {
      const [step, setStep] = React.useState(1);

      return (
        <div>
          {step === 1 && (
            <div data-testid="step-1">
              <p>Step 1: Personal Info</p>
              <button onClick={() => setStep(2)}>Next</button>
            </div>
          )}
          {step === 2 && (
            <div data-testid="step-2">
              <p>Step 2: Address</p>
              <button onClick={() => setStep(1)}>Back</button>
              <button onClick={() => setStep(3)}>Next</button>
            </div>
          )}
          {step === 3 && (
            <div data-testid="step-3">
              <p>Step 3: Confirm</p>
              <button onClick={() => setStep(2)}>Back</button>
              <button>Submit</button>
            </div>
          )}
        </div>
      );
    };

    render(<MultiStepForm />);

    expect(screen.getByTestId('step-1')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Next'));
    expect(screen.getByTestId('step-2')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Back'));
    expect(screen.getByTestId('step-1')).toBeInTheDocument();
  });
});
