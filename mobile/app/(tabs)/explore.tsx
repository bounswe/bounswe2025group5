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
};

function PostSkeleton({ post }: { post: Post }) {
  return (
    <View style={styles.postContainer}>
      <ThemedText type="title" style={styles.postTitle}>
        {post.title}
      </ThemedText>
      <ThemedText style={styles.postContent}>
        {post.content}
      </ThemedText>

      <View style={styles.postFooter}>
        <Ionicons name="heart-outline" size={16} />
        <ThemedText style={styles.footerText}>{post.likes}</ThemedText>
        <Ionicons name="chatbubble-outline" size={16} />
        <ThemedText style={styles.footerText}>{post.comments}</ThemedText>
      </View>
    </View>
  );
}

export default function ExploreScreen() {
  const navigation = useNavigation();
  const { userType, username } = useContext(AuthContext);

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
    backgroundColor: '#151718',
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