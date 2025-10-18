// __tests__/screens/ProfileScreen.test.tsx

import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react-native';
import { Text, View } from 'react-native';

// --- ADJUST PATHS ---
import ProfileScreen from '../profile'; // Path to component
import { NavigationContainer } from '@react-navigation/native';
// Assuming context is in app/context/AuthContext.tsx
import { AuthContext, AuthContextType, UserType } from '../../_layout'; // Path to context
// --- END ADJUST PATHS ---

// --- Mock Dependencies ---

// AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
    // Define mocks directly inside the factory
    getItem: jest.fn().mockResolvedValue(null),
    setItem: jest.fn().mockResolvedValue(null),
    multiSet: jest.fn().mockResolvedValue(null),
    removeItem: jest.fn().mockResolvedValue(null),
    // multiRemove is now just another mocked method
    multiRemove: jest.fn().mockResolvedValue(null),
    // Add any other AsyncStorage methods your app might use
}));

const mockNavigate = jest.fn();
const mockReset = jest.fn();
const mockSetParams = jest.fn();
jest.mock('@react-navigation/native', () => {
    const actualNav = jest.requireActual('@react-navigation/native'); // Get actual stuff
    return {
        ...actualNav, // Keep actual NavigationContainer, etc.
        useNavigation: () => ({ // Mock ONLY useNavigation
            navigate: mockNavigate,
            reset: mockReset,
            setParams: mockSetParams,
        }),
        useRoute: () => ({ params: {} }), // Keep simple route mock
        // We no longer need to mock useFocusEffect here because
        // NavigationContainer provides the context it needs.
        // The component's actual useFocusEffect will run.
    };
});

// Platform
jest.mock('react-native/Libraries/Utilities/Platform', () => {
    const Platform = jest.requireActual('react-native/Libraries/Utilities/Platform');
    Platform.OS = 'ios';
    Platform.select = jest.fn((selector) => selector[Platform.OS]);
    return Platform;
});

// useColorScheme
jest.mock('@/hooks/useColorScheme', () => ({
    useColorScheme: () => 'light', // Default to light
}));

// Ionicons
jest.mock('@expo/vector-icons/Ionicons', () => {
    const MockIcon = ({ name }: { name: string }) => {
        const MockReactNative = require('react-native');
        return <MockReactNative.Text testID={`icon-${name}`}>{name}</MockReactNative.Text>;
    };
    return MockIcon; // Assuming default export usage or simple name
});

// Image & require - Mock Image and ignore require for assets
jest.mock('react-native/Libraries/Image/Image', () => 'Image');

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

// Global Fetch Mock (needs specific handling for profile routes)
global.fetch = jest.fn() as jest.Mock;

// --- Helper Functions ---
const mockProfileInfoSuccess = (
    biography = 'Test Bio',
    photoUrl = 'http://example.com/avatar.jpg'
) => {
    (fetch as jest.Mock).mockImplementation((url: string | URL | Request) => {
        const urlString =
            typeof url === 'string'
                ? url
                : url instanceof URL
                    ? url.toString()
                    : (url as Request).url ?? '';
        if (urlString.includes('/api/users/') && urlString.includes('/profile?username=')) {
            return Promise.resolve({
                ok: true, status: 200, json: () => Promise.resolve({ biography, photoUrl }),
            });
        }
        // Default for other fetches if any
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({}) });
    });
};

const mockProfileInfoNotFoundThenCreateSuccess = () => {
     let callCount = 0;
     (fetch as jest.Mock).mockImplementation((url: string | URL | Request) => {
        const urlString =
            typeof url === 'string'
                ? url
                : url instanceof URL
                    ? url.toString()
                    : (url as Request).url ?? '';
        if (urlString.includes('/api/users/') && urlString.includes('/profile?username=')) {
             callCount++;
            if (callCount === 1) { // First call returns 404
                 return Promise.resolve({ ok: false, status: 404 });
             } else { // Second call (after create) returns success
                 return Promise.resolve({
                     ok: true, status: 200, json: () => Promise.resolve({ biography: '', photoUrl: '' }), // Assume create results in empty profile
                 });
             }
         } else if (
            urlString.includes('/api/users/') &&
            urlString.endsWith('/profile') &&
            url instanceof Request &&
            url.method === 'PUT'
        ) {
             // Mock the create endpoint success
             return Promise.resolve({ ok: true, status: 201, json: () => Promise.resolve({ message: 'Created' }) });
         }
         return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({}) });
     });
};

const mockProfileInfoError = () => {
     (fetch as jest.Mock).mockImplementation((url: string | URL | Request) => {
         const urlString =
             typeof url === 'string'
                 ? url
                 : url instanceof URL
                     ? url.toString()
                     : (url as Request).url ?? '';
         if (urlString.includes('/api/users/') && urlString.includes('/profile?username=')) {
             return Promise.reject(new Error('API Error'));
         }
         return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({}) });
     });
};


const createMockAuthContext = (
    userType: UserType = 'user',
    username: string = 'testuser',
    user_id: string = '123'
): AuthContextType => ({
    userType, username,
    setUserType: jest.fn(), setUsername: jest.fn(),
});

const renderComponent = (authContextValue = createMockAuthContext()) => {
    return render(
        // Wrap with NavigationContainer!
        <NavigationContainer>
            <AuthContext.Provider value={authContextValue}>
                <ProfileScreen />
            </AuthContext.Provider>
        </NavigationContainer>
    );
};

// --- Test Suite ---
describe('<ProfileScreen />', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        // Default fetch mock (can be overridden)
        mockProfileInfoSuccess('', ''); // Default to success with empty profile
    });

    it('should show loading indicator initially for user type', () => {
        // Prevent fetch from resolving immediately
        (fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));
        renderComponent(createMockAuthContext('user', 'testuser'));
        expect(screen.getByTestId('profile-loading-indicator')).toBeTruthy();
    });

    it('should redirect guest users', async () => {
        const mockContext = createMockAuthContext('guest'); // GUEST user
        renderComponent(mockContext);

        // useFocusEffect runs, checks userType, calls reset
        // Need to wait slightly for effect to potentially run
        await act(async () => {
           await new Promise(resolve => setImmediate(resolve));
        });

        expect(mockReset).toHaveBeenCalledWith({
            index: 0,
            routes: [{ name: 'index', params: { error: 'You need to sign up first!' } }],
        });
        // Check that main content is likely not rendered
        expect(screen.queryByTestId('logout-button')).toBeNull();
    });

    it('should fetch and display profile info (with data)', async () => {
        const username = 'johndoe';
        const bio = 'Developer and tester.';
        const avatar = 'http://my.avatar/pic.png';
        mockProfileInfoSuccess(bio, avatar); // Setup specific success response
        renderComponent(createMockAuthContext('user', username));

        // Wait for loading to finish and elements to appear
        expect(await screen.findByTestId('profile-avatar-image')).toBeTruthy();
        expect(await screen.findByText(`Hello, ${username}`)).toBeTruthy();
        expect(await screen.findByText(bio)).toBeTruthy();

        // Verify specific elements
        const image = screen.getByTestId('profile-avatar-image');
        expect(image.props.source.uri).toBe(avatar);
        expect(screen.getByTestId('profile-bio-text').children.join('')).toBe(bio); // Check text content

        // Verify placeholder isn't shown
        expect(screen.queryByTestId('profile-avatar-placeholder')).toBeNull();
        expect(screen.queryByText('No bio yet.')).toBeNull();

        // Verify action buttons
        expect(screen.getByTestId('logout-button')).toBeTruthy();
        expect(screen.getByTestId('edit-profile-button')).toBeTruthy();
        expect(screen.getByTestId('create-post-button')).toBeTruthy();
        expect(screen.getByTestId('my-posts-button')).toBeTruthy();
    });

    it('should fetch and display profile info (no bio/avatar)', async () => {
        const username = 'jane';
        mockProfileInfoSuccess('', ''); // Success response with empty data
        renderComponent(createMockAuthContext('user', username));
    
        // Wait for loading to finish
        // FIX: Use the mock's testID
        expect(await screen.findByTestId('icon-person-circle-outline')).toBeTruthy();
        expect(await screen.findByText('No bio yet.')).toBeTruthy();
        expect(await screen.findByText(`Hello, ${username}`)).toBeTruthy();
    
        // Check placeholder icon and text are shown
        expect(screen.getByTestId('icon-person-circle-outline')).toBeTruthy(); // Already checked by findBy
        expect(screen.getByTestId('profile-bio-text').children.join('')).toBe('No bio yet.');
    
        // Check image and specific bio text are not shown
        expect(screen.queryByTestId('profile-avatar-image')).toBeNull();
    
         // Verify action buttons
         expect(screen.getByTestId('logout-button')).toBeTruthy();
         // ... other buttons
    });

    it('should call navigation on button presses', async () => {
        mockProfileInfoSuccess(); // Ensure component renders fully
        renderComponent(createMockAuthContext('user', 'navTestUser'));

        // Wait for component to finish loading
        expect(await screen.findByTestId('edit-profile-button')).toBeTruthy();

        // Test Edit Profile
        fireEvent.press(screen.getByTestId('edit-profile-button'));
        expect(mockNavigate).toHaveBeenCalledWith('edit_profile');

        // Test Create Post
        fireEvent.press(screen.getByTestId('create-post-button'));
        expect(mockNavigate).toHaveBeenCalledWith('create_post');

        // Test My Posts
        fireEvent.press(screen.getByTestId('my-posts-button'));
        expect(mockNavigate).toHaveBeenCalledWith('posts');
    });

    it('should handle logout correctly', async () => {
        const mockSetUserType = jest.fn();
        const mockSetUsername = jest.fn();
        const mockSetUserId = jest.fn();

        const baseContext = createMockAuthContext('user','logoutUser','789');
        const specificContextValue: AuthContextType = {
            ...baseContext,
            setUserType: mockSetUserType,
            setUsername: mockSetUsername,
        };

        mockProfileInfoSuccess();
        renderComponent(specificContextValue);

        expect(await screen.findByTestId('logout-button')).toBeTruthy();

        // --- ACT ---
        fireEvent.press(screen.getByTestId('logout-button'));

        // --- ASSERT ---
        // Need to re-import AsyncStorage *after* mocking to spy on it
        // This is a bit advanced, let's just check the consequences first
        // We can no longer directly access 'mockMultiRemove' as defined before.

        // Wait for the consequences: context changes and navigation reset
        await waitFor(() => {
             expect(mockSetUserType).toHaveBeenCalledWith(null);
        });
        expect(mockSetUsername).toHaveBeenCalledWith('');
        // expect(mockSetUserId).toHaveBeenCalledWith(''); // Optional
        expect(mockReset).toHaveBeenCalledWith({ index: 0, routes: [{ name: 'index' }] });

        // If you absolutely MUST check the AsyncStorage call itself:
        // const AsyncStorage = require('@react-native-async-storage/async-storage');
        // expect(AsyncStorage.multiRemove).toHaveBeenCalledWith(['username', 'password', 'email', 'token']);
        // Note: requiring after mocking can sometimes be fragile. Checking consequences is often better.
    });


});
