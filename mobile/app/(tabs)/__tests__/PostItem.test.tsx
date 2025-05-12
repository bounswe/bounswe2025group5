import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { Alert } from 'react-native';
// Assuming PostItem is extracted and exported from a separate file
import PostItem from '../explore'; // Adjust path as needed

// --- Mock Dependencies ---

// Frontend Comment Type
type CommentData = {
    commentId: number;
    content: string;
    createdAt: string;
    username: string;
  };
  
type Post = {
    id: number;
    title: string;
    content: string;
    likes: number;
    comments: number;
    photoUrl: string | null;
    likedByUser: boolean;
  };

jest.mock('@expo/vector-icons/Ionicons', () => {
    // Mock Icon component that renders its name for easy checking
    const MockIcon = ({ name }: { name: string; size?: number; color?: string }) => <span data-testid={`icon-${name}`}>{name}</span>; // Using <span> for web-like test structure, adjust if needed
    return MockIcon;
});

// Mock ThemedText to just render children
jest.mock('@/components/ThemedText', () => ({
  ThemedText: ({ children, style }: any) => <span style={style}>{children}</span> // Simple mock
}));

// Mock Image component
jest.mock('react-native/Libraries/Image/Image', () => 'Image');

// Mock Alert
jest.spyOn(Alert, 'alert'); // Allows checking if Alert.alert was called

// --- Helper to create default props ---
const createMockPost = (overrides: Partial<Post> = {}): Post => ({
  id: 1,
  title: 'Test Post Title',
  content: 'Test post content here.',
  likes: 10,
  comments: 2,
  photoUrl: null,
  likedByUser: false,
  ...overrides,
});

const createMockProps = (overrides: Partial<any> = {}) => {
  const defaultPost = createMockPost(overrides.post); // Allow overriding post details

  return {
    post: defaultPost,
    cardBackgroundColor: '#fff',
    iconColor: '#000',
    textColor: '#000',
    commentInputBorderColor: '#ccc',
    commentInputTextColor: '#000',
    commentInputPlaceholderColor: '#888',
    commentInputBackgroundColor: '#eee',
    onLikePress: jest.fn(),
    userType: 'user', // Default to logged-in user for comment section tests initially
    loggedInUsername: 'testuser',
    isExpanded: false, // Default to not expanded
    commentsList: [] as CommentData[],
    isLoadingComments: false,
    commentInputText: '', // Default empty input for new comments
    isPostingComment: false, // Default not posting
    onToggleComments: jest.fn(),
    onCommentInputChange: jest.fn(),
    onPostComment: jest.fn(),
    onDeleteComment: jest.fn(),
    onTriggerEditComment: jest.fn(),
    editingCommentDetailsForPost: null,
    onEditCommentContentChange: jest.fn(),
    onSaveEditedCommentForPost: jest.fn(),
    onCancelCommentEdit: jest.fn(),
    isSubmittingCommentEditForPost: false,
    ...overrides,
  };
};


// --- Test Suite ---
describe('<PostItem /> Rendering Logic', () => {

    beforeEach(() => {
        // Clear mock calls before each test
        jest.clearAllMocks();
    });

    // --- Like Icon Tests ---
    it('should render a filled heart icon when post.likedByUser is true', () => {
        const props = createMockProps({ post: { likedByUser: true } });
        render(<PostItem {...props} />);

        // Check specifically for the 'heart' icon (filled)
        expect(screen.getByTestId('icon-heart')).toBeTruthy();
        // Ensure the outline version is NOT present
        expect(screen.queryByTestId('icon-heart-outline')).toBeNull();
    });

    it('should render an outline heart icon when post.likedByUser is false', () => {
        const props = createMockProps({ post: { likedByUser: false } }); // default is false, but explicit here
        render(<PostItem {...props} />);

        // Check specifically for the 'heart-outline' icon
        expect(screen.getByTestId('icon-heart-outline')).toBeTruthy();
        // Ensure the filled version is NOT present
        expect(screen.queryByTestId('icon-heart')).toBeNull();
    });

    // --- Comment Input Visibility Tests ---
    it('should render comment input section when expanded and user is NOT guest', () => {
        const props = createMockProps({
            isExpanded: true,
            userType: 'user', // or 'admin', just not 'guest'
        });
        render(<PostItem {...props} />);

        // Check for the comment input placeholder (good indicator)
        expect(screen.getByPlaceholderText('Add a comment...')).toBeTruthy();
        // Check for the "Post" button
        expect(screen.getByText('Post')).toBeTruthy();
    });

    it('should NOT render comment input section when NOT expanded', () => {
        const props = createMockProps({
            isExpanded: false, // Explicitly false
            userType: 'user',
        });
        render(<PostItem {...props} />);

        // Assert input and button are NOT present
        expect(screen.queryByPlaceholderText('Add a comment...')).toBeNull();
        expect(screen.queryByText('Post')).toBeNull();
    });

    it('should NOT render comment input section when userType is guest, even if expanded', () => {
        const props = createMockProps({
            isExpanded: true, // Expanded
            userType: 'guest', // But user is guest
        });
        render(<PostItem {...props} />);

        // Assert input and button are NOT present
        expect(screen.queryByPlaceholderText('Add a comment...')).toBeNull();
        expect(screen.queryByText('Post')).toBeNull();
    });

    // --- New Comment "Post" Button State Tests ---
    it('should disable the "Post" button when commentInputText is empty', () => {
        const props = createMockProps({
            isExpanded: true,
            userType: 'user',
            commentInputText: '', // Empty input
        });
        render(<PostItem {...props} />);

        // Find the button and check its disabled state
        const postButton = screen.getByText('Post');
        // In React Native testing, check accessibilityState or directly if component forwards disabled prop
        expect(postButton.props.accessibilityState).toHaveProperty('disabled', true);
        // Or if the component correctly uses the disabled prop on TouchableOpacity:
        // expect(screen.getByRole('button', { name: 'Post' })).toBeDisabled(); // Preferred if supported well
    });

    it('should disable the "Post" button when commentInputText contains only whitespace', () => {
        const props = createMockProps({
            isExpanded: true,
            userType: 'user',
            commentInputText: '   \n  ', // Whitespace input
        });
        render(<PostItem {...props} />);

        const postButton = screen.getByText('Post');
        expect(postButton.props.accessibilityState).toHaveProperty('disabled', true);
        // expect(screen.getByRole('button', { name: 'Post' })).toBeDisabled();
    });


    it('should enable the "Post" button when commentInputText has content and not posting', () => {
        const props = createMockProps({
            isExpanded: true,
            userType: 'user',
            commentInputText: 'Some comment text', // Has content
            isPostingComment: false, // Not posting
        });
        render(<PostItem {...props} />);

        const postButton = screen.getByText('Post');
        // Check if disabled is false or not present in accessibilityState
        expect(postButton.props.accessibilityState?.disabled).toBeFalsy();
        // expect(screen.getByRole('button', { name: 'Post' })).toBeEnabled();
    });

    it('should disable the "Post" button when isPostingComment is true, even with text', () => {
        const props = createMockProps({
            isExpanded: true,
            userType: 'user',
            commentInputText: 'Some comment text', // Has text
            isPostingComment: true, // But currently posting
        });
        render(<PostItem {...props} />);

        // Button text changes to an ActivityIndicator, so we can't find by 'Post' text
        // Instead, we should check that the TouchableOpacity itself is disabled
        // Find the container or TouchableOpacity (may need testID)
        const touchable = screen.getByRole('button'); // Assumes TouchableOpacity has implicit button role
        expect(touchable.props.accessibilityState).toHaveProperty('disabled', true);
        // Check that the "Post" text is NOT visible (replaced by ActivityIndicator)
        expect(screen.queryByText('Post')).toBeNull();
    });
});