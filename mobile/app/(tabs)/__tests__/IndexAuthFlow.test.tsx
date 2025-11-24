import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';

import HomeScreen from '../index';
import { AuthContext } from '../../_layout';
import { apiRequest, login as loginRequest, register as registerRequest } from '../../services/apiClient';

const mockNavigate = jest.fn();
const mockSetParams = jest.fn();

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(null),
  multiSet: jest.fn().mockResolvedValue(null),
  removeItem: jest.fn().mockResolvedValue(null),
}));

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    useNavigation: () => ({ navigate: mockNavigate, setParams: mockSetParams }),
    useRoute: () => ({ params: {} }),
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

jest.mock('@/components/ParallaxScrollView', () => {
  const React = require('react');
  const { View } = require('react-native');
  return ({ children, ...props }: any) => <View {...props}>{children}</View>;
});

jest.mock('@/components/ThemedText', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return { ThemedText: ({ children, ...props }: any) => <Text {...props}>{children}</Text> };
});

jest.mock('../../components/CheckBox', () => {
  const React = require('react');
  const { TouchableOpacity, Text } = require('react-native');
  return ({ checked, onPress }: any) => (
    <TouchableOpacity onPress={onPress} testID="kvkk-checkbox">
      <Text>{checked ? '[X]' : '[ ]'}</Text>
    </TouchableOpacity>
  );
});

jest.mock('../../services/apiClient', () => ({
  apiRequest: jest.fn(),
  login: jest.fn(),
  register: jest.fn(),
}));

const mockApiRequest = apiRequest as jest.MockedFunction<typeof apiRequest>;
const mockLogin = loginRequest as jest.MockedFunction<typeof loginRequest>;
const mockRegister = registerRequest as jest.MockedFunction<typeof registerRequest>;

const renderWithContext = () =>
  render(
    <AuthContext.Provider
      value={{
        userType: null,
        username: '',
        setUserType: jest.fn(),
        setUsername: jest.fn(),
      }}
    >
      <HomeScreen />
    </AuthContext.Provider>
  );

describe('Index / Auth flow', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeAll(() => {
    jest.useFakeTimers();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  afterAll(() => {
    jest.useRealTimers();
    consoleErrorSpy?.mockRestore();
    (Alert.alert as jest.Mock).mockRestore();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockApiRequest.mockImplementation(async (path: string) => {
      if (path.includes('/api/users/count')) {
        return { ok: true, status: 200, json: jest.fn().mockResolvedValue({ userCount: 42 }) } as any;
      }
      if (path.includes('/api/posts/mostLiked')) {
        return { ok: true, status: 200, json: jest.fn().mockResolvedValue([]) } as any;
      }
      return { ok: true, status: 200, json: jest.fn().mockResolvedValue([]) } as any;
    });
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
  });

  it('shows login form after tapping login button', async () => {
    renderWithContext();
    fireEvent.press(screen.getByText('logIn'));
    expect(screen.getByPlaceholderText('emailOrUsername')).toBeTruthy();
    expect(screen.getByPlaceholderText('password')).toBeTruthy();
  });

  it('shows registration fields after tapping register', () => {
    renderWithContext();
    fireEvent.press(screen.getByText('register'));
    expect(screen.getByPlaceholderText('username')).toBeTruthy();
    expect(screen.getByPlaceholderText('email')).toBeTruthy();
    expect(screen.getByPlaceholderText('password')).toBeTruthy();
    expect(screen.getByPlaceholderText('confirmPassword')).toBeTruthy();
    expect(screen.getByTestId('kvkk-checkbox')).toBeTruthy();
  });

  it('navigates to explore when continuing as guest', () => {
    renderWithContext();
    fireEvent.press(screen.getByText('continueAsGuest'));
    expect(mockNavigate).toHaveBeenCalledWith('explore');
  });

  it('shows error on invalid login credentials', async () => {
    renderWithContext();
    fireEvent.press(screen.getByText('logIn'));
    fireEvent.changeText(screen.getByPlaceholderText('emailOrUsername'), 'user');
    fireEvent.changeText(screen.getByPlaceholderText('password'), 'short');
    fireEvent.press(screen.getAllByText('logIn').pop() as any);
    await waitFor(() => expect(screen.getByText('errorFillCredentials')).toBeTruthy());
    expect(mockLogin).not.toHaveBeenCalled();
  });
});
