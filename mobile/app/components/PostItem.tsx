// components/PostItem.tsx
import React, { useState, useMemo } from 'react';
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  TextInput,
  ActivityIndicator,
  Platform,
  useColorScheme,
  Image,
  Alert,
  Modal,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import AccessibleText from '@/components/AccessibleText';
import CommentItemDisplay from './CommentItemDisplay';

import { useTranslation } from 'react-i18next';
import { apiUrl } from '../apiConfig';

interface CommentData {
  commentId: number;
  username: string;
  content: string;
  createdAt: string | Date;
}

type Post = {
  id: number;
  title: string;
  content: string;
  likes: number;
  comments: number;
  photoUrl: string | null;
  likedByUser: boolean;
  savedByUser: boolean;
  createdAt?: string | Date | null;
};

interface PostItemProps {
  post: Post;
  cardBackgroundColor: string;
  iconColor: string;
  textColor: string;
  commentInputBorderColor: string;
  commentInputTextColor: string;
  commentInputPlaceholderColor: string;
  commentInputBackgroundColor: string;
  onLikePress: (postId: number, currentlyLiked: boolean) => void;
  onSavePress: (postId: number, currentlySaved: boolean) => void;
  userType: string | null;
  loggedInUsername: string | null;

  isExpanded: boolean;
  commentsList: CommentData[];
  isLoadingComments: boolean;
  commentInputText: string;
  isPostingComment: boolean;
  onToggleComments: () => void;
  onCommentInputChange: (text: string) => void;
  onPostComment: () => void;
  onDeleteComment: (postId: number, commentId: number) => void;

  // Edit props
  onTriggerEditComment: (postId: number, comment: CommentData) => void;
  editingCommentDetailsForPost: { commentId: number; currentText: string } | null;
  onEditCommentContentChange: (newText: string) => void;
  onSaveEditedCommentForPost: (postId: number, commentId: number) => void;
  onCancelCommentEdit: () => void;
  isSubmittingCommentEditForPost: boolean;
}

function PostItem({
  post,
  cardBackgroundColor,
  iconColor,
  textColor,
  commentInputBorderColor,
  commentInputTextColor,
  commentInputPlaceholderColor,
  commentInputBackgroundColor,
  onLikePress,
  onSavePress,
  userType,
  loggedInUsername,
  isExpanded,
  commentsList,
  isLoadingComments,
  commentInputText,
  isPostingComment,
  onToggleComments,
  onCommentInputChange,
  onPostComment,
  onDeleteComment,
  onTriggerEditComment,
  editingCommentDetailsForPost,
  onEditCommentContentChange,
  onSaveEditedCommentForPost,
  onCancelCommentEdit,
  isSubmittingCommentEditForPost,
}: PostItemProps) {
  const { t, i18n } = useTranslation();
  const colorScheme = useColorScheme();
  const [isImageViewerVisible, setImageViewerVisible] = useState(false);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);

  const commentItemBorderColor = colorScheme === 'dark' ? '#3A3A3C' : '#EAEAEA';
  const commentUsernameActualColor = colorScheme === 'dark' ? '#E0E0E0' : '#333333';
  const commentContentActualColor = textColor;
  const deleteIconActualColor = colorScheme === 'dark' ? '#FF8A80' : '#D9534F';
  const editIconActualColor = colorScheme === 'dark' ? '#82B1FF' : '#007AFF';
  const imageUri = post.photoUrl
    ? post.photoUrl.startsWith('http')
      ? post.photoUrl
      : apiUrl(post.photoUrl)
    : null;
  const resolvedLanguage = (i18n.resolvedLanguage || i18n.language || 'en').toString();
  const formattedPublishedAt = useMemo(() => {
    if (!post.createdAt) return null;
    const dateInstance = post.createdAt instanceof Date ? post.createdAt : new Date(post.createdAt);
    if (Number.isNaN(dateInstance.getTime())) return null;
    try {
      return dateInstance.toLocaleString(resolvedLanguage, {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    } catch {
      return dateInstance.toISOString();
    }
  }, [post.createdAt, resolvedLanguage]);

  const handleLike = () => {
    if (userType === 'guest') {
      Alert.alert(t('loginRequired'), t('pleaseLogInToLikePosts'));
      return;
    }
    onLikePress(post.id, post.likedByUser);
  };

  const handleSave = () => {
    if (userType === 'guest') {
      Alert.alert(t('loginRequired'), t('pleaseLogInToSavePosts'));
      return;
    }
    onSavePress(post.id, post.savedByUser);
  };

    
  
    const canPostComment = userType !== 'guest' && loggedInUsername && !editingCommentDetailsForPost; // Disable new comment if editing one in this post
  
  return (
      <View testID={`post-${post.id}`} style={[styles.postContainer, { backgroundColor: cardBackgroundColor }]}>

        {/* Report Button (Moved to top-right) */}
        {loggedInUsername && loggedInUsername !== post.title && (
          <TouchableOpacity
            style={styles.reportButtonAbsolute}
            onPress={() => {}}
            accessible
            accessibilityRole="button"
            accessibilityLabel={t('reportPost', { defaultValue: 'Report post' })}
            accessibilityHint={t('reportThisPostHint', { defaultValue: 'Report this post to the moderators.' })}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name="warning-outline"
              size={16}
              color="#515151ff"
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
            />
            <ThemedText style={styles.reportText}>
              {t('report', { defaultValue: 'Report' })}
            </ThemedText>
          </TouchableOpacity>
        )}
        
        {/* ... Post title, image, content, footer (likes/comment count) ... */}
        <AccessibleText type="title" isLargeText backgroundColor={cardBackgroundColor} style={styles.postTitle}>
          {post.title}
        </AccessibleText>
        {imageUri && (
          <>
            <View style={styles.imageWrapper}>
              <Image
                source={{ uri: imageUri }}
                style={styles.postImage}
                onError={(e) => console.warn('Explore: Image failed to load:', e.nativeEvent.error, imageUri)}
              />
              <TouchableOpacity
                style={styles.fullscreenButton}
                onPress={() => {
                  if (!imageUri) {
                    return;
                  }
                  Image.getSize(
                    imageUri,
                    (width, height) => {
                      setImageDimensions({ width, height });
                      setImageViewerVisible(true);
                    },
                    () => {
                      setImageDimensions(null);
                      setImageViewerVisible(true);
                    }
                  );
                }}
                accessibilityRole="button"
                accessibilityLabel={t('viewImageFullscreen', { defaultValue: 'View image fullscreen' })}
              >
                <Ionicons name="expand-outline" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <Modal
              visible={isImageViewerVisible}
              onRequestClose={() => {
                setImageViewerVisible(false);
                setImageDimensions(null);
              }}
              transparent
              animationType="fade"
            >
              <View style={styles.fullscreenModalBackdrop}>
                <View style={styles.fullscreenHeader}>
                  <TouchableOpacity
                    onPress={() => {
                      setImageViewerVisible(false);
                      setImageDimensions(null);
                    }}
                    style={styles.fullscreenExitButton}
                    accessibilityRole="button"
                    accessibilityLabel={t('closeFullscreenImage', { defaultValue: 'Close fullscreen image' })}
                  >
                    <Ionicons name="close" size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
                <ScrollView
                  style={styles.fullscreenImageScroll}
                  contentContainerStyle={styles.fullscreenImageContainer}
                  minimumZoomScale={1}
                  maximumZoomScale={4}
                  showsHorizontalScrollIndicator={false}
                  showsVerticalScrollIndicator={false}
                  centerContent
                >
                  <Image
                    source={{ uri: imageUri }}
                    style={[
                      styles.fullscreenImage,
                      imageDimensions && imageDimensions.height
                        ? { aspectRatio: imageDimensions.width / imageDimensions.height }
                        : null,
                    ]}
                    resizeMode="contain"
                  />
                </ScrollView>
              </View>
            </Modal>
          </>
        )}

        {post.content ? (
          <AccessibleText backgroundColor={cardBackgroundColor} style={[styles.postContent]}> 
            {post.content}
          </AccessibleText>
        ) : null}
        <View style={styles.postMetaRow}>
          {formattedPublishedAt ? (
            <ThemedText
              style={[styles.postTimestamp, { color: iconColor }]}
              accessibilityLabel={formattedPublishedAt}
            >
              {formattedPublishedAt}
            </ThemedText>
          ) : (
            <View />
          )}
        </View>

        <View style={styles.postFooter}>
          <TouchableOpacity onPress={handleLike} style={styles.footerAction}>
            <Ionicons
              name={post.likedByUser ? 'heart' : 'heart-outline'}
              size={20}
              color={post.likedByUser ? 'red' : iconColor}
            />
            <ThemedText style={[styles.footerText, { color: post.likedByUser ? 'red' : iconColor, marginLeft: 4 }]}>
              {post.likes}
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity onPress={onToggleComments} style={styles.footerAction}>
            <Ionicons name="chatbubble-outline" size={20} color={iconColor} />
            <ThemedText style={[styles.footerText, { color: iconColor, marginLeft: 4 }]}>
              {post.comments}
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity testID="save-toggle" onPress={handleSave} style={[styles.footerAction, { marginLeft: 'auto' }]}>
            <Ionicons
              testID={`icon-${post.savedByUser ? 'bookmark' : 'bookmark-outline'}`}
              name={post.savedByUser ? 'bookmark' : 'bookmark-outline'}
              size={20}
              color={post.savedByUser ? '#FFC107' : iconColor}
            />
            <ThemedText
              style={[
                styles.footerText,
                { color: post.savedByUser ? '#FFC107' : iconColor, marginLeft: 4 },
              ]}
            >
              {post.savedByUser ? t('saved') : t('save')}
            </ThemedText>
          </TouchableOpacity>
        </View>

      {/* Comments */}
      {isExpanded && (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
          keyboardVerticalOffset={100}
        >
          <View style={styles.commentsSection}>
            {isLoadingComments ? (
              <ActivityIndicator style={{ marginVertical: 15 }} color={iconColor} />
            ) : commentsList.length === 0 && !editingCommentDetailsForPost ? (
              <AccessibleText backgroundColor={cardBackgroundColor} style={[styles.noCommentsText]}> 
                {t('noCommentsYetBeFirst')}
              </AccessibleText>
            ) : (
              <ScrollView
                style={styles.commentsListContainer}
                nestedScrollEnabled
                showsVerticalScrollIndicator={false}
              >
                {commentsList.map((comment) => {
                  const isEditingThisComment =
                    editingCommentDetailsForPost?.commentId === comment.commentId;
                  return (
                    <CommentItemDisplay
                      key={comment.commentId}
                      comment={comment}
                      commentTextColor={commentContentActualColor}
                      commentUsernameColor={commentUsernameActualColor}
                      commentBorderColor={commentItemBorderColor}
                      loggedInUsername={loggedInUsername}
                      onDeleteComment={(commentIdToDelete) =>
                        onDeleteComment(post.id, commentIdToDelete)
                      }
                      deleteIconColor={deleteIconActualColor}
                      editIconColor={editIconActualColor}
                      onTriggerEdit={(commentToEdit) =>
                        onTriggerEditComment(post.id, {
                          ...commentToEdit,
                          createdAt: commentToEdit.createdAt.toString(),
                        })
                      }
                      isEditingThisComment={isEditingThisComment}
                      editedContent={
                        isEditingThisComment ? editingCommentDetailsForPost?.currentText || '' : ''
                      }
                      onEditContentChange={onEditCommentContentChange}
                      onSaveEditedComment={() =>
                        onSaveEditedCommentForPost(post.id, comment.commentId)
                      }
                      onCancelEdit={onCancelCommentEdit}
                      isSavingEdit={isEditingThisComment && isSubmittingCommentEditForPost}
                      // If CommentItemDisplay has internal strings, remember to i18n that component too.
                    />
                  );
                })}
              </ScrollView>
            )}

            {/* Add Comment (disabled for guest or while editing) */}
            {canPostComment && (
              <View style={[styles.addCommentContainer, { borderTopColor: commentItemBorderColor }]}>
                <TextInput
                  style={[
                    styles.commentInput,
                    {
                      borderColor: commentInputBorderColor,
                      color: commentInputTextColor,
                      backgroundColor: commentInputBackgroundColor,
                    },
                  ]}
                  placeholder={t('addACommentPlaceholder')}
                  placeholderTextColor={commentInputPlaceholderColor}
                  value={commentInputText}
                  onChangeText={onCommentInputChange}
                  multiline
                  editable={!isPostingComment}
                />
                <TouchableOpacity
                  testID="post-comment-button"
                  style={[
                    styles.postCommentButton,
                    isPostingComment || !commentInputText.trim()
                      ? styles.postCommentButtonDisabled
                      : {},
                  ]}
                  onPress={onPostComment}
                  disabled={isPostingComment || !commentInputText.trim()}
                >
                  {isPostingComment ? (
                    <ActivityIndicator
                      size="small"
                      color={colorScheme === 'dark' ? '#FFFFFF' : '#007AFF'}
                    />
                  ) : (
                    <ThemedText style={styles.postCommentButtonText}>{t('post')}</ThemedText>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}

export default PostItem;

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 24 },
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
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 16, marginLeft: 5 },
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
  imageWrapper: {
    position: 'relative',
    marginBottom: 10,
  },
  postImage: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 6,
    marginBottom: 0,
    backgroundColor: '#eee',
    resizeMode: 'cover',
  },
  fullscreenButton: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 16,
    padding: 8,
    zIndex: 1,
  },
  postTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  postContent: { fontSize: 14, lineHeight: 20, marginBottom: 12 },
  postMetaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  postTimestamp: { fontSize: 12, opacity: 0.7, marginBottom: 8 },
  reportButton: { padding: 4, marginLeft: 12 },
  reportButtonPlaceholder: { width: 24, height: 24 },
  postFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  footerAction: { flexDirection: 'row', alignItems: 'center', minHeight: 20 },
  footerText: { fontSize: 14, marginRight: 8 },
  loginButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#2196F3',
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  loginButtonText: { color: '#fff', fontSize: 14, fontWeight: '500' },
  errorBox: {
    marginTop: 40,
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  errorText: { fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
  noMoreBox: {
    marginTop: 40,
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  noMoreText: { fontSize: 16, fontWeight: '500', textAlign: 'center' },
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
  loadMoreText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  commentsSection: { marginTop: 10, paddingTop: 10, flex: 1 },
  commentsListContainer: { marginBottom: 10 },
  commentItemContainer: { paddingVertical: 8, borderBottomWidth: 1 },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  commentUsername: { fontWeight: 'bold', fontSize: 13, flexShrink: 1, marginRight: 8 },
  commentOwnerActions: { flexDirection: 'row' },
  commentActionButton: { paddingHorizontal: 6, paddingVertical: 4 },
  deleteCommentButton: { padding: 4 },
  commentEditInput: {
    fontSize: 14,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderRadius: 6,
    marginBottom: 8,
    maxHeight: 100,
  },
  editActionsContainer: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 4 },
  editActionButton: {
    marginLeft: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
    minWidth: 70,
    alignItems: 'center',
  },
  editActionButtonText: { color: '#FFFFFF', fontWeight: '600', fontSize: 13 },
  commentContent: { fontSize: 14, lineHeight: 18 },
  commentTimestamp: { fontSize: 10, opacity: 0.7, marginTop: 4, textAlign: 'right' },
  noCommentsText: { textAlign: 'center', marginVertical: 15, fontSize: 14, opacity: 0.7 },
  addCommentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    marginTop: 5,
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    fontSize: 14,
    marginRight: 10,
    maxHeight: 80,
  },
  postCommentButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#007AFF',
  },
  postCommentButtonDisabled: { backgroundColor: '#B0C4DE' },
  postCommentButtonText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },
  fullscreenModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  fullscreenHeader: {
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingHorizontal: 16,
    paddingBottom: 12,
    alignItems: 'flex-start',
  },
  fullscreenExitButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 22,
    padding: 10,
    alignSelf: 'flex-start',
  },
  fullscreenImageScroll: {
    flex: 1,
  },
  fullscreenImageContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  fullscreenImage: {
    width: '100%',
   height: undefined,
    aspectRatio: 16 / 9,
  },
  reportButtonAbsolute: {
  position: 'absolute',
  top: 8,
  right: 8,
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: 'rgba(255,255,255,0.8)', // improves visibility over images
  borderRadius: 14,
  paddingVertical: 4,
  paddingHorizontal: 8,
  zIndex: 10,
  },
  reportText: {
    marginLeft: 4,
    fontSize: 13,
    color: '#515151',
    fontWeight: '500',
  },
});
