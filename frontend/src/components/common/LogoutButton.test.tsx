import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LogoutButton from './LogoutButton';
import { clearTokens } from '@/lib/api/client';
import { useNavigate } from 'react-router-dom';

vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, defaultValue: string) => defaultValue,
  }),
}));

vi.mock('@/lib/api/client', () => ({
  clearTokens: vi.fn(),
}));

describe('LogoutButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders nothing if not authenticated', () => {
    render(<LogoutButton />);
    expect(screen.queryByRole('button', { name: 'Logout' })).not.toBeInTheDocument();
  });

  it('renders button if authenticated', () => {
    localStorage.setItem('authToken', 'token');
    render(<LogoutButton />);
    expect(screen.getByRole('button', { name: 'Logout' })).toBeInTheDocument();
  });

  it('opens dialog and logs out on confirm', async () => {
    localStorage.setItem('authToken', 'token');
    const navigate = vi.fn();
    vi.mocked(useNavigate).mockReturnValue(navigate);
    const user = userEvent.setup();

    render(<LogoutButton />);
    
    await user.click(screen.getByRole('button', { name: 'Logout' }));

    expect(screen.getByText('Confirm Logout')).toBeInTheDocument();

    // The dialog should be open now.
    // We look for the "Logout" button inside the dialog.
    // Since there are two "Logout" buttons (trigger and confirm), we need to pick the right one.
    // The confirm button is usually the last one rendered or we can find it by context.
    const buttons = screen.getAllByRole('button', { name: 'Logout' });
    const confirmButton = buttons[buttons.length - 1];
    
    await user.click(confirmButton);

    expect(clearTokens).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith('/auth/login', { replace: true });
  });

  it('closes dialog on cancel', async () => {
    localStorage.setItem('authToken', 'token');
    const user = userEvent.setup();

    render(<LogoutButton />);
    
    await user.click(screen.getByRole('button', { name: 'Logout' }));

    expect(screen.getByText('Confirm Logout')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByText('Confirm Logout')).not.toBeInTheDocument();
    expect(clearTokens).not.toHaveBeenCalled();
  });
});
