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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { AuthContext } from '../_layout';

const HOST = Platform.select({ android: '10.0.2.2', ios: 'localhost', web: 'localhost' });
const API_BASE = `http://${HOST}:8080`;

// REMOVED isLikeStatusPending from Post type
type Post = {
  id: number;
  title: string;
  content: string;
  likes: number;
  comments: number;
  photoUrl: string | null;
  likedByUser: boolean;
};

interface PostItemProps {
  post: Post;
  cardBackgroundColor: string;
  iconColor: string;
  onLikePress: (postId: number, currentlyLiked: boolean) => void;
  userType: string | null;
}

// PostItem no longer needs to handle isLikeStatusPending
function PostItem({ post, cardBackgroundColor, iconColor, onLikePress, userType }: PostItemProps) {
  const handleLike = () => {
    if (userType === 'guest') {
      Alert.alert("Login Required", "Please log in to like posts.");
      return;
    }
    onLikePress(post.id, post.likedByUser);
  };

  return (
    <View style={[styles.postContainer, { backgroundColor: cardBackgroundColor }]}>
      <ThemedText type="title" style={styles.postTitle}>
        {post.title}
      </ThemedText>
      {post.photoUrl && (
        <Image
          source={{
            uri: post.photoUrl.startsWith('http')
              ? post.photoUrl
              : `${API_BASE}${post.photoUrl}`,
          }}
          style={styles.postImage}
          onError={(e) => console.warn('Explore: Image failed to load:', e.nativeEvent.error, post.photoUrl)}
        />
      )}
      <ThemedText style={styles.postContent} numberOfLines={post.photoUrl ? 2 : 5}>
        {post.content}
      </ThemedText>

      <View style={styles.postFooter}>
        <TouchableOpacity onPress={handleLike} style={styles.footerAction}>
          {/* No more spinner here, icon is always displayed */}
          <Ionicons
            name={post.likedByUser ? "heart" : "heart-outline"}
            size={20}
            color={post.likedByUser ? 'red' : iconColor}
          />
          <ThemedText style={[styles.footerText, { color: post.likedByUser ? 'red' : iconColor, marginLeft: 4 }]}>
            {post.likes}
          </ThemedText>
        </TouchableOpacity>
        <Ionicons name="chatbubble-outline" size={16} color={iconColor} style={{ marginLeft: 16 }}/>
        <ThemedText style={[styles.footerText, { marginLeft: 4 }]}>{post.comments}</ThemedText>
      </View>
    </View>
  );
}


export default function ExploreScreen() {
  const navigation = useNavigation();
  const { userType, username } = useContext(AuthContext);

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true); // For initial load spinner
  const [refreshing, setRefreshing] = useState(false); // For pull-to-refresh spinner
  const [lastPostId, setLastPostId] = useState<number | null>(null);
  const [error, setError] = useState(false);
  const [noMorePosts, setNoMorePosts] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false); // For "Load More" button's spinner
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Post[]>([]);
  const [isSearching, setIsSearching] = useState(false); // For search operation spinner
  const [inSearchMode, setInSearchMode] = useState(false);


  const colorScheme = useColorScheme();
  const screenBackgroundColor = colorScheme === 'dark' ? '#151718' : '#F0F2F5';
  const cardBackgroundColor = colorScheme === 'dark' ? '#1C1C1E' : '#FFFFFF';
  const searchBarBackgroundColor = colorScheme === 'dark' ? '#1C1C1E' : '#FFFFFF';
  const searchInputColor = colorScheme === 'dark' ? '#E5E5E7' : '#000000';
  const searchPlaceholderColor = colorScheme === 'dark' ? '#8E8E93' : '#8E8E93';
  const iconColor = colorScheme === 'dark' ? '#8E8E93' : '#6C6C70';
  const themedErrorBoxBackgroundColor = colorScheme === 'dark' ? '#5D1F1A' : '#ffcccc';
  const themedErrorBoxTextColor = colorScheme === 'dark' ? '#FFA094' : '#cc0000';
  const themedNoMoreBoxBackgroundColor = colorScheme === 'dark' ? '#1A3A4A' : '#e0f7fa';
  const themedNoMoreBoxTextColor = colorScheme === 'dark' ? '#9EE8FF' : '#00796b';
  const activityIndicatorColor = colorScheme === 'dark' ? '#FFFFFF' : '#000000';
  const refreshControlColors = colorScheme === 'dark' ? { tintColor: '#FFFFFF', titleColor: '#FFFFFF'} : { tintColor: '#000000', titleColor: '#000000'};

  useEffect(() => {
    if (!userType && username !== undefined) { // Check username to ensure context is somewhat initialized
      navigation.navigate('index' as never);
    }
  }, [userType, username, navigation]);

  // mapApiItemToPost no longer needs isBeingLoadedMore
  const mapApiItemToPost = (item: any): Post => ({
    id: item.postId,
    title: item.creatorUsername,
    content: item.content,
    likes: item.likes || 0,
    comments: Array.isArray(item.comments) ? item.comments.length : (Number(item.comments) || 0),
    photoUrl: item.photoUrl,
    likedByUser: false, // Always init false, fetchLikeStatusesForPosts will correct it
  });

  // fetchLikeStatusesForPosts no longer sets isLikeStatusPending
  const fetchLikeStatusesForPosts = async (currentPostsToUpdate: Post[], currentUsername: string): Promise<Post[]> => {
    if (!currentUsername || currentPostsToUpdate.length === 0) {
      return currentPostsToUpdate; // No user or no posts, return as is (likedByUser will be false)
    }
    
    const promises = currentPostsToUpdate.map(async (post) => {
      try {
        const res = await fetch(`${API_BASE}/api/posts/${post.id}/likes`);
        if (!res.ok) {
          console.warn(`Failed to fetch likes for post ${post.id}: ${res.status}`);
          return post; // Return original post (likedByUser: false)
        }
        const likesData = await res.json();
        const likedByCurrent = likesData.likedByUsers?.some((liker: any) => liker.username === currentUsername) || false;
        return { ...post, likedByUser: likedByCurrent };
      } catch (e) {
        console.error(`Error fetching like status for post ${post.id}:`, e);
        return post; // Return original post on error
      }
    });
    return Promise.all(promises);
  };


  const fetchPosts = async (loadMore = false) => {
    const currentOperation = loadMore ? 'loading more' : 'fetching initial/refresh';
    // console.log(`fetchPosts: Starting ${currentOperation}.`);

    try {
      if (loadMore) setLoadingMore(true);
      else setLoading(true);

      const url = loadMore
        ? `${API_BASE}/api/posts/info?size=5&lastPostId=${lastPostId}`
        : `${API_BASE}/api/posts/info?size=5`;
      
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Fetch failed with status ${res.status}`);
      const data = await res.json();

      if (data.length === 0) {
        setNoMorePosts(true);
        if (!loadMore) setPosts([]);
        // Ensure loading states are correctly turned off
        setLoading(false); setLoadingMore(false); setRefreshing(false);
        return;
      }

      let processedNewItems: Post[] = data.map(mapApiItemToPost);

      // Now, always fetch like statuses before adding to list if user is logged in
      if (username && userType === 'user' && processedNewItems.length > 0) {
        // console.log(`fetchPosts (${currentOperation}): Fetching like statuses for ${processedNewItems.length} items.`);
        processedNewItems = await fetchLikeStatusesForPosts(processedNewItems, username);
      }

      if (loadMore) {
        setPosts(prevPosts => [...prevPosts, ...processedNewItems]);
      } else {
        setPosts(processedNewItems);
      }
      
      // Update pagination state based on the initially fetched data length, not processed length
      if (data.length > 0) {
         // Use the ID from the last item in the *original data* for pagination consistency
         // if `processedNewItems` could be reordered or filtered, though unlikely here.
         // For simplicity, using `processedNewItems` is fine if order is preserved.
        setLastPostId(processedNewItems[processedNewItems.length - 1].id);
      }
      if (data.length < 5) setNoMorePosts(true);
      else setNoMorePosts(false);
      
      setError(false);
    } catch (err) {
      console.error(`Failed to fetch posts (${currentOperation}):`, err);
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false); // Ensure this is always reset
    }
  };
  
  useFocusEffect(
    React.useCallback(() => {
      if (userType) { 
        handleRefresh();
      } else if (username === null || username === '') { // Explicitly check for guest or uninitialized logged-out state
        setPosts([]);
        setLoading(false); // Stop loading if confirmed guest/logged out
      }
      // If username is undefined, context might still be loading, so don't clear posts yet.
    }, [userType, username]) 
  );


  const handleRefresh = () => {
    setRefreshing(true);
    setLastPostId(null);
    setNoMorePosts(false);
    setError(false);
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
      setSearchResults([]); // Clear previous results
      const res = await fetch(
        `${API_BASE}/api/search/posts/semantic?query=${encodeURIComponent(q)}&size=5`
      );
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      
      let processedResults: Post[] = data.map(mapApiItemToPost);

      if (username && userType === 'user' && processedResults.length > 0) {
        // console.log(`performSearch: Fetching like statuses for ${processedResults.length} search results.`);
        processedResults = await fetchLikeStatusesForPosts(processedResults, username);
      }
      setSearchResults(processedResults);
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

  const handleLikeToggle = async (postId: number, currentlyLiked: boolean) => {
    if (userType === 'guest' || !username) {
      Alert.alert("Login Required", "Please log in to like posts.");
      return;
    }

    const setListFunction = inSearchMode ? setSearchResults : setPosts;

    setListFunction(currentList =>
      currentList.map(p =>
        p.id === postId
          ? { ...p, likedByUser: !currentlyLiked, likes: currentlyLiked ? Math.max(0, p.likes - 1) : p.likes + 1 }
          : p
      )
    );

    try {
      const url = `${API_BASE}/api/posts/like`;
      const method = currentlyLiked ? 'DELETE' : 'POST';
      const body = JSON.stringify({ username, postId });

      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: body,
      });

      const responseBodyText = await response.text();

      if (!response.ok) {
        let errorMsg = `Failed to ${currentlyLiked ? 'unlike' : 'like'}. Status: ${response.status}`;
        try {
          const errorData = JSON.parse(responseBodyText);
          errorMsg = errorData.message || errorMsg;
        } catch (e) { errorMsg += ` Response: ${responseBodyText.substring(0,100)}`; }
        throw new Error(errorMsg);
      }

      const result = JSON.parse(responseBodyText);
      if (!result.success) {
        throw new Error(result.message || `Backend error on ${currentlyLiked ? 'unlike' : 'like'}.`);
      }
    } catch (err: any) {
      console.error('Failed to toggle like:', err.message);
      Alert.alert("Error", err.message || "Could not update like status.");
      setListFunction(currentList =>
        currentList.map(p =>
          p.id === postId
            ? { ...p, likedByUser: currentlyLiked, likes: currentlyLiked ? p.likes + 1 : Math.max(0, p.likes - 1) }
            : p
        )
      );
    }
  };

  // Initial loading state for the entire screen before AuthContext is ready
  if (username === undefined && userType === undefined) {
      return <View style={{flex:1, justifyContent:'center', alignItems:'center', backgroundColor: screenBackgroundColor}}><ActivityIndicator size="large" color={activityIndicatorColor} /></View>;
  }

  const currentDisplayPosts = inSearchMode ? searchResults : posts;
  // Overall loading: if `loading` (initial), or `isSearching` for search results.
  // `loadingMore` is handled by the button's spinner. `refreshing` by RefreshControl.
  const isContentLoading = (loading && !inSearchMode && currentDisplayPosts.length === 0) || (isSearching && inSearchMode && currentDisplayPosts.length === 0);


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

      <View style={[styles.searchBar, { backgroundColor: searchBarBackgroundColor }]}>
        {inSearchMode && (
          <TouchableOpacity onPress={handleBack} disabled={isSearching}>
            <Ionicons name="arrow-back" size={25} color={iconColor} style={[styles.searchIcon, { marginRight: 8 }]} />
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={performSearch} disabled={isSearching}>
          {isSearching ? (
            <ActivityIndicator size="small" color={iconColor} style={styles.searchIcon} />
          ) : (
            <Ionicons name="search" size={30} color={iconColor} style={styles.searchIcon} />
          )}
        </TouchableOpacity>
        <TextInput
          style={[styles.searchInput, { color: searchInputColor }]}
          placeholder="Search for posts…"
          placeholderTextColor={searchPlaceholderColor}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
          onSubmitEditing={performSearch}
          editable={!isSearching}
        />
      </View>

      {isContentLoading ? (
        <ActivityIndicator style={{ marginTop: 20 }} size="large" color={activityIndicatorColor} />
      ) : error && currentDisplayPosts.length === 0 ? (
        <View style={[styles.errorBox, { backgroundColor: themedErrorBoxBackgroundColor }]}>
          <ThemedText style={[styles.errorText, { color: themedErrorBoxTextColor }]}>Failed to fetch posts</ThemedText>
        </View>
      ) : inSearchMode ? (
        searchResults.length > 0 ? (
          searchResults.map(post => (
            <PostItem
              key={`search-${post.id}`}
              post={post}
              cardBackgroundColor={cardBackgroundColor}
              iconColor={iconColor}
              onLikePress={handleLikeToggle}
              userType={userType}
            />
          ))
        ) : ( // No search results (and not loading them because isContentLoading would be true)
          <View style={[styles.noMoreBox, { backgroundColor: themedNoMoreBoxBackgroundColor }]}>
            <ThemedText style={[styles.noMoreText, { color: themedNoMoreBoxTextColor }]}>No results found for "{searchQuery}"</ThemedText>
          </View>
        )
      ) : posts.length > 0 ? (
        <>
          {posts.map(post => (
            <PostItem
              key={`feed-${post.id}`}
              post={post}
              cardBackgroundColor={cardBackgroundColor}
              iconColor={iconColor}
              onLikePress={handleLikeToggle}
              userType={userType}
            />
          ))}
          {!noMorePosts && !refreshing && posts.length > 0 && ( // Ensure not refreshing before showing load more
            <TouchableOpacity 
              style={styles.loadMoreButton} 
              onPress={handleLoadMore} 
              disabled={loadingMore || refreshing || isSearching} // Disable if any other main loading is active
            >
              {loadingMore ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <ThemedText style={styles.loadMoreText}>Load More Posts</ThemedText>
              )}
            </TouchableOpacity>
          )}
          {noMorePosts && posts.length > 0 && !loadingMore && !refreshing && (
            <View style={[styles.noMoreBox, { backgroundColor: themedNoMoreBoxBackgroundColor, marginTop: 20, marginBottom: 20 }]}>
              <ThemedText style={[styles.noMoreText, { color: themedNoMoreBoxTextColor }]}>You've reached the end!</ThemedText>
            </View>
          )}
        </>
      ) : ( 
         !loading && !error && !refreshing && !isSearching && ( // Final fallback: No posts
          <View style={[styles.noMoreBox, { backgroundColor: themedNoMoreBoxBackgroundColor }]}>
            <ThemedText style={[styles.noMoreText, { color: themedNoMoreBoxTextColor }]}>No posts available</ThemedText>
            <ThemedText style={[styles.noMoreText, { color: themedNoMoreBoxTextColor, fontSize: 14, marginTop: 8 }]}>Pull down to refresh.</ThemedText>
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
    marginTop: Platform.OS === 'ios' ? 48 : 24,
    marginBottom: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 30,
    marginHorizontal: 16,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 5,
  },
  postContainer: {
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  postImage: {
    width: '100%',
    aspectRatio: 16 / 9,
    maxHeight: 180,
    borderRadius: 6,
    marginBottom: 10,
    backgroundColor: '#eee',
    resizeMode: 'cover',
  },
  postTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  postContent: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  postFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  footerAction: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 20,
  },
  footerText: {
    fontSize: 14,
    marginRight: 8,
  },
  loginButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#2196F3',
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  errorBox: {
    marginTop: 40,
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  noMoreBox: {
    marginTop: 40,
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  noMoreText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  loadMoreButton: {
    marginVertical: 20,
    marginHorizontal: 40,
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  loadMoreText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});