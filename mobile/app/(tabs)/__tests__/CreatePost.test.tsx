import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';

import CreatePostScreen from '../../create_post';
import { AuthContext } from '../../_layout';
import { getAccessToken } from '../../services/apiClient';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(null),
  multiSet: jest.fn().mockResolvedValue(null),
  removeItem: jest.fn().mockResolvedValue(null),
}));

const mockGoBack = jest.fn();
const mockSetOptions = jest.fn();

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    useNavigation: () => ({
      goBack: mockGoBack,
      setOptions: mockSetOptions,
    }),
  };
});

jest.mock('react-i18next', () => {
  const actual = jest.requireActual('react-i18next');
  return {
    ...actual,
    useTranslation: () => ({
      t: (k: string, opts?: any) => opts?.defaultValue ?? k,
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

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
  launchImageLibraryAsync: jest.fn().mockResolvedValue({ canceled: true }),
  MediaTypeOptions: { Images: 'Images' },
}));

jest.mock('../../services/apiClient', () => {
  const actual = jest.requireActual('../../services/apiClient');
  return {
    ...actual,
    getAccessToken: jest.fn(),
  };
});

const mockGetAccessToken = getAccessToken as jest.MockedFunction<typeof getAccessToken>;

describe('Create post screen', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeAll(() => {
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    (Alert.alert as jest.Mock).mockRestore();
    consoleErrorSpy?.mockRestore();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAccessToken.mockResolvedValue('token-123');
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({}),
    }) as any;
  });

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
        <CreatePostScreen />
      </AuthContext.Provider>
    );

  it('submits when content is provided and navigates back on success', async () => {
    renderWithAuth();
    fireEvent.changeText(screen.getByPlaceholderText('writePostPlaceholder'), 'Hello world');

    const postButton = screen.getByText('post');
    expect(postButton.props.accessibilityState?.disabled).toBeFalsy();

    fireEvent.press(postButton);

    await waitFor(() => expect(global.fetch as jest.Mock).toHaveBeenCalled());
    expect(mockGoBack).toHaveBeenCalled();
  });
});
