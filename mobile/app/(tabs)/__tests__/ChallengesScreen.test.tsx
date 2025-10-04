// __tests__/screens/ChallengesScreen.test.tsx

import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react-native';
import { Text, View, Platform } from 'react-native'; // For mocks

// --- ADJUST PATHS ---
import ChallengesScreen from '../challenges'; // Path to your component
// Assuming context is in app/context/AuthContext.tsx
import { AuthContext, AuthContextType, UserType } from '../../_layout'; // ADJUST PATH if needed
// Assuming types are defined/exported elsewhere or define them here

type Challenge = {
    challengeId: number;
    name: string;
    description: string;
    amount: number;
    startDate: string;
    endDate: string;
    status: string;
    wasteType: string;
    attendee: boolean;
  };
  
type LeaderboardEntry = {
    userId: number;
    username: string;
    remainingAmount: number;
  };

// --- Mock Dependencies ---

// Mock ThemedText
jest.mock('@/components/ThemedText', () => {
    const MockReactNative = require('react-native');
    const MockThemedText = ({ children, style, ...props }: any) => (
        <MockReactNative.Text style={style} {...props}>{children}</MockReactNative.Text>
    );
    return { ThemedText: MockThemedText };
});

// Mock Platform
jest.mock('react-native/Libraries/Utilities/Platform', () => {
    const Platform = jest.requireActual('react-native/Libraries/Utilities/Platform');
    Platform.OS = 'ios'; // Default mock OS, change if needed for specific tests
    Platform.select = jest.fn((selector) => selector[Platform.OS]);
    return Platform;
});

// Mock useColorScheme hook
jest.mock('@/hooks/useColorScheme', () => ({
    // Default mock scheme, change if needed for specific tests
    useColorScheme: () => 'light',
}));

// Smarter Fetch Mock
global.fetch = jest.fn() as jest.Mock; // Initialize as Jest mock

// --- Helper Functions ---

// Sample Challenge Data
const mockChallengeData: Challenge[] = [
    { challengeId: 1, name: 'Reduce Plastic', description: 'Cut down plastic use', amount: 10, startDate: '2024-01-01', endDate: '2024-01-31', status: 'Completed', wasteType: 'Plastic', attendee: true },
    { challengeId: 2, name: 'Compost Masters', description: 'Compost food scraps', amount: 5, startDate: '2024-02-01', endDate: '2024-02-28', status: 'Active', wasteType: 'Organic', attendee: true },
    { challengeId: 3, name: 'Paperless Office', description: 'Go digital', amount: 20, startDate: '2024-03-01', endDate: '2024-03-31', status: 'Active', wasteType: 'Paper', attendee: false },
];

// AuthContext Mock Setup
const createMockAuthContext = (
    userType: UserType = 'user',
    username: string = 'testuser',
    user_id: string = '123'
): AuthContextType => ({
    userType, username,
    setUserType: jest.fn(), setUsername: jest.fn(),
});

// Render Helper
const renderComponent = (authContextValue = createMockAuthContext()) => {
    return render(
        <AuthContext.Provider value={authContextValue}>
            <ChallengesScreen />
        </AuthContext.Provider>
    );
};

// --- Test Suite ---
describe('<ChallengesScreen />', () => {

    // Reset mocks before each test
    beforeEach(() => {
        jest.clearAllMocks();
        // Default successful fetch mock for challenges
        (fetch as jest.Mock).mockResolvedValue({
            ok: true,
            status: 200,
            json: jest.fn().mockResolvedValue(mockChallengeData), // Provide default mock data
        });
    });

    // --- Test Case 1: Initial Loading State ---
    it('should show full screen loading indicator initially', () => {
        // Make fetch take time / don't resolve it immediately for loading state
        (fetch as jest.Mock).mockImplementationOnce(() => new Promise(() => {})); // Pending promise

        renderComponent();

        // Assuming you added testID="full-screen-loading"
        expect(screen.getByTestId('full-screen-loading')).toBeTruthy();
        // Check that list is not yet rendered
        expect(screen.queryByTestId('challenges-list')).toBeNull();
    });


    // --- Test Case 2: Successful Load and Display ---
    it('should display challenges list after successful fetch', async () => {
        renderComponent();

        // Wait for the list items to appear based on mock data
        // Use findBy* which waits for elements
        expect(await screen.findByText('Reduce Plastic')).toBeTruthy();
        expect(await screen.findByText('Compost Masters')).toBeTruthy();
        expect(await screen.findByText('Paperless Office')).toBeTruthy();

        // Check filters are present
        expect(screen.getByTestId('attended-only-switch')).toBeTruthy();
        expect(screen.getByTestId('active-only-switch')).toBeTruthy();

        // Check loading indicators are gone
        expect(screen.queryByTestId('full-screen-loading')).toBeNull();
        expect(screen.queryByTestId('inline-loading')).toBeNull(); // Also check inline one
    });

    it('should display error message if initial fetch fails', async () => {
        // Mock fetch to simulate an error
        (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network Error'));
    
        renderComponent();
    
        // Wait for the error message to appear
        const errorMessage = await screen.findByText('Failed to load challenges');
        expect(errorMessage).toBeTruthy();
    
        // FIX: Instead of checking for the list component's absence,
        // check that specific list items (from mockData) are NOT rendered.
        expect(screen.queryByText('Reduce Plastic')).toBeNull();
        expect(screen.queryByText('Compost Masters')).toBeNull();
        // Check that the "No challenges match your filters" text is also not shown
        expect(screen.queryByText(/No challenges match/i)).toBeNull();
    
    
        // Check loading indicators are not present
        expect(screen.queryByTestId('full-screen-loading')).toBeNull();
        expect(screen.queryByTestId('inline-loading')).toBeNull();
    });


    // --- Test Case 4: Filtering - Attended Only ---
    it('should filter challenges when "Attended only" switch is toggled', async () => {
        renderComponent();

        // Wait for initial list
        expect(await screen.findByText('Reduce Plastic')).toBeTruthy();
        expect(await screen.findByText('Compost Masters')).toBeTruthy();
        expect(await screen.findByText('Paperless Office')).toBeTruthy();

        // Find the switch
        const attendedSwitch = screen.getByTestId('attended-only-switch');

        // --- ACT ---
        // Toggle the switch ON
        fireEvent(attendedSwitch, 'valueChange', true);

        // --- ASSERT ---
        // Check that only attended challenges are visible
        // Need waitFor because filtering might cause a re-render asynchronously
        await waitFor(() => {
            expect(screen.getByText('Reduce Plastic')).toBeTruthy();
            expect(screen.getByText('Compost Masters')).toBeTruthy();
            // Paperless Office was attendee: false in mock data
            expect(screen.queryByText('Paperless Office')).toBeNull();
        });

         // --- ACT ---
        // Toggle the switch OFF
        fireEvent(attendedSwitch, 'valueChange', false);

        // --- ASSERT ---
        // Check that all challenges are visible again
        await waitFor(() => {
             expect(screen.getByText('Reduce Plastic')).toBeTruthy();
             expect(screen.getByText('Compost Masters')).toBeTruthy();
             expect(screen.getByText('Paperless Office')).toBeTruthy();
         });
    });


     // --- Test Case 5: Filtering - Active Only ---
    it('should filter challenges when "Active only" switch is toggled', async () => {
        renderComponent();

        // Wait for initial list
        expect(await screen.findByText('Reduce Plastic')).toBeTruthy(); // Completed
        expect(await screen.findByText('Compost Masters')).toBeTruthy(); // Active
        expect(await screen.findByText('Paperless Office')).toBeTruthy(); // Active

        const activeSwitch = screen.getByTestId('active-only-switch');

        // --- ACT ---
        fireEvent(activeSwitch, 'valueChange', true);

        // --- ASSERT ---
        await waitFor(() => {
            // Completed challenge should be hidden
            expect(screen.queryByText('Reduce Plastic')).toBeNull();
            // Active ones should be visible
            expect(screen.getByText('Compost Masters')).toBeTruthy();
            expect(screen.getByText('Paperless Office')).toBeTruthy();
        });

        // --- ACT ---
        fireEvent(activeSwitch, 'valueChange', false);

         // --- ASSERT ---
         await waitFor(() => {
             expect(screen.getByText('Reduce Plastic')).toBeTruthy();
             expect(screen.getByText('Compost Masters')).toBeTruthy();
             expect(screen.getByText('Paperless Office')).toBeTruthy();
         });
    });

    // --- Add more tests here later for: ---
    // - Challenge expansion / collapsing
    // - Attend / Leave button press and fetch call
    // - End challenge button visibility/press for admin
    // - View Leaderboard button press, fetch call, modal display, modal close

});