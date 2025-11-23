import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';

import SavedPostsScreen from '../../saved_posts';
import { AuthContext } from '../../_layout';
import { apiRequest } from '../../services/apiClient';

const mockNavigate = jest.fn();
const mockSetOptions = jest.fn();

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    useNavigation: () => ({
      navigate: mockNavigate,
      setOptions: mockSetOptions,
    }),
    useFocusEffect: (cb: any) => {
      const React = require('react');
      return React.useEffect(() => cb(), [cb]);
    },
  };
});

jest.mock('react-i18next', () => {
  const actual = jest.requireActual('react-i18next');
  return {
    ...actual,
    useTranslation: () => ({
      t: (_k: string, opts?: any) => opts?.defaultValue ?? _k,
      i18n: { language: 'en', resolvedLanguage: 'en' },
    }),
    initReactI18next: {
      type: '3rdParty',
      init: jest.fn(),
    },
  };
});

jest.mock('@expo/vector-icons', () => {
  const MockIcon = ({ name }: { name: string }) => {
    const { Text } = require('react-native');
    return <Text testID={`icon-${name}`}>{name}</Text>;
  };
  return { Ionicons: MockIcon };
});

jest.mock('@/components/AccessibleText', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return ({ children, ...props }: any) => <Text {...props}>{children}</Text>;
});

jest.mock('../../services/apiClient', () => ({
  apiRequest: jest.fn(),
}));

const mockApiRequest = apiRequest as jest.MockedFunction<typeof apiRequest>;

const renderWithAuth = () =>
  render(
    <AuthContext.Provider
      value={{
        userType: 'user',
        username: 'alice',
        setUserType: jest.fn(),
        setUsername: jest.fn(),
      }}
    >
      <SavedPostsScreen />
    </AuthContext.Provider>
  );

describe('Saved posts flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows saved posts for the logged-in user', async () => {
    mockApiRequest.mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue([
        {
          postId: 7,
          creatorUsername: 'bob',
          content: 'Saved post content',
          likeCount: 5,
          commentCount: 1,
          photoUrl: null,
        },
      ]),
    } as any);

    renderWithAuth();

    await waitFor(() => expect(mockApiRequest).toHaveBeenCalled());

    expect(await screen.findByText('Saved post content')).toBeTruthy();
    expect(await screen.findByText(/bob/)).toBeTruthy();
  });
});
