import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';

import ExploreScreen from '../explore';
import { AuthContext, UserType } from '../../_layout';

// Mock Ionicons so we can detect icon names
jest.mock('@expo/vector-icons', () => {
    const { Text } = require('react-native');
    return {
      Ionicons: ({ name }: { name: string }) => <Text testID={`icon-${name}`}>{name}</Text>,
    };
  });

// Mock ThemedText
jest.mock('@/components/ThemedText', () => ({
  ThemedText: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock fetch globally
global.fetch = jest.fn((url: RequestInfo | URL, options?: RequestInit) => {
  const urlString =
    typeof url === 'string'
      ? url
      : url instanceof URL
        ? url.toString()
        : (url as Request)?.url ?? '';

  if (urlString.includes('/api/posts?')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve([
        {
          postId: 1,
          creatorUsername: 'testuser',
          content: 'Test content',
          likes: 5,
          comments: [],
          photoUrl: null,
        },
      ]),
    });
  }

  if (urlString.includes('/api/posts/') && urlString.includes('/likes')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ likedByUsers: [] }),
    });
  }

  if (urlString.includes('/api/users/') && urlString.includes('/saved-posts')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve([]),
    });
  }

  if (urlString.includes('/api/posts/like') || urlString.includes('/api/posts/save')) {
    return Promise.resolve({
      ok: true,
      text: () => Promise.resolve(JSON.stringify({ success: true, username: 'testuser' })),
    });
  }

  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  });
}) as any;

describe('ExploreScreen Post Interactions', () => {
  it('toggles like and save icons on press', async () => {
    const screen = render(
        <NavigationContainer>
      <AuthContext.Provider value={{ userType: 'user' as UserType, username: 'testuser', setUserType:jest.fn(), setUsername:jest.fn() }}>
        <ExploreScreen />
      </AuthContext.Provider>
      </NavigationContainer>
    );

    // Wait for post to load
    await waitFor(() => {
        expect(screen.getByTestId('post-1')).toBeTruthy();
      });
      

    // Like button and icon
    const likeButton = screen.getByTestId('like-toggle');
    expect(screen.queryByTestId('icon-heart-outline')).toBeTruthy(); // Initially not liked

    fireEvent.press(likeButton);

    // Wait for UI to reflect the change
    await waitFor(() => {
      expect(screen.queryByTestId('icon-heart')).toBeTruthy(); // Now liked
    });

    // Save button and icon
    const saveButton = screen.getByTestId('save-toggle');
    expect(screen.queryByTestId('icon-bookmark-outline')).toBeTruthy(); // Initially not saved

    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(screen.queryByTestId('icon-bookmark')).toBeTruthy(); // Now saved
    });
  });
});
