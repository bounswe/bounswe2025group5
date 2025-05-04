import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Text,
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';

// Match the same API base URL as in explore.tsx
const API_BASE = 'http://10.0.2.2:8080';

// Reuse the Post type from explore.tsx
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

function PostSkeleton({ 
  post,
  onUnsave,
  isLoading 
}: { 
  post: Post;
  onUnsave: (postId: string) => void;
  isLoading: boolean;
}) {
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
        <View style={styles.actionButton}>
          <Ionicons name={post.isLiked ? "heart" : "heart-outline"} 
            size={16} 
            color={post.isLiked ? "#FF6B6B" : undefined} 
          />
          <ThemedText style={styles.footerText}>{post.likes}</ThemedText>
        </View>
        
        <View style={styles.actionButton}>
          <Ionicons name="chatbubble-outline" size={16} />
          <ThemedText style={styles.footerText}>{post.comments}</ThemedText>
        </View>
        
        <TouchableOpacity 
          onPress={() => onUnsave(post.id)} 
          style={styles.actionButton}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#666" style={{marginRight: 8}} />
          ) : (
            <Ionicons 
              name="bookmark" 
              size={16} 
              color="#4A90E2" 
            />
          )}
          <ThemedText style={styles.footerText}>Unsave</ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function SavedPostsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { userId } = route.params as { userId: number };
  
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [unsavingPostId, setUnsavingPostId] = useState<string | null>(null);

  useEffect(() => {
    fetchSavedPosts();
  }, []);

  const fetchSavedPosts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/posts/getSavedPosts?userId=${userId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch saved posts');
      }
      
      const data = await response.json();
      // Add isSaved flag to all posts since they are saved by definition
      const savedPosts = data.map((post: any) => ({
        ...post,
        isSaved: true,
        // Ensure we have string IDs for consistency with the explore page
        id: post.id.toString()
      }));
      
      setPosts(savedPosts);
    } catch (error) {
      console.error('Error fetching saved posts:', error);
      Alert.alert('Error', 'Failed to load saved posts');
    } finally {
      setLoading(false);
    }
  };

  const unsavePost = async (postId: string) => {
    setUnsavingPostId(postId);
    try {
      console.log(`Unsaving post ${postId} for user ${userId}`);
      const response = await fetch(`${API_BASE}/api/posts/unsave/${userId}/${postId}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'Origin': 'http://localhost:19006',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to unsave post');
      }
      
      // Remove the post from the list
      setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
      
    } catch (error: any) {
      console.error('Error unsaving post:', error);
      Alert.alert('Error', `Failed to unsave post: ${error.message || 'Unknown error'}`);
    } finally {
      setUnsavingPostId(null);
    }
  };

  return (
    <>
      <Stack.Screen 
        options={{
          title: "Saved Posts",
          headerShown: true,
        }} 
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <ThemedText type="title">Your Saved Posts</ThemedText>
        </View>

        {loading ? (
          <ActivityIndicator size="large" style={styles.loader} />
        ) : posts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="bookmark-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No saved posts yet</Text>
            <TouchableOpacity 
              style={styles.exploreButton}
              onPress={() => navigation.navigate('(tabs)' as never)}
            >
              <Text style={styles.exploreButtonText}>Explore Posts</Text>
            </TouchableOpacity>
          </View>
        ) : (
          posts.map(post => (
            <PostSkeleton 
              key={post.id} 
              post={post} 
              onUnsave={unsavePost}
              isLoading={unsavingPostId === post.id}
            />
          ))
        )}
      </ScrollView>
    </>
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
    marginTop: 16,     
    marginBottom: 16,
  },
  loader: {
    marginTop: 40,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
  },
  exploreButton: {
    marginTop: 24,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#3F51B5',
    borderRadius: 8,
  },
  exploreButtonText: {
    color: 'white',
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