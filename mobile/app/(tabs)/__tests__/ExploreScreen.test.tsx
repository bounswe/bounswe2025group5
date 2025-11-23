import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';

import ExploreScreen from '../explore';
import { AuthContext } from '../../_layout';
import { apiRequest } from '../../services/apiClient';

const mockNavigate = jest.fn();

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(null),
  multiSet: jest.fn().mockResolvedValue(null),
  removeItem: jest.fn().mockResolvedValue(null),
}));

jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({ navigate: mockNavigate }),
    useFocusEffect: (callback: any) => {
      const React = require('react');
      return React.useEffect(() => callback(), [callback]);
    },
  };
});

jest.mock('@expo/vector-icons', () => {
  const MockIcon = ({ name }: { name: string }) => {
    const ReactNative = require('react-native');
    return <ReactNative.Text testID={`icon-${name}`}>{name}</ReactNative.Text>;
  };
  return { Ionicons: MockIcon };
});

jest.mock('../../components/PostItem', () => {
  const React = require('react');
  const { View, Text } = require('react-native');
  return ({ post }: any) => (
    <View testID={`post-${post.id}`}>
      <Text>{post.title}</Text>
      <Text>{post.content}</Text>
    </View>
  );
});

jest.mock('@/components/AccessibleText', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return ({ children, ...props }: any) => <Text {...props}>{children}</Text>;
});

jest.mock('../../services/apiClient', () => ({
  apiRequest: jest.fn(),
}));

jest.mock('react-i18next', () => {
  const actual = jest.requireActual('react-i18next');
  return {
    ...actual,
    useTranslation: () => ({
      t: (_key: string, opts?: any) => opts?.defaultValue ?? _key,
      i18n: { resolvedLanguage: 'en', language: 'en' },
    }),
    initReactI18next: {
      type: '3rdParty',
      init: jest.fn(),
    },
  };
});

jest.mock('react-native/Libraries/Interaction/InteractionManager', () => ({
  runAfterInteractions: (cb: any) => {
    cb?.();
    return { cancel: jest.fn() };
  },
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
      <ExploreScreen />
    </AuthContext.Provider>
  );

describe('<ExploreScreen />', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads feed when user is logged in', async () => {
    const mockPostsResponse = [
      {
        postId: 1,
        creatorUsername: 'alice',
        content: 'Hello world',
        likes: 3,
        comments: [],
        photoUrl: null,
        liked: false,
        saved: false,
      },
    ];

    mockApiRequest.mockImplementation(async (path: string) => {
      if (path.startsWith('/api/posts')) {
        return {
          ok: true,
          status: 200,
          json: jest.fn().mockResolvedValue(mockPostsResponse),
        } as any;
      }
      if (path.includes('/profile')) {
        return {
          ok: true,
          status: 200,
          json: jest.fn().mockResolvedValue({ photoUrl: 'https://example.com/a.png' }),
        } as any;
      }
      return {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({}),
      } as any;
    });

    renderWithAuth();

    await waitFor(() => expect(mockApiRequest).toHaveBeenCalled());

    expect(await screen.findByTestId('post-1')).toBeTruthy();
    expect(screen.getByText('alice')).toBeTruthy();
    expect(screen.getByText('Hello world')).toBeTruthy();
    expect(mockNavigate).not.toHaveBeenCalledWith('index');
  });
});
