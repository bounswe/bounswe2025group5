import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import PasswordStrengthMeter from './password-strength-meter';
import { usePasswordStrength } from '@/hooks/usePasswordStrength';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('@/hooks/usePasswordStrength', () => ({
  usePasswordStrength: vi.fn(),
}));

describe('PasswordStrengthMeter', () => {
  it('renders very weak strength correctly', () => {
    vi.mocked(usePasswordStrength).mockReturnValue({ score: 0, feedback: { warning: '', suggestions: [] } });
    render(<PasswordStrengthMeter password="123" />);
    
    expect(screen.getByText('common.passwordStrength.label')).toBeInTheDocument();
    expect(screen.getByText('common.passwordStrength.veryWeak')).toBeInTheDocument();
  });

  it('renders weak strength correctly', () => {
    vi.mocked(usePasswordStrength).mockReturnValue({ score: 1, feedback: { warning: '', suggestions: [] } });
    render(<PasswordStrengthMeter password="weak" />);
    
    expect(screen.getByText('common.passwordStrength.weak')).toBeInTheDocument();
  });

  it('renders fair strength correctly', () => {
    vi.mocked(usePasswordStrength).mockReturnValue({ score: 2, feedback: { warning: '', suggestions: [] } });
    render(<PasswordStrengthMeter password="fair" />);
    
    expect(screen.getByText('common.passwordStrength.fair')).toBeInTheDocument();
  });

  it('renders good strength correctly', () => {
    vi.mocked(usePasswordStrength).mockReturnValue({ score: 3, feedback: { warning: '', suggestions: [] } });
    render(<PasswordStrengthMeter password="good" />);
    
    expect(screen.getByText('common.passwordStrength.good')).toBeInTheDocument();
  });

  it('renders strong strength correctly', () => {
    vi.mocked(usePasswordStrength).mockReturnValue({ score: 4, feedback: { warning: '', suggestions: [] } });
    render(<PasswordStrengthMeter password="strong" />);
    
    expect(screen.getByText('common.passwordStrength.strong')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    vi.mocked(usePasswordStrength).mockReturnValue({ score: 2, feedback: { warning: '', suggestions: [] } });
    const { container } = render(<PasswordStrengthMeter password="test" className="custom-class" />);
    
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
