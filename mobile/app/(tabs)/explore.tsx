//app/(tabs)/index.tsx
import React, { useContext, useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { AuthContext } from '../_layout';

const API_BASE = 'http://localhost:8080';

type Post = {
  id: number;
  title: string;
  content: string;
  likes: number;
  comments: number;
  isLiked?: boolean;
  isSaved?: boolean;
};

const mockPosts: Post[] = [
  {
    id: '1',
    title: 'Post Title 1',
    content: 'This is a short preview of the post content…',
    likes: 12,
    comments: 4,
    image: 'https://placehold.co/300x150' 
,
  },
  {
    id: '2',
    title: 'Post Title 2',
    content: 'Another preview text goes here as a placeholder.',
    likes: 8,
    comments: 2,
    image: 'https://placehold.co/300x150',
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

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastPostId, setLastPostId] = useState<number | null>(null);
  const [error, setError] = useState(false);
  const [noMorePosts, setNoMorePosts] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false); 
  const [searchQuery,   setSearchQuery]   = useState('');
  const [searchResults, setSearchResults] = useState<Post[]>([]);
  const [isSearching,   setIsSearching]   = useState(false);
  const [inSearchMode,  setInSearchMode]  = useState(false);

  useEffect(() => {
    if (!userType) {
      navigation.navigate('index' as never);
    }
  }, [userType]);

  useFocusEffect(
    React.useCallback(() => {
      if (userType) {
        handleRefresh();
      }
    }, [userType])
  );

  const fetchPosts = async (loadMore = false) => {
    try {
      if (loadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      const url = loadMore
        ? `${API_BASE}/api/posts/info?size=5&lastPostId=${lastPostId}`
        : `${API_BASE}/api/posts/info?size=5`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error('Fetch failed');
      }
      const data = await res.json();

      if (data.length === 0) {
        setNoMorePosts(true);
        return;
      }

      const mappedPosts: Post[] = data.map((item: any) => ({
        id: item.postId,
        title: item.creatorUsername,
        content: item.content,
        likes: item.likes,
        comments: item.comments.length,
      }));

      if (loadMore) {
        setPosts(prevPosts => [...prevPosts, ...mappedPosts]);
      } else {
        setPosts(mappedPosts);
      }

      if (mappedPosts.length > 0) {
        setLastPostId(mappedPosts[mappedPosts.length - 1].id);
      }

      if (mappedPosts.length < 5) {
        setNoMorePosts(true);
      } else {
        setNoMorePosts(false);
      }

      setError(false);
    } catch (err) {
      console.error('Failed to fetch posts:', err);
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setLastPostId(null);
    setNoMorePosts(false);
    fetchPosts(false);
  };

  const handleLoadMore = () => {
    if (!loading && !loadingMore && lastPostId !== null && !noMorePosts) {
      fetchPosts(true);
    }
  };

  const performSearch = async () => {
    const q = searchQuery.trim();
    if (!q) return;

    try {
      setIsSearching(true);
      const res = await fetch(
        `${API_BASE}/api/search/posts/semantic?query=${encodeURIComponent(q)}&size=5`
      );
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();

      const mapped: Post[] = data.map((item: any) => ({
        id: item.postId,
        title: item.creatorUsername,
        content: item.content,
        likes: item.likes,
        comments: item.comments,          // already a number
      }));

      setSearchResults(mapped);
      setInSearchMode(true);
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
  };

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
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
    >
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

      <View style={styles.searchBar}>
        {inSearchMode && (
          <TouchableOpacity onPress={handleBack}>
            <Ionicons
              name="arrow-back"
              size={25}
              color="#888"
              style={[styles.searchIcon, { marginRight: 8 }]}
            />
          </TouchableOpacity>
        )}

           <TouchableOpacity onPress={performSearch} disabled={isSearching}>
          {isSearching ? (
            /* small spinner that replaces the icon while the request is in flight */
            <ActivityIndicator size="small" color="#888" style={styles.searchIcon} />
          ) : (
            <Ionicons name="search" size={30} color="#888" style={styles.searchIcon} />
          )}
        </TouchableOpacity>
        <TextInput
          style={styles.searchInput}
          placeholder="Search for posts…"
          placeholderTextColor="#888"
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
          onSubmitEditing={performSearch}
        />
      </View>

      {/* ───────── Main content ───────── */}
      {inSearchMode ? (
        /* SEARCH MODE */
        isSearching ? (
          <ActivityIndicator style={{ marginTop: 20 }} />
        ) : searchResults.length > 0 ? (
          searchResults.map(post => <PostSkeleton key={post.id} post={post} />)
        ) : (
          <View style={styles.noMoreBox}>
            <ThemedText style={styles.noMoreText}>No results found</ThemedText>
          </View>
        )
      ) : (
        /* NORMAL FEED */
        loading ? (
          <ActivityIndicator style={{ marginTop: 20 }} />
        ) : error ? (
          <View style={styles.errorBox}>
            <ThemedText style={styles.errorText}>Failed to fetch posts</ThemedText>
          </View>
        ) : posts.length > 0 ? (
          <>
            {posts.map(post => (
              <PostSkeleton key={post.id} post={post} />
            ))}

            {!noMorePosts ? (
              <TouchableOpacity style={styles.loadMoreButton} onPress={handleLoadMore}>
                {loadingMore ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <ThemedText style={styles.loadMoreText}>Load More Posts</ThemedText>
                )}
              </TouchableOpacity>
            ) : (
              <View style={styles.noMoreBox}>
                <ThemedText style={styles.noMoreText}>No more posts available</ThemedText>
              </View>
            )}
          </>
        ) : (
          <View style={styles.noMoreBox}>
            <ThemedText style={styles.noMoreText}>No posts available</ThemedText>
          </View>
        )
      )}

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
    marginBottom: 18,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 30,
    marginHorizontal: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 18,
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
    color: '#000',
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
    color: '#000',
  },
  loginButton: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#2196F3',
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginLeft: 8,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  errorBox: {
    marginTop: 40,
    marginHorizontal: 20,
    padding: 12,
    backgroundColor: '#ffcccc',
    borderRadius: 8,
    alignItems: 'center',
  },
  errorText: {
    color: '#cc0000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  noMoreBox: {
    marginTop: 40,
    marginHorizontal: 20,
    padding: 12,
    backgroundColor: '#e0f7fa',
    borderRadius: 8,
    alignItems: 'center',
  },
  noMoreText: {
    color: '#00796b',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadMoreButton: {
    marginVertical: 20,
    marginHorizontal: 40,
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  loadMoreText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});