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
import AsyncStorage from '@react-native-async-storage/async-storage';

const HOST = Platform.select({ android: '10.0.2.2', ios: 'localhost' , web: 'localhost' });
const API_BASE = `http://${HOST}:8080`;

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
  const { username } = useContext(AuthContext); // user_id removed as not used in this direct logic
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
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE}/api/posts/getPostsForUser?username=${encodeURIComponent(username)}`); 
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch posts: ${response.status} - ${errorText}`); // Updated error message
      }
      const data: PostData[] = await response.json();
      
      setAllPosts(data); 
      setUserPosts(data); 

    } catch (err) {
      console.error('Error fetching or filtering posts:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [username]);


  useFocusEffect(
    useCallback(() => {
      fetchAllPostsAndFilter();
    }, [fetchAllPostsAndFilter])
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
              const errorText = await response.text();
              throw new Error(`Failed to delete post: ${response.status} - ${errorText}`);
            }
            Alert.alert("Success", "Post deleted successfully.");
            fetchAllPostsAndFilter(); 
          } catch (err) {
            console.error("Error deleting post:", err);
            Alert.alert("Error", "Could not delete post.");
          }
        }}
      ]
    );
  };

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
    >
      {error ? (
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: 200,
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