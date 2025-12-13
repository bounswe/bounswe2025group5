import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert, Text } from 'react-native';
import EditProfileScreen from '../../edit_profile';
import { AuthContext } from '../../_layout';
import { apiRequest, clearSession } from '../../services/apiClient';
import { useTranslation } from 'react-i18next';

jest.mock('../../services/apiClient', () => ({
    apiRequest: jest.fn(),
    clearSession: jest.fn(),
    getAccessToken: jest.fn(),
}));

jest.mock('react-i18next', () => ({
    useTranslation: jest.fn(),
    initReactI18next: {
        type: '3rdParty',
        init: jest.fn(),
    },
}));

jest.mock('@expo/vector-icons', () => ({
    Ionicons: 'Ionicons',
}));

jest.mock('@expo/vector-icons/Ionicons', () => 'Ionicons');

jest.mock('expo-font', () => ({
    isLoaded: jest.fn(() => true),
    loadAsync: jest.fn(() => Promise.resolve()),
    useFonts: jest.fn(() => [true, null]),
}));

jest.mock('expo-image-picker', () => ({
    requestMediaLibraryPermissionsAsync: jest.fn(),
    launchImageLibraryAsync: jest.fn(),
    MediaTypeOptions: { Images: 'Images' },
}));

jest.mock('expo-file-system', () => ({
    copyAsync: jest.fn(),
    cacheDirectory: 'file:///tmp/',
}));

jest.mock('react-native/Libraries/Modal/Modal', () => {
    const React = require('react');
    const { View } = require('react-native');
    return ({ visible, children }: { visible: boolean; children: React.ReactNode }) =>
        visible ? <View accessibilityLabel="modal">{children}</View> : null;
});

jest.mock('@react-navigation/native', () => {
    const actualNav = jest.requireActual('@react-navigation/native');
    return {
        ...actualNav,
        useNavigation: () => mockNavigation,
    };
});

jest.mock('@/components/ParallaxScrollView', () => {
    const React = require('react');
    return ({ children }: { children: React.ReactNode }) => <>{children}</>;
});

const en = require('../../locales/en.json');
const tr = require('../../locales/tr.json');

const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
    reset: jest.fn(),
    setOptions: jest.fn(),
};

describe('EditProfileScreen', () => {
    const authValue = {
        userType: 'user' as const,
        username: 'currentUser',
        setUserType: jest.fn(),
        setUsername: jest.fn(),
    };

    let currentLanguage = 'en';

    beforeEach(() => {
        jest.clearAllMocks();
        currentLanguage = 'en';

        (useTranslation as jest.Mock).mockImplementation(() => ({
            t: (key: string, options?: any) => {
                const langData = currentLanguage === 'en' ? en : tr;
                let value = langData.translation[key];
                if (!value && options?.defaultValue) return options.defaultValue;
                if (!value) return key;
                if (options) {
                    Object.keys(options).forEach((k) => {
                        if (typeof options[k] === 'string' || typeof options[k] === 'number') {
                            value = value.replace(`{{${k}}}`, String(options[k]));
                        }
                    });
                }
                return value;
            },
            i18n: {
                language: currentLanguage,
                resolvedLanguage: currentLanguage,
                changeLanguage: (lang: string) => {
                    currentLanguage = lang;
                    return Promise.resolve();
                },
            },
        }));

        jest.spyOn(Alert, 'alert').mockImplementation(() => { });
    });

    it('loads and displays existing bio', async () => {
        (apiRequest as jest.Mock).mockImplementation((url: string, options?: any) => {
            if (url.includes('/profile?') && !options) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({ biography: 'Hello bio', photoUrl: null }),
                });
            }
            return Promise.resolve({ ok: false });
        });

        const { getByDisplayValue, getByText } = render(
            <AuthContext.Provider value={authValue}>
                <EditProfileScreen />
            </AuthContext.Provider>
        );

        await waitFor(() => expect(getByDisplayValue('Hello bio')).toBeTruthy());
        expect(getByText('9/100')).toBeTruthy();
    });

    it('saves updated bio', async () => {
        (apiRequest as jest.Mock).mockImplementation((url: string, options?: any) => {
            if (url.includes('/profile?') && !options) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({ biography: 'Initial bio', photoUrl: null }),
                });
            }
            if (url.includes('/profile') && options?.method === 'PUT') {
                return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
            }
            return Promise.resolve({ ok: false });
        });

        const { getByDisplayValue, getByText, getByPlaceholderText } = render(
            <AuthContext.Provider value={authValue}>
                <EditProfileScreen />
            </AuthContext.Provider>
        );

        await waitFor(() => expect(getByDisplayValue('Initial bio')).toBeTruthy());

        const bioInput = getByPlaceholderText(/Write a short bio/i);
        fireEvent.changeText(bioInput, 'Updated Bio');

        fireEvent.press(getByText('Update Profile'));

        await waitFor(() =>
            expect(apiRequest).toHaveBeenCalledWith(
                expect.stringContaining('/profile'),
                expect.objectContaining({
                    method: 'PUT',
                    body: expect.stringContaining('"biography":"Updated Bio"'),
                })
            )
        );

        await waitFor(() =>
            expect(Alert.alert).toHaveBeenCalledWith('Success', 'Profile Updated!')
        );
    });

    it('deletes account after confirmation', async () => {
        (apiRequest as jest.Mock).mockImplementation((url: string, options?: any) => {
            if (url.includes('/profile?') && !options) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({ biography: 'Bio', photoUrl: null }),
                });
            }
            if (options?.method === 'DELETE') {
                return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
            }
            return Promise.resolve({ ok: false });
        });

        (clearSession as jest.Mock).mockResolvedValue(undefined);

        const { getByText, getAllByText, getByPlaceholderText } = render(
            <AuthContext.Provider value={authValue}>
                <EditProfileScreen />
            </AuthContext.Provider>
        );

        await waitFor(() => expect(getAllByText('Delete Account').length).toBeGreaterThan(0));

        const deleteButtons = getAllByText('Delete Account');
        const deleteButton = deleteButtons[deleteButtons.length - 1];
        fireEvent.press(deleteButton);

        const passwordInput = await waitFor(() =>
            getByPlaceholderText(/Enter your password/i)
        );
        fireEvent.changeText(passwordInput, 'secret123');

        fireEvent.press(getByText('Yes, delete account'));

        await waitFor(() =>
            expect(apiRequest).toHaveBeenCalledWith(
                expect.stringContaining('/api/users/'),
                expect.objectContaining({
                    method: 'DELETE',
                    body: expect.stringContaining('"password":"secret123"'),
                })
            )
        );
        await waitFor(() => expect(clearSession).toHaveBeenCalled());
        expect(mockNavigation.reset).toHaveBeenCalledWith({
            index: 0,
            routes: [{ name: '(tabs)' }],
        });
    });

    describe('Reset Password Modal', () => {
        beforeEach(() => {
            (apiRequest as jest.Mock).mockImplementation((url: string, options?: any) => {
                if (url.includes('/profile?') && !options) {
                    return Promise.resolve({
                        ok: true,
                        json: () => Promise.resolve({ biography: 'Bio', photoUrl: null }),
                    });
                }
                return Promise.resolve({ ok: false });
            });
        });

        it('opens reset password modal when button is pressed', async () => {
            const { getAllByText, getByPlaceholderText } = render(
                <AuthContext.Provider value={authValue}>
                    <EditProfileScreen />
                </AuthContext.Provider>
            );

            await waitFor(() => expect(getAllByText('Reset Password').length).toBeGreaterThan(0));

            const resetButtons = getAllByText('Reset Password');
            fireEvent.press(resetButtons[resetButtons.length - 1]);

            await waitFor(() => {
                expect(getByPlaceholderText(/Enter your current password/i)).toBeTruthy();
                expect(getByPlaceholderText(/Enter your new password/i)).toBeTruthy();
                expect(getByPlaceholderText(/Confirm your new password/i)).toBeTruthy();
            });
        });

        it('shows password strength indicator when typing new password', async () => {
            const { getAllByText, getByPlaceholderText, getByText } = render(
                <AuthContext.Provider value={authValue}>
                    <EditProfileScreen />
                </AuthContext.Provider>
            );

            await waitFor(() => expect(getAllByText('Reset Password').length).toBeGreaterThan(0));

            const resetButtons = getAllByText('Reset Password');
            fireEvent.press(resetButtons[resetButtons.length - 1]);

            const newPasswordInput = await waitFor(() =>
                getByPlaceholderText(/Enter your new password/i)
            );

            // Test weak password - label shows "Very weak" as defaultValue
            fireEvent.changeText(newPasswordInput, 'weak');
            await waitFor(() => expect(getByText('Very weak')).toBeTruthy());

            // Test fair password (8+ chars with uppercase and number)
            fireEvent.changeText(newPasswordInput, 'Password1');
            await waitFor(() => expect(getByText('Fair')).toBeTruthy());

            // Test strong password (12+ chars with uppercase, number, special char)
            fireEvent.changeText(newPasswordInput, 'StrongPass123!');
            await waitFor(() => expect(getByText('Strong')).toBeTruthy());
        });

        it('shows error when trying to change to a weak password', async () => {
            const { getAllByText, getByPlaceholderText, getByText } = render(
                <AuthContext.Provider value={authValue}>
                    <EditProfileScreen />
                </AuthContext.Provider>
            );

            await waitFor(() => expect(getAllByText('Reset Password').length).toBeGreaterThan(0));

            const resetButtons = getAllByText('Reset Password');
            fireEvent.press(resetButtons[resetButtons.length - 1]);

            const currentPasswordInput = await waitFor(() =>
                getByPlaceholderText(/Enter your current password/i)
            );
            const newPasswordInput = getByPlaceholderText(/Enter your new password/i);
            const confirmPasswordInput = getByPlaceholderText(/Confirm your new password/i);

            fireEvent.changeText(currentPasswordInput, 'oldpassword');
            fireEvent.changeText(newPasswordInput, 'weak');
            fireEvent.changeText(confirmPasswordInput, 'weak');

            fireEvent.press(getByText('Change Password'));

            await waitFor(() =>
                expect(getByText('Password is too weak. Please choose a stronger password.')).toBeTruthy()
            );
        });

        it('shows error when new passwords do not match', async () => {
            const { getAllByText, getByPlaceholderText, getByText } = render(
                <AuthContext.Provider value={authValue}>
                    <EditProfileScreen />
                </AuthContext.Provider>
            );

            await waitFor(() => expect(getAllByText('Reset Password').length).toBeGreaterThan(0));

            const resetButtons = getAllByText('Reset Password');
            fireEvent.press(resetButtons[resetButtons.length - 1]);

            const currentPasswordInput = await waitFor(() =>
                getByPlaceholderText(/Enter your current password/i)
            );
            const newPasswordInput = getByPlaceholderText(/Enter your new password/i);
            const confirmPasswordInput = getByPlaceholderText(/Confirm your new password/i);

            fireEvent.changeText(currentPasswordInput, 'oldpassword');
            fireEvent.changeText(newPasswordInput, 'StrongPass123!');
            fireEvent.changeText(confirmPasswordInput, 'DifferentPass456!');

            fireEvent.press(getByText('Change Password'));

            await waitFor(() =>
                expect(getByText('New passwords do not match.')).toBeTruthy()
            );
        });

        it('successfully changes password with strong password', async () => {
            (apiRequest as jest.Mock).mockImplementation((url: string, options?: any) => {
                if (url.includes('/profile?') && !options) {
                    return Promise.resolve({
                        ok: true,
                        json: () => Promise.resolve({ biography: 'Bio', photoUrl: null }),
                    });
                }
                if (url.includes('/reset-password') && options?.method === 'PUT') {
                    return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
                }
                return Promise.resolve({ ok: false });
            });

            const { getAllByText, getByPlaceholderText, getByText } = render(
                <AuthContext.Provider value={authValue}>
                    <EditProfileScreen />
                </AuthContext.Provider>
            );

            await waitFor(() => expect(getAllByText('Reset Password').length).toBeGreaterThan(0));

            const resetButtons = getAllByText('Reset Password');
            fireEvent.press(resetButtons[resetButtons.length - 1]);

            const currentPasswordInput = await waitFor(() =>
                getByPlaceholderText(/Enter your current password/i)
            );
            const newPasswordInput = getByPlaceholderText(/Enter your new password/i);
            const confirmPasswordInput = getByPlaceholderText(/Confirm your new password/i);

            fireEvent.changeText(currentPasswordInput, 'oldpassword');
            fireEvent.changeText(newPasswordInput, 'StrongPass123!');
            fireEvent.changeText(confirmPasswordInput, 'StrongPass123!');

            fireEvent.press(getByText('Change Password'));

            await waitFor(() =>
                expect(apiRequest).toHaveBeenCalledWith(
                    '/api/reset-password',
                    expect.objectContaining({
                        method: 'PUT',
                        body: expect.stringContaining('"newPassword":"StrongPass123!"'),
                    })
                )
            );

            await waitFor(() =>
                expect(Alert.alert).toHaveBeenCalledWith('Success', 'Password changed successfully!')
            );
        });

        it('shows error when current password is incorrect', async () => {
            (apiRequest as jest.Mock).mockImplementation((url: string, options?: any) => {
                if (url.includes('/profile?') && !options) {
                    return Promise.resolve({
                        ok: true,
                        json: () => Promise.resolve({ biography: 'Bio', photoUrl: null }),
                    });
                }
                if (url.includes('/reset-password') && options?.method === 'PUT') {
                    return Promise.resolve({ ok: false, status: 401 });
                }
                return Promise.resolve({ ok: false });
            });

            const { getAllByText, getByPlaceholderText, getByText } = render(
                <AuthContext.Provider value={authValue}>
                    <EditProfileScreen />
                </AuthContext.Provider>
            );

            await waitFor(() => expect(getAllByText('Reset Password').length).toBeGreaterThan(0));

            const resetButtons = getAllByText('Reset Password');
            fireEvent.press(resetButtons[resetButtons.length - 1]);

            const currentPasswordInput = await waitFor(() =>
                getByPlaceholderText(/Enter your current password/i)
            );
            const newPasswordInput = getByPlaceholderText(/Enter your new password/i);
            const confirmPasswordInput = getByPlaceholderText(/Confirm your new password/i);

            fireEvent.changeText(currentPasswordInput, 'wrongpassword');
            fireEvent.changeText(newPasswordInput, 'StrongPass123!');
            fireEvent.changeText(confirmPasswordInput, 'StrongPass123!');

            fireEvent.press(getByText('Change Password'));

            await waitFor(() =>
                expect(getByText('Current password is incorrect.')).toBeTruthy()
            );
        });
    });
});
