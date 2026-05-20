/**
 * Tests - Core Components Integration
 * Validates that design system components work together
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Button from '@/components/Button/Button';
import Input from '@/components/Input/Input';
import Alert from '@/components/Alert/Alert';

describe('Components Integration', () => {
  it('renders form with Button and Input together', () => {
    render(
      <div>
        <Input label="Username" placeholder="Enter username" />
        <Button variant="primary">Submit</Button>
      </div>
    );

    expect(screen.getByPlaceholderText('Enter username')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
  });

  it('renders Alert and Button together for notifications', () => {
    render(
      <div>
        <Alert isOpen={true} type="success">
          Operation successful
        </Alert>
        <Button variant="secondary">Dismiss</Button>
      </div>
    );

    expect(screen.getByText('Operation successful')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /dismiss/i })).toBeInTheDocument();
  });

  it('renders multiple input variants', () => {
    render(
      <div>
        <Input label="Email" type="email" />
        <Input label="Password" type="password" />
        <Input label="Message" />
      </div>
    );

    const inputs = screen.getAllByRole('textbox');
    expect(inputs.length).toBeGreaterThanOrEqual(2);
  });

  it('renders alert with different severity levels', () => {
    render(
      <div>
        <Alert isOpen={true} type="success">Success</Alert>
        <Alert isOpen={true} type="error">Error</Alert>
        <Alert isOpen={true} type="warning">Warning</Alert>
        <Alert isOpen={true} type="info">Info</Alert>
      </div>
    );

    expect(screen.getByText('Success')).toBeInTheDocument();
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Warning')).toBeInTheDocument();
    expect(screen.getByText('Info')).toBeInTheDocument();
  });

  it('renders button with all variants', () => {
    render(
      <div>
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="danger">Danger</Button>
        <Button variant="ghost">Ghost</Button>
      </div>
    );

    expect(screen.getByRole('button', { name: /primary/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /secondary/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /danger/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ghost/i })).toBeInTheDocument();
  });
});
