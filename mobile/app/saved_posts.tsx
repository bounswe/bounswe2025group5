// app/saved_posts.tsx
import React, { useContext, useState, useCallback, useLayoutEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  ActivityIndicator,
  RefreshControl,
  useColorScheme,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

import { useTranslation } from 'react-i18next';
import { AuthContext } from './_layout'; // Adjust path if necessary
import { apiUrl } from './apiConfig';
import { apiRequest } from './services/apiClient';

// Types
type PostData = {
  postId: number;
  creatorUsername: string;
  content: string;
  likeCount: number;
  commentCount: number;
  photoUrl: string | null;
};

type ErrorState = { key: string | null; message: string | null };

// Single Card
function SavedPostCard({
  post,
  cardBackgroundColor,
  iconColor,
  actionIconColor,
  isSavedLocally,
  onUnsave,
  onSave,
}: {
  post: PostData;
  cardBackgroundColor: string;
  iconColor: string;
  actionIconColor: string;
  isSavedLocally: boolean;
  onUnsave: (postId: number) => void;
  onSave: (postId: number) => void;
}) {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();

  const handleViewPost = () => {
    // navigation.navigate('post_detail', { postId: post.postId });
    console.log('Navigate to post detail for:', post.postId);
  };

  const handleBookmarkPress = () => {
    if (isSavedLocally) onUnsave(post.postId);
    else onSave(post.postId);
  };

  return (
    <TouchableOpacity onPress={handleViewPost} style={[styles.postContainer, { backgroundColor: cardBackgroundColor }]}>
      {post.photoUrl && (
        <Image
          source={{ uri: post.photoUrl.startsWith('http') ? post.photoUrl : `${API_BASE}${post.photoUrl}` }}
          style={styles.postImage}
          onError={(e) => console.warn('Saved Post Card: Image load error', e.nativeEvent.error)}
        />
      )}
      <ThemedText style={styles.postContent} numberOfLines={post.photoUrl ? 3 : 6}>
        {post.content}
      </ThemedText>

      <ThemedText style={styles.creatorText}>
        {t('byLabel')} {post.creatorUsername}
      </ThemedText>

      <View style={styles.postFooter}>
        <View style={styles.postStats}>
          <Ionicons name="heart-outline" size={16} color={iconColor} />
          <ThemedText style={[styles.footerText, { color: iconColor }]}>{post.likeCount}</ThemedText>
          <Ionicons name="chatbubble-outline" size={16} color={iconColor} />
          <ThemedText style={[styles.footerText, { color: iconColor }]}>{post.commentCount}</ThemedText>
        </View>
        <View style={styles.postActions}>
          <TouchableOpacity onPress={handleBookmarkPress} style={styles.actionIcon}>
            <Ionicons name={isSavedLocally ? 'bookmark' : 'bookmark-outline'} size={20} color={actionIconColor} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// Main Screen
export default function SavedPostsScreen() {
  const navigation = useNavigation<any>();
  const { username } = useContext(AuthContext);
  const colorScheme = useColorScheme();
  const { t, i18n } = useTranslation();

  // State
  const [savedPosts, setSavedPosts] = useState<PostData[]>([]);
  const [locallyUnsavedIds, setLocallyUnsavedIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<ErrorState>({ key: null, message: null });

  // Theming
  const isDarkMode = colorScheme === 'dark';
  const screenBackgroundColor = isDarkMode ? '#151718' : '#F0F2F5';
  const cardBackgroundColor = isDarkMode ? '#1C1C1E' : '#FFFFFF';
  const iconColor = isDarkMode ? '#8E8E93' : '#6C6C70';
  const actionIconColor = '#FFC107';
  const activityIndicatorColor = isDarkMode ? '#FFFFFF' : '#000000';
  const refreshControlColors = isDarkMode ? { tintColor: '#FFFFFF', titleColor: '#FFFFFF' } : { tintColor: '#000000', titleColor: '#000000' };
  const errorTextColor = isDarkMode ? '#FF9494' : '#D32F2F';
  const primaryButtonColor = '#007AFF';

  // Header
  useLayoutEffect(() => {
    navigation.setOptions({ headerTitle: t('savedPostsTitle') });
  }, [navigation, i18n.language, t]);

  // Fetch
  const fetchSavedPosts = useCallback(async () => {
    if (!username) {
      setError({ key: 'loginRequiredSaved', message: null });
      setLoading(false);
      setRefreshing(false);
      setSavedPosts([]);
      setLocallyUnsavedIds(new Set());
      return;
    }

        // Indicate loading only if not refreshing
        if (!refreshing) {
            setLoading(true);
        }
        setError({ key: null, message: null });

        try {
            // --- API Call to GET saved posts ---
            // Remember to encode username for URL safety
            const response = await apiRequest(`/api/users/${encodeURIComponent(username)}/saved-posts`);

            if (!response.ok) {
                if (response.status === 404) { // Handle no saved posts gracefully
                    setSavedPosts([]);
                } else {
                    throw new Error(`Failed to fetch saved posts. Status: ${response.status}`);
                }
            } else {
                const data: PostData[] = await response.json();
                setSavedPosts(data);
            }
            // --- Sync local state with fetch results ---
            setLocallyUnsavedIds(new Set()); // Reset local unsaved status on successful fetch/refresh

        } catch (err: any) {
            console.error("Error fetching saved posts:", err);
            setError(err.message || "An unknown error occurred.");
            // Keep potentially stale 'savedPosts' data visible on error? Or clear? Current: Keep.
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [username, refreshing]); // Dependencies

    // Effect to fetch data on focus or when username changes
    useFocusEffect(
        useCallback(() => {
            console.log("SavedPostsScreen Focus: Username =", username);
            // Wait for AuthContext to provide definitive status (null or string)
            if (username === undefined) {
                console.log("SavedPostsScreen Focus: Waiting for Auth Context...");
                setLoading(true); // Show loader while waiting
                setError(null);
            } else if (username) {
                console.log("SavedPostsScreen Focus: Username present, fetching data.");
                fetchSavedPosts(); // Fetch data only when logged in
            } else { // username is null or empty string
                console.log("SavedPostsScreen Focus: Username null/empty, setting Login Required error.");
                setError("Login Required: Cannot fetch saved posts.");
                setSavedPosts([]);
                setLocallyUnsavedIds(new Set());
                setLoading(false);
            }
        }, [username, fetchSavedPosts]) // Dependencies: username, fetchSavedPosts
    );

    try {
      const response = await fetch(`${API_BASE}/api/posts/getSavedPosts?username=${encodeURIComponent(username)}`);

      if (!response.ok) {
        if (response.status === 404) {
          setSavedPosts([]);
        } else {
            Alert.alert("Login Required", "Please log in to view saved posts.");
        }
    };

    // --- Handle UNsaving a Post ---
    const handleUnsavePost = async (postId: number) => {
        if (!username) { Alert.alert("Login Required"); return; }

        // 1. Optimistic UI Update (Mark as locally unsaved)
        setLocallyUnsavedIds(prevIds => {
            const newIds = new Set(prevIds);
            newIds.add(postId);
            console.log(`Optimistic UI: Marking Post ${postId} as locally unsaved.`);
            return newIds;
        });

        try {
            // 2. API Call (DELETE)
            const response = await apiRequest(`/api/posts/${postId}/saves/${encodeURIComponent(username)}`, {
                method: 'DELETE',
            });
            const responseBodyText = await response.text(); // Get text for potential validation/error
            console.log(`API Response: Status ${response.status}`);

            if (!response.ok) { throw new Error(`Failed to unsave post. Status: ${response.status}`); }

            // 3. Validate Success Response (Optional but Recommended)
            // Expecting { "deleted": true } based on previous info
            try {
                const result = JSON.parse(responseBodyText);
                if (!result || result.deleted !== true) {
                   throw new Error("Backend unsave confirmation format mismatch.");
                }
                console.log(`API Success: Post ${postId} unsaved.`);
            } catch(e: any) {
                 throw new Error(`Failed to parse unsave confirmation or format mismatch: ${e.message}`);
            }
            // If validation passes, do nothing - local state is already updated

        } catch (err: any) {
            // 4. Revert UI on Error
            console.error("Error during unsave:", err);
            Alert.alert("Error", err.message || "Could not unsave post.");
            setLocallyUnsavedIds(prevIds => {
                const newIds = new Set(prevIds);
                newIds.delete(postId);
                console.log(`Reverting UI: Removing Post ${postId} from locally unsaved.`);
                return newIds;
            });
        }
    };

    // --- Handle SAVING a Post (that was locally unsaved) ---
    const handleSavePost = async (postId: number) => {
         if (!username) { Alert.alert("Login Required"); return; }

         // 1. Optimistic UI Update (Mark as locally saved)
         setLocallyUnsavedIds(prevIds => {
            const newIds = new Set(prevIds);
            newIds.delete(postId);
            console.log(`Optimistic UI: Marking Post ${postId} as locally saved (removing from unsaved).`);
            return newIds;
        });

         try {
            // 2. API Call (POST)
            const response = await apiRequest(`/api/posts/${postId}/save`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username }),
            });
            const responseBodyText = await response.text();
            console.log(`API Response: Status ${response.status}`);

            if (!response.ok) { throw new Error(`Failed to save post. Status: ${response.status}`); }

            // 3. Validate Success Response (Optional but Recommended)
            // Expecting { "username": "...", "postId": ... } based on previous info
             try {
                const result = JSON.parse(responseBodyText);
                if (!result || result.username !== username || result.postId !== postId) {
                   throw new Error("Backend save confirmation format mismatch.");
                }
                console.log(`API Success: Post ${postId} saved.`);
            } catch(e: any) {
                 throw new Error(`Failed to parse save confirmation or format mismatch: ${e.message}`);
            }
            // If validation passes, do nothing - local state is already updated

         } catch (err: any) {
            // 4. Revert UI on Error
             console.error("Error during save:", err);
             Alert.alert("Error", err.message || "Could not save post.");
             setLocallyUnsavedIds(prevIds => {
                const newIds = new Set(prevIds);
                newIds.add(postId); // Add back to unsaved list
                console.log(`Reverting UI: Re-adding Post ${postId} to locally unsaved.`);
                return newIds;
            });
         }
    };

    // --- Render Logic ---

    // 1. Initial Auth Loading State
    if (username === undefined) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: screenBackgroundColor }]}>
                <ActivityIndicator size="large" color={activityIndicatorColor} />
            </View>
        );
    }
  }, [username, refreshing]);

  // On focus / username change
  useFocusEffect(
    useCallback(() => {
      if (username === undefined) {
        setLoading(true);
        setError({ key: null, message: null });
      } else if (username) {
        fetchSavedPosts();
      } else {
        setError({ key: 'loginRequiredSaved', message: null });
        setSavedPosts([]);
        setLocallyUnsavedIds(new Set());
        setLoading(false);
      }
    }, [username, fetchSavedPosts])
  );

  // Pull-to-Refresh
  const handleRefresh = () => {
    if (username) {
      setRefreshing(true);
    } else {
      Alert.alert(t('loginRequired'), t('loginToViewSaved'));
    }
  };

  // Unsave
  const handleUnsavePost = async (postId: number) => {
    if (!username) {
      Alert.alert(t('loginRequired'));
      return;
    }

    setLocallyUnsavedIds((prev) => new Set(prev).add(postId));

    try {
      const url = `${API_BASE}/api/posts/unsave/${encodeURIComponent(username)}/${postId}`;
      const response = await fetch(url, { method: 'DELETE' });
      const responseBodyText = await response.text();

      if (!response.ok) {
        throw new Error(`Server error: ${response.status} ${responseBodyText}`);
      }

      try {
        const result = JSON.parse(responseBodyText);
        if (!result || result.deleted !== true) {
          throw new Error('format-mismatch');
        }
      } catch (e: any) {
        throw new Error(`format-mismatch ${e?.message || ''}`.trim());
      }
    } catch (err) {
      console.error('Error during unsave:', err);
      Alert.alert(t('error'), t('errorUnsavePost'));
      setLocallyUnsavedIds((prev) => {
        const copy = new Set(prev);
        copy.delete(postId);
        return copy;
      });
    }
  };

  // Save (re-save)
  const handleSavePost = async (postId: number) => {
    if (!username) {
      Alert.alert(t('loginRequired'));
      return;
    }

    setLocallyUnsavedIds((prev) => {
      const copy = new Set(prev);
      copy.delete(postId);
      return copy;
    });

    try {
      const url = `${API_BASE}/api/posts/save`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, postId }),
      });
      const responseBodyText = await response.text();

      if (!response.ok) {
        throw new Error(`Server error: ${response.status} ${responseBodyText}`);
      }

      try {
        const result = JSON.parse(responseBodyText);
        if (!result || result.username !== username || result.postId !== postId) {
          throw new Error('format-mismatch');
        }
      } catch (e: any) {
        throw new Error(`format-mismatch ${e?.message || ''}`.trim());
      }
    } catch (err) {
      console.error('Error during save:', err);
      Alert.alert(t('error'), t('errorSavePost'));
      setLocallyUnsavedIds((prev) => {
        const copy = new Set(prev);
        copy.add(postId);
        return copy;
      });
    }
  };

  // Render states

  if (username === undefined) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: screenBackgroundColor }]}>
        <ActivityIndicator size="large" color={activityIndicatorColor} />
      </View>
    );
  }

  if (!username) {
    return (
      <ScrollView
        style={[styles.container, { backgroundColor: screenBackgroundColor }]}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={refreshControlColors.tintColor} titleColor={refreshControlColors.titleColor} />}
      >
        <View style={styles.centeredMessageContainer}>
          <ThemedText style={[styles.messageText, { color: errorTextColor, marginBottom: 20 }]}>
            {t('loginRequiredSaved')}
          </ThemedText>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: primaryButtonColor }]} onPress={() => navigation.navigate('index' as never)}>
            <ThemedText style={styles.buttonText}>{t('goToLogin')}</ThemedText>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  if (loading && savedPosts.length === 0) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: screenBackgroundColor }]}>
        <ActivityIndicator size="large" color={activityIndicatorColor} />
      </View>
    );
  }

  if (error.key || error.message) {
    return (
      <ScrollView
        style={[styles.container, { backgroundColor: screenBackgroundColor }]}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={refreshControlColors.tintColor} titleColor={refreshControlColors.titleColor} />}
      >
        <View style={styles.centeredMessageContainer}>
          <ThemedText style={[styles.messageText, { color: errorTextColor, marginBottom: 20 }]}>
            {error.key ? t(error.key) : error.message}
          </ThemedText>
          <TouchableOpacity onPress={fetchSavedPosts} style={styles.retryButton}>
            <ThemedText style={styles.retryButtonText}>{t('retry')}</ThemedText>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  if (!loading && savedPosts.length === 0) {
    return (
      <ScrollView
        style={[styles.container, { backgroundColor: screenBackgroundColor }]}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={refreshControlColors.tintColor} titleColor={refreshControlColors.titleColor} />}
      >
        <View style={styles.centeredMessageContainer}>
          <ThemedText style={styles.messageText}>{t('noSavedPosts')}</ThemedText>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: primaryButtonColor, marginTop: 20 }]}
            onPress={() => navigation.navigate('(tabs)', { screen: 'explore' })}
          >
            <ThemedText style={styles.buttonText}>{t('explorePosts')}</ThemedText>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: screenBackgroundColor }]}
      contentContainerStyle={styles.listContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={refreshControlColors.tintColor} titleColor={refreshControlColors.titleColor} />}
    >
      {savedPosts.map((post) => (
        <SavedPostCard
          key={post.postId}
          post={post}
          cardBackgroundColor={cardBackgroundColor}
          iconColor={iconColor}
          actionIconColor={actionIconColor}
          isSavedLocally={!locallyUnsavedIds.has(post.postId)}
          onUnsave={handleUnsavePost}
          onSave={handleSavePost}
        />
      ))}
    </ScrollView>
  );
}

// Styles
const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  listContent: { padding: 16, paddingBottom: 24 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  centeredMessageContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 40 },
  messageText: { fontSize: 16, textAlign: 'center', marginBottom: 15 },
  postContainer: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(128, 128, 128, 0.2)',
  },
  postImage: {
    width: '100%',
    aspectRatio: 16 / 9,
    maxHeight: 250,
    borderRadius: 6,
    marginBottom: 12,
    resizeMode: 'cover',
    backgroundColor: '#e0e0e0',
  },
  postContent: { fontSize: 15, marginBottom: 6, lineHeight: 22 },
  creatorText: { fontSize: 13, color: '#8E8E93', marginBottom: 10 },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(128, 128, 128, 0.3)',
    paddingTop: 10,
    marginTop: 10,
  },
  postStats: { flexDirection: 'row', alignItems: 'center' },
  footerText: { fontSize: 14, marginHorizontal: 8 },
  postActions: { flexDirection: 'row', alignItems: 'center' },
  actionIcon: { padding: 8, marginLeft: 8, borderRadius: 15 },
  actionButton: { marginTop: 20, paddingVertical: 12, paddingHorizontal: 30, borderRadius: 25, alignItems: 'center', justifyContent: 'center', minWidth: 150 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  retryButton: { marginTop: 15, borderColor: '#007AFF', borderWidth: 1, paddingVertical: 10, paddingHorizontal: 25, borderRadius: 25, alignItems: 'center', justifyContent: 'center', minWidth: 150 },
  retryButtonText: { color: '#007AFF', fontSize: 15, fontWeight: '500' },
});
