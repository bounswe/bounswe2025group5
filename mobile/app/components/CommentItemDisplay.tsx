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
import AccessibleText from '@/components/AccessibleText';
import { useTranslation } from 'react-i18next';


// Define the CommentData interface
interface CommentData {
  commentId: number;
  username: string;
  content: string;
  createdAt: string | Date; // Can be string from API, then converted to Date
  avatarUrl?: string | null;
}

// --- CommentItemDisplay Component ---
interface CommentItemDisplayProps {
  comment: CommentData;
  commentTextColor: string;
  commentUsernameColor: string;
  commentBorderColor: string;
  /** background color of the container (hex) so AccessibleText can compute readable foreground */
  backgroundColor?: string;
  loggedInUsername: string | null;
  onDeleteComment: (commentId: number) => void;
  deleteIconColor: string;
  // --- NEW PROPS for edit functionality ---
  editIconColor: string;
  onTriggerEdit: (comment: CommentData) => void;
  isEditingThisComment: boolean;
  editedContent: string;
  onEditContentChange: (newText: string) => void;
  onSaveEditedComment: (commentId: number) => void;
  onCancelEdit: () => void;
  isSavingEdit: boolean;
  onReportComment?: (comment: CommentData) => void;
  reportActionColor?: string;
  // --- END NEW PROPS for edit ---
}

function CommentItemDisplay({
  comment,
  commentTextColor,
  commentUsernameColor,
  commentBorderColor,
  loggedInUsername,
  onDeleteComment,
  backgroundColor,
  deleteIconColor,
  // --- NEW PROPS for edit functionality ---
  editIconColor,
  onTriggerEdit,
  isEditingThisComment,
  editedContent,
  onEditContentChange,
  onSaveEditedComment,
  onCancelEdit,
  isSavingEdit,
  onReportComment,
  reportActionColor,
  // --- END NEW PROPS for edit ---
}: CommentItemDisplayProps) {
  const { t, i18n } = useTranslation();
  const isOwner = loggedInUsername && comment.username === loggedInUsername;
  const colorScheme = useColorScheme(); // For save/cancel button text color
  const resolvedReportColor = reportActionColor || '#515151';

  if (isOwner && isEditingThisComment) {
    return (
      <View style={styles.commentItemWrapper}>
        <View style={[styles.commentBubble, { backgroundColor: bubbleBackground, borderColor: bubbleBorderColor }]}>
          <View style={styles.commentHeader}>
            <AccessibleText backgroundColor={bubbleBackground} style={[styles.commentUsername]}>{comment.username} (editing)</AccessibleText>
          </View>
          <TextInput
            style={[styles.commentEditInput, { borderColor: editIconColor, color: commentTextColor, backgroundColor: colorScheme === 'dark' ? '#2C2C2E' : '#F9F9F9' }]}
            value={editedContent}
            onChangeText={onEditContentChange}
            multiline
            autoFocus
            editable={!isSavingEdit}
          />
          <View style={styles.editActionsContainer}>
            <TouchableOpacity
              style={[styles.editActionButton, { backgroundColor: '#888' }]}
              onPress={onCancelEdit}
              disabled={isSavingEdit}
            >
              <AccessibleText backgroundColor={'#888'} style={styles.editActionButtonText}>{t('cancel')}</AccessibleText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.editActionButton, { backgroundColor: editIconColor }]}
              onPress={() => onSaveEditedComment(comment.commentId)}
              disabled={isSavingEdit || !editedContent.trim()}
            >
              {isSavingEdit ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <AccessibleText backgroundColor={editIconColor} style={styles.editActionButtonText}>{t('save')}</AccessibleText>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.commentItemWrapper}>
      <View style={[styles.commentBubble, { backgroundColor: bubbleBackground, borderColor: bubbleBorderColor }]}>
        <View style={styles.commentTopRow}>
          {comment.avatarUrl ? (
            <Image source={{ uri: comment.avatarUrl }} style={styles.commentAvatarImage} />
          ) : (
            <View style={[styles.commentAvatar, { backgroundColor: avatarBackground }]}>
              <AccessibleText backgroundColor={avatarBackground} style={[styles.commentAvatarText, { color: avatarTextColor }]}>
                {avatarInitial}
              </AccessibleText>
            </View>
          )}
          <View style={styles.commentMeta}>
            <AccessibleText backgroundColor={bubbleBackground} style={[styles.commentUsername, { marginRight: 0 }]}>
              {comment.username}
            </AccessibleText>
            <AccessibleText backgroundColor={bubbleBackground} style={[styles.commentTimestamp, { color: timestampColor }]}>
              {timestampText}
            </AccessibleText>
          </View>
        ) : onReportComment ? (
          <TouchableOpacity
            onPress={() => onReportComment(comment)}
            style={styles.commentActionButton}
            accessibilityLabel="Report comment"
            accessibilityRole="button"
          >
            <Ionicons name="warning-outline" size={16} color={resolvedReportColor} />
            <AccessibleText backgroundColor={backgroundColor} style={[styles.commentActionText, { color: resolvedReportColor }]}>{t('report')}</AccessibleText>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

export default CommentItemDisplay;

const styles = StyleSheet.create({
    commentsSection: { marginTop: 10, paddingTop: 10 },
    commentsListContainer: { maxHeight: 200, marginBottom: 10 },
    commentItemWrapper: { marginBottom: 12 },
    commentBubble: {
      borderWidth: 1,
      borderRadius: 14,
      padding: 12,
    },
    commentTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 6,
    },
    commentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    commentMeta: { flex: 1, marginLeft: 10 },
    commentUsername: { fontWeight: '700', fontSize: 14, flexShrink: 1 },
    commentAvatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    commentAvatarImage: {
      width: 32,
      height: 32,
      borderRadius: 16,
    },
    commentAvatarText: { fontWeight: '700' },
    // --- MODIFIED/NEW Styles for comment actions and editing ---
    commentOwnerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      marginLeft: 'auto',
    },
    commentActionButton: {
      paddingHorizontal: 6, // Space out icons
      paddingVertical: 4,
      flexDirection: 'row',
      alignItems: 'center',
    },
    commentActionEnd: { marginLeft: 'auto' },
    commentActionText: {
      marginLeft: 4,
      fontSize: 13,
      fontWeight: '500',
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
    // --- END ---
    commentContent: { fontSize: 14, lineHeight: 20 },
    commentTimestamp: { fontSize: 11, marginTop: 2 },
    noCommentsText: { textAlign: 'center', marginVertical: 15, fontSize: 14, opacity: 0.7 },
    addCommentContainer: { flexDirection: 'row', alignItems: 'center', paddingTop: 10, borderTopWidth: 1, marginTop: 5 },
    commentInput: { flex: 1, borderWidth: 1, borderRadius: 20, paddingHorizontal: 15, paddingVertical: 8, fontSize: 14, marginRight: 10, maxHeight: 80 },
    postCommentButton: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 20, backgroundColor: '#007AFF' },
    postCommentButtonDisabled: { backgroundColor: '#B0C4DE' },
    postCommentButtonText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },
  });
