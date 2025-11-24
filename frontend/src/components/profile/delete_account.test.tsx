import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import DeleteAccount from '@/components/profile/delete_account';
import { UsersApi } from '@/lib/api/users';
import { clearTokens } from '@/lib/api/client';

const formatTemplate = (template: string, vars?: Record<string, unknown>) =>
  template.replace(/\{\{?\s*(\w+)\s*\}?\}/g, (_, token) => String(vars?.[token] ?? ''));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultValueOrOptions?: unknown, maybeOptions?: Record<string, unknown>) => {
      const options =
        typeof defaultValueOrOptions === 'object' && defaultValueOrOptions !== null && !Array.isArray(defaultValueOrOptions)
          ? (defaultValueOrOptions as Record<string, unknown>)
          : maybeOptions;
      const defaultText =
        typeof defaultValueOrOptions === 'string'
          ? defaultValueOrOptions
          : typeof options?.defaultValue === 'string'
            ? options.defaultValue
            : undefined;
      return defaultText ? formatTemplate(defaultText, options) : key;
    },
  }),
}));

vi.mock('@/lib/api/users', () => ({
  UsersApi: {
    deleteAccount: vi.fn(),
  },
}));

vi.mock('@/lib/api/client', () => ({
  clearTokens: vi.fn(),
}));

const originalLocation = window.location;

beforeAll(() => {
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: {
      ...originalLocation,
      href: 'http://localhost/',
    },
  });
});

afterAll(() => {
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: originalLocation,
  });
});

describe('DeleteAccount', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    window.localStorage.setItem('username', 'demo-user');
  });

  it('submits password and clears session tokens', async () => {
    const user = userEvent.setup();
    vi.mocked(UsersApi.deleteAccount).mockResolvedValue({ deleted: true });

    render(<DeleteAccount />);

    await user.click(screen.getByRole('button', { name: 'profile.delete' }));

    const passwordInput = screen.getByPlaceholderText('Enter your password');
    await user.type(passwordInput, 'secret');
    await user.click(screen.getAllByRole('button', { name: 'profile.delete' })[1]);

    await waitFor(() =>
      expect(UsersApi.deleteAccount).toHaveBeenCalledWith('demo-user', 'secret')
    );

    expect(clearTokens).toHaveBeenCalled();
    expect(window.localStorage.getItem('username')).toBeNull();
    expect(window.location.href).toBe('/auth/login');
  });

  it('shows translated error when password is incorrect', async () => {
    const user = userEvent.setup();
    vi.mocked(UsersApi.deleteAccount).mockRejectedValue(new Error('Incorrect password'));

    render(<DeleteAccount />);

    await user.click(screen.getByRole('button', { name: 'profile.delete' }));
    const passwordInput = screen.getByPlaceholderText('Enter your password');
    await user.type(passwordInput, 'wrong');
    await user.click(screen.getAllByRole('button', { name: 'profile.delete' })[1]);

    await waitFor(() => expect(UsersApi.deleteAccount).toHaveBeenCalled());
    expect(clearTokens).not.toHaveBeenCalled();
    expect(screen.getByText('Incorrect password')).toBeInTheDocument();
  });
});

