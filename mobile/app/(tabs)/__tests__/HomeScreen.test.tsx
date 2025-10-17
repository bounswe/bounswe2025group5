// __tests__/screens/HomeScreen.test.tsx

import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react-native';
import HomeScreen from '../index';                // Path to your HomeScreen component
import { AuthContext } from '../../_layout';      // Path to your AuthContext definition

// --- Mock AsyncStorage ---
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(null),
  multiSet: jest.fn().mockResolvedValue(null),
  removeItem: jest.fn().mockResolvedValue(null),
}));

// --- Mock Navigation Hooks ---
const mockNavigate = jest.fn();
const mockSetParams = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: mockNavigate, setParams: mockSetParams }),
  useRoute:      () => ({ params: {} }),
  useFocusEffect: jest.fn(),
}));

// --- Mock expo-router stack (if used) ---
jest.mock('expo-router', () => ({ Stack: {} }));

// --- Mock Icons & UI Components ---
jest.mock('@expo/vector-icons/Ionicons', () => {
  return ({ name }: { name: string }) => {
    const ReactNative = require('react-native');
    return <ReactNative.Text testID={`icon-${name}`}>{name}</ReactNative.Text>;
  };
});
jest.mock('@/components/ParallaxScrollView', () => {
  const React = require('react');
  const { View } = require('react-native');
  return ({ children, ...props }: any) => <View {...props}>{children}</View>;
});
jest.mock('@/components/ThemedText', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    ThemedText: ({ children, style, ...props }: any) =>
      <Text style={style} {...props}>{children}</Text>
  };
});
jest.mock('@/components/HelloWave', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return { HelloWave: () => <Text>Wave</Text> };
});
jest.mock('../../components/CheckBox', () => {
  const React = require('react');
  const { Text, TouchableOpacity } = require('react-native');
  return ({ checked, onPress }: any) => (
    <TouchableOpacity onPress={onPress} testID="mock-checkbox">
      <Text>{checked ? '[X]' : '[ ]'}</Text>
    </TouchableOpacity>
  );
});

// --- Mock fetch for user count & trending posts ---
global.fetch = jest.fn((url: string | URL | Request) => {
  const u =
    typeof url === 'string'
      ? url
      : url instanceof URL
        ? url.toString()
        : (url as Request).url ?? '';
  if (u.includes('/api/users/count')) {
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ userCount: 55 }),
    });
  }
  if (u.includes('/api/posts/mostLiked')) {
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve([]),
    });
  }
  if (u.includes('/api/home/getCurrentWeather')) {
    // console.log('FETCH MOCK: Returning trending posts response');
    return Promise.resolve({
        ok: true, status: 200, json: () => Promise.resolve({temperature: 20.0}),
    });
}
  return Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
  });
}) as jest.Mock;

// --- AuthContext Mock Value ---
const mockAuthContext = {
  userType: null,
  username: '',
  user_id: '',
  setUserType: jest.fn(),
  setUsername: jest.fn(),
  setUserId:  jest.fn(),
};

// --- Render Helper + Async Wait ---
const renderWithContext = (ctx = mockAuthContext) => render(
  <AuthContext.Provider value={ctx}>
    <HomeScreen />
  </AuthContext.Provider>
);
const waitForUpdates = async () => {
  await act(async () => new Promise(res => setImmediate(res)));
};

beforeEach(() => {
  jest.clearAllMocks();
  require('@react-native-async-storage/async-storage').getItem.mockResolvedValue(null);
});

describe('<HomeScreen /> – full flow', () => {
  it('shows login form after pressing main login button', async () => {
    renderWithContext();
    await waitForUpdates();
    expect(screen.getByText(/55 users are reducing/i)).toBeTruthy();
    fireEvent.press(screen.getByTestId('main-login-button'));
    expect(screen.getByPlaceholderText('Email or Username')).toBeTruthy();
    expect(screen.getByPlaceholderText('Password')).toBeTruthy();
    expect(screen.getByTestId('form-login-button')).toBeTruthy();
    expect(screen.queryByTestId('main-login-button')).toBeNull();
  });

  it('shows registration form after pressing main register button', async () => {
    renderWithContext();
    await waitForUpdates();
    fireEvent.press(screen.getByTestId('main-register-button'));
    expect(screen.queryByTestId('main-login-button')).toBeNull();
    expect(screen.queryByTestId('main-register-button')).toBeNull();
    expect(screen.queryByText(/55 users are reducing/i)).toBeNull();
    expect(screen.getByPlaceholderText('Username')).toBeTruthy();
    expect(screen.getByPlaceholderText('Email')).toBeTruthy();
    expect(screen.getByPlaceholderText('Password')).toBeTruthy();
    expect(screen.getByPlaceholderText('Confirm password')).toBeTruthy();
    expect(screen.getByTestId('mock-checkbox')).toBeTruthy();
    expect(screen.getByTestId('form-register-button')).toBeTruthy();
    expect(screen.getByTestId('form-back-to-login-button')).toBeTruthy();
  });

  it('switches back to login form from registration form', async () => {
    renderWithContext();
    await waitForUpdates();
    fireEvent.press(screen.getByTestId('main-register-button'));
    fireEvent.press(screen.getByTestId('form-back-to-login-button'));
    expect(screen.queryByPlaceholderText('Username')).toBeNull();
    expect(screen.getByPlaceholderText('Email or Username')).toBeTruthy();
    expect(screen.getByTestId('form-login-button')).toBeTruthy();
  });

  it('navigates to "explore" when logging in with credentials "test"', async () => {
    const setUserType = jest.fn();
    const setUsername = jest.fn();
    render(
      <AuthContext.Provider value={{
        userType: null, username: '', setUserType, setUsername
      }}>
        <HomeScreen />
      </AuthContext.Provider>
    );
    await waitForUpdates();
    fireEvent.press(screen.getByTestId('main-login-button'));
    fireEvent.changeText(screen.getByPlaceholderText('Email or Username'), 'test');
    fireEvent.changeText(screen.getByPlaceholderText('Password'), 'test');
    await act(async () => {
      fireEvent.press(screen.getByTestId('form-login-button'));
    });
    expect(setUserType).toHaveBeenCalledWith('user');
    expect(setUsername).toHaveBeenCalledWith('test');
    expect(mockNavigate).toHaveBeenCalledWith('explore');
  });
});
