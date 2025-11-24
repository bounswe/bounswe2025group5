import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';
import UserProfileScreen from '../../user_profile';
import { AuthContext } from '../../_layout';
import { apiRequest } from '../../services/apiClient';
import { useTranslation } from 'react-i18next';

jest.mock('../../services/apiClient', () => ({
    apiRequest: jest.fn(),
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

jest.mock('@/components/ParallaxScrollView', () => {
    const React = require('react');
    return ({ children }: { children: React.ReactNode }) => <>{children}</>;
});

jest.mock('@/components/AccessibleText', () => {
    const React = require('react');
    const { Text } = require('react-native');
    return ({ children }: { children: React.ReactNode }) => <Text>{children}</Text>;
});

jest.mock('../../components/PostItem', () => {
    const React = require('react');
    const { Text } = require('react-native');
    return ({ post }: { post: any }) => <Text>{post?.content ?? 'PostItem'}</Text>;
});

const en = require('../../locales/en.json');
const tr = require('../../locales/tr.json');

const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
};

let mockRouteParams: any = { username: 'otheruser' };

jest.mock('@react-navigation/native', () => {
    const actualNav = jest.requireActual('@react-navigation/native');
    return {
        ...actualNav,
        useNavigation: () => mockNavigation,
        useRoute: () => ({ params: mockRouteParams }),
    };
});

describe('UserProfile follow toggle', () => {
    const authValue = {
        userType: 'user' as const,
        username: 'currentUser',
        setUserType: jest.fn(),
        setUsername: jest.fn(),
    };

    let currentLanguage = 'en';

    beforeEach(() => {
        jest.clearAllMocks();
        mockRouteParams = { username: 'otheruser' };
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
    });

    it('sends follow request and updates follower count', async () => {
        (apiRequest as jest.Mock).mockImplementation((url: string, options?: any) => {
            if (url.includes('/profile')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({ biography: 'Test bio', followerCount: 5, followingCount: 3 }),
                });
            }
            if (url.includes('/is-following/')) {
                return Promise.resolve({ ok: true, json: () => Promise.resolve({ follow: false }) });
            }
            if (url.includes('/posts')) {
                return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
            }
            if (url.includes('/follow/') && options?.method === 'POST') {
                return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
            }
            return Promise.resolve({ ok: false });
        });

        const { getByText } = render(
            <AuthContext.Provider value={authValue}>
                <UserProfileScreen />
            </AuthContext.Provider>
        );

        await waitFor(() => expect(getByText('Follow')).toBeTruthy());
        expect(getByText('5')).toBeTruthy();

        fireEvent.press(getByText('Follow'));

        await waitFor(() =>
            expect(apiRequest).toHaveBeenCalledWith(
                expect.stringContaining('/follow/'),
                expect.objectContaining({ method: 'POST' })
            )
        );

        await waitFor(() => expect(getByText('Unfollow')).toBeTruthy());
        await waitFor(() => expect(getByText('6')).toBeTruthy());
    });

    it('sends unfollow request when already following', async () => {
        (apiRequest as jest.Mock).mockImplementation((url: string, options?: any) => {
            if (url.includes('/profile')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({ biography: 'Test bio', followerCount: 4, followingCount: 1 }),
                });
            }
            if (url.includes('/is-following/')) {
                return Promise.resolve({ ok: true, json: () => Promise.resolve({ follow: true }) });
            }
            if (url.includes('/posts')) {
                return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
            }
            if (url.includes('/unfollow/') && options?.method === 'DELETE') {
                return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
            }
            return Promise.resolve({ ok: false });
        });

        const { getByText } = render(
            <AuthContext.Provider value={authValue}>
                <UserProfileScreen />
            </AuthContext.Provider>
        );

        await waitFor(() => expect(getByText('Unfollow')).toBeTruthy());
        expect(getByText('4')).toBeTruthy();

        fireEvent.press(getByText('Unfollow'));

        await waitFor(() =>
            expect(apiRequest).toHaveBeenCalledWith(
                expect.stringContaining('/unfollow/'),
                expect.objectContaining({ method: 'DELETE' })
            )
        );

        await waitFor(() => expect(getByText('Follow')).toBeTruthy());
        await waitFor(() => expect(getByText('3')).toBeTruthy());
    });
});