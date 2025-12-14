import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import * as React from 'react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import EditProfile from '@/components/profile/edit_profile';
import { UsersApi } from '@/lib/api/users';
import { AuthApi } from '@/lib/api/auth';

const formatTemplate = (template: string, vars?: Record<string, unknown>) =>
  template.replace(/\{\{?\s*(\w+)\s*\}?\}/g, (_, token) => String(vars?.[token] ?? ''));

// i18n mock
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultValueOrOptions?: unknown, maybeOptions?: Record<string, unknown>) => {
      const options =
        typeof defaultValueOrOptions === 'object' &&
        defaultValueOrOptions !== null &&
        !Array.isArray(defaultValueOrOptions)
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

vi.mock('@/components/ui/popover', () => ({
  Popover: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PopoverTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  PopoverContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Users API mock
vi.mock('@/lib/api/users', () => ({
  UsersApi: {
    updateProfile: vi.fn(),
    uploadProfilePhoto: vi.fn(),
  },
}));

vi.mock('@/lib/api/auth', () => ({
  AuthApi: {
    resetPassword: vi.fn(),
  },
}));

vi.mock('@/hooks/usePasswordStrength', () => ({
  usePasswordStrength: (password: string) => ({
    score: password ? 4 : 0,
    isStrong: Boolean(password),
    feedback: undefined,
  }),
}));

describe('EditProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updates biography and notifies parent', async () => {
    const user = userEvent.setup();
    const onBioSaved = vi.fn();
    vi.mocked(UsersApi.updateProfile).mockResolvedValue({
      username: 'demo',
      biography: 'Updated bio',
      followerCount: 0,
      followingCount: 0,
      photoUrl: null,
    });

    render(
      <EditProfile username="demo" initialBio="Hello" initialPhotoUrl={null} onBioSaved={onBioSaved} />
    );

    await user.click(screen.getByRole('button', { name: 'profile.edit' }));

    const bioInput = screen.getByPlaceholderText('Tell us about yourself') as HTMLInputElement;
    await user.clear(bioInput);
    await user.type(bioInput, 'Updated bio');

    await user.click(screen.getByRole('button', { name: 'profile.save' }));

    await waitFor(() =>
      expect(UsersApi.updateProfile).toHaveBeenCalledWith('demo', 'Updated bio')
    );
    expect(onBioSaved).toHaveBeenCalledWith('Updated bio');
  });

  it('uploads a new profile photo', async () => {
    vi.mocked(UsersApi.uploadProfilePhoto).mockResolvedValue({
      username: 'demo',
      biography: null,
      followerCount: 0,
      followingCount: 0,
      photoUrl: 'https://example.com/avatar.png',
    });
    const onPhotoSaved = vi.fn();

    const { container } = render(
      <EditProfile username="demo" initialBio="" initialPhotoUrl={null} onPhotoSaved={onPhotoSaved} />
    );

    await userEvent.click(screen.getByRole('button', { name: 'profile.edit' }));

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['avatar'], 'avatar.png', { type: 'image/png' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() =>
      expect(UsersApi.uploadProfilePhoto).toHaveBeenCalledWith('demo', file)
    );
    expect(onPhotoSaved).toHaveBeenCalledWith('https://example.com/avatar.png');
  });

  it('shows validation error when new password is too short', async () => {
    const user = userEvent.setup();
    render(<EditProfile username="demo" initialBio="" initialPhotoUrl={null} />);

    await user.click(screen.getByRole('button', { name: 'profile.edit' }));
    await user.click(screen.getByRole('tab', { name: /reset password/i }));

    await user.type(screen.getByLabelText(/current password/i), 'oldpass');
    await user.type(screen.getByLabelText(/^new password$/i), '123');
    await user.type(screen.getByLabelText(/confirm new password/i), '123');

    await user.click(screen.getByRole('button', { name: /update password/i }));

    expect(AuthApi.resetPassword).not.toHaveBeenCalled();
    expect(
      await screen.findByText(/password must be at least 8 characters/i)
    ).toBeInTheDocument();
  });

  it('submits reset password and shows success', async () => {
    const user = userEvent.setup();
    vi.mocked(AuthApi.resetPassword).mockResolvedValue({ success: true });

    render(<EditProfile username="demo" initialBio="" initialPhotoUrl={null} />);

    await user.click(screen.getByRole('button', { name: 'profile.edit' }));
    await user.click(screen.getByRole('tab', { name: /reset password/i }));

    await user.type(screen.getByLabelText(/current password/i), 'OldPass!123');
    await user.type(screen.getByLabelText(/^new password$/i), 'NewPass!123');
    await user.type(screen.getByLabelText(/confirm new password/i), 'NewPass!123');

    await user.click(screen.getByRole('button', { name: /update password/i }));

    await waitFor(() =>
      expect(AuthApi.resetPassword).toHaveBeenCalledWith('demo', 'OldPass!123', 'NewPass!123')
    );
    expect(screen.getByText('Password updated successfully.')).toBeInTheDocument();
    expect(screen.getByLabelText(/^new password$/i)).toHaveValue('');
    expect(screen.getByLabelText(/confirm new password/i)).toHaveValue('');
  });

  it('shows backend error when reset password fails', async () => {
    const user = userEvent.setup();
    vi.mocked(AuthApi.resetPassword).mockRejectedValue(new Error('Current password is incorrect'));

    render(<EditProfile username="demo" initialBio="" initialPhotoUrl={null} />);

    await user.click(screen.getByRole('button', { name: 'profile.edit' }));
    await user.click(screen.getByRole('tab', { name: /reset password/i }));

    await user.type(screen.getByLabelText(/current password/i), 'wrong');
    await user.type(screen.getByLabelText(/^new password$/i), 'NewPass!123');
    await user.type(screen.getByLabelText(/confirm new password/i), 'NewPass!123');

    await user.click(screen.getByRole('button', { name: /update password/i }));

    await waitFor(() =>
      expect(AuthApi.resetPassword).toHaveBeenCalledWith('demo', 'wrong', 'NewPass!123')
    );
    expect(
      screen.getByText('Current password is incorrect')
    ).toBeInTheDocument();
  });
});
