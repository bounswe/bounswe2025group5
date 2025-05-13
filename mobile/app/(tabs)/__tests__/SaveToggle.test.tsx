// A test file to test the bookmark functionality
import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import ExploreScreen from '../explore';
import { AuthContext } from '../../_layout';
import { useFocusEffect } from 'expo-router';

// Mock navigation
const mockNavigate = jest.fn();
const mockSetParams = jest.fn();

// Mock React Navigation hooks
jest.mock('@react-navigation/native', () => {
    const actualNav = jest.requireActual('@react-navigation/native');
    return {
        ...actualNav,
        useNavigation: () => ({
            navigate: mockNavigate,
            setParams: mockSetParams,
        }),
        useRoute: () => ({params: {}}),
        useFocusEffect: (cb: any) => { cb()}
    };
});

// Mock Ionicons
jest.mock('@expo/vector-icons', () => ({
    Ionicons: () => null
}));

// Mock Alert
jest.spyOn(Alert, 'alert').mockImplementation((title, message) => null);

describe('Save Post Functionality', () => {
    const mockPost = {
        id: 1,
        creatorUsername: 'testuser',
        content: 'Test post',
        likes: 0,
        comments: [],
        photoUrl: null,
        savedByUser: false
    };

    const mockAuthContext = {
        userType: 'user',
        username: 'testuser',
        setUserType: jest.fn(),
        setUsername: jest.fn(),
    };

    beforeEach(() => {
        global.fetch = jest.fn(() => 
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve({ success: true })
            })
        ) as jest.Mock;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should toggle save state when save button is pressed', async () => {
        const { getByTestId } = render(
            <AuthContext.Provider value={mockAuthContext}>
                <ExploreScreen />
            </AuthContext.Provider>
        );

        const saveButton = getByTestId('save-toggle');
        
        // Initial state should be unsaved
        expect(saveButton.props.children[1].props.children).toBe('Save');

        // Press the save button
        await act(async () => {
            fireEvent.press(saveButton);
        });

        // Verify API call was made
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/api/posts/save'),
            expect.objectContaining({
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    username: 'testuser', 
                    postId: mockPost.id 
                })
            })
        );

        // Button text should change to "Saved"
        expect(saveButton.props.children[1].props.children).toBe('Saved');
    });

    it('should show login alert for guest users', async () => {
        const guestAuthContext = {
            ...mockAuthContext,
            userType: 'guest',
            username: null
        };

        const { getByTestId } = render(
            <AuthContext.Provider value={guestAuthContext}>
                <ExploreScreen />
            </AuthContext.Provider>
        );

        const saveButton = getByTestId('save-toggle');
        
        await act(async () => {
            fireEvent.press(saveButton);
        });

        expect(Alert.alert).toHaveBeenCalledWith(
            "Login Required",
            "Please log in to save posts."
        );
    });

    it('should handle save API error gracefully', async () => {
        global.fetch = jest.fn(() => Promise.reject('API Error')) as jest.Mock;

        const { getByTestId } = render(
            <AuthContext.Provider value={mockAuthContext}>
                <ExploreScreen />
            </AuthContext.Provider>
        );

        const saveButton = getByTestId('save-toggle');
        
        await act(async () => {
            fireEvent.press(saveButton);
        });

        // Should revert to original state on error
        expect(saveButton.props.children[1].props.children).toBe('Save');
    });
});