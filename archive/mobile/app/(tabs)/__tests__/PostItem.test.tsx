// __tests__/components/PostItem.test.tsx

import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { Alert, Text, ActivityIndicator } from 'react-native'; 

import PostItem from '../../components/PostItem'; 


interface CommentData {
    commentId: number;
    username: string;
    content: string;
    createdAt: string | Date; 
}

type Post = {
    id: number;
    title: string;
    content: string;
    likes: number;
    comments: number;
    photoUrl: string | null;
    likedByUser: boolean;
    savedByUser: boolean;
  };


jest.mock('expo-font', () => ({
  loadAsync: jest.fn().mockResolvedValue(undefined),
  isLoaded: jest.fn().mockReturnValue(true),
}));

jest.mock('@expo/vector-icons', () => {
    const MockIcon = ({ name }: { name: string; size?: number; color?: string }) => {
      const MockReactNative = require('react-native');

      return <MockReactNative.Text testID={`icon-${name}`}>{name}</MockReactNative.Text>;
    };

    return {
       Ionicons: MockIcon,

    };
});

jest.mock('@/components/ThemedText', () => {
    const MockReactNative = require('react-native');
    const MockThemedText = ({ children, style, ...props }: any) => (
      <MockReactNative.Text style={style} {...props}>
        {children}
      </MockReactNative.Text>
    );
    return { ThemedText: MockThemedText };
});

jest.mock('react-native/Libraries/Image/Image', () => 'Image');

jest.spyOn(Alert, 'alert');

// before you render <HomeScreen />
// Mock WeatherService definition
  

const createMockPost = (overrides: Partial<Post> = {}): Post => ({
  id: 1,
  title: 'Test User',
  content: 'Test post content here.',
  likes: 10,
  comments: 2,
  photoUrl: null,
  likedByUser: false,
  savedByUser: false,
  ...overrides,
});

const createMockProps = (overrides: Partial<any> = {}) => {
  const defaultPost = createMockPost(overrides.post);
  return {
    post: defaultPost,
    cardBackgroundColor: '#ffffff',
    iconColor: '#000000',
    textColor: '#000000',
    commentInputBorderColor: '#cccccc',
    commentInputTextColor: '#000000',
    commentInputPlaceholderColor: '#888888',
    commentInputBackgroundColor: '#eeeeee',
    onLikePress: jest.fn(),
    userType: 'user',
    loggedInUsername: 'testuser',
    isExpanded: false,
    commentsList: [] as CommentData[],
    isLoadingComments: false,
    commentInputText: '',
    isPostingComment: false,
    onToggleComments: jest.fn(),
    onCommentInputChange: jest.fn(),
    onPostComment: jest.fn(),
    onDeleteComment: jest.fn(),
    onTriggerEditComment: jest.fn(),
    editingCommentDetailsForPost: null,
    onEditCommentContentChange: jest.fn(),
    onSaveEditedCommentForPost: jest.fn(),
    onCancelCommentEdit: jest.fn(),
    onSavePress: jest.fn(), // Add mock implementation for onSavePress
    isSubmittingCommentEditForPost: false,
    ...overrides,
  };
};

describe('<PostItem /> Rendering Logic', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // Test Case 1: Filled heart icon
    it('should render a filled heart icon when post.likedByUser is true', () => {
        const props = createMockProps({ post: { likedByUser: true } });
        render(<PostItem {...props} />);
        // Check using the testID provided by our Ionicons mock
        expect(screen.getByTestId('icon-heart')).toBeTruthy();
        expect(screen.queryByTestId('icon-heart-outline')).toBeNull();
    });

    // Test Case 2: Outline heart icon
    it('should render an outline heart icon when post.likedByUser is false', () => {
        const props = createMockProps({ post: { likedByUser: false } });
        render(<PostItem {...props} />);
        // Check using the testID provided by our Ionicons mock
        expect(screen.getByTestId('icon-heart-outline')).toBeTruthy();
        expect(screen.queryByTestId('icon-heart')).toBeNull();
    });

    // Test Case 3: Comment input visible
    it('should render comment input section when expanded and user is NOT guest', () => {
        const props = createMockProps({
            isExpanded: true,
            userType: 'user',
        });
        render(<PostItem {...props} />);
        expect(screen.getByPlaceholderText('Add a comment...')).toBeTruthy();
        expect(screen.getByText('Post')).toBeTruthy(); // Check the text inside the button
    });

    // Test Case 4: Comment input hidden (not expanded)
    it('should NOT render comment input section when NOT expanded', () => {
        const props = createMockProps({
            isExpanded: false,
            userType: 'user',
        });
        render(<PostItem {...props} />);
        expect(screen.queryByPlaceholderText('Add a comment...')).toBeNull();
        expect(screen.queryByText('Post')).toBeNull();
    });

    // Test Case 5: Comment input hidden (guest user)
    it('should NOT render comment input section when userType is guest, even if expanded', () => {
        const props = createMockProps({
            isExpanded: true,
            userType: 'guest',
        });
        render(<PostItem {...props} />);
        expect(screen.queryByPlaceholderText('Add a comment...')).toBeNull();
        expect(screen.queryByText('Post')).toBeNull();
    });

    // Test Case 6: Post button disabled (empty text)
    it('should disable the "Post" button when commentInputText is empty', () => {
        const props = createMockProps({
            isExpanded: true,
            userType: 'user',
            commentInputText: '',
        });
        render(<PostItem {...props} />);
        // Find the button using the testID you added in PostItem.tsx
        const postButtonTouchable = screen.getByTestId('post-comment-button');
        // Check its disabled state via accessibilityState
        expect(postButtonTouchable.props.accessibilityState).toHaveProperty('disabled', true);
    });

    // Test Case 7: Post button disabled (whitespace text)
    it('should disable the "Post" button when commentInputText contains only whitespace', () => {
        const props = createMockProps({
            isExpanded: true,
            userType: 'user',
            commentInputText: '   \n  ',
        });
        render(<PostItem {...props} />);
        // Find the button using the testID
        const postButtonTouchable = screen.getByTestId('post-comment-button');
        expect(postButtonTouchable.props.accessibilityState).toHaveProperty('disabled', true);
    });

    // Test Case 8: Post button disabled (isPostingComment)
    it('should disable the "Post" button when isPostingComment is true, even with text', () => {
        const props = createMockProps({
            isExpanded: true,
            userType: 'user',
            commentInputText: 'Valid comment text',
            isPostingComment: true, // Set to true
        });
        render(<PostItem {...props} />);
        // Find the button using the testID
        const postButtonTouchable = screen.getByTestId('post-comment-button');
        // Check disabled state
        expect(postButtonTouchable.props.accessibilityState).toHaveProperty('disabled', true);
        // Check that the "Post" text is NOT rendered (replaced by ActivityIndicator)
        expect(screen.queryByText('Post')).toBeNull();
    });

    // Test Case 9: Post button enabled
     it('should enable the "Post" button when there is text and not posting', () => {
        const props = createMockProps({
            isExpanded: true,
            userType: 'user',
            commentInputText: 'Valid Text', // Has text
            isPostingComment: false,        // Not posting
        });
        render(<PostItem {...props} />);
        const postButtonTouchable = screen.getByTestId('post-comment-button');
        expect(postButtonTouchable.props.accessibilityState?.disabled).toBeFalsy();
        expect(screen.getByText('Post')).toBeTruthy();
    });

}); 