import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react-native';
import { Alert } from 'react-native';

import MyPostsScreen from '../../posts';
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
      t: (k: string) => k,
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
      <MyPostsScreen />
    </AuthContext.Provider>
  );

describe('Manage posts screen', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeAll(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    consoleErrorSpy?.mockRestore();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  it('navigates to edit and removes item after delete', async () => {
    mockApiRequest.mockImplementation(async (path: string, opts: any = {}) => {
      if (path.includes('/api/users/') && !opts.method) {
        return {
          ok: true,
          status: 200,
          json: jest.fn().mockResolvedValue([
            {
              postId: 123,
              creatorUsername: 'alice',
              content: 'My first post',
              likes: 0,
              comments: [],
              photoUrl: null,
            },
          ]),
        } as any;
      }
      if (opts.method === 'DELETE' && path === '/api/posts/123') {
        return { ok: true, status: 200, text: jest.fn().mockResolvedValue('') } as any;
      }
      return { ok: true, status: 200, json: jest.fn().mockResolvedValue([]) } as any;
    });

    renderWithAuth();

    expect(await screen.findByText('My first post')).toBeTruthy();

    fireEvent.press(screen.getByText(/edit/i));
    expect(mockNavigate).toHaveBeenCalledWith('edit_post_detail', {
      postId: 123,
      initialContent: 'My first post',
      initialPhotoUrl: null,
    });

    fireEvent.press(screen.getByText(/delete/i));

    await waitFor(() => expect(mockApiRequest).toHaveBeenCalledWith('/api/posts/123', expect.anything()));
    await waitFor(() => expect(screen.queryByText('My first post')).toBeNull());
  });
});
