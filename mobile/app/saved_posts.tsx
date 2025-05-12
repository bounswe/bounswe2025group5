// app/saved_posts.tsx
import React, { useContext, useEffect, useState, useCallback, useLayoutEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  ActivityIndicator,
  RefreshControl,
  Platform,
  useColorScheme,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { AuthContext } from './_layout'; // Adjust path if necessary

const HOST = Platform.select({ android: '10.0.2.2', ios: 'localhost', web: 'localhost' });
const API_BASE = `http://${HOST}:8080`;

// Assuming PostData type is consistent with what getSavedPosts returns
type PostData = {
  postId: number; // Ensure this matches the ID field name from your API (e.g., could be 'id')
  creatorUsername: string;
  content: string;
  likes: number;
  comments: any[]; // Adjust type if needed (e.g., number for count)
  photoUrl: string | null;
};

// *** Card Component for Saved Posts (Handles Local Unsave State) ***
function SavedPostCard({
    post,
    cardBackgroundColor,
    iconColor,
    actionIconColor,
    isLocallyUnsaved, 
    onUnsave,
    onResave         
}: {
    post: PostData;
    cardBackgroundColor: string;
    iconColor: string;
    actionIconColor: string;
    isLocallyUnsaved: boolean; // Pass the check result
    onUnsave: (postId: number) => void;
    onResave: (postId: number) => void; // Pass the resave handler
}) {
  const navigation = useNavigation<any>();

  const handleViewPost = () => {
     // Optional: Navigate to post detail if needed
     // navigation.navigate('post_detail', { postId: post.postId });
     console.log("Navigate to post detail for:", post.postId);
  };

   // Helper to safely get comments length or count
   const getCommentCount = (comments: any): number => {
      if (Array.isArray(comments)) {
          return comments.length;
      }
      if (typeof comments === 'number') {
          return comments;
      }
      return 0; // Default to 0 if type is unexpected
  }

  // Determine which action to call based on the local state
  const handleBookmarkPress = () => {
      if (isLocallyUnsaved) {
          onResave(post.postId);
      } else {
          onUnsave(post.postId);
      }
  };

  return (
    <TouchableOpacity onPress={handleViewPost} style={[styles.postContainer, { backgroundColor: cardBackgroundColor }]}>
      {post.photoUrl && (
        <Image
          source={{
            uri: post.photoUrl.startsWith('http')
              ? post.photoUrl
              : `${API_BASE}${post.photoUrl}`,
          }}
          style={styles.postImage}
          onError={(e) => console.warn('Saved Post: Image failed to load:', e.nativeEvent.error, post.photoUrl)}
        />
      )}
      <ThemedText style={styles.postContent} numberOfLines={post.photoUrl ? 3 : 6}>
        {post.content}
      </ThemedText>
      <ThemedText style={styles.creatorText}>By: {post.creatorUsername}</ThemedText>

      <View style={styles.postFooter}>
        <View style={styles.postStats}>
            <Ionicons name="heart-outline" size={16} color={iconColor} />
            <ThemedText style={[styles.footerText, { color: iconColor }]}>{post.likes}</ThemedText>
            <Ionicons name="chatbubble-outline" size={16} color={iconColor} />
            <ThemedText style={[styles.footerText, { color: iconColor }]}>{getCommentCount(post.comments)}</ThemedText>
        </View>
        <View style={styles.postActions}>
            {/* Unsave/Resave Button - Icon and action depend on local state */}
            <TouchableOpacity onPress={handleBookmarkPress} style={styles.actionIcon}>
                <Ionicons
                    name={isLocallyUnsaved ? "bookmark-outline" : "bookmark"} // <-- Conditional icon
                    size={20}
                    color={actionIconColor} 
                />
            </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// *** Main Screen Component ***
export default function SavedPostsScreen() {
  const navigation = useNavigation<any>();
  const { username } = useContext(AuthContext);
  const colorScheme = useColorScheme();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: 'My Saved Posts',
    });
  }, [navigation]);

  const [savedPosts, setSavedPosts] = useState<PostData[]>([]);
  // --- New State to track posts unsaved in this session ---
  const [locallyUnsavedIds, setLocallyUnsavedIds] = useState<Set<number>>(new Set());
  // ---
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const isDarkMode = colorScheme === 'dark';
  const screenBackgroundColor = isDarkMode ? '#151718' : '#F0F2F5';
  const cardBackgroundColor = isDarkMode ? '#1C1C1E' : '#FFFFFF';
  const iconColor = isDarkMode ? '#8E8E93' : '#6C6C70'; // For stats icons
  const actionIconColor = isDarkMode ? '#4A90E2' : '#007AFF'; // Color for the bookmark action icon
  const activityIndicatorColor = isDarkMode ? '#FFFFFF' : '#000000';
  const refreshControlColors = isDarkMode ? { tintColor: '#FFFFFF', titleColor: '#FFFFFF'} : { tintColor: '#000000', titleColor: '#000000'};
  const errorTextColor = isDarkMode ? '#FF9494' : '#D32F2F';

  // *** Fetch Saved Posts Logic - Resets local state on success ***
  const fetchSavedPosts = useCallback(async () => {
    if (!username) {
        setError("Login Required: Cannot fetch saved posts.");
        setLoading(false);
        setRefreshing(false);
        return;
    }
    if (!refreshing && savedPosts.length === 0) {
        setLoading(true);
    }
    setError('');

    try {
      const response = await fetch(`${API_BASE}/api/posts/getSavedPosts?username=${username}`);

      if (!response.ok) {
        const errorBody = await response.text();
        console.error("Fetch saved posts error:", response.status, errorBody);
        if (response.status === 404) {
             setSavedPosts([]); // Handle case where user has no saved posts
             setLocallyUnsavedIds(new Set()); // Clear local state even on 404
        } else {
            throw new Error(`Failed to fetch saved posts: ${response.status}`);
        }
      } else {
         const data: PostData[] = await response.json();
         setSavedPosts(data);
         // ---> Reset local unsaved state after successful fetch <---
         setLocallyUnsavedIds(new Set());
      }

    } catch (err) {
      console.error('Error fetching saved posts:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred while fetching saved posts.');
      // Don't clear posts or local state on error, keep showing the old data if available
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [username, refreshing]); // Keep refreshing dependency

  // Fetch data when the screen comes into focus or username changes
  useFocusEffect(
    useCallback(() => {
      // Only fetch if username is available
      if (username) {
        fetchSavedPosts();
      } else {
        // Handle case where user logs out while on this screen
        setSavedPosts([]);
        setLocallyUnsavedIds(new Set());
        setError("Login Required: Cannot fetch saved posts.");
        setLoading(false);
      }
    }, [fetchSavedPosts, username]) // Add username dependency here too
  );

  // Handle pull-to-refresh
  const handleRefresh = () => {
    setRefreshing(true);
    // fetchSavedPosts will be called due to state change and useCallback dependency
  };

  // *** Unsave Post Logic - Marks locally, calls API ***
  const handleUnsavePost = async (postId: number) => {
    if (!username) {
        Alert.alert("Login Required", "Please log in to unsave posts.");
        return;
    }

    // Mark as locally unsaved *before* API call for immediate UI feedback
    const newUnsavedIds = new Set(locallyUnsavedIds);
    newUnsavedIds.add(postId);
    setLocallyUnsavedIds(newUnsavedIds);

    try {
        // --- Use your DELETE endpoint ---
        const response = await fetch(`${API_BASE}/api/posts/unsave/${username}/${postId}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            // Revert local state change on failure
            const revertedUnsavedIds = new Set(locallyUnsavedIds);
            revertedUnsavedIds.delete(postId);
            setLocallyUnsavedIds(revertedUnsavedIds);

            const errorBody = await response.text();
            console.error("Unsave post error:", response.status, errorBody);
            throw new Error(`Failed to unsave post: ${response.status}`);
        }

        console.log(`Post ${postId} unsaved successfully (backend). Will be removed on refresh.`);
        // UI is already updated via local state change

    } catch (err) {
        // Revert local state change on any exception
        const revertedUnsavedIds = new Set(locallyUnsavedIds);
        revertedUnsavedIds.delete(postId);
        setLocallyUnsavedIds(revertedUnsavedIds);

        console.error("Error unsaving post:", err);
        Alert.alert("Error", err instanceof Error ? err.message : "Could not unsave post.");
    }
  };

  // *** Re-Save Post Logic - Updates local state, calls API ***
  const handleResavePost = async (postId: number) => {
    if (!username) {
      Alert.alert("Login Required", "Please log in to save posts.");
      return;
    }

    // Immediately remove from 'locally unsaved' for UI feedback
    const newUnsavedIds = new Set(locallyUnsavedIds);
    newUnsavedIds.delete(postId);
    setLocallyUnsavedIds(newUnsavedIds);

    try {
        // --- Use your POST endpoint for saving ---
        const response = await fetch(`${API_BASE}/api/posts/save`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json', 
            },
            body: JSON.stringify({
                // Adjust body based on your API requirements
                // Ensure these field names match what your API expects!
                username: username,
                postId: postId,
            }),
        });

      if (!response.ok) {
            // Revert local state if save fails (mark as unsaved again)
            const revertedUnsavedIds = new Set(locallyUnsavedIds);
            revertedUnsavedIds.add(postId);
            setLocallyUnsavedIds(revertedUnsavedIds);

            const errorBody = await response.text();
            console.error("Re-save post error:", response.status, errorBody);
            throw new Error(`Failed to re-save post: ${response.status}`);
      }

      console.log(`Post ${postId} re-saved successfully.`);
      // UI is already updated via local state change

    } catch (err) {
        // Revert local state on any exception (mark as unsaved again)
        const revertedUnsavedIds = new Set(locallyUnsavedIds);
        revertedUnsavedIds.add(postId);
        setLocallyUnsavedIds(revertedUnsavedIds);

        console.error("Error re-saving post:", err);
        Alert.alert("Error", err instanceof Error ? err.message : "Could not re-save post.");
    }
  };

  // Loading State
  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: screenBackgroundColor }]}>
        <ActivityIndicator size="large" color={activityIndicatorColor} />
      </View>
    );
  }

  // Main Render
  return (
    <ScrollView
      style={[styles.container, { backgroundColor: screenBackgroundColor }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={refreshControlColors.tintColor}
          titleColor={refreshControlColors.titleColor}
        />
      }
    >
      {error ? (
        <View style={styles.centeredMessageContainer}>
            <ThemedText style={{ color: errorTextColor, textAlign: 'center' }}>{error}</ThemedText>
            {/* Show retry only if the error is not about login */}
            {error !== "Login Required: Cannot fetch saved posts." && (
                 <TouchableOpacity onPress={fetchSavedPosts} style={styles.retryButton}>
                    <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
                </TouchableOpacity>
            )}
        </View>
      ) : savedPosts.length === 0 ? ( // Check after loading is false
        <View style={styles.centeredMessageContainer}>
            <ThemedText>You haven't saved any posts yet.</ThemedText>
            <TouchableOpacity
                style={styles.exploreButton}
                onPress={() => navigation.navigate('(tabs)', { screen: 'explore' })} // Adjust navigation path
            >
                <ThemedText style={styles.exploreButtonText}>Explore Posts</ThemedText>
            </TouchableOpacity>
        </View>
      ) : (
        // List of Saved Posts
        savedPosts.map(post => (
          <SavedPostCard
            key={post.postId} // Ensure key is unique and stable
            post={post}
            cardBackgroundColor={cardBackgroundColor}
            iconColor={iconColor}
            actionIconColor={actionIconColor}
            // ---> Pass the check and the correct handlers <---
            isLocallyUnsaved={locallyUnsavedIds.has(post.postId)}
            onUnsave={handleUnsavePost}
            onResave={handleResavePost}
          />
        ))
      )}
    </ScrollView>
  );
}

// *** Styles (Mostly unchanged from previous versions) ***
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 16,
    paddingBottom: 24,
    flexGrow: 1,
  },
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
    backgroundColor: '#e0e0e0'
  },
  postContent: {
    fontSize: 15,
    marginBottom: 6,
    lineHeight: 22,
  },
  creatorText: {
      fontSize: 13,
      color: '#8E8E93',
      marginBottom: 10,
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(128, 128, 128, 0.3)',
    paddingTop: 10,
    marginTop: 10,
  },
  postStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    marginHorizontal: 8,
    // Color is set dynamically in the component
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIcon: {
    padding: 8,
    marginLeft: 8,
    borderRadius: 15,
  },
  centeredMessageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: 300,
  },
   exploreButton: {
    marginTop: 20,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
  },
  exploreButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  retryButton: {
    marginTop: 15,
    borderColor: '#007AFF',
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#007AFF',
    fontSize: 15,
    fontWeight: '500',
  }
});