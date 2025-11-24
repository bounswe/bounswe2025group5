import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';

import ExploreScreen from '../explore';
import { AuthContext } from '../../_layout';
import { apiRequest } from '../../services/apiClient';

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    useNavigation: () => ({ navigate: mockNavigate }),
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

jest.mock('../../services/apiClient', () => ({
  apiRequest: jest.fn(),
}));

jest.mock('react-native/Libraries/Interaction/InteractionManager', () => ({
  runAfterInteractions: (cb: any) => {
    cb?.();
    return { cancel: jest.fn() };
  },
  createInteractionHandle: () => 1,
  clearInteractionHandle: () => {},
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

describe('Explore search', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeAll(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    consoleErrorSpy?.mockRestore();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockApiRequest.mockImplementation(async (path: string) => {
      if (path.includes('/api/posts')) {
        return { ok: true, status: 200, json: jest.fn().mockResolvedValue([]) } as any;
      }
      if (path.includes('/api/forum/search/semantic')) {
        return {
          ok: true,
          status: 200,
          json: jest.fn().mockResolvedValue([
            {
              postId: 5,
              creatorUsername: 'bob',
              content: 'Search result content',
              likes: 1,
              comments: [],
              photoUrl: null,
              liked: false,
              saved: false,
            },
          ]),
        } as any;
      }
      if (path.includes('/profile?username=')) {
        return { ok: true, status: 200, json: jest.fn().mockResolvedValue({ photoUrl: null }) } as any;
      }
      return { ok: true, status: 200, json: jest.fn().mockResolvedValue([]) } as any;
    });
  });

  it('executes search and renders results', async () => {
    renderWithAuth();

    const input = screen.getByPlaceholderText('searchPlaceholder');
    fireEvent.changeText(input, 'eco');
    fireEvent(input, 'submitEditing');

    expect(await screen.findByText('Search result content')).toBeTruthy();
    expect(screen.getByText('bob')).toBeTruthy();
  });
});
