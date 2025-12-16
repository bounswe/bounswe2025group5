import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import ReportAlarmButton from './ReportAlarmButton';

describe('ReportAlarmButton', () => {
  it('renders with default props', () => {
    render(<ReportAlarmButton />);
    const button = screen.getByRole('button', { name: /report content/i });
    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled();
  });

  it('renders with custom aria-label and title', () => {
    render(<ReportAlarmButton aria-label="Custom Label" title="Custom Title" />);
    const button = screen.getByRole('button', { name: /custom label/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('title', 'Custom Title');
  });

  it('handles click events', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(<ReportAlarmButton onClick={onClick} />);
    
    const button = screen.getByRole('button');
    await user.click(button);
    
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('can be disabled', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(<ReportAlarmButton disabled onClick={onClick} />);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    
    await user.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('applies custom className', () => {
    render(<ReportAlarmButton className="custom-class" />);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
  });

  it('renders small size correctly', () => {
    render(<ReportAlarmButton size="sm" />);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('h-8', 'w-8');
  });
});
