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
}

// --- CommentItemDisplay Component ---
interface CommentItemDisplayProps {
  comment: CommentData;
  commentTextColor: string;
  commentUsernameColor: string;
  commentBorderColor: string;
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
  // --- END NEW PROPS for edit ---
}

function CommentItemDisplay({
  comment,
  commentTextColor,
  commentUsernameColor,
  commentBorderColor,
  loggedInUsername,
  onDeleteComment,
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
  // --- END NEW PROPS for edit ---
}: CommentItemDisplayProps) {
  const { t } = useTranslation();
  const isOwner = loggedInUsername && comment.username === loggedInUsername;
  const colorScheme = useColorScheme(); // For save/cancel button text color

  if (isOwner && isEditingThisComment) {
    return (
      <View style={[styles.commentItemContainer, { borderBottomColor: commentBorderColor }]}>
        <View style={styles.commentHeader}>
          <AccessibleText style={[styles.commentUsername, { color: commentUsernameColor }]}>{comment.username} (editing)</AccessibleText>
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
            <AccessibleText style={styles.editActionButtonText}>{t('cancel')}</AccessibleText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.editActionButton, { backgroundColor: editIconColor }]}
            onPress={() => onSaveEditedComment(comment.commentId)}
            disabled={isSavingEdit || !editedContent.trim()}
          >
            {isSavingEdit ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <AccessibleText style={styles.editActionButtonText}>{t('save')}</AccessibleText>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.commentItemContainer, { borderBottomColor: commentBorderColor }]}>
      <View style={styles.commentHeader}>
        <AccessibleText style={[styles.commentUsername, { color: commentUsernameColor }]}>{comment.username}</AccessibleText>
        {isOwner ? (
          <View style={styles.commentOwnerActions}>
            <TouchableOpacity onPress={() => onTriggerEdit(comment)} style={styles.commentActionButton}>
              <Ionicons name="pencil-outline" size={18} color={editIconColor} />
              <AccessibleText style={[styles.commentActionText, { color: editIconColor }]}>{t('edit')}</AccessibleText>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onDeleteComment(comment.commentId)} style={styles.commentActionButton}>
              <Ionicons name="trash-outline" size={18} color={deleteIconColor} />
              <AccessibleText style={[styles.commentActionText, { color: deleteIconColor }]}>{t('delete')}</AccessibleText>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            onPress={() => {}}
            style={styles.commentActionButton}
            accessibilityLabel="Report comment"
            accessibilityRole="button"
          >
            <Ionicons name="warning-outline" size={16} color="#515151" />
            <AccessibleText style={[styles.commentActionText, { color: "#515151" }]}>{t('report')}</AccessibleText>
          </TouchableOpacity>
        )}
      </View>
      <AccessibleText style={[styles.commentContent, { color: commentTextColor }]}>{comment.content}</AccessibleText>
      <AccessibleText style={[styles.commentTimestamp, { color: commentTextColor }]}>
        {new Date(comment.createdAt).toLocaleDateString()}
      </AccessibleText>
    </View>
  );
}

export default CommentItemDisplay;

const styles = StyleSheet.create({
    commentsSection: { marginTop: 10, paddingTop: 10 },
    commentsListContainer: { maxHeight: 200, marginBottom: 10 },
    commentItemContainer: { paddingVertical: 8, borderBottomWidth: 1 },
    commentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    commentUsername: { fontWeight: 'bold', fontSize: 13, flexShrink: 1, marginRight: 8 },
    // --- MODIFIED/NEW Styles for comment actions and editing ---
    commentOwnerActions: {
      flexDirection: 'row',
    },
    commentActionButton: {
      paddingHorizontal: 6, // Space out icons
      paddingVertical: 4,
      flexDirection: 'row',
      alignItems: 'center',
    },
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
    commentContent: { fontSize: 14, lineHeight: 18 },
    commentTimestamp: { fontSize: 10, opacity: 0.7, marginTop: 4, textAlign: 'right' },
    noCommentsText: { textAlign: 'center', marginVertical: 15, fontSize: 14, opacity: 0.7 },
    addCommentContainer: { flexDirection: 'row', alignItems: 'center', paddingTop: 10, borderTopWidth: 1, marginTop: 5 },
    commentInput: { flex: 1, borderWidth: 1, borderRadius: 20, paddingHorizontal: 15, paddingVertical: 8, fontSize: 14, marginRight: 10, maxHeight: 80 },
    postCommentButton: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 20, backgroundColor: '#007AFF' },
    postCommentButtonDisabled: { backgroundColor: '#B0C4DE' },
    postCommentButtonText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },
  });
