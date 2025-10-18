import React, { useContext, useState, useCallback, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  StyleSheet,
  Image,
  View,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Platform,
  useColorScheme,
  Switch,
  Modal,
  Alert,
  Keyboard,
} from 'react-native';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { AuthContext } from '../_layout';
import { apiRequest, clearSession } from '../services/apiClient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import PostItem from '../components/PostItem';

type CommentData = {
  commentId: number;
  username: string;
  content: string;
  createdAt: string | Date;
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
  createdAt?: string | Date | null;
};

const WASTE_TYPES = ['Plastic', 'Paper', 'Glass', 'Metal', 'Organic'] as const;

const MOCK_WASTE_HISTORY: Record<string, number[]> = {
  Plastic: [2, 3, 4, 6, 8],
  Paper: [1, 2, 3, 3, 4],
  Glass: [1, 1, 2, 4, 5],
  Metal: [0.5, 1, 1.5, 2, 2.5],
  Organic: [3, 4, 5, 7, 9],
};

const formatChartValue = (value: number) => {
  if (!Number.isFinite(value)) return '0';
  return Number.isInteger(value) ? value.toString() : value.toFixed(1);
};

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { t, i18n } = useTranslation();
  
  const { userType, setUserType, username, setUsername} = useContext(AuthContext);
    
  // Define ErrorState so useState<ErrorState> is valid
  type ErrorState = { key: string | null; message: string | null };

  const colorScheme = useColorScheme();

  const [bio, setBio] = useState('');
  const [avatarUri, setAvatarUri] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ErrorState>({ key: null, message: null });
  const [profileUpdateBannerVisible, setProfileUpdateBannerVisible] = useState(false);
  const [isAvatarModalVisible, setAvatarModalVisible] = useState(false);
  const [hasLoadedProfile, setHasLoadedProfile] = useState(false);
  const [hasLoadedPosts, setHasLoadedPosts] = useState(false);
  const [isProgressModalVisible, setProgressModalVisible] = useState(false);
  const [selectedWasteType, setSelectedWasteType] = useState<string>(WASTE_TYPES[0]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsError, setPostsError] = useState<string | null>(null);
  const [expandedPostId, setExpandedPostId] = useState<number | null>(null);
  const [commentsByPostId, setCommentsByPostId] = useState<{ [postId: number]: CommentData[] }>({});
  const [loadingCommentsPostId, setLoadingCommentsPostId] = useState<number | null>(null);
  const [commentInputs, setCommentInputs] = useState<{ [postId: number]: string }>({});
  const [postingCommentPostId, setPostingCommentPostId] = useState<number | null>(null);
  const [editingCommentDetails, setEditingCommentDetails] = useState<{
    postId: number;
    commentId: number;
    currentText: string;
  } | null>(null);
  const [isSubmittingCommentEdit, setIsSubmittingCommentEdit] = useState(false);
  const isTurkish = (i18n.resolvedLanguage || i18n.language || '').toLowerCase().startsWith('tr');
  const toggleLanguage = (value: boolean) => {
    i18n.changeLanguage(value ? 'tr-TR' : 'en-US');
  };

  const isDarkMode = colorScheme === 'dark';
  const parallaxHeaderBgColor = isDarkMode ? '#000000' : '#FFFFFF';
  const avatarPlaceholderColor = isDarkMode ? '#5A5A5D' : '#999';
  const contentBackgroundColor = isDarkMode ? '#151718' : '#F0F2F5';
  const buttonTextColor = '#FFFFFF';
  const errorTextColor = isDarkMode ? '#FF9494' : '#D32F2F';
  const errorBackgroundColor = isDarkMode ? '#5D1F1A' : '#FFCDD2';
  const successBannerBgColor = isDarkMode ? 'rgba(46, 125, 50, 0.25)' : '#E8F5E9';
  const successBannerTextColor = isDarkMode ? '#A5D6A7' : '#2E7D32';
  const cardBackgroundColor = isDarkMode ? '#1C1C1E' : '#FFFFFF';
  const generalTextColor = isDarkMode ? '#E5E5E7' : '#1C1C1E';
  const iconColor = isDarkMode ? '#8E8E93' : '#6C6C70';
  const commentInputBorderColor = isDarkMode ? '#545458' : '#C7C7CD';
  const commentInputTextColor = generalTextColor;
  const commentInputPlaceholderColor = iconColor;
  const commentInputBackgroundColor = isDarkMode ? '#2C2C2E' : '#F0F2F5';
  const chartValues = useMemo(
    () => MOCK_WASTE_HISTORY[selectedWasteType] ?? [],
    [selectedWasteType]
  );
  const chartBarHeights = useMemo(() => {
    if (chartValues.length === 0) return [];
    const maxValue = Math.max(...chartValues, 1);
    return chartValues.map((value) => {
      const normalized = maxValue ? value / maxValue : 0;
      return Math.max(12, normalized * 140);
    });
  }, [chartValues]);

  const handleLogout = async () => {
    await clearSession();
    await AsyncStorage.multiRemove(['password', 'email']);
    setUserType(null);
    setUsername('');
    navigation.reset({ index: 0, routes: [{ name: 'index' }] });
  };

  const mapApiItemToPost = (item: any): Post => ({
    id: item.postId,
    title: item.creatorUsername,
    content: item.content,
    likes: item.likes || 0,
    comments: Array.isArray(item.comments) ? item.comments.length : Number(item.comments) || 0,
    photoUrl: item.photoUrl ?? null,
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
        const likedByCurrent =
          likesData.likedByUsers?.some((liker: any) => liker.username === currentUsername) || false;
        return { ...post, likedByUser: likedByCurrent };
      } catch (e) {
        console.warn('Failed to fetch like status for post', post.id, e);
        return post;
      }
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
      return currentPostsToUpdate.map((post) => ({
        ...post,
        savedByUser: savedPostIds.has(post.id),
      }));
    } catch (e) {
      console.warn('Error fetching saved statuses:', e);
      return currentPostsToUpdate;
    }
  };

  const fetchUserPosts = useCallback(async () => {
    if (!username) {
      setPosts([]);
      setPostsLoading(false);
      setHasLoadedPosts(false);
      return;
    }
    const shouldShowSpinner = !hasLoadedPosts;
    if (shouldShowSpinner) {
      setPostsLoading(true);
    }
    setPostsError(null);
    try {
      const res = await apiRequest(`/api/users/${encodeURIComponent(username)}/posts`);
      if (!res.ok) {
        throw new Error(`Failed to fetch posts: ${res.status}`);
      }
      const data = await res.json();
      let mappedPosts: Post[] = Array.isArray(data) ? data.map(mapApiItemToPost) : [];
      if (userType === 'user') {
        mappedPosts = await fetchLikeStatusesForPosts(mappedPosts, username);
        mappedPosts = await fetchSavedStatusesForPosts(mappedPosts, username);
      }
      setPosts(mappedPosts);
      setHasLoadedPosts(true);
    } catch (err) {
      console.error('Failed to fetch profile posts:', err);
      setPostsError(i18n.t('profilePostsLoadError'));
      setPosts([]);
    } finally {
      if (shouldShowSpinner) {
        setPostsLoading(false);
      }
    }
  }, [username, userType, hasLoadedPosts, i18n]);

  const handleLikeToggle = async (postId: number, currentlyLiked: boolean) => {
    if (userType === 'guest' || !username) {
      Alert.alert(t('loginRequired'), t('pleaseLogInToLikePosts'));
      return;
    }
    setPosts((currentList) =>
      currentList.map((p) =>
        p.id === postId
          ? { ...p, likedByUser: !currentlyLiked, likes: currentlyLiked ? Math.max(0, p.likes - 1) : p.likes + 1 }
          : p
      )
    );
    try {
      const response = await apiRequest('/api/posts/like', {
        method: currentlyLiked ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, postId }),
      });
      const responseBodyText = await response.text();
      if (!response.ok) {
        let errorMsg = `Failed to ${currentlyLiked ? 'unlike' : 'like'} post.`;
        try {
          const errorData = JSON.parse(responseBodyText);
          errorMsg = errorData.message || errorMsg;
        } catch {
          errorMsg = `${errorMsg} ${responseBodyText.substring(0, 120)}`;
        }
        throw new Error(errorMsg);
      }
      const parsed = JSON.parse(responseBodyText || '{}');
      if (!parsed.success) {
        throw new Error(parsed.message || `Backend error on ${currentlyLiked ? 'unlike' : 'like'}.`);
      }
    } catch (err: any) {
      console.error('Failed to toggle like:', err);
      Alert.alert(t('error'), err.message || t('couldNotUpdateLike'));
      setPosts((currentList) =>
        currentList.map((p) =>
          p.id === postId
            ? { ...p, likedByUser: currentlyLiked, likes: currentlyLiked ? p.likes + 1 : Math.max(0, p.likes - 1) }
            : p
        )
      );
    }
  };

  const handleSaveToggle = async (postId: number, currentlySaved: boolean) => {
    if (userType === 'guest' || !username) {
      Alert.alert(t('loginRequired'), t('pleaseLogInToSavePosts'));
      return;
    }
    setPosts((currentList) =>
      currentList.map((p) => (p.id === postId ? { ...p, savedByUser: !currentlySaved } : p))
    );
    try {
      const encodedUsername = encodeURIComponent(username);
      const response = currentlySaved
        ? await apiRequest(`/api/posts/${postId}/saves/${encodedUsername}`, { method: 'DELETE' })
        : await apiRequest(`/api/posts/${postId}/save`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username }),
          });
      const responseBodyText = await response.text();
      if (!response.ok) {
        let errorMsg = `Failed to ${currentlySaved ? 'unsave' : 'save'} post.`;
        try {
          const errorData = JSON.parse(responseBodyText);
          errorMsg = errorData.message || errorMsg;
        } catch {
          errorMsg = `${errorMsg} ${responseBodyText.substring(0, 120)}`;
        }
        throw new Error(errorMsg);
      }
      const parsed = JSON.parse(responseBodyText || '{}');
      const successField = currentlySaved ? parsed.deleted : parsed.username;
      if (!successField) {
        throw new Error(parsed.message || `Backend error on ${currentlySaved ? 'unsave' : 'save'}.`);
      }
    } catch (err: any) {
      console.error('Failed to toggle save:', err);
      Alert.alert(t('error'), err.message || t('couldNotUpdateSave'));
      setPosts((currentList) =>
        currentList.map((p) => (p.id === postId ? { ...p, savedByUser: currentlySaved } : p))
      );
    }
  };

  const fetchCommentsForPost = async (postId: number, forceRefresh = false) => {
    if (commentsByPostId[postId] && !forceRefresh && commentsByPostId[postId].length > 0) {
      return;
    }
    if (editingCommentDetails?.postId === postId && !forceRefresh) {
      return;
    }
    setLoadingCommentsPostId(postId);
    try {
      const response = await apiRequest(`/api/posts/${postId}/comments`);
      if (!response.ok) {
        throw new Error(`Failed to fetch comments: ${response.status}`);
      }
      const apiResponse = await response.json();
      const fetchedComments: CommentData[] = (apiResponse.comments || []).map((apiComment: any) => ({
        commentId: apiComment.commentId,
        content: apiComment.content,
        createdAt: apiComment.createdAt,
        username: apiComment.creatorUsername,
      }));
      setCommentsByPostId((prev) => ({ ...prev, [postId]: fetchedComments }));
      if (typeof apiResponse.totalComments === 'number') {
        setPosts((prev) =>
          prev.map((p) => (p.id === postId ? { ...p, comments: apiResponse.totalComments } : p))
        );
      }
    } catch (e) {
      console.error('Failed to load comments for post', postId, e);
      Alert.alert(t('error'), t('couldNotLoadComments'));
    } finally {
      setLoadingCommentsPostId(null);
    }
  };

  const handleToggleComments = (postId: number) => {
    const isCurrentlyExpanded = expandedPostId === postId;
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

  const handleCommentInputChange = (postId: number, text: string) => {
    if (editingCommentDetails && editingCommentDetails.postId === postId) {
      setEditingCommentDetails(null);
    }
    setCommentInputs((prev) => ({ ...prev, [postId]: text }));
  };

  const handlePostComment = async (postId: number) => {
    if (!username) {
      Alert.alert(t('loginRequired'), t('mustBeLoggedIn'));
      return;
    }
    const content = commentInputs[postId]?.trim();
    if (!content) {
      Alert.alert(t('emptyComment'), t('commentCannotBeEmpty'));
      return;
    }
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
      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to post comment.');
      }
      const newComment: CommentData = {
        commentId: responseData.commentId,
        content: responseData.content,
        createdAt: responseData.createdAt,
        username: responseData.creatorUsername || username,
      };
      setCommentsByPostId((prev) => ({ ...prev, [postId]: [newComment, ...(prev[postId] || [])] }));
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, comments: p.comments + 1 } : p))
      );
      setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
    } catch (err: any) {
      console.error('Failed to post comment:', err);
      Alert.alert(t('error'), t('couldNotPostComment', { message: err.message }));
    } finally {
      setPostingCommentPostId(null);
    }
  };

  const handleDeleteComment = async (postId: number, commentId: number) => {
    if (!username) {
      Alert.alert(t('error'), t('mustBeLoggedIn'));
      return;
    }
    if (editingCommentDetails && editingCommentDetails.commentId === commentId) {
      setEditingCommentDetails(null);
    }
    Alert.alert(t('deleteCommentTitle'), t('deleteCommentMessage'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            const response = await apiRequest(`/api/posts/comment/${commentId}`, { method: 'DELETE' });
            if (!response.ok) {
              throw new Error(`Failed to delete comment: ${response.status}`);
            }
            setCommentsByPostId((prev) => ({
              ...prev,
              [postId]: (prev[postId] || []).filter((c) => c.commentId !== commentId),
            }));
            setPosts((prev) =>
              prev.map((p) =>
                p.id === postId ? { ...p, comments: Math.max(0, p.comments - 1) } : p
              )
            );
            Alert.alert(t('success'), t('commentDeleted'));
          } catch (err) {
            console.error('Failed to delete comment:', err);
            Alert.alert(t('error'), t('couldNotDeleteComment', { message: (err as Error).message }));
          }
        },
      },
    ]);
  };

  const handleStartEditComment = (postId: number, commentToEdit: CommentData) => {
    setEditingCommentDetails({
      postId,
      commentId: commentToEdit.commentId,
      currentText: commentToEdit.content,
    });
    setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
    if (expandedPostId !== postId) {
      setExpandedPostId(postId);
    }
  };

  const handleEditingCommentTextChange = (newText: string) => {
    setEditingCommentDetails((prev) => (prev ? { ...prev, currentText: newText } : null));
  };

  const handleCancelCommentEdit = () => {
    setEditingCommentDetails(null);
  };

  const handleSaveCommentEdit = async (postIdToSave: number, commentIdToSave: number) => {
    if (!editingCommentDetails || editingCommentDetails.commentId !== commentIdToSave || !username) {
      Alert.alert(t('error'), t('couldNotSaveEdit'));
      setEditingCommentDetails(null);
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
        const errorData = await response.json().catch(() => ({ message: 'Failed to update comment.' }));
        throw new Error(errorData.message || `Failed to update comment: ${response.status}`);
      }
      const updatedCommentData = await response.json();
      setCommentsByPostId((prev) => {
        const postComments = (prev[postIdToSave] || []).map((c) =>
          c.commentId === commentIdToSave
            ? {
                ...c,
                content: updatedCommentData.content,
                createdAt: updatedCommentData.createdAt || c.createdAt,
              }
            : c
        );
        return { ...prev, [postIdToSave]: postComments };
      });
      Alert.alert(t('success'), t('commentUpdated'));
      setEditingCommentDetails(null);
    } catch (err: any) {
      console.error('Error updating comment:', err);
      Alert.alert(t('error'), t('couldNotUpdateComment', { message: err.message }));
    } finally {
      setIsSubmittingCommentEdit(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (userType === 'guest') {
        navigation.reset({
          index: 0,
          routes: [{ name: 'index', params: { error: 'You need to sign up first!' } }],
        });
        return;
      }

      let isMounted = true;
      const shouldShowInitialSpinner = !hasLoadedProfile;

      (async () => {
        try {
          if (shouldShowInitialSpinner) {
            setLoading(true);
          }
          setError({ key: null, message: null });
          const encodedUsername = encodeURIComponent(username);
          const profileUrl = `/api/users/${encodedUsername}/profile?username=${encodedUsername}`;

          let res = await apiRequest(profileUrl);

          if (res.status === 404) {
            await apiRequest(`/api/users/${encodedUsername}/profile`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ username, biography: '' }),
            });
            res = await apiRequest(profileUrl);
          }

          if (!res.ok) {
            throw new Error(`Failed to fetch profile: ${res.status}`);
          }

          const data = await res.json();
          if (!isMounted) return;
          setBio(data.biography ?? '');
          setAvatarUri(data.photoUrl ?? '');
          setHasLoadedProfile(true);
          fetchUserPosts();
        } catch (err) {
          console.error('Failed to fetch or create profile:', err);
          if (isMounted) {
            setError({ key: 'errorCouldNotFetchProfile', message: null });
          }
        } finally {
          if (isMounted && shouldShowInitialSpinner) {
            setLoading(false);
          }
        }
      })();

      return () => {
        isMounted = false;
      };
    }, [userType, username, navigation, fetchUserPosts, hasLoadedProfile])
  );

  useEffect(() => {
    const hasProfileUpdated = route?.params?.profileUpdated;
    if (hasProfileUpdated) {
      setProfileUpdateBannerVisible(true);
      fetchUserPosts();
      const timeout = setTimeout(() => setProfileUpdateBannerVisible(false), 3000);
      navigation.setParams?.({ profileUpdated: undefined });
      return () => clearTimeout(timeout);
    }
  }, [route?.params?.profileUpdated, navigation, fetchUserPosts]);

  if (userType !== 'user' || loading) {
    return (
      <View style={[styles.loadingContainer, {backgroundColor: contentBackgroundColor}]}>
         <ActivityIndicator testID="profile-loading-indicator" size="large" color={isDarkMode ? '#FFF' : '#000'} />
      </View>
    );
  }

  return (
    <>
    <ParallaxScrollView
      headerBackgroundColor={{ light: parallaxHeaderBgColor, dark: parallaxHeaderBgColor }}
      headerImage={
        <Image
          source={require('@/assets/images/wallpaper.png')} // FILENAME IS CORRECT
          style={styles.headerImage}
          resizeMode="cover"
        />
      }
    >
      <View style={[styles.contentContainer, {backgroundColor: contentBackgroundColor}]}>
      {/* ========================================================== */}
        {/* LANGUAGE TOGGLE SITS ABOVE LOGOUT                         */}
        {/* ========================================================== */}
        <View style={styles.languageToggleOuterContainer}>
            <View style={styles.languageToggleContainer}>
                <Text style={styles.languageLabel}>EN</Text>
                <Switch
                    trackColor={{ false: '#767577', true: '#81b0ff' }}
                    thumbColor={isDarkMode ? (isTurkish ? '#f5dd4b' : '#f4f4f4') : (isTurkish ? '#f5dd4b' : '#f4f4f4')}
                    ios_backgroundColor="#3e3e3e"
                    onValueChange={toggleLanguage}
                    value={isTurkish}
                />
                <Text style={styles.languageLabel}>TR</Text>
            </View>
        </View>

        {profileUpdateBannerVisible && (
          <View style={[styles.successBanner, { backgroundColor: successBannerBgColor }]}>
            <Text style={[styles.successBannerText, { color: successBannerTextColor }]}>{t('successBioUpdated')}</Text>
          </View>
        )}

        <View style={styles.logoutContainer}>
          <TouchableOpacity testID="logout-button" onPress={handleLogout} style={styles.logoutButton}>
            <Text style={[styles.topButtonText, {color: buttonTextColor}]}>{t('logOut')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.badgesContainer}>
          <TouchableOpacity
            testID="my-badges-button"
            style={styles.badgesButton}
            onPress={() => navigation.navigate('badges')}
          >
            <Text style={[styles.topButtonText, {color: buttonTextColor}]}>{t('myBadges')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.editProfileContainer}>
          <TouchableOpacity
            testID="edit-profile-button"
            style={styles.editButton}
            onPress={() => navigation.navigate('edit_profile')}
          >
            <Text style={[styles.topButtonText, {color: buttonTextColor}]}>{t('editProfile')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.profileContainer}>
          {avatarUri ? (
            <>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setAvatarModalVisible(true)}
                accessibilityRole="imagebutton"
                accessibilityLabel={t('viewImageFullscreen', { defaultValue: 'View profile image fullscreen' })}
              >
                <Image
                  testID="profile-avatar-image"
                  source={{ uri: avatarUri }}
                  style={styles.profilePic}
                />
              </TouchableOpacity>
              <Modal
                visible={isAvatarModalVisible}
                onRequestClose={() => setAvatarModalVisible(false)}
                transparent
                animationType="fade"
              >
                <View style={styles.avatarModalBackdrop}>
                  <TouchableOpacity
                    style={styles.avatarModalCloseButton}
                    onPress={() => setAvatarModalVisible(false)}
                    accessibilityRole="button"
                    accessibilityLabel={t('closeFullscreenImage', { defaultValue: 'Close image' })}
                  >
                    <Ionicons name="close" size={28} color="#FFFFFF" />
                  </TouchableOpacity>
                  <Image
                    source={{ uri: avatarUri }}
                    style={styles.avatarModalImage}
                    resizeMode="contain"
                  />
                </View>
              </Modal>
            </>
          ) : (
            <Ionicons testID="profile-avatar-placeholder" name="person-circle-outline" size={100} color={avatarPlaceholderColor} />
          )}
          <View style={{ marginLeft: 12, flexShrink: 1 }}>
            <View style={styles.profileGreetingRow}>
              <ThemedText testID="profile-username-text" type="default" style={{ fontSize: 20 }}>
                {t('helloUser', { username })}
              </ThemedText>
              <TouchableOpacity
                style={styles.progressButton}
                onPress={() => setProgressModalVisible(true)}
                accessibilityLabel={t('viewProgress', { defaultValue: 'View historical progress' })}
              >
                <Ionicons name="stats-chart" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <ThemedText
              testID="profile-bio-text"
              type="default"
              style={{ marginTop: 4, fontStyle: bio ? 'normal' : 'italic' }}
              numberOfLines={3}
            >
              {bio || t('noBioYet')}
            </ThemedText>
          </View>
        </View>
        
        {/* ERROR MESSAGE INSERTED HERE */}
        {error.key && (
            <ThemedText style={[styles.errorText, { color: errorTextColor, backgroundColor: errorBackgroundColor }]}>
                {t(error.key)}
            </ThemedText>
        )}
        
        <TouchableOpacity
          testID="create-post-button"
          style={[styles.actionButton, { backgroundColor: '#2196F3' }]}
          onPress={() => navigation.navigate('create_post')}
        >
          <Text style={[styles.actionText, {color: buttonTextColor}]}>{t('createPost')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          testID="my-posts-button"
          style={[styles.actionButton, { backgroundColor: '#00008B' }]} 
          onPress={() => navigation.navigate('posts')} 
        >
          <Text style={[styles.actionText, {color: buttonTextColor}]}>{t('managePosts')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#D4AF37' }]}
          onPress={() => navigation.navigate('saved_posts')}
        >
          <Text style={[styles.actionText, {color: buttonTextColor}]}>{t('savedPosts')}</Text>
        </TouchableOpacity>

        <View style={[styles.sectionDivider, { backgroundColor: isDarkMode ? '#2E2E2E' : '#D9D9D9' }]} />

        <ThemedText style={[styles.postsHeader, { color: generalTextColor }]}>{t('profilePostsTitle')}</ThemedText>

        <View style={styles.postListContainer}>
          {postsLoading ? (
            <ActivityIndicator style={styles.postsLoadingIndicator} color={iconColor} />
          ) : postsError ? (
            <ThemedText style={[styles.postsErrorText, { color: errorTextColor }]}>{postsError}</ThemedText>
          ) : posts.length === 0 ? (
            <ThemedText style={[styles.emptyPostsText, { color: iconColor }]}>{t('noPostsYet')}</ThemedText>
          ) : (
            posts.map((post) => (
              <PostItem
                key={`profile-post-${post.id}`}
                post={post}
                cardBackgroundColor={cardBackgroundColor}
                iconColor={iconColor}
                textColor={generalTextColor}
                commentInputBorderColor={commentInputBorderColor}
                commentInputTextColor={commentInputTextColor}
                commentInputPlaceholderColor={commentInputPlaceholderColor}
                commentInputBackgroundColor={commentInputBackgroundColor}
                onLikePress={handleLikeToggle}
                onSavePress={handleSaveToggle}
                userType={userType}
                loggedInUsername={username}
                isExpanded={expandedPostId === post.id}
                commentsList={commentsByPostId[post.id] || []}
                isLoadingComments={loadingCommentsPostId === post.id}
                commentInputText={
                  editingCommentDetails?.postId === post.id ? '' : commentInputs[post.id] || ''
                }
                isPostingComment={postingCommentPostId === post.id}
                onToggleComments={() => handleToggleComments(post.id)}
                onCommentInputChange={(text) => handleCommentInputChange(post.id, text)}
                onPostComment={() => handlePostComment(post.id)}
                onDeleteComment={handleDeleteComment}
                onTriggerEditComment={handleStartEditComment}
                editingCommentDetailsForPost={
                  editingCommentDetails?.postId === post.id ? editingCommentDetails : null
                }
                onEditCommentContentChange={handleEditingCommentTextChange}
                onSaveEditedCommentForPost={handleSaveCommentEdit}
                onCancelCommentEdit={handleCancelCommentEdit}
                isSubmittingCommentEditForPost={
                  editingCommentDetails?.postId === post.id && isSubmittingCommentEdit
                }
              />
            ))
          )}
        </View>


      </View>
    </ParallaxScrollView>

    {isProgressModalVisible ? (
      <View style={styles.progressModalOverlay}>
        <TouchableOpacity
          style={styles.progressModalBackdrop}
          activeOpacity={1}
          onPress={() => setProgressModalVisible(false)}
        />
        <View style={[styles.progressModalCard, { backgroundColor: cardBackgroundColor }]}>
          <View style={styles.progressModalHeader}>
            <ThemedText style={[styles.progressModalTitle, { color: generalTextColor }]}>
              Historical data
            </ThemedText>
            <TouchableOpacity
              onPress={() => setProgressModalVisible(false)}
              style={styles.progressModalCloseButton}
              accessibilityLabel={t('close', { defaultValue: 'Close' })}
            >
              <Ionicons name="close" size={20} color={generalTextColor} />
            </TouchableOpacity>
          </View>

          <View style={styles.chartArea}>
            <View style={[styles.chartAxes, { borderColor: iconColor }]}>
              {chartBarHeights.length === 0 ? (
                <ThemedText style={[styles.chartEmptyText, { color: iconColor }]}>
                  {t('noData', { defaultValue: 'No data available' })}
                </ThemedText>
              ) : (
                <View style={styles.chartBarsContainer}>
                  {chartBarHeights.map((height, index) => (
                    <View key={`chart-bar-${index}`} style={styles.chartBarWrapper}>
                      <ThemedText style={[styles.chartValueLabel, { color: iconColor }]}>
                        {formatChartValue(chartValues[index])}
                      </ThemedText>
                      <View style={[styles.chartBar, { height }]} />
                      <ThemedText style={[styles.chartXAxisLabel, { color: iconColor }]}>
                        {index + 1}
                      </ThemedText>
                    </View>
                  ))}
                </View>
              )}
            </View>
            <ThemedText style={[styles.chartYAxisLabel, { color: iconColor }]}>
              {t('timeAxisLabel', { defaultValue: 'Time axis' })}
            </ThemedText>
          </View>

          <View style={styles.wasteTypeSelector}>
            <ThemedText style={[styles.wasteTypeLabel, { color: generalTextColor }]}>
              {t('wasteTypeLabel', { defaultValue: 'Waste Type:' })}
            </ThemedText>
            <View style={styles.wasteTypeChips}>
              {WASTE_TYPES.map((type) => {
                const isActive = selectedWasteType === type;
                return (
                  <TouchableOpacity
                    key={type}
                    onPress={() => setSelectedWasteType(type)}
                    style={[
                      styles.wasteTypeChip,
                      { borderColor: iconColor },
                      isActive && styles.wasteTypeChipActive,
                    ]}
                  >
                    <ThemedText
                      style={[
                        styles.wasteTypeChipText,
                        { color: isActive ? '#FFFFFF' : generalTextColor },
                      ]}
                    >
                      {t(type.toLowerCase(), { defaultValue: type })}
                    </ThemedText>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </View>
    ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  headerImage: { width: '100%', height: undefined, aspectRatio: 0.88 },
  contentContainer: { flex: 1, padding: 16, marginTop: -20 }, 
  logoutContainer: { alignItems: 'flex-end', margin: 4  },
  logoutButton: { paddingHorizontal: 20, paddingVertical: 6, borderRadius: 4, backgroundColor: '#E53935' },
  languageToggleOuterContainer: { alignItems: 'flex-end', margin: 4 }, 
  languageToggleContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(128,128,128,0.3)', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 0 },
  languageLabel: { color: '#888', fontWeight: 'bold', marginHorizontal: 0, fontSize: 12 },
  editProfileContainer: { alignItems: 'flex-end', margin: 4 },
  editButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4, backgroundColor: '#007AFF' },
  badgesContainer: { alignItems: 'flex-end', margin: 4 },
  badgesButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4, backgroundColor: '#FF9800' },
  topButtonText: { fontSize: 14, color: '#FFFFFF' },
  profileContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  profilePic: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#ddd' }, 
  profileGreetingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  progressButton: { marginLeft: 12, width: 36, height: 36, borderRadius: 18, backgroundColor: '#2E7D32', alignItems: 'center', justifyContent: 'center' },
  actionButton: { width: '100%', paddingVertical: 12, borderRadius: 8, marginBottom: 12, alignItems: 'center' },
  actionText: { fontSize: 16 }, 
  sectionDivider: { height: 1, width: '100%', marginVertical: 20, borderRadius: 999 },
  postsHeader: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  postListContainer: { paddingBottom: 24 },
  postsLoadingIndicator: { marginVertical: 20 },
  postsErrorText: { textAlign: 'center', marginVertical: 12 },
  emptyPostsText: { textAlign: 'center', marginVertical: 12, fontStyle: 'italic' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center'},
  errorText: { textAlign: 'center', marginBottom: 12, padding: 10, borderRadius: 6 }, // STYLE FOR ERROR
  successBanner: {
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  successBannerText: {
    fontSize: 14,
    fontWeight: '600',
  },
  avatarModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  avatarModalCloseButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    right: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 24,
    padding: 10,
  },
  avatarModalImage: {
    width: '100%',
    height: '70%',
  },
  progressModalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', padding: 20, pointerEvents: 'box-none' },
  progressModalBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)' },
  progressModalCard: { width: '90%', maxWidth: 360, borderRadius: 16, padding: 20, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 8, zIndex: 1 },
  progressModalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  progressModalTitle: { fontSize: 20, fontWeight: '700' },
  progressModalCloseButton: { padding: 8, marginLeft: 12 },
  chartArea: { marginTop: 8 },
  chartAxes: { height: 200, borderLeftWidth: 2, borderBottomWidth: 2, paddingLeft: 16, paddingBottom: 12, justifyContent: 'flex-end' },
  chartBarsContainer: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', height: 160, paddingHorizontal: 8 },
  chartBarWrapper: { alignItems: 'center', justifyContent: 'flex-end', minWidth: 36 },
  chartValueLabel: { fontSize: 12, marginBottom: 6 },
  chartBar: { width: 20, borderRadius: 6, backgroundColor: '#4CAF50' },
  chartXAxisLabel: { marginTop: 6, fontSize: 12 },
  chartYAxisLabel: { marginTop: 12, fontSize: 12, textAlign: 'right' },
  chartEmptyText: { alignSelf: 'center', marginTop: 32, fontSize: 14 },
  wasteTypeSelector: { marginTop: 20 },
  wasteTypeLabel: { fontSize: 14, fontWeight: '600', marginBottom: 12 },
  wasteTypeChips: { flexDirection: 'row', flexWrap: 'wrap' },
  wasteTypeChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, marginRight: 8, marginBottom: 8 },
  wasteTypeChipActive: { backgroundColor: '#2E7D32', borderColor: '#2E7D32' },
  wasteTypeChipText: { fontSize: 12, fontWeight: '600' },
});



