
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
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import CommentItemDisplay from '../components/CommentItemDisplay';

const HOST = Platform.select({ android: '10.0.2.2', ios: 'localhost', web: 'localhost' });
const API_BASE = `http://${HOST}:8080`;

interface CommentData {
    commentId: number;
    username: string;
    content: string;
    createdAt: string | Date; // Can be string from API, then converted to Date
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
  };

// --- PostItem Component ---
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
    commentInputText: string; // For new comments
    isPostingComment: boolean; // For new comments
    onToggleComments: () => void;
    onCommentInputChange: (text: string) => void; // For new comments
    onPostComment: () => void; // For new comments
    onDeleteComment: (postId: number, commentId: number) => void;

    // --- NEW PROPS for edit functionality ---
    onTriggerEditComment: (postId: number, comment: CommentData) => void;
    editingCommentDetailsForPost: { commentId: number; currentText: string; } | null; // Details for *this specific post*
    onEditCommentContentChange: (newText: string) => void; // Generic handler, ExploreScreen manages which comment text
    onSaveEditedCommentForPost: (postId: number, commentId: number) => void;
    onCancelCommentEdit: () => void;
    isSubmittingCommentEditForPost: boolean; // Specific to this post
    // --- END NEW PROPS for edit ---
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
    // --- NEW PROPS for edit functionality ---
    onTriggerEditComment,
    editingCommentDetailsForPost,
    onEditCommentContentChange,
    onSaveEditedCommentForPost,
    onCancelCommentEdit,
    isSubmittingCommentEditForPost,
    // --- END NEW PROPS for edit ---
  }: PostItemProps) {
  
    const colorScheme = useColorScheme();
    const commentItemBorderColor = colorScheme === 'dark' ? '#3A3A3C' : '#EAEAEA';
    const commentUsernameActualColor = colorScheme === 'dark' ? '#E0E0E0' : '#333333';
    const commentContentActualColor = textColor;
    const deleteIconActualColor = colorScheme === 'dark' ? '#FF8A80' : '#D9534F';
    // --- NEW: Define edit icon color ---
    const editIconActualColor = colorScheme === 'dark' ? '#82B1FF' : '#007AFF'; // A themable blue
    // --- END NEW ---
  
    const handleLike = () => {
      if (userType === 'guest') {
        Alert.alert("Login Required", "Please log in to like posts.");
        return;
      }
      onLikePress(post.id, post.likedByUser);
    };

    const handleSave = () => {
      if (userType === 'guest') {
        Alert.alert("Login Required", "Please log in to save posts.");
        return;
      }
      onSavePress(post.id, post.savedByUser);
    };

    
  
    const canPostComment = userType !== 'guest' && loggedInUsername && !editingCommentDetailsForPost; // Disable new comment if editing one in this post
  
    return (
      <View style={[styles.postContainer, { backgroundColor: cardBackgroundColor }]}>
        {/* ... Post title, image, content, footer (likes/comment count) ... no changes here */}
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
        <ThemedText style={[styles.postContent, {color: textColor}]} numberOfLines={post.photoUrl ? 2 : 5}>
          {post.content}
        </ThemedText>
  
        <View style={styles.postFooter}>
          <TouchableOpacity onPress={handleLike} style={styles.footerAction}>
            <Ionicons
              name={post.likedByUser ? "heart" : "heart-outline"}
              size={20}
              color={post.likedByUser ? 'red' : iconColor}
            />
            <ThemedText style={[styles.footerText, { color: post.likedByUser ? 'red' : iconColor, marginLeft: 4 }]}>
              {post.likes}
            </ThemedText>
          </TouchableOpacity>
  
          <TouchableOpacity onPress={onToggleComments} style={[styles.footerAction]}>
            <Ionicons name="chatbubble-outline" size={20} color={iconColor} />
            <ThemedText style={[styles.footerText, { color: iconColor, marginLeft: 4 }]}>
              {post.comments}
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleSave} style={[styles.footerAction, { marginLeft: 246 }]}>
            <Ionicons
              name={post.savedByUser ? "bookmark" : "bookmark-outline"}
              size={20}
              color={post.savedByUser ? '#FFC107' : iconColor}
            />
            <ThemedText style={[styles.footerText, { color: post.savedByUser ? '#FFC107' : iconColor, marginLeft: 4 }]}>
              {post.savedByUser ? 'Saved' : 'Save'}
            </ThemedText>
          </TouchableOpacity>

        </View>
  
  
        {isExpanded && (
          <View style={styles.commentsSection}>
            {isLoadingComments ? (
              <ActivityIndicator style={{ marginVertical: 15 }} color={iconColor} />
            ) : commentsList.length === 0 && !editingCommentDetailsForPost ? ( // Check editing too
              <ThemedText style={[styles.noCommentsText, {color: textColor}]}>No comments yet. Be the first!</ThemedText>
            ) : (
              <View style={styles.commentsListContainer}>
                {commentsList.map(comment => {
                  const isEditingThisComment = editingCommentDetailsForPost?.commentId === comment.commentId;
                  return (
                    <CommentItemDisplay
                      key={comment.commentId}
                      comment={comment}
                      commentTextColor={commentContentActualColor}
                      commentUsernameColor={commentUsernameActualColor}
                      commentBorderColor={commentItemBorderColor}
                      loggedInUsername={loggedInUsername}
                      onDeleteComment={(commentIdToDelete) => onDeleteComment(post.id, commentIdToDelete)}
                      deleteIconColor={deleteIconActualColor}
                      // --- Pass props for edit functionality ---
                      editIconColor={editIconActualColor}
  
                      // ????????????????
                      onTriggerEdit={(commentToEdit) => onTriggerEditComment(post.id, { ...commentToEdit, createdAt: commentToEdit.createdAt.toString() })}
                      isEditingThisComment={isEditingThisComment}
                      editedContent={isEditingThisComment ? (editingCommentDetailsForPost?.currentText || '') : ''}
                      onEditContentChange={onEditCommentContentChange}
                      onSaveEditedComment={() => onSaveEditedCommentForPost(post.id, comment.commentId)}
                      onCancelEdit={onCancelCommentEdit}
                      isSavingEdit={isEditingThisComment && isSubmittingCommentEditForPost}
                      // --- END Pass props for edit ---
                    />
                  );
                })}
              </View>
            )}
  
            {/* Add Comment Input Area - only if not guest AND not currently editing a comment in this post */}
            {canPostComment && (
              <View style={[styles.addCommentContainer, { borderTopColor: commentItemBorderColor }]}>
                <TextInput
                  style={[
                    styles.commentInput,
                    {
                      borderColor: commentInputBorderColor,
                      color: commentInputTextColor,
                      backgroundColor: commentInputBackgroundColor,
                    }
                  ]}
                  placeholder="Add a comment..."
                  placeholderTextColor={commentInputPlaceholderColor}
                  value={commentInputText}
                  onChangeText={onCommentInputChange}
                  multiline
                  editable={!isPostingComment} // Keep this, as posting new comment is separate
                />
                <TouchableOpacity
                  style={[styles.postCommentButton, isPostingComment || !commentInputText.trim() ? styles.postCommentButtonDisabled : {}]}
                  onPress={onPostComment}
                  disabled={isPostingComment || !commentInputText.trim()}
                >
                  {isPostingComment ? (
                    <ActivityIndicator size="small" color={colorScheme === 'dark' ? '#FFFFFF' : '#007AFF'} />
                  ) : (
                    <ThemedText style={styles.postCommentButtonText}>Post</ThemedText>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </View>
    );
  }

export default PostItem;
  
  const styles = StyleSheet.create({
    // ... (existing styles) ...
    container: { flex: 1 },
    content: { paddingBottom: 24 },
    header: { paddingHorizontal: 16, marginTop: Platform.OS === 'ios' ? 48 : 24, marginBottom: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    searchBar: { flexDirection: 'row', alignItems: 'center', borderRadius: 30, marginHorizontal: 16, paddingHorizontal: 12, paddingVertical: Platform.OS === 'ios' ? 12 : 8, marginBottom: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
    searchIcon: { marginRight: 8 },
    searchInput: { flex: 1, fontSize: 16, marginLeft: 5 },
    postContainer: { borderRadius: 8, padding: 12, marginHorizontal: 16, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
    postImage: { width: '100%', aspectRatio: 16/9, maxHeight: 180, borderRadius: 6, marginBottom: 10, backgroundColor: '#eee', resizeMode: 'cover' },
    postTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
    postContent: { fontSize: 14, lineHeight: 20, marginBottom: 12 },
    postFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 4  },
    footerAction: { flexDirection: 'row', alignItems: 'center', minHeight: 20 },
    footerText: { fontSize: 14, marginRight: 8 },
    loginButton: { paddingVertical: 8, paddingHorizontal: 16, backgroundColor: '#2196F3', borderRadius: 20, alignSelf: 'flex-start' },
    loginButtonText: { color: '#fff', fontSize: 14, fontWeight: '500' },
    errorBox: { marginTop: 40, marginHorizontal: 20, padding: 16, borderRadius: 8, alignItems: 'center' },
    errorText: { fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
    noMoreBox: { marginTop: 40, marginHorizontal: 20, padding: 16, borderRadius: 8, alignItems: 'center' },
    noMoreText: { fontSize: 16, fontWeight: '500', textAlign: 'center' },
    loadMoreButton: { marginVertical: 20, marginHorizontal: 40, backgroundColor: '#2196F3', paddingVertical: 12, borderRadius: 25, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
    loadMoreText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    commentsSection: { marginTop: 10, paddingTop: 10 },
    commentsListContainer: { maxHeight: 200, marginBottom: 10 },
    commentItemContainer: { paddingVertical: 8, borderBottomWidth: 1 },
    commentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    commentUsername: { fontWeight: 'bold', fontSize: 13, flexShrink: 1, marginRight: 8 },
    commentOwnerActions: {
      flexDirection: 'row',
    },
    commentActionButton: {
      paddingHorizontal: 6, // Space out icons
      paddingVertical: 4,
    },
    deleteCommentButton: { // This was old, now using commentActionButton
      padding: 4,
    },
    commentEditInput: {
      fontSize: 14,
      paddingVertical: 8,
      paddingHorizontal: 10,
      borderWidth: 1,
      borderRadius: 6,
      marginBottom: 8,
      maxHeight: 100,
    },
    editActionsContainer: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginTop: 4,
    },
    editActionButton: {
      marginLeft: 8,
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 15,
      minWidth: 70,
      alignItems: 'center',
    },
    editActionButtonText: {
      color: '#FFFFFF',
      fontWeight: '600',
      fontSize: 13,
    },
    commentContent: { fontSize: 14, lineHeight: 18 },
    commentTimestamp: { fontSize: 10, opacity: 0.7, marginTop: 4, textAlign: 'right' },
    noCommentsText: { textAlign: 'center', marginVertical: 15, fontSize: 14, opacity: 0.7 },
    addCommentContainer: { flexDirection: 'row', alignItems: 'center', paddingTop: 10, borderTopWidth: 1, marginTop: 5 },
    commentInput: { flex: 1, borderWidth: 1, borderRadius: 20, paddingHorizontal: 15, paddingVertical: 8, fontSize: 14, marginRight: 10, maxHeight: 80 },
    postCommentButton: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 20, backgroundColor: '#007AFF' },
    postCommentButtonDisabled: { backgroundColor: '#B0C4DE' },
    postCommentButtonText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },
  });