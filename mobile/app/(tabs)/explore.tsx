// app/(tabs)/explore.tsx
import React, { useContext, useState, useEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  Image,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { AuthContext } from '../_layout';

type Post = {
  id: string;
  title: string;
  content: string;
  likes: number;
  comments: number;
  image: string;
  isLiked?: boolean;
  isSaved?: boolean;
};

// Update to your actual backend URL - adjust this based on your setup
// If running on physical device, use your computer's IP instead of localhost
const BASE_URL = 'http://10.0.2.2:8080'; // For Android emulator
// const BASE_URL = 'http://localhost:8080'; // For iOS simulator or web

const mockPosts: Post[] = [
  {
    id: '9', // Updated to match database ID
    title: 'Post Title 1',
    content: 'This is a short preview of the post content…',
    likes: 12,
    comments: 4,
    image: 'https://placehold.co/300x150',
    isLiked: false,
    isSaved: false,
  },
  {
    id: '10', // Updated ID
    title: 'Post Title 2',
    content: 'Another preview text goes here as a placeholder.',
    likes: 8,
    comments: 2,
    image: 'https://placehold.co/300x150',
    isLiked: false,
    isSaved: false,
  },
];

function PostSkeleton({ 
  post, 
  onLike, 
  onUnlike, 
  onSave,
  onUnsave,
  isLoading,
  isSaveLoading 
}: { 
  post: Post;
  onLike: (postId: string) => void;
  onUnlike: (postId: string) => void;
  onSave: (postId: string) => void;
  onUnsave: (postId: string) => void;
  isLoading: boolean;
  isSaveLoading: boolean;
}) {
  const handleLikePress = () => {
    if (isLoading) return;
    
    if (post.isLiked) {
      onUnlike(post.id);
    } else {
      onLike(post.id);
    }
  };

  const handleSavePress = () => {
    if (isSaveLoading) return;
    
    if (post.isSaved) {
      onUnsave(post.id);
    } else {
      onSave(post.id);
    }
  };

  return (
    <View style={styles.postContainer}>
      <Image source={{ uri: post.image }} style={styles.postImage} />
      <ThemedText type="title" style={styles.postTitle}>
        {post.title}
      </ThemedText>
      <ThemedText style={styles.postContent}>
        {post.content}
      </ThemedText>

      <View style={styles.postFooter}>
        <TouchableOpacity 
          onPress={handleLikePress} 
          style={styles.actionButton}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#666" style={{marginRight: 8}} />
          ) : (
            <Ionicons 
              name={post.isLiked ? "heart" : "heart-outline"} 
              size={16} 
              color={post.isLiked ? "#FF6B6B" : undefined} 
            />
          )}
          <ThemedText style={styles.footerText}>{post.likes}</ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="chatbubble-outline" size={16} />
          <ThemedText style={styles.footerText}>{post.comments}</ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity 
          onPress={handleSavePress} 
          style={styles.actionButton}
          disabled={isSaveLoading}
        >
          {isSaveLoading ? (
            <ActivityIndicator size="small" color="#666" style={{marginRight: 8}} />
          ) : (
            <Ionicons 
              name={post.isSaved ? "bookmark" : "bookmark-outline"} 
              size={16} 
              color={post.isSaved ? "#4A90E2" : undefined} 
            />
          )}
          <ThemedText style={styles.footerText}>Save</ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function ExploreScreen() {
  const navigation = useNavigation();
  const { userType, username } = useContext(AuthContext);
  const [posts, setPosts] = useState<Post[]>(mockPosts);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPostId, setLoadingPostId] = useState<string | null>(null);
  const [savingPostId, setSavingPostId] = useState<string | null>(null);
  
  //TODO: Mock user ID, how to get it?
  const userId = 2;

  useFocusEffect(
    React.useCallback(() => {
      console.log('userType:', userType);
      console.log('username:', username);
    }, [userType])
  );

  React.useEffect(() => {
    if (!userType) {
      navigation.navigate('index' as never);
    }
  }, [userType]);

  const likePost = async (postId: string) => {
    if (!username) {
      Alert.alert('Error', 'You must be logged in to like posts');
      return;
    }
    
    setLoadingPostId(postId);
    try {
      console.log(`Sending like request for post ${postId}`);
      const response = await fetch(`${BASE_URL}/api/posts/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Origin': 'http://localhost:19006', // Add origin header for CORS
        },
        body: JSON.stringify({
          username: username,
          postId: parseInt(postId)
        }),
      });
      
      console.log('Like response status:', response.status);
      
      if (!response.ok) {
        let errorMessage = 'Failed to like post';
        try {
          const errorData = await response.json();
          errorMessage = errorData?.message || errorMessage;
        } catch (e) {
          // If parsing JSON fails, use the default error message
        }
        throw new Error(errorMessage);
      }
      
      // Update local state
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === postId 
            ? { ...post, likes: post.likes + 1, isLiked: true } 
            : post
        )
      );
      console.log(`Successfully liked post ${postId}`);
    } catch (error: any) {
      console.error('Error liking post:', error);
      Alert.alert('Error', `Failed to like the post: ${error.message || 'Unknown error'}`);
    } finally {
      setLoadingPostId(null);
    }
  };

  const unlikePost = async (postId: string) => {
    if (!username) {
      Alert.alert('Error', 'You must be logged in to unlike posts');
      return;
    }
    
    setLoadingPostId(postId);
    try {
      console.log(`Sending unlike request for post ${postId}`);
      const response = await fetch(`${BASE_URL}/api/posts/like`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Origin': 'http://localhost:19006', // Add origin header for CORS
        },
        body: JSON.stringify({
          username: username,
          postId: parseInt(postId)
        }),
      });
      
      console.log('Unlike response status:', response.status);
      
      if (!response.ok) {
        let errorMessage = 'Failed to unlike post';
        try {
          const errorData = await response.json();
          errorMessage = errorData?.message || errorMessage;
        } catch (e) {
          // If parsing JSON fails, use the default error message
        }
        throw new Error(errorMessage);
      }
      
      // Update local state
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === postId 
            ? { ...post, likes: Math.max(0, post.likes - 1), isLiked: false } 
            : post
        )
      );
      console.log(`Successfully unliked post ${postId}`);
    } catch (error: any) {
      console.error('Error unliking post:', error);
      Alert.alert('Error', `Failed to unlike the post: ${error.message || 'Unknown error'}`);
    } finally {
      setLoadingPostId(null);
    }
  };

  const savePost = async (postId: string) => {
    if (!username) {
      Alert.alert('Error', 'You must be logged in to save posts');
      return;
    }
    
    setSavingPostId(postId);
    try {
      console.log(`Sending save request for post ${postId}`);
      const response = await fetch(`${BASE_URL}/api/posts/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Origin': 'http://localhost:19006', 
        },
        body: JSON.stringify({
          userId: userId,
          postId: parseInt(postId)
        }),
      });
      
      console.log('Save response status:', response.status);
      
      if (!response.ok) {
        let errorMessage = 'Failed to save post';
        try {
          const errorData = await response.json();
          errorMessage = errorData?.message || errorMessage;
        } catch (e) {
          // If parsing JSON fails, use the default error message
        }
        throw new Error(errorMessage);
      }
      
      // Update local state
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === postId 
            ? { ...post, isSaved: true } 
            : post
        )
      );
      console.log(`Successfully saved post ${postId}`);
    } catch (error: any) {
      console.error('Error saving post:', error);
      Alert.alert('Error', `Failed to save the post: ${error.message || 'Unknown error'}`);
    } finally {
      setSavingPostId(null);
    }
  };

  const unsavePost = async (postId: string) => {
    if (!username) {
      Alert.alert('Error', 'You must be logged in to unsave posts');
      return;
    }
    
    setSavingPostId(postId);
    try {
      console.log(`Sending unsave request for post ${postId}`);
      // Note: The DELETE request uses path parameters instead of a request body
      const response = await fetch(`${BASE_URL}/api/posts/unsave/${userId}/${postId}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'Origin': 'http://localhost:19006', 
        },
      });
      
      console.log('Unsave response status:', response.status);
      
      if (!response.ok) {
        let errorMessage = 'Failed to unsave post';
        try {
          const errorData = await response.json();
          errorMessage = errorData?.message || errorMessage;
        } catch (e) {
          // If parsing JSON fails, use the default error message
        }
        throw new Error(errorMessage);
      }
      
      // Update local state
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === postId 
            ? { ...post, isSaved: false } 
            : post
        )
      );
      console.log(`Successfully unsaved post ${postId}`);
    } catch (error: any) {
      console.error('Error unsaving post:', error);
      Alert.alert('Error', `Failed to unsave the post: ${error.message || 'Unknown error'}`);
    } finally {
      setSavingPostId(null);
    }
  };

  if (!userType) return null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <ThemedText type="title">Explore</ThemedText>
      </View>

      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={Math.random() < 0.5 ? "Search for a specific topic…" : "Find something interesting…"}
          placeholderTextColor="#888"
        />
      </View>

      {posts.map(post => (
        <PostSkeleton 
          key={post.id} 
          post={post} 
          onLike={likePost}
          onUnlike={unlikePost}
          onSave={savePost}
          onUnsave={unsavePost}
          isLoading={loadingPostId === post.id}
          isSaveLoading={savingPostId === post.id}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 24,
  },
  header: {
    paddingHorizontal: 16,
    marginTop: 48,     
    marginBottom: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    marginHorizontal: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  postContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  postImage: {
    width: '100%',
    height: 150,
    borderRadius: 4,
    marginBottom: 10,
    backgroundColor: '#eee',
  },
  postTitle: {
    fontSize: 18,
    marginBottom: 6,
  },
  postContent: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  postFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  footerText: {
    fontSize: 14,
    marginHorizontal: 8,
  },
});
