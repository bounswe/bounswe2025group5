//app/(tabs)/explore.tsx
import React, { useContext, useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Platform,
  useColorScheme,
  Image,
  Alert,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { AuthContext } from '../_layout';

const HOST = Platform.select({ android: '10.0.2.2', ios: 'localhost', web: 'localhost' });
const API_BASE = `http://${HOST}:8080`;

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
  savedByUser: boolean;
};

// --- CommentItemDisplay Component ---
interface CommentItemDisplayProps {
  comment: CommentData;
  commentTextColor: string;
  commentUsernameColor: string;
  commentBorderColor: string;
  loggedInUsername: string | null;
  onDeleteComment: (commentId: number) => void;
  deleteIconColor: string;
  // --- NEW PROPS for edit functionality ---
  editIconColor: string;
  onTriggerEdit: (comment: CommentData) => void;
  isEditingThisComment: boolean;
  editedContent: string;
  onEditContentChange: (newText: string) => void;
  onSaveEditedComment: (commentId: number) => void;
  onCancelEdit: () => void;
  isSavingEdit: boolean;
  // --- END NEW PROPS for edit ---
}

function CommentItemDisplay({
  comment,
  commentTextColor,
  commentUsernameColor,
  commentBorderColor,
  loggedInUsername,
  onDeleteComment,
  deleteIconColor,
  // --- NEW PROPS for edit functionality ---
  editIconColor,
  onTriggerEdit,
  isEditingThisComment,
  editedContent,
  onEditContentChange,
  onSaveEditedComment,
  onCancelEdit,
  isSavingEdit,
  // --- END NEW PROPS for edit ---
}: CommentItemDisplayProps) {
  const isOwner = loggedInUsername && comment.username === loggedInUsername;
  const colorScheme = useColorScheme(); // For save/cancel button text color

  if (isOwner && isEditingThisComment) {
    return (
      <View style={[styles.commentItemContainer, { borderBottomColor: commentBorderColor }]}>
        <View style={styles.commentHeader}>
          <ThemedText style={[styles.commentUsername, { color: commentUsernameColor }]}>{comment.username} (editing)</ThemedText>
        </View>
        <TextInput
          style={[styles.commentEditInput, { borderColor: editIconColor, color: commentTextColor, backgroundColor: colorScheme === 'dark' ? '#2C2C2E' : '#F9F9F9' }]}
          value={editedContent}
          onChangeText={onEditContentChange}
          multiline
          autoFocus
          editable={!isSavingEdit}
        />
        <View style={styles.editActionsContainer}>
          <TouchableOpacity
            style={[styles.editActionButton, { backgroundColor: '#888' }]}
            onPress={onCancelEdit}
            disabled={isSavingEdit}
          >
            <ThemedText style={styles.editActionButtonText}>Cancel</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.editActionButton, { backgroundColor: editIconColor }]}
            onPress={() => onSaveEditedComment(comment.commentId)}
            disabled={isSavingEdit || !editedContent.trim()}
          >
            {isSavingEdit ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <ThemedText style={styles.editActionButtonText}>Save</ThemedText>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.commentItemContainer, { borderBottomColor: commentBorderColor }]}>
      <View style={styles.commentHeader}>
        <ThemedText style={[styles.commentUsername, { color: commentUsernameColor }]}>{comment.username}</ThemedText>
        {isOwner && (
          <View style={styles.commentOwnerActions}>
            <TouchableOpacity onPress={() => onTriggerEdit(comment)} style={styles.commentActionButton}>
              <Ionicons name="pencil-outline" size={18} color={editIconColor} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onDeleteComment(comment.commentId)} style={styles.commentActionButton}>
              <Ionicons name="trash-outline" size={18} color={deleteIconColor} />
            </TouchableOpacity>
          </View>
        )}
      </View>
      <ThemedText style={[styles.commentContent, { color: commentTextColor }]}>{comment.content}</ThemedText>
      <ThemedText style={[styles.commentTimestamp, { color: commentTextColor }]}>
        {new Date(comment.createdAt).toLocaleDateString()}
      </ThemedText>
    </View>
  );
}


// --- PostItem Component ---
interface PostItemProps {
  post: Post;
  cardBackgroundColor: string;
  iconColor: string;
  textColor: string;
  commentInputBorderColor: string;
  commentInputTextColor: string;
  commentInputPlaceholderColor: string;
  commentInputBackgroundColor: string;
  onLikePress: (postId: number, currentlyLiked: boolean) => void;
  onSavePress: (postId: number, currentlySaved: boolean) => void;
  userType: string | null;
  loggedInUsername: string | null;

  isExpanded: boolean;
  commentsList: CommentData[];
  isLoadingComments: boolean;
  commentInputText: string; // For new comments
  isPostingComment: boolean; // For new comments
  onToggleComments: () => void;
  onCommentInputChange: (text: string) => void; // For new comments
  onPostComment: () => void; // For new comments
  onDeleteComment: (postId: number, commentId: number) => void;

  // --- NEW PROPS for edit functionality ---
  onTriggerEditComment: (postId: number, comment: CommentData) => void;
  editingCommentDetailsForPost: { commentId: number; currentText: string; } | null; // Details for *this specific post*
  onEditCommentContentChange: (newText: string) => void; // Generic handler, ExploreScreen manages which comment text
  onSaveEditedCommentForPost: (postId: number, commentId: number) => void;
  onCancelCommentEdit: () => void;
  isSubmittingCommentEditForPost: boolean; // Specific to this post
  // --- END NEW PROPS for edit ---
}

function PostItem({
  post,
  cardBackgroundColor,
  iconColor,
  textColor,
  commentInputBorderColor,
  commentInputTextColor,
  commentInputPlaceholderColor,
  commentInputBackgroundColor,
  onLikePress,
  onSavePress,
  userType,
  loggedInUsername,
  isExpanded,
  commentsList,
  isLoadingComments,
  commentInputText,
  isPostingComment,
  onToggleComments,
  onCommentInputChange,
  onPostComment,
  onDeleteComment,
  // --- NEW PROPS for edit functionality ---
  onTriggerEditComment,
  editingCommentDetailsForPost,
  onEditCommentContentChange,
  onSaveEditedCommentForPost,
  onCancelCommentEdit,
  isSubmittingCommentEditForPost,
  // --- END NEW PROPS for edit ---
}: PostItemProps) {

  const colorScheme = useColorScheme();
  const commentItemBorderColor = colorScheme === 'dark' ? '#3A3A3C' : '#EAEAEA';
  const commentUsernameActualColor = colorScheme === 'dark' ? '#E0E0E0' : '#333333';
  const commentContentActualColor = textColor;
  const deleteIconActualColor = colorScheme === 'dark' ? '#FF8A80' : '#D9534F';
  // --- NEW: Define edit icon color ---
  const editIconActualColor = colorScheme === 'dark' ? '#82B1FF' : '#007AFF'; // A themable blue
  // --- END NEW ---

  const handleLike = () => {
    if (userType === 'guest') {
      Alert.alert("Login Required", "Please log in to like posts.");
      return;
    }
    onLikePress(post.id, post.likedByUser);
  };

  const handleSave = () => {
    if (userType === 'guest') {
      Alert.alert("Login Required", "Please log in to save posts.");
      return;
    }
    onSavePress(post.id, post.savedByUser);
  };


  const canPostComment = userType !== 'guest' && loggedInUsername && !editingCommentDetailsForPost; // Disable new comment if editing one in this post

  return (
    <View style={[styles.postContainer, { backgroundColor: cardBackgroundColor }]}>
      {/* ... Post title, image, content, footer (likes/comment count) ... no changes here */}
      <ThemedText type="title" style={styles.postTitle}>
        {post.title}
      </ThemedText>
      {post.photoUrl && (
        <Image
          source={{
            uri: post.photoUrl.startsWith('http')
              ? post.photoUrl
              : `${API_BASE}${post.photoUrl}`,
          }}
          style={styles.postImage}
          onError={(e) => console.warn('Explore: Image failed to load:', e.nativeEvent.error, post.photoUrl)}
        />
      )}
      <ThemedText style={[styles.postContent, {color: textColor}]} numberOfLines={post.photoUrl ? 2 : 5}>
        {post.content}
      </ThemedText>

      <View style={styles.postFooter}>
        <TouchableOpacity onPress={handleLike} style={styles.footerAction}>
          <Ionicons
            name={post.likedByUser ? "heart" : "heart-outline"}
            size={20}
            color={post.likedByUser ? 'red' : iconColor}
          />
          <ThemedText style={[styles.footerText, { color: post.likedByUser ? 'red' : iconColor, marginLeft: 4 }]}>
            {post.likes}
          </ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={onToggleComments} style={[styles.footerAction, { marginLeft: 16 }]}>
          <Ionicons name="chatbubble-outline" size={20} color={iconColor} />
          <ThemedText style={[styles.footerText, { color: iconColor, marginLeft: 4 }]}>
            {post.comments}
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleSave} style={[styles.footerAction, { marginLeft: 16 }]}>
            <Ionicons
              name={post.savedByUser ? "bookmark" : "bookmark-outline"}
              size={20}
              color={post.savedByUser ? 'blue' : iconColor}
            />
            <ThemedText style={[styles.footerText, { color: post.savedByUser ? 'blue' : iconColor, marginLeft: 4 }]}>
              {post.savedByUser ? 'Saved' : 'Save'}
            </ThemedText>
          </TouchableOpacity>

      </View>


      {isExpanded && (
        <View style={styles.commentsSection}>
          {isLoadingComments ? (
            <ActivityIndicator style={{ marginVertical: 15 }} color={iconColor} />
          ) : commentsList.length === 0 && !editingCommentDetailsForPost ? ( // Check editing too
            <ThemedText style={[styles.noCommentsText, {color: textColor}]}>No comments yet. Be the first!</ThemedText>
          ) : (
            <View style={styles.commentsListContainer}>
              {commentsList.map(comment => {
                const isEditingThisComment = editingCommentDetailsForPost?.commentId === comment.commentId;
                return (
                  <CommentItemDisplay
                    key={comment.commentId}
                    comment={comment}
                    commentTextColor={commentContentActualColor}
                    commentUsernameColor={commentUsernameActualColor}
                    commentBorderColor={commentItemBorderColor}
                    loggedInUsername={loggedInUsername}
                    onDeleteComment={(commentIdToDelete) => onDeleteComment(post.id, commentIdToDelete)}
                    deleteIconColor={deleteIconActualColor}
                    // --- Pass props for edit functionality ---
                    editIconColor={editIconActualColor}
                    onTriggerEdit={(commentToEdit) => onTriggerEditComment(post.id, commentToEdit)}
                    isEditingThisComment={isEditingThisComment}
                    editedContent={isEditingThisComment ? (editingCommentDetailsForPost?.currentText || '') : ''}
                    onEditContentChange={onEditCommentContentChange}
                    onSaveEditedComment={() => onSaveEditedCommentForPost(post.id, comment.commentId)}
                    onCancelEdit={onCancelCommentEdit}
                    isSavingEdit={isEditingThisComment && isSubmittingCommentEditForPost}
                    // --- END Pass props for edit ---
                  />
                );
              })}
            </View>
          )}

          {/* Add Comment Input Area - only if not guest AND not currently editing a comment in this post */}
          {canPostComment && (
            <View style={[styles.addCommentContainer, { borderTopColor: commentItemBorderColor }]}>
              <TextInput
                style={[
                  styles.commentInput,
                  {
                    borderColor: commentInputBorderColor,
                    color: commentInputTextColor,
                    backgroundColor: commentInputBackgroundColor,
                  }
                ]}
                placeholder="Add a comment..."
                placeholderTextColor={commentInputPlaceholderColor}
                value={commentInputText}
                onChangeText={onCommentInputChange}
                multiline
                editable={!isPostingComment} // Keep this, as posting new comment is separate
              />
              <TouchableOpacity
                style={[styles.postCommentButton, isPostingComment || !commentInputText.trim() ? styles.postCommentButtonDisabled : {}]}
                onPress={onPostComment}
                disabled={isPostingComment || !commentInputText.trim()}
              >
                {isPostingComment ? (
                  <ActivityIndicator size="small" color={colorScheme === 'dark' ? '#FFFFFF' : '#007AFF'} />
                ) : (
                  <ThemedText style={styles.postCommentButtonText}>Post</ThemedText>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </View>
  );
}


export default function ExploreScreen() {
  const navigation = useNavigation();

  const authContext = useContext(AuthContext);
  const userType = authContext?.userType;
  const username = authContext?.username;


  // ... (existing states for posts, search, etc.) ...
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastPostId, setLastPostId] = useState<number | null>(null);
  const [error, setError] = useState(false);
  const [noMorePosts, setNoMorePosts] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Post[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [inSearchMode, setInSearchMode] = useState(false);

  // Comment specific states
  const [expandedPostId, setExpandedPostId] = useState<number | null>(null);
  const [commentsByPostId, setCommentsByPostId] = useState<{ [postId: number]: CommentData[] }>({});
  const [loadingCommentsPostId, setLoadingCommentsPostId] = useState<number | null>(null);
  const [commentInputs, setCommentInputs] = useState<{ [postId: number]: string }>({}); // For NEW comments
  const [postingCommentPostId, setPostingCommentPostId] = useState<number | null>(null);

  // --- NEW State for editing comments ---
  const [editingCommentDetails, setEditingCommentDetails] = useState<{
    postId: number;
    commentId: number;
    currentText: string;
  } | null>(null);
  const [isSubmittingCommentEdit, setIsSubmittingCommentEdit] = useState(false);
  // --- END NEW State ---

  const colorScheme = useColorScheme();
  // ... (color definitions remain the same) ...
  const screenBackgroundColor = colorScheme === 'dark' ? '#151718' : '#F0F2F5';
  const cardBackgroundColor = colorScheme === 'dark' ? '#1C1C1E' : '#FFFFFF';
  const generalTextColor = colorScheme === 'dark' ? '#E5E5E7' : '#1C1C1E';
  const searchBarBackgroundColor = colorScheme === 'dark' ? '#1C1C1E' : '#FFFFFF';
  const searchInputColor = colorScheme === 'dark' ? '#E5E5E7' : '#000000';
  const searchPlaceholderColor = colorScheme === 'dark' ? '#8E8E93' : '#8E8E93';
  const iconColor = colorScheme === 'dark' ? '#8E8E93' : '#6C6C70';
  const commentInputBorderColor = colorScheme === 'dark' ? '#545458' : '#C7C7CD';
  const commentInputTextColor = generalTextColor;
  const commentInputPlaceholderColor = iconColor;
  const commentInputBackgroundColor = colorScheme === 'dark' ? '#2C2C2E' : '#F0F2F5';
  const themedErrorBoxBackgroundColor = colorScheme === 'dark' ? '#5D1F1A' : '#ffcccc';
  const themedErrorBoxTextColor = colorScheme === 'dark' ? '#FFA094' : '#cc0000';
  const themedNoMoreBoxBackgroundColor = colorScheme === 'dark' ? '#1A3A4A' : '#e0f7fa';
  const themedNoMoreBoxTextColor = colorScheme === 'dark' ? '#9EE8FF' : '#00796b';
  const activityIndicatorColor = colorScheme === 'dark' ? '#FFFFFF' : '#000000';
  const refreshControlColors = colorScheme === 'dark' ? { tintColor: '#FFFFFF', titleColor: '#FFFFFF'} : { tintColor: '#000000', titleColor: '#000000'};
  
  // ... (useEffect, mapApiItemToPost, fetchLikeStatusesForPosts, fetchPosts, useFocusEffect, handleRefresh, handleLoadMore, performSearch, handleBack, handleLikeToggle remain the same) ...
  // These functions are long, so I'm omitting them here for brevity but they are unchanged from your last version.
  // Please ensure they are present in your actual file.

  useEffect(() => {
    if (!userType && username !== undefined) {
      navigation.navigate('index'as never);
    }
  }, [userType, username, navigation]);

  const mapApiItemToPost = (item: any): Post => ({
    id: item.postId,
    title: item.creatorUsername,
    content: item.content,
    likes: item.likes || 0,
    comments: Array.isArray(item.comments) ? item.comments.length : (Number(item.comments) || 0),
    photoUrl: item.photoUrl,
    likedByUser: false,
    savedByUser: false,
  });

  const fetchLikeStatusesForPosts = async (currentPostsToUpdate: Post[], currentUsername: string): Promise<Post[]> => {
    if (!currentUsername || currentPostsToUpdate.length === 0) return currentPostsToUpdate;
    const promises = currentPostsToUpdate.map(async (post) => {
      try {
        const res = await fetch(`${API_BASE}/api/posts/${post.id}/likes`);
        if (!res.ok) return post;
        const likesData = await res.json();
        const likedByCurrent = likesData.likedByUsers?.some((liker: any) => liker.username === currentUsername) || false;
        return { ...post, likedByUser: likedByCurrent };
      } catch (e) { return post; }
    });
    return Promise.all(promises);
  };

  const fetchSavedStatusesForPosts = async (currentPostsToUpdate: Post[], currentUsername: string): Promise<Post[]> => {
    if (!currentUsername || currentPostsToUpdate.length === 0) return currentPostsToUpdate;
      try {
        const res = await fetch(`${API_BASE}/api/posts/getSavedPosts?username=${currentUsername}`); 
        if (!res.ok) return currentPostsToUpdate;
        const savedPostsData = await res.json();
        const savedPostIds = new Set(savedPostsData.map((post: any) => post.postId));
        return currentPostsToUpdate.map(post => ({
          ...post,
          savedByUser: savedPostIds.has(post.id), 
        }));
      } catch (e) { 
        console.error('Error fetching saved statuses:', e);
        return currentPostsToUpdate;
      }
  }
        


  const fetchPosts = async (loadMore = false) => {
    const currentOperation = loadMore ? 'loading more' : 'fetching initial/refresh';
    try {
      if (loadMore) setLoadingMore(true);
      else setLoading(true);

      const url = loadMore
        ? `${API_BASE}/api/posts/info?size=5&lastPostId=${lastPostId}`
        : `${API_BASE}/api/posts/info?size=5`;
      
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Fetch failed with status ${res.status}`);
      const data = await res.json();

      if (data.length === 0) {
        setNoMorePosts(true);
        if (!loadMore) setPosts([]);
        setLoading(false); setLoadingMore(false); setRefreshing(false);
        return;
      }

      let processedNewItems: Post[] = data.map(mapApiItemToPost);

      if (username && userType === 'user' && processedNewItems.length > 0) {
        processedNewItems = await fetchLikeStatusesForPosts(processedNewItems, username); 
        processedNewItems = await fetchSavedStatusesForPosts(processedNewItems, username);
      }

      if (loadMore) {
        setPosts(prevPosts => [...prevPosts, ...processedNewItems]);
      } else {
        setPosts(processedNewItems);
        if (expandedPostId && processedNewItems.find(p => p.id === expandedPostId)) {
            fetchCommentsForPost(expandedPostId, true); 
        } else if (expandedPostId) { 
            setExpandedPostId(null);
            setCommentsByPostId(prev => {
                const newComments = {...prev};
                delete newComments[expandedPostId];
                return newComments;
            });
        }
      }
      
      if (data.length > 0) setLastPostId(processedNewItems[processedNewItems.length - 1].id);
      if (data.length < 5) setNoMorePosts(true);
      else setNoMorePosts(false);
      
      setError(false);
    } catch (err) {
      console.error(`Failed to fetch posts (${currentOperation}):`, err);
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };
  
  useFocusEffect(
    React.useCallback(() => {
      if (userType) { 
        handleRefresh();
      } else if (username === null || username === '') {
        setPosts([]);
        setLoading(false);
      }
    }, [userType, username]) 
  );

  const handleRefresh = () => {
    setRefreshing(true);
    setLastPostId(null);
    setNoMorePosts(false);
    setError(false);
    setEditingCommentDetails(null); // Cancel any ongoing edit on refresh
    fetchPosts(false);
  };

  const handleLoadMore = () => {
    if (!loading && !loadingMore && !refreshing && !isSearching && lastPostId !== null && !noMorePosts) {
      fetchPosts(true);
    }
  };

  const performSearch = async () => {
    const q = searchQuery.trim();
    if (!q) return;
    try {
      setIsSearching(true);
      setSearchResults([]);
      setEditingCommentDetails(null); // Cancel edit on new search
      const res = await fetch(
        `${API_BASE}/api/search/posts/semantic?query=${encodeURIComponent(q)}&size=5`
      );
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      let processedResults: Post[] = data.map(mapApiItemToPost);
      if (username && userType === 'user' && processedResults.length > 0) {
        processedResults = await fetchLikeStatusesForPosts(processedResults, username); 
        processedResults = await fetchSavedStatusesForPosts(processedResults, username);
      }
      setSearchResults(processedResults);
      setInSearchMode(true);
      if (expandedPostId) setExpandedPostId(null);

    } catch (err) {
      console.error('Search error:', err);
      setSearchResults([]);
      setInSearchMode(true);
    } finally {
      setIsSearching(false);
    }
  };

  const handleBack = () => {
    setInSearchMode(false);
    setSearchQuery('');
    setSearchResults([]);
    setEditingCommentDetails(null); // Cancel edit
    if (expandedPostId) setExpandedPostId(null);
  };

  const handleLikeToggle = async (postId: number, currentlyLiked: boolean) => {
    if (userType === 'guest' || !username) {
      Alert.alert("Login Required", "Please log in to like posts.");
      return;
    }
    const listToUpdate = inSearchMode ? searchResults : posts;
    const setListFunction = inSearchMode ? setSearchResults : setPosts;

    setListFunction(currentList =>
      currentList.map(p =>
        p.id === postId
          ? { ...p, likedByUser: !currentlyLiked, likes: currentlyLiked ? Math.max(0, p.likes - 1) : p.likes + 1 }
          : p
      )
    );
    try {
      const url = `${API_BASE}/api/posts/like`;
      const method = currentlyLiked ? 'DELETE' : 'POST';
      const body = JSON.stringify({ username, postId });
      const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body });
      const responseBodyText = await response.text();
      if (!response.ok) {
        let errorMsg = `Failed to ${currentlyLiked ? 'unlike' : 'like'}. Status: ${response.status}`;
        try { const errorData = JSON.parse(responseBodyText); errorMsg = errorData.message || errorMsg; }
        catch (e) { errorMsg += ` Response: ${responseBodyText.substring(0,100)}`; }
        throw new Error(errorMsg);
      }
      const result = JSON.parse(responseBodyText);
      if (!result.success) throw new Error(result.message || `Backend error on ${currentlyLiked ? 'unlike' : 'like'}.`);
    } catch (err: any) {
      console.error('Failed to toggle like:', err.message);
      Alert.alert("Error", err.message || "Could not update like status.");
      setListFunction(currentList =>
        currentList.map(p =>
          p.id === postId
            ? { ...p, likedByUser: currentlyLiked, likes: currentlyLiked ? p.likes + 1 : Math.max(0, p.likes - 1) }
            : p
        )
      );
    }
  };

  const handleSaveToggle = async (postId: number, currentlySaved: boolean) => {
    if (userType === 'guest' || !username) {
      Alert.alert("Login Required", "Please log in to save posts.");
      return;
    }
    const listToUpdate = inSearchMode ? searchResults : posts;
    const setListFunction = inSearchMode ? setSearchResults : setPosts;
    setListFunction(currentList =>
      currentList.map(p =>
        p.id === postId
          ? { ...p, savedByUser: !currentlySaved }
          : p
      )
    );
    
    // api call for save POST {{base_url}}/api/posts/save with body { "username": "{{username} }", "postId": {{post_id}} } and header Content-Type: application/json
    // api call for unsave DELETE {{base_url}}/api/posts/unsave{{username}}/{{post_id}} no body
    try {
      const url = currentlySaved
        ? `${API_BASE}/api/posts/unsave${username}/${postId}`
        : `${API_BASE}/api/posts/save`;
      const method = currentlySaved ? 'DELETE' : 'POST';
      const body = currentlySaved ? null : JSON.stringify({ username, postId });
      const response = currentlySaved ? await fetch(url, { method }) : await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body });
      const responseBodyText = await response.text();
      if (!response.ok) {
        let errorMsg = `Failed to ${currentlySaved ? 'unsave' : 'save'}. Status: ${response.status}`;
        try { const errorData = JSON.parse(responseBodyText); errorMsg = errorData.message || errorMsg; }
        catch (e) { errorMsg += ` Response: ${responseBodyText.substring(0,100)}`; }
        throw new Error(errorMsg);
      }
      const result = JSON.parse(responseBodyText);
      if (!result.success) throw new Error(result.message || `Backend error on ${currentlySaved ? 'unsave' : 'save'}.`);
    } catch (err: any) {
      console.error('Failed to toggle save:', err.message);
      Alert.alert("Error", err.message || "Could not update save status.");
      setListFunction(currentList =>
        currentList.map(p =>
          p.id === postId
            ? { ...p, savedByUser: currentlySaved }
            : p
        )
      );
    }
  };





  // --- Comment Handlers (Fetch, Toggle, Post New, Delete are largely same) ---
  const fetchCommentsForPost = async (postId: number, forceRefresh = false) => {
    if (commentsByPostId[postId] && !forceRefresh && commentsByPostId[postId].length > 0) {
      return;
    }
    // If editing a comment within this post, don't refresh comments as it might interrupt edit
    if (editingCommentDetails?.postId === postId && !forceRefresh) {
        return;
    }
    setLoadingCommentsPostId(postId);
    try {
      const response = await fetch(`${API_BASE}/api/comments/post/${postId}`);
      if (!response.ok) { /* ... error handling ... */ throw new Error(`Failed to fetch comments: ${response.status}`); }
      const apiResponse = await response.json();
      const fetchedComments: CommentData[] = (apiResponse.comments || []).map((apiComment: any) => ({
        commentId: apiComment.commentId, content: apiComment.content, createdAt: apiComment.createdAt, username: apiComment.creatorUsername,
      }));
      setCommentsByPostId(prev => ({ ...prev, [postId]: fetchedComments }));
      if (typeof apiResponse.totalComments === 'number') { /* ... update post comment count ... */ }
    } catch (e: any) { /* ... error handling ... */ Alert.alert("Error", `Could not load comments.`);
    } finally { setLoadingCommentsPostId(null); }
  };

  const handleToggleComments = (postId: number) => {
    const isCurrentlyExpanded = expandedPostId === postId;
    if (editingCommentDetails && editingCommentDetails.postId === postId && !isCurrentlyExpanded) {
        // If trying to expand a post while editing one of its comments, allow.
        // If trying to collapse a post while editing, perhaps cancel edit or prompt?
        // For now, just toggle. If collapsing, the edit UI will disappear.
    }
    if (isCurrentlyExpanded) {
      // If collapsing the post where a comment is being edited, cancel the edit.
      if (editingCommentDetails && editingCommentDetails.postId === postId) {
        setEditingCommentDetails(null);
      }
      setExpandedPostId(null);
    } else {
      setExpandedPostId(postId);
      if (!commentsByPostId[postId] || commentsByPostId[postId].length === 0) {
        fetchCommentsForPost(postId, false);
      }
    }
  };

  const handleCommentInputChange = (postId: number, text: string) => { // For NEW comments
    // If user starts typing a new comment while editing another in the same post, cancel the edit.
    if (editingCommentDetails && editingCommentDetails.postId === postId) {
        setEditingCommentDetails(null);
    }
    setCommentInputs(prev => ({ ...prev, [postId]: text }));
  };

  const handlePostComment = async (postId: number) => { // For NEW comments
    // ... (same as before, but ensure username is available) ...
    if (!username) { Alert.alert("Login required..."); return; }
    const content = commentInputs[postId]?.trim();
    if (!content) { Alert.alert("Empty comment..."); return; }
    if (editingCommentDetails?.postId === postId) { // Defensive: Should be prevented by UI, but cancel edit if somehow attempted
        setEditingCommentDetails(null);
    }
    setPostingCommentPostId(postId);
    Keyboard.dismiss();
    try {
        const response = await fetch(`${API_BASE}/api/comments`, { /* ... POST new comment ... */ method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, content, postId })});
        const apiResponseData = await response.json();
        if (!response.ok) throw new Error(apiResponseData.message || `Failed to post comment`);
        const newComment: CommentData = { /* ... map response ... */ commentId: apiResponseData.commentId, content: apiResponseData.content, createdAt: apiResponseData.createdAt, username: apiResponseData.creatorUsername || username };
        setCommentsByPostId(prev => ({ ...prev, [postId]: [newComment, ...(prev[postId] || [])] }));
        const listUpdater = (list: Post[]) => list.map(p => p.id === postId ? { ...p, comments: p.comments + 1 } : p);
        setPosts(listUpdater);
        if (inSearchMode) setSearchResults(listUpdater);
        setCommentInputs(prev => ({ ...prev, [postId]: '' }));
    } catch (e: any) { Alert.alert("Error", `Could not post comment: ${e.message}`);
    } finally { setPostingCommentPostId(null); }
  };

  const handleDeleteComment = async (postId: number, commentId: number) => {
    // ... (same as before, but also cancel edit if deleting the comment being edited) ...
    if (editingCommentDetails && editingCommentDetails.commentId === commentId) {
        setEditingCommentDetails(null);
    }
    // ... (rest of delete logic) ...
    if (!username) { Alert.alert("Error", "You must be logged in..."); return; }
    Alert.alert("Delete Comment", "Are you sure?", [ { text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: async () => {
        try {
            const response = await fetch(`${API_BASE}/api/comments/${commentId}`, { method: 'DELETE' });
            if (!response.ok) { /* ... error handling ... */ throw new Error(`Failed to delete comment.`); }
            setCommentsByPostId(prev => ({ ...prev, [postId]: (prev[postId] || []).filter(c => c.commentId !== commentId) }));
            const listUpdater = (list: Post[]) => list.map(p => p.id === postId ? { ...p, comments: Math.max(0, p.comments - 1) } : p);
            setPosts(listUpdater);
            if (inSearchMode) setSearchResults(listUpdater);
            Alert.alert("Success", "Comment deleted.");
        } catch (e: any) { Alert.alert("Error", `Could not delete comment: ${e.message}`); }
    }}]);
  };


  // --- NEW Handlers for editing comments ---
  const handleStartEditComment = (postId: number, commentToEdit: CommentData) => {
    setEditingCommentDetails({
      postId: postId,
      commentId: commentToEdit.commentId,
      currentText: commentToEdit.content,
    });
    // Optionally clear the main new comment input for this post
    setCommentInputs(prev => ({ ...prev, [postId]: '' }));
    // Ensure the post's comments are expanded if not already
    if (expandedPostId !== postId) {
        setExpandedPostId(postId);
    }
  };

  const handleEditingCommentTextChange = (newText: string) => {
    setEditingCommentDetails(prev => (prev ? { ...prev, currentText: newText } : null));
  };

  const handleCancelCommentEdit = () => {
    setEditingCommentDetails(null);
  };

  const handleSaveCommentEdit = async (postIdToSave: number, commentIdToSave: number) => {
    if (!editingCommentDetails || editingCommentDetails.commentId !== commentIdToSave || !username) {
      Alert.alert("Error", "Could not save edit. Mismatch or not logged in.");
      setEditingCommentDetails(null); // Reset state if something is wrong
      return;
    }

    const newContent = editingCommentDetails.currentText.trim();
    if (!newContent) {
      Alert.alert("Empty Comment", "Comment cannot be empty.");
      return;
    }

    setIsSubmittingCommentEdit(true);
    Keyboard.dismiss();

    try {
      const response = await fetch(`${API_BASE}/api/comments/${commentIdToSave}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        // Body depends on your API. Common is just the content.
        // If your backend needs username for auth in body (less common with token auth):
        // body: JSON.stringify({ content: newContent, username: username }),
        body: JSON.stringify({ content: newContent }),
      });

      // Assuming API returns the updated comment or just a success status
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Failed to update comment."}));
        throw new Error(errorData.message || `Failed to update comment: ${response.status}`);
      }
      
      const updatedCommentData = await response.json(); // Assuming API returns the full updated comment

      setCommentsByPostId(prev => {
        const postComments = (prev[postIdToSave] || []).map(c =>
          c.commentId === commentIdToSave
            ? { ...c, content: updatedCommentData.content, createdAt: updatedCommentData.createdAt || c.createdAt } // Use returned data
            : c
        );
        return { ...prev, [postIdToSave]: postComments };
      });

      Alert.alert("Success", "Comment updated.");
      setEditingCommentDetails(null);
    } catch (e: any) {
      console.error(`Error updating comment ${commentIdToSave}:`, e.message);
      Alert.alert("Error", `Could not update comment: ${e.message}`);
    } finally {
      setIsSubmittingCommentEdit(false);
    }
  };
  // --- END NEW Handlers ---


  if (username === undefined && userType === undefined) {
      return <View style={{flex:1, justifyContent:'center', alignItems:'center', backgroundColor: screenBackgroundColor}}><ActivityIndicator size="large" color={activityIndicatorColor} /></View>;
  }

  const currentDisplayPosts = inSearchMode ? searchResults : posts;
  // ... (isContentLoading logic remains the same) ...
  const isContentLoading = (loading && !inSearchMode && currentDisplayPosts.length === 0) || (isSearching && inSearchMode && currentDisplayPosts.length === 0);


  return (
    <ScrollView
      style={[styles.container, { backgroundColor: screenBackgroundColor }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl /* ... */ refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {/* ... Header, SearchBar ... */}
      <View style={styles.header}>
        <ThemedText type="title">Explore</ThemedText>
        {userType === 'guest' && (
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => navigation.navigate('index' as never)}
          >
            <ThemedText style={styles.loginButtonText}>Go to Login</ThemedText>
          </TouchableOpacity>
        )}
      </View>

      <View style={[styles.searchBar, { backgroundColor: searchBarBackgroundColor }]}>
        {inSearchMode && (
          <TouchableOpacity onPress={handleBack} disabled={isSearching}>
            <Ionicons name="arrow-back" size={25} color={iconColor} style={[styles.searchIcon, { marginRight: 8 }]} />
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={performSearch} disabled={isSearching || !!editingCommentDetails}>
          {isSearching ? (
            <ActivityIndicator size="small" color={iconColor} style={styles.searchIcon} />
          ) : (
            <Ionicons name="search" size={30} color={iconColor} style={styles.searchIcon} />
          )}
        </TouchableOpacity>
        <TextInput
          style={[styles.searchInput, { color: searchInputColor }]}
          placeholder="Search for posts…"
          placeholderTextColor={searchPlaceholderColor}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
          onSubmitEditing={performSearch}
          editable={!isSearching && !editingCommentDetails}
        />
      </View>


      {isContentLoading ? (
        <ActivityIndicator style={{ marginTop: 20 }} size="large" color={activityIndicatorColor} />
      ) : error && currentDisplayPosts.length === 0 ? (
        <View>...</View> /* Error box */
      ) : inSearchMode ? (
        searchResults.length > 0 ? (
          searchResults.map(post => (
            <PostItem
              key={`search-${post.id}`}
              post={post}
              // ... other common props ...
              cardBackgroundColor={cardBackgroundColor} iconColor={iconColor} textColor={generalTextColor}
              commentInputBorderColor={commentInputBorderColor} commentInputTextColor={commentInputTextColor}
              commentInputPlaceholderColor={commentInputPlaceholderColor} commentInputBackgroundColor={commentInputBackgroundColor}
              onLikePress={handleLikeToggle} userType={userType} loggedInUsername={username} 
              onSavePress={handleSaveToggle}
              // Comment related
              isExpanded={expandedPostId === post.id}
              commentsList={commentsByPostId[post.id] || []}
              isLoadingComments={loadingCommentsPostId === post.id}
              commentInputText={editingCommentDetails?.postId === post.id ? '' : (commentInputs[post.id] || '')} // Clear new comment input if editing in this post
              isPostingComment={postingCommentPostId === post.id}
              onToggleComments={() => handleToggleComments(post.id)}
              onCommentInputChange={(text) => handleCommentInputChange(post.id, text)}
              onPostComment={() => handlePostComment(post.id)}
              onDeleteComment={handleDeleteComment}
              // Edit related
              onTriggerEditComment={handleStartEditComment}
              editingCommentDetailsForPost={editingCommentDetails?.postId === post.id ? editingCommentDetails : null}
              onEditCommentContentChange={handleEditingCommentTextChange}
              onSaveEditedCommentForPost={handleSaveCommentEdit}
              onCancelCommentEdit={handleCancelCommentEdit}
              isSubmittingCommentEditForPost={editingCommentDetails?.postId === post.id && isSubmittingCommentEdit}
            />
          ))
        ) : (
          <View>...</View> /* No search results */
        )
      ) : posts.length > 0 ? (
        <>
          {posts.map(post => (
            <PostItem
              key={`feed-${post.id}`}
              post={post}
              // ... other common props ...
              cardBackgroundColor={cardBackgroundColor} iconColor={iconColor} textColor={generalTextColor}
              commentInputBorderColor={commentInputBorderColor} commentInputTextColor={commentInputTextColor}
              commentInputPlaceholderColor={commentInputPlaceholderColor} commentInputBackgroundColor={commentInputBackgroundColor}
              onLikePress={handleLikeToggle} userType={userType} loggedInUsername={username}
              onSavePress={handleSaveToggle} 
              // Comment related
              isExpanded={expandedPostId === post.id}
              commentsList={commentsByPostId[post.id] || []}
              isLoadingComments={loadingCommentsPostId === post.id}
              commentInputText={editingCommentDetails?.postId === post.id ? '' : (commentInputs[post.id] || '')}
              isPostingComment={postingCommentPostId === post.id}
              onToggleComments={() => handleToggleComments(post.id)}
              onCommentInputChange={(text) => handleCommentInputChange(post.id, text)}
              onPostComment={() => handlePostComment(post.id)}
              onDeleteComment={handleDeleteComment}
              // Edit related
              onTriggerEditComment={handleStartEditComment}
              editingCommentDetailsForPost={editingCommentDetails?.postId === post.id ? editingCommentDetails : null}
              onEditCommentContentChange={handleEditingCommentTextChange}
              onSaveEditedCommentForPost={handleSaveCommentEdit}
              onCancelCommentEdit={handleCancelCommentEdit}
              isSubmittingCommentEditForPost={editingCommentDetails?.postId === post.id && isSubmittingCommentEdit}
            />
          ))}
                {/* ... (Load More and No More Posts JSX remains the same) ... */}
      {!noMorePosts && !refreshing && posts.length > 0 && (
        <TouchableOpacity 
          style={styles.loadMoreButton} 
          onPress={handleLoadMore} 
          disabled={loadingMore || refreshing || isSearching}
        >
          {loadingMore ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <ThemedText style={styles.loadMoreText}>Load More Posts</ThemedText>
          )}
        </TouchableOpacity>
      )}
      {noMorePosts && posts.length > 0 && !loadingMore && !refreshing && (
        <View style={[styles.noMoreBox, { backgroundColor: themedNoMoreBoxBackgroundColor, marginTop: 20, marginBottom: 20 }]}>
          <ThemedText style={[styles.noMoreText, { color: themedNoMoreBoxTextColor }]}>You've reached the end!</ThemedText>
        </View>
      )}
    </>
  ) : ( 
     !loading && !error && !refreshing && !isSearching && (
      <View style={[styles.noMoreBox, { backgroundColor: themedNoMoreBoxBackgroundColor }]}>
        <ThemedText style={[styles.noMoreText, { color: themedNoMoreBoxTextColor }]}>No posts available</ThemedText>
        <ThemedText style={[styles.noMoreText, { color: themedNoMoreBoxTextColor, fontSize: 14, marginTop: 8 }]}>Pull down to refresh.</ThemedText>
      </View>
    )
  )}
</ScrollView>
);
}

const styles = StyleSheet.create({
  // ... (existing styles) ...
  container: { flex: 1 },
  content: { paddingBottom: 24 },
  header: { paddingHorizontal: 16, marginTop: Platform.OS === 'ios' ? 48 : 24, marginBottom: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  searchBar: { flexDirection: 'row', alignItems: 'center', borderRadius: 30, marginHorizontal: 16, paddingHorizontal: 12, paddingVertical: Platform.OS === 'ios' ? 12 : 8, marginBottom: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 16, marginLeft: 5 },
  postContainer: { borderRadius: 8, padding: 12, marginHorizontal: 16, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  postImage: { width: '100%', aspectRatio: 16/9, maxHeight: 180, borderRadius: 6, marginBottom: 10, backgroundColor: '#eee', resizeMode: 'cover' },
  postTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  postContent: { fontSize: 14, lineHeight: 20, marginBottom: 12 },
  postFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  footerAction: { flexDirection: 'row', alignItems: 'center', minHeight: 20 },
  footerText: { fontSize: 14, marginRight: 8 },
  loginButton: { paddingVertical: 8, paddingHorizontal: 16, backgroundColor: '#2196F3', borderRadius: 20, alignSelf: 'flex-start' },
  loginButtonText: { color: '#fff', fontSize: 14, fontWeight: '500' },
  errorBox: { marginTop: 40, marginHorizontal: 20, padding: 16, borderRadius: 8, alignItems: 'center' },
  errorText: { fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
  noMoreBox: { marginTop: 40, marginHorizontal: 20, padding: 16, borderRadius: 8, alignItems: 'center' },
  noMoreText: { fontSize: 16, fontWeight: '500', textAlign: 'center' },
  loadMoreButton: { marginVertical: 20, marginHorizontal: 40, backgroundColor: '#2196F3', paddingVertical: 12, borderRadius: 25, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
  loadMoreText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  commentsSection: { marginTop: 10, paddingTop: 10 },
  commentsListContainer: { maxHeight: 200, marginBottom: 10 },
  commentItemContainer: { paddingVertical: 8, borderBottomWidth: 1 },
  commentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  commentUsername: { fontWeight: 'bold', fontSize: 13, flexShrink: 1, marginRight: 8 },
  // --- MODIFIED/NEW Styles for comment actions and editing ---
  commentOwnerActions: {
    flexDirection: 'row',
  },
  commentActionButton: {
    paddingHorizontal: 6, // Space out icons
    paddingVertical: 4,
  },
  deleteCommentButton: { // This was old, now using commentActionButton
    padding: 4,
  },
  commentEditInput: {
    fontSize: 14,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderRadius: 6,
    marginBottom: 8,
    maxHeight: 100,
  },
  editActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  editActionButton: {
    marginLeft: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
    minWidth: 70,
    alignItems: 'center',
  },
  editActionButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
  // --- END ---
  commentContent: { fontSize: 14, lineHeight: 18 },
  commentTimestamp: { fontSize: 10, opacity: 0.7, marginTop: 4, textAlign: 'right' },
  noCommentsText: { textAlign: 'center', marginVertical: 15, fontSize: 14, opacity: 0.7 },
  addCommentContainer: { flexDirection: 'row', alignItems: 'center', paddingTop: 10, borderTopWidth: 1, marginTop: 5 },
  commentInput: { flex: 1, borderWidth: 1, borderRadius: 20, paddingHorizontal: 15, paddingVertical: 8, fontSize: 14, marginRight: 10, maxHeight: 80 },
  postCommentButton: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 20, backgroundColor: '#007AFF' },
  postCommentButtonDisabled: { backgroundColor: '#B0C4DE' },
  postCommentButtonText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },
});