import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import CreatePostScreen from '../app/create_post';
import { AuthContext } from '../app/_layout';
import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';

// Mocks
jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
  MediaTypeOptions: {
    Images: 'Images',
  },
}));

jest.mock('expo-file-system', () => ({
  copyAsync: jest.fn(),
  cacheDirectory: 'file:///tmp/',
}));

jest.mock('../app/services/apiClient', () => ({
  getAccessToken: jest.fn(() => Promise.resolve('mock-token')),
  apiRequest: jest.fn(),
}));

jest.mock('../app/apiConfig', () => ({
  apiUrl: (path: string) => `http://localhost:8080${path}`,
}));

const en = require('../app/locales/en.json');
const tr = require('../app/locales/tr.json');

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

jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
      setOptions: jest.fn(),
    }),
  };
});

// Mock global fetch and FormData
global.fetch = jest.fn();
global.FormData = class FormData {
  append = jest.fn();
} as any;

describe('CreatePostScreen Functionalities', () => {
  const mockUser = {
    userType: 'user' as const,
    username: 'testuser',
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
            return value;
        },
        i18n: { 
            language: currentLanguage, 
            changeLanguage: (lang: string) => {
                currentLanguage = lang;
                return Promise.resolve();
            }
        },
    }));

    jest.spyOn(Alert, 'alert');
  });

  it('renders correctly', () => {
    const { getByPlaceholderText, getByText } = render(
      <AuthContext.Provider value={mockUser}>
        <CreatePostScreen />
      </AuthContext.Provider>
    );

    // Check for key elements
    expect(getByText('Create a New Post')).toBeTruthy();
    expect(getByPlaceholderText('Write your post here...')).toBeTruthy();
    expect(getByText('Add Image (Optional)')).toBeTruthy();
    expect(getByText('Post')).toBeTruthy();
  });

  it('disables post button when content is empty', async () => {
    const { getByText } = render(
      <AuthContext.Provider value={mockUser}>
        <CreatePostScreen />
      </AuthContext.Provider>
    );

    const postButton = getByText('Post');
    fireEvent.press(postButton);
    expect(global.fetch).not.toHaveBeenCalled();
    expect(Alert.alert).not.toHaveBeenCalled();
  });

  it('allows picking an image', async () => {
    (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({ granted: true });
    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file://test.jpg', width: 100, height: 100, mimeType: 'image/jpeg' }],
    });

    const { getByText } = render(
      <AuthContext.Provider value={mockUser}>
        <CreatePostScreen />
      </AuthContext.Provider>
    );

    fireEvent.press(getByText('Add Image (Optional)'));

    await waitFor(() => {
      expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalled();
      expect(getByText('Change Image')).toBeTruthy();
    });
  });

  it('submits a post successfully', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    const { getByText, getByPlaceholderText } = render(
      <AuthContext.Provider value={mockUser}>
        <CreatePostScreen />
      </AuthContext.Provider>
    );

    fireEvent.changeText(getByPlaceholderText('Write your post here...'), 'Hello World');
    fireEvent.press(getByText('Post'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/posts'),
        expect.objectContaining({
          method: 'POST',
        })
      );
      // Check for success alert
      expect(Alert.alert).toHaveBeenCalledWith(
        expect.stringMatching(/Success|success/), 
        expect.any(String)
      );
    });
  });

  it('handles server errors', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      text: () => Promise.resolve('Internal Server Error'),
    });

    const { getByText, getByPlaceholderText } = render(
      <AuthContext.Provider value={mockUser}>
        <CreatePostScreen />
      </AuthContext.Provider>
    );

    fireEvent.changeText(getByPlaceholderText('Write your post here...'), 'Hello World');
    fireEvent.press(getByText('Post'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        expect.stringMatching(/Error|error/), 
        expect.stringContaining('500')
      );
    });
  });

  it('displays correct texts in Turkish and English', async () => {
    // Switch to Turkish
    currentLanguage = 'tr';
    
    const { getByText, unmount } = render(
      <AuthContext.Provider value={mockUser}>
        <CreatePostScreen />
      </AuthContext.Provider>
    );

    // Verify Turkish texts
    expect(getByText('Yeni Gönderi Oluştur')).toBeTruthy(); // Create New Post
    expect(getByText('Gönder')).toBeTruthy(); // Post

    unmount();

    // Switch to English
    currentLanguage = 'en';
    const { getByText: getByTextEn } = render(
      <AuthContext.Provider value={mockUser}>
        <CreatePostScreen />
      </AuthContext.Provider>
    );

    expect(getByTextEn('Create a New Post')).toBeTruthy();
    expect(getByTextEn('Post')).toBeTruthy();
  });
});
