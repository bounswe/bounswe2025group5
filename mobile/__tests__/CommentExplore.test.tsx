import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import ExploreScreen from '../app/(tabs)/explore';
import { AuthContext } from '../app/_layout';
import { apiRequest } from '../app/services/apiClient';
import { useTranslation } from 'react-i18next';

// Mocks
jest.mock('../app/services/apiClient', () => ({
  apiRequest: jest.fn(),
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

// Remove PostItem mock to use the real component for integration testing
// jest.mock('../app/components/PostItem', ...); 

jest.mock('expo-font', () => ({
  isLoaded: jest.fn(() => true),
  loadAsync: jest.fn(() => Promise.resolve()),
  useFonts: jest.fn(() => [true, null]),
}));

jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: jest.fn(),
      addListener: jest.fn(),
    }),
    useFocusEffect: (callback: () => void) => {
      const React = require('react');
      React.useEffect(callback, []);
    },
  };
});

jest.mock('../app/apiConfig', () => ({
  apiUrl: (path: string) => `http://localhost:8080${path}`,
}));

// Mock InteractionManager
jest.mock('react-native/Libraries/Interaction/InteractionManager', () => ({
  runAfterInteractions: jest.fn((callback) => {
    callback();
    return { cancel: jest.fn() };
  }),
  createInteractionHandle: jest.fn(),
  clearInteractionHandle: jest.fn(),
}));

describe('ExploreScreen Comment Functionalities', () => {
  const mockUser = {
    userType: 'user' as const,
    username: 'testuser',
    setUserType: jest.fn(),
    setUsername: jest.fn(),
  };

  const mockPost = {
    postId: 1,
    creatorUsername: 'otheruser',
    content: 'Test Post Content',
    likes: 5,
    comments: 2,
    photoUrl: null,
    likedByUser: false,
    savedByUser: false,
    createdAt: new Date().toISOString(),
  };

  const mockComments = [
    {
      commentId: 101,
      creatorUsername: 'commenter1',
      content: 'First comment',
      createdAt: new Date().toISOString(),
    },
    {
      commentId: 102,
      creatorUsername: 'testuser', // Own comment
      content: 'My comment',
      createdAt: new Date().toISOString(),
    },
  ];

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
            
            if (options) {
                Object.keys(options).forEach(k => {
                    if (typeof options[k] === 'string' || typeof options[k] === 'number') {
                        value = value.replace(`{{${k}}}`, String(options[k]));
                    }
                });
            }
            return value;
        },
        i18n: { 
            language: currentLanguage, 
            resolvedLanguage: currentLanguage,
            changeLanguage: (lang: string) => {
                currentLanguage = lang;
                return Promise.resolve();
            }
        },
    }));

    (apiRequest as jest.Mock).mockImplementation((url, options) => {
      if (url.includes('/api/posts/1/comments') && !options) {
        // Fetch comments
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ comments: mockComments }),
        });
      }
      if (url.includes('/api/posts') && !options) {
        // Fetch posts
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([mockPost]),
        });
      }
      if (url.includes('/api/users/') && url.includes('/profile')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ photoUrl: null }) });
      }
      return Promise.resolve({ ok: false, status: 404 });
    });
  });

  it('fetches and displays comments when post comments are toggled', async () => {
    const { getByText, queryByText } = render(
      <AuthContext.Provider value={mockUser}>
        <ExploreScreen />
      </AuthContext.Provider>
    );

    // Wait for posts to load
    await waitFor(() => expect(getByText('Test Post Content')).toBeTruthy());

    // Comments should not be visible initially
    expect(queryByText('First comment')).toBeNull();

    // Find comment toggle button (it has the comment count)
    const commentButton = getByText('2'); 
    fireEvent.press(commentButton);

    // Verify API call
    await waitFor(() => {
      expect(apiRequest).toHaveBeenCalledWith(expect.stringContaining('/api/posts/1/comments'));
    });

    // Verify comments are displayed
    await waitFor(() => {
      expect(getByText('First comment')).toBeTruthy();
      expect(getByText('My comment')).toBeTruthy();
    });
  });

  it('allows posting a new comment', async () => {
    (apiRequest as jest.Mock).mockImplementation((url, options) => {
        if (url.includes('/api/posts/1/comments') && !options) {
            return Promise.resolve({ ok: true, json: () => Promise.resolve({ comments: mockComments }) });
        }
        if (url.includes('/api/posts/1/comments') && options?.method === 'POST') {
            const body = JSON.parse(options.body);
            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve({
                    commentId: 103,
                    content: body.content,
                    creatorUsername: body.username,
                    createdAt: new Date().toISOString(),
                }),
            });
        }
        if (url.includes('/api/posts') && !options) {
            return Promise.resolve({ ok: true, json: () => Promise.resolve([mockPost]) });
        }
        return Promise.resolve({ ok: false });
    });

    const { getByText, getByPlaceholderText, getByTestId } = render(
      <AuthContext.Provider value={mockUser}>
        <ExploreScreen />
      </AuthContext.Provider>
    );

    await waitFor(() => expect(getByText('Test Post Content')).toBeTruthy());
    fireEvent.press(getByText('2')); // Open comments

    await waitFor(() => expect(getByText('First comment')).toBeTruthy());

    const input = getByPlaceholderText('Add a comment...');
    fireEvent.changeText(input, 'New test comment');
    
    const postButton = getByTestId('post-comment-button');
    fireEvent.press(postButton);

    await waitFor(() => {
        expect(apiRequest).toHaveBeenCalledWith(
            expect.stringContaining('/api/posts/1/comments'),
            expect.objectContaining({
                method: 'POST',
                body: expect.stringContaining('New test comment'),
            })
        );
    });

    // Verify new comment is displayed
    await waitFor(() => expect(getByText('New test comment')).toBeTruthy());
  });

  it('allows deleting a comment', async () => {
    (apiRequest as jest.Mock).mockImplementation((url, options) => {
        if (url.includes('/api/posts/1/comments') && !options) {
            return Promise.resolve({ ok: true, json: () => Promise.resolve({ comments: mockComments }) });
        }
        if (url.includes('/api/posts/comment/102') && options?.method === 'DELETE') {
            return Promise.resolve({ ok: true, text: () => Promise.resolve('Deleted') });
        }
        if (url.includes('/api/posts') && !options) {
            return Promise.resolve({ ok: true, json: () => Promise.resolve([mockPost]) });
        }
        return Promise.resolve({ ok: false });
    });

    const { getByText, getByLabelText, queryByText } = render(
      <AuthContext.Provider value={mockUser}>
        <ExploreScreen />
      </AuthContext.Provider>
    );

    await waitFor(() => expect(getByText('Test Post Content')).toBeTruthy());
    fireEvent.press(getByText('2')); // Open comments

    await waitFor(() => expect(getByText('My comment')).toBeTruthy());

    const deleteButton = getByLabelText('Delete comment');
    fireEvent.press(deleteButton);

    await waitFor(() => {
        expect(apiRequest).toHaveBeenCalledWith(
            expect.stringContaining('/api/posts/comment/102'),
            expect.objectContaining({ method: 'DELETE' })
        );
    });

    // Verify comment is removed
    await waitFor(() => expect(queryByText('My comment')).toBeNull());
  });

  it('allows editing a comment', async () => {
    (apiRequest as jest.Mock).mockImplementation((url, options) => {
        if (url.includes('/api/posts/1/comments') && !options) {
            return Promise.resolve({ ok: true, json: () => Promise.resolve({ comments: mockComments }) });
        }
        if (url.includes('/api/posts/comment/102') && options?.method === 'PUT') {
            const body = JSON.parse(options.body);
            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve({
                    commentId: 102,
                    content: body.content,
                    creatorUsername: body.username,
                    createdAt: new Date().toISOString(),
                }),
            });
        }
        if (url.includes('/api/posts') && !options) {
            return Promise.resolve({ ok: true, json: () => Promise.resolve([mockPost]) });
        }
        return Promise.resolve({ ok: false });
    });

    const { getByText, getByLabelText, getByDisplayValue, getAllByText } = render(
      <AuthContext.Provider value={mockUser}>
        <ExploreScreen />
      </AuthContext.Provider>
    );

    await waitFor(() => expect(getByText('Test Post Content')).toBeTruthy());
    fireEvent.press(getByText('2')); // Open comments

    await waitFor(() => expect(getByText('My comment')).toBeTruthy());

    const editButton = getByLabelText('Edit comment');
    fireEvent.press(editButton);

    // Input should appear with current text
    const editInput = getByDisplayValue('My comment');
    fireEvent.changeText(editInput, 'Updated comment text');

    // There are two "Save" buttons: one for the post (bookmark) and one for the comment edit.
    // The post save button is rendered first.
    const saveButtons = getAllByText('Save');
    const saveCommentButton = saveButtons[saveButtons.length - 1]; // The last one should be the comment save button
    fireEvent.press(saveCommentButton);

    await waitFor(() => {
        expect(apiRequest).toHaveBeenCalledWith(
            expect.stringContaining('/api/posts/comment/102'),
            expect.objectContaining({
                method: 'PUT',
                body: expect.stringContaining('Updated comment text'),
            })
        );
    });

    // Verify updated text is displayed
    await waitFor(() => expect(getByText('Updated comment text')).toBeTruthy());
  });

  it('opens report modal with correct text when reporting a comment', async () => {
    const { getByText, getAllByLabelText } = render(
      <AuthContext.Provider value={mockUser}>
        <ExploreScreen />
      </AuthContext.Provider>
    );

    await waitFor(() => expect(getByText('Test Post Content')).toBeTruthy());
    fireEvent.press(getByText('2')); // Open comments

    await waitFor(() => expect(getByText('First comment')).toBeTruthy());

    // 'First comment' is by 'commenter1', current user is 'testuser'. So report button should be visible.
    // In CommentItemDisplay, report button has accessibilityLabel="Report comment"
    // There might be multiple comments, so we use getAllByLabelText and pick the first one (which corresponds to 'First comment' if rendered first)
    // Actually mockComments order: 101 (commenter1), 102 (testuser).
    // 102 is owner, so no report button. 101 is not owner, so report button.
    // So there should be only one "Report comment" button.
    const reportButtons = getAllByLabelText('Report comment');
    expect(reportButtons.length).toBeGreaterThan(0);
    fireEvent.press(reportButtons[0]);

    // Verify Report Modal is visible
    // ReportModal title is t('reportCommentTitle') -> "Report Comment"
    await waitFor(() => expect(getByText('Report Comment')).toBeTruthy());
    
    // Verify content snippet is visible
    expect(getByText('First comment')).toBeTruthy();
    
    // Verify "Send Report" button
    expect(getByText('Send Report')).toBeTruthy();
  });

  it('displays correct texts in Turkish and English', async () => {
    // Switch to Turkish
    currentLanguage = 'tr';
    
    const { getByText, getByPlaceholderText, rerender, unmount } = render(
      <AuthContext.Provider value={mockUser}>
        <ExploreScreen />
      </AuthContext.Provider>
    );

    await waitFor(() => expect(getByText('Test Post Content')).toBeTruthy());
    
    // Check "Explore Global" -> "Keşfet" (based on tr.json "exploreGlobal": "Keşfet")
    expect(getByText('Keşfet')).toBeTruthy();

    // Open comments
    fireEvent.press(getByText('2'));
    
    // Check placeholder "Yorum ekle..." (tr.json "addACommentPlaceholder": "Yorum ekle...")
    await waitFor(() => expect(getByPlaceholderText('Yorum ekle...')).toBeTruthy());

    unmount();

    // Switch to English
    currentLanguage = 'en';
    const { getByText: getByTextEn, getByPlaceholderText: getByPlaceholderTextEn } = render(
      <AuthContext.Provider value={mockUser}>
        <ExploreScreen />
      </AuthContext.Provider>
    );

    await waitFor(() => expect(getByTextEn('Test Post Content')).toBeTruthy());

    // Check "Explore Global" -> "Explore Global"
    expect(getByTextEn('Explore Global')).toBeTruthy();
    
    // Open comments
    fireEvent.press(getByTextEn('2'));

    // Check placeholder "Add a comment..."
    await waitFor(() => expect(getByPlaceholderTextEn('Add a comment...')).toBeTruthy());
  });
});
