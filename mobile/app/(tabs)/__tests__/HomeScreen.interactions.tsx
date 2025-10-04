// __tests__/screens/HomeScreen.interactions.test.tsx
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react-native';

// --- ADJUST PATHS ---
import HomeScreen from '../index';     // Path to your HomeScreen component
import { AuthContext } from '../../_layout';      // Path to your AuthContext definition file

// --- END ADJUST PATHS ---

// AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
    getItem: jest.fn().mockResolvedValue(null), // Default: not logged in
    setItem: jest.fn().mockResolvedValue(null),
    multiSet: jest.fn().mockResolvedValue(null),
    removeItem: jest.fn().mockResolvedValue(null),
  }));
  
  // Navigation Hooks
  const mockNavigate = jest.fn();
  const mockSetParams = jest.fn();
  jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'), // Keep original non-hook stuff
    useNavigation: () => ({
      navigate: mockNavigate,
      setParams: mockSetParams,
    }),
    useRoute: () => ({
      params: {},
    }),
    useFocusEffect: jest.fn(), // Simple mock
  }));
  
  // Ionicons
  jest.mock('@expo/vector-icons/Ionicons', () => {
      const MockIcon = ({ name }: { name: string }) => {
          const MockReactNative = require('react-native');
          const Text = MockReactNative.Text;
          return <Text testID={`icon-${name}`}>{name}</Text>;
      };
      return MockIcon;
  });
  
  // Component Mocks
  jest.mock('@/components/ParallaxScrollView', () => {
      const MockReactNative = require('react-native');
      const View = MockReactNative.View;
      const MockScrollView = ({ children, ...props }: any) => <View {...props}>{children}</View>;
      return MockScrollView;
  });
  jest.mock('@/components/ThemedText', () => {
      const MockReactNative = require('react-native');
      const Text = MockReactNative.Text;
      const MockThemedText = ({ children, style, ...props }: any) => (
          <Text style={style} {...props}>{children}</Text>
      );
      return { ThemedText: MockThemedText };
  });
  jest.mock('@/components/HelloWave', () => {
       const MockReactNative = require('react-native');
       const Text = MockReactNative.Text;
       const MockWave = () => <Text>Wave</Text>;
       return { HelloWave: MockWave };
  });
  jest.mock('../../components/CheckBox', () => {
      const MockReactNative = require('react-native');
      const Text = MockReactNative.Text;
      const TouchableOpacity = MockReactNative.TouchableOpacity;
      const MockCheckBox = ({ checked, onPress }: { checked: boolean; onPress: () => void }) => (
          <TouchableOpacity onPress={onPress} testID="mock-checkbox">
              <Text>{checked ? '[X]' : '[ ]'}</Text>
          </TouchableOpacity>
      );
      return MockCheckBox;
  });
  jest.mock('react-native/Libraries/Image/Image', () => 'Image');
  
  // Smarter Fetch API Mock
  global.fetch = jest.fn((url: string | URL | Request) => {
      // console.log(`FETCH MOCK CALLED WITH URL: ${url}`);
      const urlString = url.toString();
      if (urlString.includes('/api/users/count')) {
          // console.log('FETCH MOCK: Returning user count response');
          return Promise.resolve({
              ok: true, status: 200, json: () => Promise.resolve({ userCount: 55 }),
          });
      }
      if (urlString.includes('/api/posts/mostLikedPosts')) {
           // console.log('FETCH MOCK: Returning trending posts response');
          return Promise.resolve({
              ok: true, status: 200, json: () => Promise.resolve([]),
          });
      }
      if (urlString.includes('/api/home/getCurrentWeather')) {
            // console.log('FETCH MOCK: Returning trending posts response');
            return Promise.resolve({
                ok: true, status: 200, json: () => Promise.resolve({temperature: 20.0}),
            });
        }
      // console.log('FETCH MOCK: Returning default empty response for URL:', urlString);
      return Promise.resolve({
          ok: true, status: 200, json: () => Promise.resolve({}),
      });
  }) as jest.Mock;
  
  
  // AuthContext Mock Value
  const mockAuthContextValue = {
      userType: null, username: '', user_id: '',
      setUserType: jest.fn(), setUsername: jest.fn(), setUserId: jest.fn(),
  };
  
  // Render Helper
  const renderComponent = (contextValue = mockAuthContextValue) => {
      return render(
          <AuthContext.Provider value={contextValue}>
              <HomeScreen />
          </AuthContext.Provider>
      );
  };
  
  // Wait for async updates helper
  const waitForAsyncUpdates = async () => {
      await act(async () => {
          await new Promise(resolve => setImmediate(resolve));
      });
  };
  
  // Reset mocks before test
  beforeEach(() => {
      jest.clearAllMocks();
      require('@react-native-async-storage/async-storage').getItem.mockResolvedValue(null);
  });
  
  describe('<HomeScreen /> Interactions', () => {
  
      it('should show login form on clicking main login button', async () => {
          renderComponent();
          await waitForAsyncUpdates();
  
          expect(screen.getByText(/55 users are reducing/i)).toBeTruthy();
          const mainLoginButton = screen.getByTestId('main-login-button');
          fireEvent.press(mainLoginButton);
  
          expect(screen.getByPlaceholderText('Email or Username')).toBeTruthy();
          expect(screen.getByPlaceholderText('Password')).toBeTruthy();
          expect(screen.getByTestId('form-login-button')).toBeTruthy();
          expect(screen.queryByTestId('main-login-button')).toBeNull();
      });
  
      it('should show registration form on clicking main register button', async () => {
          renderComponent();
          await waitForAsyncUpdates(); // Wait for initial data load
  
          // Initial elements are visible
          expect(screen.getByText(/55 users are reducing/i)).toBeTruthy();
          const mainRegisterButton = screen.getByTestId('main-register-button');
          expect(mainRegisterButton).toBeTruthy();
  
          // --- ACT ---
          fireEvent.press(mainRegisterButton);
  
          // --- ASSERT ---
          // Initial elements should be hidden
          expect(screen.queryByTestId('main-login-button')).toBeNull();
          expect(screen.queryByTestId('main-register-button')).toBeNull();
          expect(screen.queryByText(/55 users are reducing/i)).toBeNull();
  
          // Registration form elements should be visible
          expect(screen.getByPlaceholderText('Username')).toBeTruthy();
          expect(screen.getByPlaceholderText('Email')).toBeTruthy();
          expect(screen.getByPlaceholderText('Password')).toBeTruthy();
          expect(screen.getByPlaceholderText('Confirm password')).toBeTruthy();
          expect(screen.getByTestId('mock-checkbox')).toBeTruthy(); // Our mocked CheckBox
          expect(screen.getByText('I have read and acknowledged KVKK form')).toBeTruthy(); // KVKK text
          expect(screen.getByTestId('form-register-button')).toBeTruthy(); // Register button in form
          expect(screen.getByTestId('form-back-to-login-button')).toBeTruthy(); // "Back to Log In"
  
          // Login specific fields should NOT be visible
          expect(screen.queryByPlaceholderText('Email or Username')).toBeNull();
      });
  
      it('should switch back to login form from registration form', async () => {
          renderComponent();
          await waitForAsyncUpdates();
  
          // Navigate to registration form first
          const mainRegisterButton = screen.getByTestId('main-register-button');
          fireEvent.press(mainRegisterButton);
  
          // Verify registration form is visible (quick check)
          expect(screen.getByPlaceholderText('Username')).toBeTruthy();
          const backToLoginButton = screen.getByTestId('form-back-to-login-button');
          expect(backToLoginButton).toBeTruthy();
  
          // --- ACT ---
          fireEvent.press(backToLoginButton);
  
          // --- ASSERT ---
          // Registration specific fields should be hidden
          expect(screen.queryByPlaceholderText('Username')).toBeNull();
          expect(screen.queryByPlaceholderText('Email')).toBeNull();
          expect(screen.queryByPlaceholderText('Confirm password')).toBeNull();
          expect(screen.queryByTestId('mock-checkbox')).toBeNull();
          expect(screen.queryByText('I have read and acknowledged KVKK form')).toBeNull();
          expect(screen.queryByTestId('form-register-button')).toBeNull();
          expect(screen.queryByTestId('form-back-to-login-button')).toBeNull(); // This button itself is gone
  
  
          // Login form elements should be visible
          expect(screen.getByPlaceholderText('Email or Username')).toBeTruthy();
          expect(screen.getByPlaceholderText('Password')).toBeTruthy();
          expect(screen.getByTestId('form-login-button')).toBeTruthy(); // Login button in form
          expect(screen.getByTestId('form-register-switch-button')).toBeTruthy(); // Register button (to switch to reg) in form
      });
  
      // You can add more tests here:
      // - Switching from Login to Registration form
      // - Typing into input fields and checking their values
      // - "Continue as Guest" button functionality
  });