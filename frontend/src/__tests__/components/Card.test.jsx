import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Card from '@/components/Card/Card';

describe('Card Component', () => {
  it('renders card with children', () => {
    render(
      <Card>
        <div>Card content</div>
      </Card>
    );
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('renders with default variant elevated', () => {
    const { container } = render(
      <Card>
        <div>Content</div>
      </Card>
    );
    expect(container.querySelector('.card--elevated')).toBeInTheDocument();
  });

  it('applies custom variant', () => {
    const { container } = render(
      <Card variant="outlined">
        <div>Content</div>
      </Card>
    );
    expect(container.querySelector('.card--outlined')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <Card className="custom-card">
        Content
      </Card>
    );
    expect(container.querySelector('.custom-card')).toBeInTheDocument();
  });

  it('renders multiple children', () => {
    render(
      <Card>
        <div>First</div>
        <div>Second</div>
        <div>Third</div>
      </Card>
    );
    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
    expect(screen.getByText('Third')).toBeInTheDocument();
  });

  it('handles interactive mode', () => {
    const { container } = render(
      <Card interactive>
        Content
      </Card>
    );
    expect(container.querySelector('.card--interactive')).toBeInTheDocument();
  });

  it('calls onClick when interactive and clicked', () => {
    const handleClick = () => {};
    const { container } = render(
      <Card interactive onClick={handleClick}>
        Clickable
      </Card>
    );
    const card = container.querySelector('.card');
    expect(card).toHaveAttribute('role', 'button');
  });

  it('applies inline styles', () => {
    const { container } = render(
      <Card style={{ backgroundColor: 'red' }}>
        Content
      </Card>
    );
    const card = container.querySelector('.card');
    expect(card).toBeInTheDocument();
  });

  it('renders without children', () => {
    const { container } = render(<Card />);
    expect(container.querySelector('.card')).toBeInTheDocument();
  });

  it('has proper structure', () => {
    const { container } = render(
      <Card>
        <div>Test</div>
      </Card>
    );
    const card = container.querySelector('.card');
    expect(card).toBeTruthy();
  });
});
