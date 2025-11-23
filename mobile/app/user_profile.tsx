import React, { useEffect, useState, useCallback, useContext } from 'react';
import { View, Image, TouchableOpacity, ActivityIndicator, StyleSheet, useColorScheme, Text, Alert } from 'react-native';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import AccessibleText from '@/components/AccessibleText';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { apiRequest } from './services/apiClient';
import PostItem from './components/PostItem';
import { AuthContext } from './_layout';

export default function UserProfileScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const usernameParam = route?.params?.username as string | undefined;
  const { userType, username } = useContext(AuthContext);

  const [loading, setLoading] = useState(true);
  const [bio, setBio] = useState<string>('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [followersCount, setFollowersCount] = useState<number | null>(null);
  const [followingCount, setFollowingCount] = useState<number | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const fetchProfile = useCallback(async (uname?: string) => {
    if (!uname) return;
    setLoading(true);
    try {
      const encoded = encodeURIComponent(uname);
      const res = await apiRequest(`/api/users/${encoded}/profile?username=${encoded}`);
      if (!res.ok) {
        throw new Error(`Failed to load profile: ${res.status}`);
      }
      const data = await res.json();
      setBio(data.biography ?? '');
      setAvatarUri(data.photoUrl ?? null);
      setFollowersCount(typeof data.followersCount === 'number' ? data.followersCount : null);
      setFollowingCount(typeof data.followingCount === 'number' ? data.followingCount : null);
      
      // Check if current user is following this user
      if (userType === 'user' && username && uname !== username) {
        try {
          const checkRes = await apiRequest(`/api/users/${encodeURIComponent(username)}/is-following/${encoded}`);
          if (checkRes.ok) {
            const checkData = await checkRes.json();
            setIsFollowing(checkData.isFollowing || false);
          }
        } catch (e) {
          console.warn('Could not check follow status', e);
        }
      }
    } catch (e) {
      console.warn('Could not fetch user profile', e);
    } finally {
      setLoading(false);
    }
  }, [userType, username]);

  const fetchPosts = useCallback(async (uname?: string) => {
    if (!uname) return;
    setPostsLoading(true);
    try {
      const encoded = encodeURIComponent(uname);
      const res = await apiRequest(`/api/users/${encoded}/posts`);
      if (!res.ok) {
        setPosts([]);
        return;
      }
      const data = await res.json();
      const mapped = Array.isArray(data)
        ? data.map((item: any) => ({
            id: item.postId,
            title: item.creatorUsername,
            content: item.content,
            likes: item.likes || 0,
            comments: Array.isArray(item.comments) ? item.comments.length : Number(item.comments) || 0,
            photoUrl: item.photoUrl ?? null,
            likedByUser: false,
            savedByUser: false,
            createdAt: item.createdAt ?? null,
            authorAvatarUrl: null,
          }))
        : [];
      setPosts(mapped);
    } catch (e) {
      console.warn('Could not fetch posts for user', e);
      setPosts([]);
    } finally {
      setPostsLoading(false);
    }
  }, []);

  const handleFollowToggle = useCallback(async () => {
    if (userType !== 'user' || !username || !usernameParam) {
      Alert.alert(t('loginRequired'), t('pleaseLogInToFollow', { defaultValue: 'Please log in to follow users.' }));
      return;
    }

    if (username === usernameParam) {
      Alert.alert(t('error'), t('cannotFollowYourself', { defaultValue: 'You cannot follow yourself.' }));
      return;
    }

    setFollowLoading(true);
    try {
      const encodedFollower = encodeURIComponent(username);
      const encodedFollowing = encodeURIComponent(usernameParam);
      
      if (isFollowing) {
        // Unfollow
        const res = await apiRequest(`/api/users/${encodedFollower}/unfollow/${encodedFollowing}`, {
          method: 'DELETE',
        });
        if (!res.ok) {
          throw new Error('Failed to unfollow user');
        }
        setIsFollowing(false);
        setFollowersCount(prev => (prev !== null ? Math.max(0, prev - 1) : prev));
      } else {
        // Follow
        const res = await apiRequest(`/api/users/${encodedFollower}/follow/${encodedFollowing}`, {
          method: 'POST',
        });
        if (!res.ok) {
          throw new Error('Failed to follow user');
        }
        setIsFollowing(true);
        setFollowersCount(prev => (prev !== null ? prev + 1 : prev));
      }
    } catch (e) {
      console.error('Error toggling follow status:', e);
      Alert.alert(t('error'), t('couldNotUpdateFollowStatus', { defaultValue: 'Could not update follow status. Please try again.' }));
    } finally {
      setFollowLoading(false);
    }
  }, [userType, username, usernameParam, isFollowing, t]);

  useEffect(() => {
    const uname = usernameParam;
    if (!uname) {
      // no username passed, go back
      navigation.goBack();
      return;
    }
    fetchProfile(uname);
    fetchPosts(uname);
  }, [usernameParam, fetchProfile, fetchPosts, navigation]);

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colorScheme === 'dark' ? '#151718' : '#F0F2F5' }]}>
        <ActivityIndicator size="large" color={colorScheme === 'dark' ? '#FFF' : '#000'} />
      </View>
    );
  }

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: colorScheme === 'dark' ? '#000' : '#F0F2F5', dark: colorScheme === 'dark' ? '#000' : '#F0F2F5' }}
      headerImage={
        <Image source={require('@/assets/images/wallpaper.png')} style={styles.headerImage} resizeMode="cover" />
      }
    >
      <View style={[styles.contentContainer, { backgroundColor: colorScheme === 'dark' ? '#151718' : '#F0F2F5' }]}> 
        <View style={styles.profileContainer}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.profilePic} />
          ) : (
            <View style={[styles.profilePic, { alignItems: 'center', justifyContent: 'center' }]}>
              <Text style={{ fontSize: 36, color: '#888' }}>{usernameParam ? usernameParam.charAt(0).toUpperCase() : '?'}</Text>
            </View>
          )}

          <View style={{ marginLeft: 12, flexShrink: 1 }}>
            <AccessibleText type="default" backgroundColor={colorScheme === 'dark' ? '#151718' : '#F0F2F5'} style={{ fontSize: 20 }}>
              {usernameParam}
            </AccessibleText>

            <AccessibleText type="default" backgroundColor={colorScheme === 'dark' ? '#151718' : '#F0F2F5'} style={{ marginTop: 4, fontStyle: bio ? 'normal' : 'italic' }} numberOfLines={3}>
              {bio || t('noBioYet')}
            </AccessibleText>

            <View style={{ flexDirection: 'row', marginTop: 8 }}>
              <View style={{ marginRight: 16 }}>
                <AccessibleText backgroundColor={colorScheme === 'dark' ? '#151718' : '#F0F2F5'} style={{ fontWeight: '700' }}>{followersCount ?? '-'}</AccessibleText>
                <AccessibleText backgroundColor={colorScheme === 'dark' ? '#151718' : '#F0F2F5'} style={{ opacity: 0.8 }}>{t('followers')}</AccessibleText>
              </View>
              <View>
                <AccessibleText backgroundColor={colorScheme === 'dark' ? '#151718' : '#F0F2F5'} style={{ fontWeight: '700' }}>{followingCount ?? '-'}</AccessibleText>
                <AccessibleText backgroundColor={colorScheme === 'dark' ? '#151718' : '#F0F2F5'} style={{ opacity: 0.8 }}>{t('following')}</AccessibleText>
              </View>
            </View>

            {userType === 'user' && username && username !== usernameParam && (
              <TouchableOpacity
                style={[styles.followButton, { backgroundColor: isFollowing ? '#888' : '#007AFF', marginTop: 12 }]}
                onPress={handleFollowToggle}
                disabled={followLoading}
              >
                {followLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <AccessibleText backgroundColor={isFollowing ? '#888' : '#007AFF'} style={{ color: '#fff', fontWeight: '600' }}>
                    {isFollowing ? t('unfollow', { defaultValue: 'Unfollow' }) : t('follow', { defaultValue: 'Follow' })}
                  </AccessibleText>
                )}
              </TouchableOpacity>
            )}

          </View>
        </View>

        <View style={{ height: 10 }} />

        <AccessibleText backgroundColor={colorScheme === 'dark' ? '#151718' : '#F0F2F5'} style={{ fontSize: 18, fontWeight: '700', marginBottom: 12 }}>{t('profilePostsTitle')}</AccessibleText>

        {postsLoading ? (
          <ActivityIndicator />
        ) : posts.length === 0 ? (
          <AccessibleText backgroundColor={colorScheme === 'dark' ? '#151718' : '#F0F2F5'} style={{ color: '#888' }}>{t('noPostsYet')}</AccessibleText>
        ) : (
          posts.map((post) => (
            <PostItem
              key={`guest-post-${post.id}`}
              post={post}
              cardBackgroundColor={colorScheme === 'dark' ? '#1C1C1E' : '#FFFFFF'}
              iconColor={colorScheme === 'dark' ? '#8E8E93' : '#6C6C70'}
              textColor={colorScheme === 'dark' ? '#E5E5E7' : '#1C1C1E'}
              commentInputBorderColor={colorScheme === 'dark' ? '#545458' : '#C7C7CD'}
              commentInputTextColor={colorScheme === 'dark' ? '#E5E5E7' : '#1C1C1E'}
              commentInputPlaceholderColor={colorScheme === 'dark' ? '#8E8E93' : '#6C6C70'}
              commentInputBackgroundColor={colorScheme === 'dark' ? '#2C2C2E' : '#F0F2F5'}
              onLikePress={() => {}}
              onSavePress={() => {}}
              userType={'guest'}
              loggedInUsername={null}
              isExpanded={false}
              commentsList={[]}
              isLoadingComments={false}
              commentInputText={''}
              isPostingComment={false}
              onToggleComments={() => {}}
              onCommentInputChange={() => {}}
              onPostComment={() => {}}
              onDeleteComment={() => {}}
              onTriggerEditComment={() => {}}
              editingCommentDetailsForPost={null}
              onEditCommentContentChange={() => {}}
              onSaveEditedCommentForPost={() => {}}
              onCancelCommentEdit={() => {}}
              isSubmittingCommentEditForPost={false}
            />
          ))
        )}

      </View>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: { width: '100%', height: undefined, aspectRatio: 0.88 },
  contentContainer: { flex: 1, padding: 16, marginTop: -20 },
  profileContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  profilePic: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#ddd' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  followButton: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
});
