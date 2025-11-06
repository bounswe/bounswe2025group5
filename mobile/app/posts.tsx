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
import { apiUrl } from './apiConfig';
import { apiRequest } from './services/apiClient';
import { useTranslation } from 'react-i18next';

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
  editIconColor,
  deleteIconColor,
  onEdit,
  onDelete,
}: {
  post: PostData;
  cardBackgroundColor: string;
  iconColor: string;
  editIconColor: string;
  deleteIconColor: string;
  onEdit: (post: PostData) => void;
  onDelete: (postId: number) => void;
}) {
  const { t } = useTranslation();
  return (
    <View style={[styles.postContainer, { backgroundColor: cardBackgroundColor }]}>
      {post.photoUrl && (
        <Image
          source={{
            uri: post.photoUrl.startsWith('http') ? post.photoUrl : apiUrl(post.photoUrl),
          }}
          style={styles.postImage}
          onError={(e) =>
            console.warn('User Post: Image failed to load:', e.nativeEvent.error, post.photoUrl)
          }
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
          <ThemedText style={styles.footerText}>
            {Array.isArray(post.comments) ? post.comments.length : post.comments}
          </ThemedText>
        </View>
        <View style={styles.postActions}>
          <TouchableOpacity onPress={() => onEdit(post)} style={styles.actionIcon}>
            <Ionicons name="pencil" size={20} color={editIconColor} />
            <ThemedText style={[styles.actionText, { color: editIconColor }]}>{' '}{t('edit')}</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onDelete(post.postId)} style={styles.actionIcon}>
            <Ionicons name="trash" size={20} color={deleteIconColor} />
            <ThemedText style={[styles.actionText, { color: deleteIconColor }]}>{' '}{t('delete')}</ThemedText>
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
  const { t } = useTranslation();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: t('managePosts'),
    });
  }, [navigation, t]);

  const [allPosts, setAllPosts] = useState<PostData[]>([]);
  const [userPosts, setUserPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const isDarkMode = colorScheme === 'dark';
  const screenBackgroundColor = isDarkMode ? '#151718' : '#F0F2F5';
  const cardBackgroundColor = isDarkMode ? '#1C1C1E' : '#FFFFFF';
  const iconColor = isDarkMode ? '#8E8E93' : '#6C6C70';
  const editIconActualColor = isDarkMode ? '#82B1FF' : '#007AFF';
  const deleteIconActualColor = isDarkMode ? '#FF8A80' : '#D9534F';
  const activityIndicatorColor = isDarkMode ? '#FFFFFF' : '#000000';
  const refreshControlColors = isDarkMode
    ? { tintColor: '#FFFFFF', titleColor: '#FFFFFF' }
    : { tintColor: '#000000', titleColor: '#000000' };
  const errorTextColor = isDarkMode ? '#FF9494' : '#D32F2F';

  const fetchAllPostsAndFilter = useCallback(async () => {
    if (!username) {
      setError(t('usernameMissing'));
      setLoading(false);
      setRefreshing(false);
      return;
    }
    if (!refreshing) setLoading(true);
    setError('');
    try {
      const response = await apiRequest(`/api/users/${encodeURIComponent(username)}/posts`);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(t('failedToFetchPostsWithStatus', { status: response.status, errorText }));
      }
      const data: PostData[] = await response.json();
      setAllPosts(data);

      const filteredPosts = data.filter((post) => post.creatorUsername === username);
      setUserPosts(filteredPosts);
    } catch (err) {
      console.error('Error fetching or filtering posts:', err);
      setError(err instanceof Error ? err.message : t('unknownError'));
      setUserPosts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [username, refreshing, t]);

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

  const showMessage = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      const composed = title ? `${title}\n${message}` : message;
      if (typeof window !== 'undefined') {
        window.alert(composed);
      } else {
        console.log(composed);
      }
    } else {
      Alert.alert(title, message);
    }
  };

  const handleDeletePost = async (postId: number) => {
    try {
      const response = await apiRequest(`/api/posts/${postId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorBody = await response.text();
        console.error('Delete failed response:', errorBody);
        throw new Error(
          t('failedToDeletePostWithStatus', {
            status: response.status,
            errorBody: errorBody || t('noDetails'),
          })
        );
      }

      setAllPosts((prev) => prev.filter((post) => post.postId !== postId));
      setUserPosts((prev) => prev.filter((post) => post.postId !== postId));

      showMessage(t('success'), t('postDeletedSuccessfully'));
    } catch (err) {
      console.error('Error deleting post:', err);
      showMessage(
        t('error'),
        `${t('couldNotDeletePost')} ${err instanceof Error ? err.message : ''}`
      );
    }
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
      keyboardShouldPersistTaps="handled"
    >
      {error ? (
        <View style={styles.centeredMessageContainer}>
          <ThemedText style={{ color: errorTextColor }}>{error}</ThemedText>
        </View>
      ) : userPosts.length === 0 && !loading ? (
        <View style={styles.centeredMessageContainer}>
          <ThemedText>{t('noPostsYet')}</ThemedText>
          <TouchableOpacity
            style={styles.createPostButton}
            onPress={() => navigation.navigate('create_post')}
          >
            <ThemedText style={styles.createPostButtonText}>
              {t('createYourFirstPost')}
            </ThemedText>
          </TouchableOpacity>
        </View>
      ) : (
        userPosts.map((post) => (
          <UserPostCard
            key={post.postId}
            post={post}
            cardBackgroundColor={cardBackgroundColor}
            iconColor={iconColor}
            editIconColor={editIconActualColor}
            deleteIconColor={deleteIconActualColor}
            onEdit={handleEditPost}
            onDelete={handleDeletePost}
          />
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 16,
    paddingBottom: 120,
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '500',
  },
  centeredMessageContainer: {
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
  },
});
