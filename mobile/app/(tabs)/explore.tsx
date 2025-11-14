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
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AccessibleText from '@/components/AccessibleText';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { AuthContext } from '../_layout';
import { apiRequest } from '../services/apiClient';
import PostItem from '../components/PostItem';
import { useTranslation } from 'react-i18next';

type CommentData = {
  commentId: number;
  username: string;
  content: string;
  createdAt: string | Date;
  avatarUrl?: string | null;
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
  createdAt?: string | null;
};

export default function ExploreScreen() {
  const navigation = useNavigation();

  const { t } = useTranslation();

  const authContext = useContext(AuthContext);
  const userType = authContext?.userType;
  const username = authContext?.username;


  const [posts, setPosts] = useState<Post[]>([]);
  const [isFriendsFeed, setIsFriendsFeed] = useState(false);
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

  const [expandedPostId, setExpandedPostId] = useState<number | null>(null);
  const [commentsByPostId, setCommentsByPostId] = useState<{ [postId: number]: CommentData[] }>({});
  const [loadingCommentsPostId, setLoadingCommentsPostId] = useState<number | null>(null);
  const [commentInputs, setCommentInputs] = useState<{ [postId: number]: string }>({}); // For NEW comments
  const [postingCommentPostId, setPostingCommentPostId] = useState<number | null>(null);

  const [editingCommentDetails, setEditingCommentDetails] = useState<{
    postId: number;
    commentId: number;
    currentText: string;
  } | null>(null);
  const [isSubmittingCommentEdit, setIsSubmittingCommentEdit] = useState(false);
  const [commenterAvatars, setCommenterAvatars] = useState<{ [username: string]: string | null }>({});
  const [isNotificationsVisible, setNotificationsVisible] = useState(false);

  const colorScheme = useColorScheme();
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
  const notificationButtonBackground = colorScheme === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)';
  const notificationIconColor = colorScheme === 'dark' ? '#FFFFFF' : '#1C1C1E';
  const feedAccentColor = isFriendsFeed ? '#2E7D32' : '#1976D2';
  const feedAccentShadow = isFriendsFeed ? 'rgba(30, 94, 48, 0.2)' : 'rgba(13, 71, 161, 0.2)';
  

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
    createdAt: item.createdAt ?? null,
  });

  const fetchLikeStatusesForPosts = async (currentPostsToUpdate: Post[], currentUsername: string): Promise<Post[]> => {
    if (!currentUsername || currentPostsToUpdate.length === 0) return currentPostsToUpdate;
    const promises = currentPostsToUpdate.map(async (post) => {
      try {
        const res = await apiRequest(`/api/posts/${post.id}/likes`);
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
      const res = await apiRequest(`/api/users/${encodeURIComponent(currentUsername)}/saved-posts`);
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
  };

  const fetchAvatarForUsername = async (username: string) => {
    if (!username) return null;
    try {
      const encoded = encodeURIComponent(username);
      const response = await apiRequest(`/api/users/${encoded}/profile?username=${encoded}`);
      if (!response.ok) return null;
      const data = await response.json();
      return data?.photoUrl ?? null;
    } catch {
      return null;
    }
  };

  const ensureAvatarsForUsernames = async (usernames: string[]) => {
    const uniqueUsernames = Array.from(new Set(usernames.filter(Boolean)));
    const missing = uniqueUsernames.filter((name) => commenterAvatars[name] === undefined);
    if (!missing.length) return {};
    const fetchedEntries = await Promise.all(
      missing.map(async (name) => {
        const url = await fetchAvatarForUsername(name);
        return [name, url] as const;
      })
    );
    const newMap = Object.fromEntries(fetchedEntries);
    if (Object.keys(newMap).length > 0) {
      setCommenterAvatars((prev) => ({ ...prev, ...newMap }));
    }
    return newMap;
  };
        

  const fetchPosts = async (loadMore = false) => {
    const isGuestUser = userType === 'guest';
    const currentOperation = loadMore ? 'loading more' : 'fetching initial/refresh';
    try {
      if (isGuestUser && loadMore) {
        setLoadingMore(false);
        setNoMorePosts(true);
        return;
      }

      if (loadMore) setLoadingMore(true);
      else setLoading(true);

      const query = isGuestUser
        ? '/api/posts/mostLiked?size=10'
        : loadMore && lastPostId !== null
          ? `/api/posts?size=5&lastPostId=${lastPostId}`
          : '/api/posts?size=5';
      
      const res = await apiRequest(query);
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
      
      if (isGuestUser) {
        setLastPostId(null);
        setNoMorePosts(true);
      } else {
        if (data.length > 0) setLastPostId(processedNewItems[processedNewItems.length - 1].id);
        if (data.length < 5) setNoMorePosts(true);
        else setNoMorePosts(false);
      }
      
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
    setEditingCommentDetails(null); 
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
      setEditingCommentDetails(null); 
      const res = await apiRequest(
        `/api/forum/search/semantic?query=${encodeURIComponent(q)}&size=5`
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
    setEditingCommentDetails(null); 
    if (expandedPostId) setExpandedPostId(null);
  };

  const openNotifications = () => setNotificationsVisible(true);
  const closeNotifications = () => setNotificationsVisible(false);

  const handleLikeToggle = async (postId: number, currentlyLiked: boolean) => {
    if (userType === 'guest' || !username) {
      Alert.alert(t('loginRequired'), t('pleaseLogInToLike'));
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
      const url = '/api/posts/like';
      const method = currentlyLiked ? 'DELETE' : 'POST';
      const body = JSON.stringify({ username, postId });
      const response = await apiRequest(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body,
      });
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
      Alert.alert(t('error'), err.message || t('couldNotUpdateLike'));
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
      Alert.alert(t('loginRequired'), t('pleaseLogInToSave'));
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
      const encodedUsername = encodeURIComponent(username);
      const response = currentlySaved
        ? await apiRequest(`/api/posts/${postId}/saves/${encodedUsername}`, {
            method: 'DELETE',
          })
        : await apiRequest(`/api/posts/${postId}/save`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username }),
          });
      const responseBodyText = await response.text();
      if (!response.ok) {
        let errorMsg = `Failed to ${currentlySaved ? 'unsave' : 'save'}. Status: ${response.status}`;
        try { const errorData = JSON.parse(responseBodyText); errorMsg = errorData.message || errorMsg; }
        catch (e) { errorMsg += ` Response: ${responseBodyText.substring(0,100)}`; }
        throw new Error(errorMsg);
      }
      const result = JSON.parse(responseBodyText);
      if (currentlySaved) {
        if (!result.deleted) throw new Error(result.message || `Backend error on unsave.`);
      }
      else {
        if (!result.username) throw new Error(result.message || `Backend error on save.`);
      }
      // success: optimistic update already applied above
    } catch (err: any) {
      console.error('Failed to toggle save:', err.message);
      Alert.alert(t('error'), err.message || t('couldNotUpdateSave'));
      const setListFunction = inSearchMode ? setSearchResults : setPosts;
      setListFunction(currentList =>
        currentList.map(p =>
          p.id === postId
            ? { ...p, savedByUser: currentlySaved }
            : p
        )
      );
    }
  };

  async function fetchCommentsForPost(postId: number, forceRefresh = false) {
    if (commentsByPostId[postId] && !forceRefresh && commentsByPostId[postId].length > 0) {
      return;
    }
    if (editingCommentDetails?.postId === postId && !forceRefresh) {
        return;
    }
    setLoadingCommentsPostId(postId);
    try {
      const response = await apiRequest(`/api/posts/${postId}/comments`);
      if (!response.ok) { /* ... error handling ... */ throw new Error(`Failed to fetch comments: ${response.status}`); }
      const apiResponse = await response.json();
      const apiComments = apiResponse.comments || [];
      const usernamesNeedingAvatars = apiComments.map((apiComment: any) => apiComment.creatorUsername);
      const newlyFetchedAvatars = await ensureAvatarsForUsernames(usernamesNeedingAvatars);
      const avatarLookup = { ...commenterAvatars, ...newlyFetchedAvatars };
      const fetchedComments: CommentData[] = apiComments.map((apiComment: any) => ({
        commentId: apiComment.commentId,
        content: apiComment.content,
        createdAt: apiComment.createdAt,
        username: apiComment.creatorUsername,
        avatarUrl: avatarLookup[apiComment.creatorUsername] ?? null,
      }));
      setCommentsByPostId(prev => ({ ...prev, [postId]: fetchedComments }));
      if (typeof apiResponse.totalComments === 'number') { /* ... update post comment count ... */ }
    } catch (e: any) { /* ... error handling ... */ Alert.alert(t('error'), t('couldNotLoadComments'));
    } finally { setLoadingCommentsPostId(null); }
  }

  const handleToggleComments = (postId: number) => {
    const isCurrentlyExpanded = expandedPostId === postId;
    if (editingCommentDetails && editingCommentDetails.postId === postId && !isCurrentlyExpanded) {
    }
    if (isCurrentlyExpanded) {
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
    if (editingCommentDetails && editingCommentDetails.postId === postId) {
        setEditingCommentDetails(null);
    }
    setCommentInputs(prev => ({ ...prev, [postId]: text }));
  };

  const handlePostComment = async (postId: number) => { // For NEW comments
    if (!username) { Alert.alert(t('loginRequired'), t('mustBeLoggedIn')); return; }
    const content = commentInputs[postId]?.trim();
    if (!content) { Alert.alert(t('emptyComment'), t('commentCannotBeEmpty')); return; }
    if (editingCommentDetails?.postId === postId) { 
        setEditingCommentDetails(null);
    }
    setPostingCommentPostId(postId);
    Keyboard.dismiss();
    try {
        const response = await apiRequest(`/api/posts/${postId}/comments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, content }),
        });
        const apiResponseData = await response.json();
        if (!response.ok) throw new Error(apiResponseData.message || `Failed to post comment`);
        const authorUsername = apiResponseData.creatorUsername || username;
        const avatarUpdates = await ensureAvatarsForUsernames([authorUsername]);
        const avatarLookup = { ...commenterAvatars, ...avatarUpdates };
        const newComment: CommentData = {
          commentId: apiResponseData.commentId,
          content: apiResponseData.content,
          createdAt: apiResponseData.createdAt,
          username: authorUsername,
          avatarUrl: avatarLookup[authorUsername] ?? null,
        };
        setCommentsByPostId(prev => ({ ...prev, [postId]: [newComment, ...(prev[postId] || [])] }));
        const listUpdater = (list: Post[]) => list.map(p => p.id === postId ? { ...p, comments: p.comments + 1 } : p);
        setPosts(listUpdater);
        if (inSearchMode) setSearchResults(listUpdater);
        setCommentInputs(prev => ({ ...prev, [postId]: '' }));
    } catch (e: any) { Alert.alert(t('error'), t('couldNotPostComment', { message: e.message }));
    } finally { setPostingCommentPostId(null); }
  };

  const handleDeleteComment = async (postId: number, commentId: number) => {
    if (editingCommentDetails && editingCommentDetails.commentId === commentId) {
      setEditingCommentDetails(null);
    }
    if (!username) {
      return;
    }

    try {
      const response = await apiRequest(`/api/posts/comment/${commentId}`, { method: 'DELETE' });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to delete comment.');
      }
      setCommentsByPostId((prev) => ({
        ...prev,
        [postId]: (prev[postId] || []).filter((c) => c.commentId !== commentId),
      }));
      const listUpdater = (list: Post[]) =>
        list.map((p) =>
          p.id === postId ? { ...p, comments: Math.max(0, p.comments - 1) } : p
        );
      setPosts(listUpdater);
      if (inSearchMode) setSearchResults(listUpdater);
    } catch (e: any) {
      console.error('Failed to delete comment:', e);
    }
  };

  const handleStartEditComment = (postId: number, commentToEdit: CommentData) => {
    setEditingCommentDetails({
      postId: postId,
      commentId: commentToEdit.commentId,
      currentText: commentToEdit.content,
    });
    setCommentInputs(prev => ({ ...prev, [postId]: '' }));
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
      Alert.alert(t('error'), t('couldNotSaveEdit'));
      setEditingCommentDetails(null); // Reset state if something is wrong
      return;
    }

    const newContent = editingCommentDetails.currentText.trim();
    if (!newContent) {
      Alert.alert(t('emptyComment'), t('commentCannotBeEmpty'));
      return;
    }

    setIsSubmittingCommentEdit(true);
    Keyboard.dismiss();

    try {
      const response = await apiRequest(`/api/posts/comment/${commentIdToSave}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newContent, username }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Failed to update comment."}));
        throw new Error(errorData.message || `Failed to update comment: ${response.status}`);
      }
      
      const updatedCommentData = await response.json(); 
      setCommentsByPostId(prev => {
        const postComments = (prev[postIdToSave] || []).map(c =>
          c.commentId === commentIdToSave
            ? { ...c, content: updatedCommentData.content, createdAt: updatedCommentData.createdAt || c.createdAt } 
            : c
        );
        return { ...prev, [postIdToSave]: postComments };
      });

      Alert.alert(t('success'), t('commentUpdated'));
      setEditingCommentDetails(null);
    } catch (e: any) {
      console.error(`Error updating comment ${commentIdToSave}:`, e.message);
      Alert.alert(t('error'), t('couldNotUpdateComment', { message: e.message }));
    } finally {
      setIsSubmittingCommentEdit(false);
    }
  };

  if (username === undefined && userType === undefined) {
      return <View style={{flex:1, justifyContent:'center', alignItems:'center', backgroundColor: screenBackgroundColor}}><ActivityIndicator size="large" color={activityIndicatorColor} /></View>;
  }

  const currentDisplayPosts = inSearchMode ? searchResults : posts;
  const isContentLoading = (loading && !inSearchMode && currentDisplayPosts.length === 0) || (isSearching && inSearchMode && currentDisplayPosts.length === 0);

  return (
    <>
      <ScrollView
        style={[styles.container, { backgroundColor: screenBackgroundColor }]}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} progressViewOffset={36} />
        }
      >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.feedToggle}
          onPress={() => setIsFriendsFeed((prev) => !prev)}
          accessibilityRole="button"
          accessibilityLabel={t('toggleFeed', { defaultValue: 'Toggle feed' })}
        >
          <AccessibleText
            type="title"
            backgroundColor={screenBackgroundColor}
            style={[
              styles.feedToggleLabel,
              {
                color: feedAccentColor,
              },
            ]}
          >
            {isFriendsFeed
              ? t('exploreFriends', { defaultValue: 'Explore Friends' })
              : t('exploreGlobal', { defaultValue: 'Explore Global' })}
          </AccessibleText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.notificationButton, { backgroundColor: notificationButtonBackground }]}
          onPress={openNotifications}
          accessibilityRole="button"
          accessibilityLabel={t('openNotifications', { defaultValue: 'Open notifications' })}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="notifications-outline" size={28} color={notificationIconColor} />
        </TouchableOpacity>
      </View>


        {userType === 'guest' && (
          <View style={styles.guestActionHeader}>
            <TouchableOpacity
              style={styles.loginButton}
              onPress={() => navigation.navigate('index' as never)}
            >
              <AccessibleText backgroundColor={'#2196F3'} style={styles.loginButtonText}>{t('goToLogin')}</AccessibleText>
            </TouchableOpacity>
          </View>
        )}

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
            placeholder={t('searchPlaceholder')}
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
          <View style={[styles.errorBox, { backgroundColor: themedErrorBoxBackgroundColor }]}> 
            <AccessibleText backgroundColor={themedErrorBoxBackgroundColor} style={[styles.errorText, { color: themedErrorBoxTextColor }]}>{t('errorFailedToLoadPosts')} </AccessibleText>
          </View>
        ) : inSearchMode ? (
          <>
            {searchResults.length > 0 ? (
              searchResults.map(post => (
                <PostItem
                  key={`search-${post.id}`}
                  post={post}
                  cardBackgroundColor={cardBackgroundColor} iconColor={iconColor} textColor={generalTextColor}
                  commentInputBorderColor={commentInputBorderColor} commentInputTextColor={commentInputTextColor}
                  commentInputPlaceholderColor={commentInputPlaceholderColor} commentInputBackgroundColor={commentInputBackgroundColor}
                  onLikePress={handleLikeToggle} userType={userType} loggedInUsername={username}
                  onSavePress={handleSaveToggle}
                  isExpanded={expandedPostId === post.id}
                  commentsList={commentsByPostId[post.id] || []}
                  isLoadingComments={loadingCommentsPostId === post.id}
                  commentInputText={editingCommentDetails?.postId === post.id ? '' : (commentInputs[post.id] || '')}
                  isPostingComment={postingCommentPostId === post.id}
                  onToggleComments={() => handleToggleComments(post.id)}
                  onCommentInputChange={(text) => handleCommentInputChange(post.id, text)}
                  onPostComment={() => handlePostComment(post.id)}
                  onDeleteComment={handleDeleteComment}
                  onTriggerEditComment={handleStartEditComment}
                  editingCommentDetailsForPost={editingCommentDetails?.postId === post.id ? editingCommentDetails : null}
                  onEditCommentContentChange={handleEditingCommentTextChange}
                  onSaveEditedCommentForPost={handleSaveCommentEdit}
                  onCancelCommentEdit={handleCancelCommentEdit}
                  isSubmittingCommentEditForPost={editingCommentDetails?.postId === post.id && isSubmittingCommentEdit}
                />
              ))
            ) : (
              <View style={[styles.noMoreBox, { backgroundColor: themedNoMoreBoxBackgroundColor }]}> 
                <AccessibleText backgroundColor={themedNoMoreBoxBackgroundColor} style={[styles.noMoreText, { color: themedNoMoreBoxTextColor }]}>No results found.</AccessibleText>
              </View>
            )}
          </>
        ) : (
          <>
            {posts.length > 0 ? (
              <>
                {posts.map(post => (
                  <PostItem
                    key={`feed-${post.id}`}
                    post={post}
                    cardBackgroundColor={cardBackgroundColor} iconColor={iconColor} textColor={generalTextColor}
                    commentInputBorderColor={commentInputBorderColor} commentInputTextColor={commentInputTextColor}
                    commentInputPlaceholderColor={commentInputPlaceholderColor} commentInputBackgroundColor={commentInputBackgroundColor}
                    onLikePress={handleLikeToggle} onSavePress={handleSaveToggle}
                    userType={userType} loggedInUsername={username}
                    isExpanded={expandedPostId === post.id}
                    commentsList={commentsByPostId[post.id] || []}
                    isLoadingComments={loadingCommentsPostId === post.id}
                    commentInputText={editingCommentDetails?.postId === post.id ? '' : (commentInputs[post.id] || '')}
                    isPostingComment={postingCommentPostId === post.id}
                    onToggleComments={() => handleToggleComments(post.id)}
                    onCommentInputChange={(text) => handleCommentInputChange(post.id, text)}
                    onPostComment={() => handlePostComment(post.id)}
                    onDeleteComment={handleDeleteComment}
                    onTriggerEditComment={handleStartEditComment}
                    editingCommentDetailsForPost={editingCommentDetails?.postId === post.id ? editingCommentDetails : null}
                    onEditCommentContentChange={handleEditingCommentTextChange}
                    onSaveEditedCommentForPost={handleSaveCommentEdit}
                    onCancelCommentEdit={handleCancelCommentEdit}
                    isSubmittingCommentEditForPost={editingCommentDetails?.postId === post.id && isSubmittingCommentEdit}
                  />
                ))}
                {!noMorePosts && !refreshing && posts.length > 0 && (
                  <TouchableOpacity
                    style={styles.loadMoreButton}
                    onPress={handleLoadMore}
                    disabled={loadingMore || refreshing || isSearching}
                  >
                    {loadingMore ? (
                          <ActivityIndicator color="#fff" />
                        ) : (
                          <AccessibleText backgroundColor={'#2196F3'} style={styles.loadMoreText}>{t('loadMorePosts')}</AccessibleText>
                        )}
                  </TouchableOpacity>
                )}
                {noMorePosts && posts.length > 0 && !loadingMore && !refreshing && (
                  <View style={[styles.noMoreBox, { backgroundColor: themedNoMoreBoxBackgroundColor, marginTop: 20, marginBottom: 20 }]}> 
                    <AccessibleText backgroundColor={themedNoMoreBoxBackgroundColor} style={[styles.noMoreText, { color: themedNoMoreBoxTextColor }]}>{t('endOfFeed')}</AccessibleText>
                  </View>
                )}
              </>
            ) : (
              !loading && !error && !refreshing && !isSearching && (
                <View style={[styles.noMoreBox, { backgroundColor: themedNoMoreBoxBackgroundColor }]}>
                  <AccessibleText backgroundColor={themedNoMoreBoxBackgroundColor} style={[styles.noMoreText, { color: themedNoMoreBoxTextColor }]}>{t('noPostsAvailable')}</AccessibleText>
                    <AccessibleText backgroundColor={themedNoMoreBoxBackgroundColor} style={[styles.noMoreText, { color: themedNoMoreBoxTextColor, fontSize: 14, marginTop: 8 }]}>{t('pullToRefresh')}</AccessibleText>
                </View>
              )
            )}
          </>
        )}
      </ScrollView>
      <Modal
        visible={isNotificationsVisible}
        animationType="slide"
        onRequestClose={closeNotifications}
      >
        <View style={[styles.notificationsOverlay, { backgroundColor: screenBackgroundColor }]}>
          <View style={styles.notificationsHeader}>
            <TouchableOpacity
              onPress={closeNotifications}
              accessibilityLabel={t('close', { defaultValue: 'Close' })}
              style={styles.notificationsBackButton}
            >
              <Ionicons name="arrow-back" size={24} color={generalTextColor} />
            </TouchableOpacity>
            <AccessibleText backgroundColor={screenBackgroundColor} style={[styles.notificationsTitle, { color: generalTextColor }]}>
              {t('notificationsTitle', { defaultValue: 'Notifications' })}
            </AccessibleText>
            <View style={{ width: 32 }} />
          </View>
          <View style={styles.notificationsContent}>
            <AccessibleText backgroundColor={screenBackgroundColor} style={[styles.notificationsEmptyText, { color: iconColor }]}>
              {t('notificationsEmpty', { defaultValue: "You're all caught up!" })}
            </AccessibleText>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 24 },
  header: { 
    paddingHorizontal: 16, 
    marginTop: Platform.OS === 'ios' ? 48 : 48, 
    marginBottom: 18, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
    marginRight: 8,
  },
  feedToggle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  feedToggleLabel: {
    paddingHorizontal: 4,
    paddingVertical: 4,
    fontWeight: '700',
  },
  guestActionHeader: {
    paddingHorizontal: 16,
    marginBottom: 18,
    alignItems: 'flex-start',
  },
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
  loginButton: { 
    paddingVertical: 8, 
    paddingHorizontal: 16, 
    backgroundColor: '#2196F3', 
    borderRadius: 20, 
  },
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
  commentOwnerActions: { flexDirection: 'row' },
  commentActionButton: { paddingHorizontal: 6, paddingVertical: 4 },
  deleteCommentButton: { padding: 4 },
  commentEditInput: { fontSize: 14, paddingVertical: 8, paddingHorizontal: 10, borderWidth: 1, borderRadius: 6, marginBottom: 8, maxHeight: 100 },
  editActionsContainer: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 4 },
  editActionButton: { marginLeft: 8, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 15, minWidth: 70, alignItems: 'center' },
  editActionButtonText: { color: '#FFFFFF', fontWeight: '600', fontSize: 13 },
  commentContent: { fontSize: 14, lineHeight: 18 },
  commentTimestamp: { fontSize: 10, opacity: 0.7, marginTop: 4, textAlign: 'right' },
  noCommentsText: { textAlign: 'center', marginVertical: 15, fontSize: 14, opacity: 0.7 },
  addCommentContainer: { flexDirection: 'row', alignItems: 'center', paddingTop: 10, borderTopWidth: 1, marginTop: 5 },
  commentInput: { flex: 1, borderWidth: 1, borderRadius: 20, paddingHorizontal: 15, paddingVertical: 8, fontSize: 14, marginRight: 10, maxHeight: 80 },
  postCommentButton: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 20, backgroundColor: '#007AFF' },
  postCommentButtonDisabled: { backgroundColor: '#B0C4DE' },
  postCommentButtonText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },
  notificationButton: {
    padding: 8,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationsOverlay: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 16,
  },
  notificationsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  notificationsBackButton: { padding: 6, marginRight: 8 },
  notificationsTitle: { fontSize: 20, fontWeight: '700' },
  notificationsContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationsEmptyText: { fontSize: 16, textAlign: 'center', lineHeight: 22 },
});
