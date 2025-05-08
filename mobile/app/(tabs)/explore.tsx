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
  Text,
  Alert,
  Modal,
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

type Comment = 
{
  commentId: number;
  content: string;
  creatorUsername: string;
  postId: number;
  createdAt: string;
}

function PostSkeleton({ post, onPressComments }: { post: Post; onPressComments: () => void }) {
  return (
    <View style={styles.postContainer}>
      <ThemedText type="title" style={styles.postTitle}>{post.title}</ThemedText>
      <ThemedText style={styles.postContent}>{post.content}</ThemedText>
      <View style={styles.postFooter}>
        <Ionicons name="heart-outline" size={16} />
        <ThemedText style={styles.footerText}>{post.likes}</ThemedText>
        <TouchableOpacity onPress={onPressComments} style={styles.commentButton}>
          <Ionicons name="chatbubble-outline" size={16} />
          <ThemedText style={styles.footerText}>{post.comments}</ThemedText>
        </TouchableOpacity>
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

  const [commentsVisible, setCommentsVisible] = useState(false); // State to manage comment visibility
  const [comments, setComments] = useState<any[]>([]); // State to manage comments
  const [newComment, setNewComment] = useState(''); // State to manage new comment input
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null); // State to manage selected post ID for comments
  const [editCommentId, setEditCommentId] = useState<number | null>(null); // State to manage comment ID for editing
  const [editCommentText, setEditCommentText] = useState(''); // State to manage edited comment text


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

  const openCommentsModal = async (postId: number) => {
    setSelectedPostId(postId);
    setCommentsVisible(true);
    setComments([]); // Clear previous comments
    try {
      const res = await fetch(`${API_BASE}/api/comments/post/${postId}`);
      if (!res.ok) throw new Error('Failed to fetch comments');
      const data = await res.json();
      const mappedComments: Comment[] = data.map((item: any) => ({
        commentId: item.commentId,
        content: item.content,
        creatorUsername: item.user_id,
        postId: item.post_id,
        createdAt: item.created_at,
      }));
      setComments(mappedComments);
    } catch (err) {
      console.error('Failed to fetch comments:', err);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/api/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newComment,
          postId: selectedPostId,
          username: username,
        }),
      });
      if (!res.ok) throw new Error('Failed to add comment');
      const data = await res.json();
      const newCommentData: Comment = {
        commentId: data.commentId,
        content: newComment,
        creatorUsername: username,
        postId: selectedPostId!,
        createdAt: new Date().toISOString(), // Use current date for the new comment
      };
      setComments(prevComments => [...prevComments, newCommentData]); // Add new comment to the list
      setNewComment(''); // Clear input after adding comment
      setCommentsVisible(false); // Close modal after adding comment
      openCommentsModal(selectedPostId!); // Refresh comments
    }
    catch (err) {
      console.error('Failed to add comment:', err);
    }
  };

  const handleEditComment = async (commentId: number) => {
    if (!editCommentText.trim() || editCommentId === null) return;
    try {
      const res = await fetch(`${API_BASE}/api/comments/${editCommentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: editCommentText,
          postId: selectedPostId,
          username: username,
        }),
      });
      if (!res.ok) throw new Error('Failed to edit comment');
      const updatedComments = comments.map(comment =>
        comment.commentId === editCommentId ? { ...comment, content: editCommentText } : comment
      );
      setComments(updatedComments);
      setEditCommentId(null); // Clear edit mode
      setEditCommentText(''); // Clear input after editing comment
    } catch (err) {
      console.error('Failed to edit comment:', err);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    Alert.alert('Delete Comment', 'Are you sure you want to delete this comment?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Delete',
        onPress: async () => {
          try {
            const res = await fetch(`${API_BASE}/api/comments/${commentId}`, {
              method: 'DELETE',
            });
            if (!res.ok) throw new Error('Failed to delete comment');
            setComments(prevComments => prevComments.filter(comment => comment.commentId !== commentId));
          } catch (err) {
            console.error('Failed to delete comment:', err);
          }
        },
      },
    ])};




  if (!userType) return null;

  return (
  <>
      {/* ───────── Header ───────── */}
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
 {/* Comment Modal */}
 <Modal visible={commentsVisible} animationType="slide" onRequestClose={() => setCommentsVisible(false)}>
 <View style={{ flex: 1, padding: 16 }}>
   <TouchableOpacity onPress={() => setCommentsVisible(false)} style={{ marginBottom: 12 }}>
     <Text style={{ fontWeight: 'bold', fontSize: 16 }}>Close</Text>
   </TouchableOpacity>

   {comments.map(comment => (
     <View key={comment.commentId} style={styles.commentBox}>
       <Text style={{ fontWeight: 'bold' }}>{comment.creatorUsername}</Text>
       {editCommentId === comment.commentId ? (
         <>
           <TextInput
             value={editCommentText}
             onChangeText={setEditCommentText}
             style={styles.input}
           />
           <TouchableOpacity onPress={handleEditComment}>
             <Text style={{ color: 'blue' }}>Save</Text>
           </TouchableOpacity>
         </>
       ) : (
         <Text>{comment.content}</Text>
       )}
       {comment.creatorUsername === username && (
         <View style={{ flexDirection: 'row', gap: 10 }}>
           <TouchableOpacity onPress={() => {
             setEditCommentId(comment.commentId);
             setEditCommentText(comment.content);
           }}>
             <Text style={{ color: 'green' }}>Edit</Text>
           </TouchableOpacity>
           <TouchableOpacity onPress={() => handleDeleteComment(comment.commentId)}>
             <Text style={{ color: 'red' }}>Delete</Text>
           </TouchableOpacity>
         </View>
       )}
     </View>
   ))}

   <TextInput
     style={styles.input}
     placeholder="Add a comment..."
     value={newComment}
     onChangeText={setNewComment}
   />
   <TouchableOpacity onPress={handleAddComment} style={styles.loginButton}>
     <Text style={{ color: '#fff' }}>Post Comment</Text>
   </TouchableOpacity>
 </View>
</Modal>
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
  commentBox: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  modalContainer: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  modalHeader: {
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  closeButton: {
    fontWeight: 'bold',
    fontSize: 16,
    color: 'red',
  },
  commentAuthor: {
    fontWeight: 'bold',
    marginBottom: 6,
  },
  editDeleteButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  editButton: {
    color: 'green',
  },
  deleteButton: {
    color: 'red',
  },
  postButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-end',
  },
  postButtonText: {
    color: '#fff',
    fontSize: 16,
  }
});