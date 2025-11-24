import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import EditProfile from '@/components/profile/edit_profile';
import { UsersApi } from '@/lib/api/users';

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
    updateProfile: vi.fn(),
    uploadProfilePhoto: vi.fn(),
  },
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
});

