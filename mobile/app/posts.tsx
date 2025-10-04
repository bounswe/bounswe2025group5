// app/posts.tsx
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
import { AuthContext } from './_layout'; 
import { API_BASE_URL } from './apiConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = API_BASE_URL;

type PostData = {
  postId: number;
  creatorUsername: string;
  content: string;
  likes: number;
  comments: any[]; 
  photoUrl: string | null;
};

function UserPostCard({
    post,
    cardBackgroundColor,
    iconColor,
    onEdit,
    onDelete
}: {
    post: PostData;
    cardBackgroundColor: string;
    iconColor: string;
    onEdit: (post: PostData) => void; // Changed to pass whole post
    onDelete: (postId: number) => void;
}) {
  return (
    <View style={[styles.postContainer, { backgroundColor: cardBackgroundColor }]}>
      {post.photoUrl && (
        <Image
          source={{
            uri: post.photoUrl.startsWith('http')
              ? post.photoUrl
              : `${API_BASE}${post.photoUrl}`, 
          }}
          style={styles.postImage}
          onError={(e) => console.warn('User Post: Image failed to load:', e.nativeEvent.error, post.photoUrl)}
        />
      )}
      <ThemedText style={styles.postContent} numberOfLines={post.photoUrl ? 3 : 6}>
        {post.content}
      </ThemedText>

      <View style={styles.postFooter}>
        <View style={styles.postStats}>
            <Ionicons name="heart-outline" size={16} color={iconColor} />
            <ThemedText style={styles.footerText}>{post.likes}</ThemedText>
            <Ionicons name="chatbubble-outline" size={16} color={iconColor} />
            <ThemedText style={styles.footerText}>{Array.isArray(post.comments) ? post.comments.length : post.comments}</ThemedText>
        </View>
        <View style={styles.postActions}>
            <TouchableOpacity onPress={() => onEdit(post)} style={styles.actionIcon}>
                <Ionicons name="pencil" size={20} color={iconColor} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onDelete(post.postId)} style={styles.actionIcon}>
                <Ionicons name="trash" size={20} color={iconColor} />
            </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export default function MyPostsScreen() {
  const navigation = useNavigation<any>();
  const { username } = useContext(AuthContext);
  const colorScheme = useColorScheme();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: 'Manage Posts',
    });
  }, [navigation]);

  const [allPosts, setAllPosts] = useState<PostData[]>([]); 
  const [userPosts, setUserPosts] = useState<PostData[]>([]); 
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const isDarkMode = colorScheme === 'dark';
  const screenBackgroundColor = isDarkMode ? '#151718' : '#F0F2F5';
  const cardBackgroundColor = isDarkMode ? '#1C1C1E' : '#FFFFFF';
  const iconColor = isDarkMode ? '#8E8E93' : '#6C6C70';
  const activityIndicatorColor = isDarkMode ? '#FFFFFF' : '#000000';
  const refreshControlColors = isDarkMode ? { tintColor: '#FFFFFF', titleColor: '#FFFFFF'} : { tintColor: '#000000', titleColor: '#000000'};
  const errorTextColor = isDarkMode ? '#FF9494' : '#D32F2F';

  const fetchAllPostsAndFilter = useCallback(async () => {
    if (!username) {
        setError("Username not found. Cannot filter posts.");
        setLoading(false);
        setRefreshing(false);
        return;
    }
    // Keep existing posts while loading new ones if refreshing
    if (!refreshing) {
        setLoading(true);
    }
    setError('');
    try {
      const response = await fetch(`${API_BASE}/api/posts/getPostsForUser?username=${encodeURIComponent(username)}`); 
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch posts: ${response.status} - ${errorText}`); // Updated error message
      }
      const data: PostData[] = await response.json();
      setAllPosts(data); // Store all posts

      // Filter for user's posts
      const filteredPosts = data.filter(post => post.creatorUsername === username);
      setUserPosts(filteredPosts); // Update the user posts

    } catch (err) {
      console.error('Error fetching or filtering posts:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      setUserPosts([]); // Clear posts on error
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [username, refreshing]); // Added refreshing dependency


  useFocusEffect(
    useCallback(() => {
      // Fetch posts when the screen comes into focus
      fetchAllPostsAndFilter();
    }, [fetchAllPostsAndFilter]) // fetchAllPostsAndFilter already includes its dependencies
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAllPostsAndFilter();
  };

  const handleEditPost = (postToEdit: PostData) => { 
    navigation.navigate('edit_post_detail', { 
        postId: postToEdit.postId,
        initialContent: postToEdit.content,
        initialPhotoUrl: postToEdit.photoUrl,
    });
  };

  const handleDeletePost = (postId: number) => {
    Alert.alert(
      "Delete Post",
      "Are you sure you want to delete this post?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: async () => {
          try {
            const token = await AsyncStorage.getItem('token');
            const headers: HeadersInit = {};
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            const response = await fetch(`${API_BASE}/api/posts/delete/${postId}`, {
              method: 'DELETE',
              headers: headers,
            });
            if (!response.ok) {
                 const errorBody = await response.text(); 
                 console.error("Delete failed response:", errorBody);
                 throw new Error(`Failed to delete post: ${response.status} - ${errorBody || 'No details'}`);
            }
            Alert.alert("Success", "Post deleted successfully.");
            // Refresh the list after deletion
            fetchAllPostsAndFilter();
          } catch (err) {
            console.error("Error deleting post:", err);
            Alert.alert("Error", `Could not delete post. ${err instanceof Error ? err.message : ''}`);
          }
        }}
      ]
    );
  };

  // Show loading indicator only on initial load, not during refresh if posts are already shown
  if (loading && userPosts.length === 0) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: screenBackgroundColor }]}>
        <ActivityIndicator size="large" color={activityIndicatorColor} />
      </View>
    );
  }

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
      // Add keyboardShouldPersistTaps='handled' if there were input fields causing issues
      keyboardShouldPersistTaps='handled' // Good practice for scroll views with touchables
      // Add scrollIndicatorInsets if there's a known bottom inset like a tab bar
      // scrollIndicatorInsets={{ bottom: 50 }} // Example value, adjust as needed
    >
      {error ? (
        // Ensure the error message container doesn't break scrolling if content is also present
        <View style={styles.centeredMessageContainer}>
            <ThemedText style={{color: errorTextColor}}>{error}</ThemedText>
        </View>
      ) : userPosts.length === 0 && !loading ? (
        <View style={styles.centeredMessageContainer}>
            <ThemedText>You haven't created any posts yet.</ThemedText>
            <TouchableOpacity
                style={styles.createPostButton}
                onPress={() => navigation.navigate('create_post')}
            >
                <ThemedText style={styles.createPostButtonText}>Create Your First Post</ThemedText>
            </TouchableOpacity>
        </View>
      ) : (
        // Render the list of user posts
        userPosts.map(post => (
          <UserPostCard
            key={post.postId}
            post={post}
            cardBackgroundColor={cardBackgroundColor}
            iconColor={iconColor}
            onEdit={handleEditPost}
            onDelete={handleDeletePost}
          />
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, // Allows ScrollView to fill the screen
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    // Styles for the content *inside* the ScrollView
    padding: 16,
    paddingBottom: 120, // <<< Increased padding at the bottom significantly MORE
                       // This ensures the last item can be scrolled fully into view
    flexGrow: 1,      // Ensures the container grows to at least fill the screen height,
                      // useful for centering content vertically when it's short,
                      // and helps with layout consistency.
  },
  postContainer: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2, 
  },
  postImage: {
    width: '100%',
    aspectRatio: 16 / 9,
    maxHeight: 200,
    borderRadius: 4,
    marginBottom: 10,
    resizeMode: 'cover',
  },
  postContent: {
    fontSize: 15,
    marginBottom: 10,
    lineHeight: 22,
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eee', 
    paddingTop: 8,
    marginTop: 8,
  },
  postStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    marginHorizontal: 8,
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIcon: {
    padding: 6, 
    marginLeft: 10,
  },
  centeredMessageContainer: {
    // Removed flex: 1 from here as it's inside a ScrollView now.
    // Rely on flexGrow: 1 in contentContainerStyle instead for vertical filling if needed.
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: 200, // Ensure it takes some space even without flex: 1
  },
  createPostButton: {
    marginTop: 20,
    backgroundColor: '#2196F3', 
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  createPostButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  }
});
