// components/PostItem.tsx
import React, { useState, useMemo } from "react";
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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import AccessibleText from "@/components/AccessibleText";
import CommentItemDisplay from "./CommentItemDisplay";
import ReportModal, { ReportContext } from "./ReportModal";

import { useTranslation } from "react-i18next";
import { apiUrl } from "../apiConfig";

interface CommentData {
  commentId: number;
  username: string;
  content: string;
  createdAt: string | Date;
  avatarUrl?: string | null;
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
  authorAvatarUrl?: string | null;
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
  editingCommentDetailsForPost: {
    commentId: number;
    currentText: string;
  } | null;
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
  const navigation = useNavigation<any>();
  const [isImageViewerVisible, setImageViewerVisible] = useState(false);
  const [imageDimensions, setImageDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportContext, setReportContext] = useState<ReportContext | null>(
    null
  );

  const commentItemBorderColor = colorScheme === "dark" ? "#3A3A3C" : "#EAEAEA";
  const commentUsernameActualColor =
    colorScheme === "dark" ? "#E0E0E0" : "#333333";
  const commentContentActualColor = textColor;
  const deleteIconActualColor = colorScheme === "dark" ? "#FF8A80" : "#D9534F";
  const editIconActualColor = colorScheme === "dark" ? "#82B1FF" : "#007AFF";
  const reportAccentColor = colorScheme === "dark" ? "#F3F3F6" : "#1F1F24";
  const reportLabelColor = colorScheme === "dark" ? "#ECECEC" : "#2C2C2E";
  const imageUri = post.photoUrl
    ? post.photoUrl.startsWith("http")
      ? post.photoUrl
      : apiUrl(post.photoUrl)
    : null;
  const resolvedLanguage = (
    i18n.resolvedLanguage ||
    i18n.language ||
    "en"
  ).toString();
  const formattedPublishedAt = useMemo(() => {
    if (!post.createdAt) return null;
    const dateInstance =
      post.createdAt instanceof Date
        ? post.createdAt
        : new Date(post.createdAt);
    if (Number.isNaN(dateInstance.getTime())) return null;
    try {
      return dateInstance.toLocaleString(resolvedLanguage, {
        dateStyle: "medium",
        timeStyle: "short",
      });
    } catch {
      return dateInstance.toISOString();
    }
  }, [post.createdAt, resolvedLanguage]);
  const authorAvatarUri = post.authorAvatarUrl
    ? post.authorAvatarUrl.startsWith("http")
      ? post.authorAvatarUrl
      : apiUrl(post.authorAvatarUrl)
    : null;
  const authorInitial = post.title ? post.title.charAt(0).toUpperCase() : "?";
  const authorAvatarBackground = colorScheme === "dark" ? "#2F2F31" : "#D9D9D9";
  const authorAvatarTextColor = colorScheme === "dark" ? "#F5F5F7" : "#111111";

  const handleLike = () => {
    // if (userType === 'guest') {
    //   Alert.alert(t('loginRequired'), t('pleaseLogInToLikePosts'));
    //   return;
    // }
    onLikePress(post.id, post.likedByUser);
  };

  const handleSave = () => {
    // if (userType === "guest") {
    //   Alert.alert(t("loginRequired"), t("pleaseLogInToSavePosts"));
    //   return;
    // }
    onSavePress(post.id, post.savedByUser);
  };

  const openReportModalForPost = () => {
    setReportContext({
      type: "post",
      title: post.title,
      snippet: post.content,
    });
    setReportModalVisible(true);
  };

  const openReportModalForComment = (comment: CommentData) => {
    if (!loggedInUsername) {
      Alert.alert(
        t("loginRequired"),
        t("pleaseLogInToReport", {
          defaultValue: "Please log in to report content.",
        })
      );
      return;
    }
    setReportContext({
      type: "comment",
      title: post.title,
      username: comment.username,
      snippet: comment.content,
    });
    setReportModalVisible(true);
  };

  const closeReportModal = () => {
    setReportModalVisible(false);
    setReportContext(null);
  };
  const canPostComment = userType === "user" && !editingCommentDetailsForPost; // Disable new comment if editing one in this post
  const reportCommentHandler = loggedInUsername
    ? openReportModalForComment
    : undefined;

  return (
    <>
      <View
        testID={`post-${post.id}`}
        style={[styles.postContainer, { backgroundColor: cardBackgroundColor }]}
      >
        {/* Report Button (Moved to top-right) */}
        {loggedInUsername && loggedInUsername !== post.title && (
          <TouchableOpacity
            style={styles.reportButtonAbsolute}
            onPress={openReportModalForPost}
            accessible
            accessibilityRole="button"
            accessibilityLabel={t("reportPost", {
              defaultValue: "Report post",
            })}
            accessibilityHint={t("reportThisPostHint", {
              defaultValue: "Report this post to the moderators.",
            })}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name="warning-outline"
              size={16}
              color={reportLabelColor}
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
            />
            <AccessibleText
              backgroundColor={"transparent"}
              style={[styles.reportText, { color: reportLabelColor }]}
            >
              {t("report", { defaultValue: "Report" })}
            </AccessibleText>
          </TouchableOpacity>
        )}

        {/* Post header with avatar + metadata */}
        <View style={styles.postHeaderRow}>
          <View
            accessible={false}
            importantForAccessibility="no-hide-descendants"
            accessibilityElementsHidden={true}
          >
            {authorAvatarUri ? (
              <Image
                source={{ uri: authorAvatarUri }}
                style={styles.postAuthorAvatarImage}
              />
            ) : (
              <View
                style={[
                  styles.postAuthorAvatar,
                  { backgroundColor: authorAvatarBackground },
                ]}
              >
                <AccessibleText
                  backgroundColor={authorAvatarBackground}
                  style={[
                    styles.postAuthorInitial,
                    { color: authorAvatarTextColor },
                  ]}
                >
                  {authorInitial}
                </AccessibleText>
              </View>
            )}
          </View>
          <View style={styles.postHeaderText}>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate("user_profile", { username: post.title })
              }
              accessibilityRole="link"
              accessibilityLabel={t("visitUserProfile", {
                username: post.title,
                defaultValue: `Visit ${post.title}'s profile`,
              })}
            >
              <AccessibleText
                type="title"
                isLargeText
                backgroundColor={cardBackgroundColor}
                style={[styles.postTitle, { color: textColor }]}
              >
                {post.title}
              </AccessibleText>
            </TouchableOpacity>
            {formattedPublishedAt ? (
              <AccessibleText
                backgroundColor={cardBackgroundColor}
                style={[styles.postTimestamp, { color: iconColor }]}
                accessibilityLabel={t("postedAt", {
                  date: formattedPublishedAt,
                  defaultValue: `Posted at ${formattedPublishedAt}`,
                })}
              >
                {formattedPublishedAt}
              </AccessibleText>
            ) : null}
          </View>
        </View>
        {imageUri && (
          <>
            <View style={styles.imageWrapper}>
              <Image
                source={{ uri: imageUri }}
                style={styles.postImage}
                accessibilityLabel={t("postImage", { defaultValue: "Post image" })}
                onError={(e) =>
                  console.warn(
                    "Explore: Image failed to load:",
                    e.nativeEvent.error,
                    imageUri
                  )
                }
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
                accessibilityLabel={t("viewImageFullscreen", {
                  defaultValue: "View image fullscreen",
                })}
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
                    accessibilityLabel={t("closeFullscreenImage", {
                      defaultValue: "Close fullscreen image",
                    })}
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
                        ? {
                            aspectRatio:
                              imageDimensions.width / imageDimensions.height,
                          }
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
          <AccessibleText
            backgroundColor={cardBackgroundColor}
            style={[styles.postContent]}
          >
            {post.content}
          </AccessibleText>
        ) : null}
        <View style={styles.postFooter}>
          <TouchableOpacity onPress={handleLike} style={styles.footerAction}>
            <Ionicons
              name={post.likedByUser ? "heart" : "heart-outline"}
              size={20}
              color={post.likedByUser ? "red" : iconColor}
            />
            <AccessibleText
              backgroundColor={cardBackgroundColor}
              style={[
                styles.footerText,
                { color: post.likedByUser ? "red" : iconColor, marginLeft: 4 },
              ]}
            >
              {post.likes}
            </AccessibleText>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              onToggleComments();
            }}
            style={styles.footerAction}
          >
            <Ionicons name="chatbubble-outline" size={20} color={iconColor} />
            <AccessibleText
              backgroundColor={cardBackgroundColor}
              style={[styles.footerText, { color: iconColor, marginLeft: 4 }]}
            >
              {post.comments}
            </AccessibleText>
          </TouchableOpacity>

          <TouchableOpacity
            testID="save-toggle"
            onPress={handleSave}
            style={[styles.footerAction, { marginLeft: "auto" }]}
          >
            <Ionicons
              testID={`icon-${
                post.savedByUser ? "bookmark" : "bookmark-outline"
              }`}
              name={post.savedByUser ? "bookmark" : "bookmark-outline"}
              size={20}
              color={post.savedByUser ? "#FFC107" : iconColor}
            />
            <AccessibleText
              backgroundColor={cardBackgroundColor}
              style={[
                styles.footerText,
                {
                  color: post.savedByUser ? "#FFC107" : iconColor,
                  marginLeft: 4,
                },
              ]}
            >
              {post.savedByUser ? t("saved") : t("save")}
            </AccessibleText>
          </TouchableOpacity>
        </View>

        {/* Comments */}
        {isExpanded && (
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1 }}
            keyboardVerticalOffset={100}
          >
            <View style={styles.commentsSection}>
              {isLoadingComments ? (
                <ActivityIndicator
                  style={{ marginVertical: 15 }}
                  color={iconColor}
                />
              ) : commentsList.length === 0 && !editingCommentDetailsForPost ? (
                <AccessibleText
                  backgroundColor={cardBackgroundColor}
                  style={[styles.noCommentsText]}
                >
                  {t("noCommentsYetBeFirst")}
                </AccessibleText>
              ) : (
                <ScrollView
                  style={styles.commentsListContainer}
                  nestedScrollEnabled
                  showsVerticalScrollIndicator={false}
                >
                  {commentsList.map((comment) => {
                    const isEditingThisComment =
                      editingCommentDetailsForPost?.commentId ===
                      comment.commentId;
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
                          isEditingThisComment
                            ? editingCommentDetailsForPost?.currentText || ""
                            : ""
                        }
                        onEditContentChange={onEditCommentContentChange}
                        onSaveEditedComment={() =>
                          onSaveEditedCommentForPost(post.id, comment.commentId)
                        }
                        onCancelEdit={onCancelCommentEdit}
                        isSavingEdit={
                          isEditingThisComment && isSubmittingCommentEditForPost
                        }
                        backgroundColor={cardBackgroundColor}
                        onReportComment={reportCommentHandler}
                        reportActionColor={reportLabelColor}
                        // If CommentItemDisplay has internal strings, remember to i18n that component too.
                      />
                    );
                  })}
                </ScrollView>
              )}

              {/* Add Comment (disabled for guest or while editing) */}
              {canPostComment && (
                <View
                  style={[
                    styles.addCommentContainer,
                    { borderTopColor: commentItemBorderColor },
                  ]}
                >
                  <TextInput
                    style={[
                      styles.commentInput,
                      {
                        borderColor: commentInputBorderColor,
                        color: commentInputTextColor,
                        backgroundColor: commentInputBackgroundColor,
                      },
                    ]}
                    placeholder={t("addACommentPlaceholder")}
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
                        color={colorScheme === "dark" ? "#FFFFFF" : "#007AFF"}
                      />
                    ) : (
                      <AccessibleText
                        backgroundColor={"#007AFF"}
                        style={styles.postCommentButtonText}
                      >
                        {t("post")}
                      </AccessibleText>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </KeyboardAvoidingView>
        )}
      </View>
      <ReportModal
        visible={reportModalVisible}
        onClose={closeReportModal}
        context={reportContext}
        surfaceColor={cardBackgroundColor}
        textColor={textColor}
        accentColor={reportAccentColor}
      />
    </>
  );
}

export default PostItem;

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 24 },
  header: {
    paddingHorizontal: 16,
    marginTop: Platform.OS === "ios" ? 48 : 24,
    marginBottom: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 30,
    marginHorizontal: 16,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 12 : 8,
    marginBottom: 18,
    shadowColor: "#000",
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
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageWrapper: {
    position: "relative",
    marginBottom: 10,
  },
  postImage: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: 6,
    marginBottom: 0,
    backgroundColor: "#eee",
    resizeMode: "cover",
  },
  fullscreenButton: {
    position: "absolute",
    right: 12,
    bottom: 12,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: 16,
    padding: 8,
    zIndex: 1,
  },
  postHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  postAuthorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  postAuthorAvatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  postAuthorInitial: { fontSize: 20, fontWeight: "700" },
  postHeaderText: { flex: 1 },
  postTitle: { fontSize: 16, fontWeight: "bold" },
  postContent: { fontSize: 14, lineHeight: 20, marginBottom: 12 },
  postTimestamp: { fontSize: 12, opacity: 0.7, marginTop: 2 },
  reportButton: { padding: 4, marginLeft: 12 },
  reportButtonPlaceholder: { width: 24, height: 24 },
  postFooter: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  footerAction: { flexDirection: "row", alignItems: "center", minHeight: 20 },
  footerText: { fontSize: 14, marginRight: 8 },
  loginButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#2196F3",
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  loginButtonText: { color: "#fff", fontSize: 14, fontWeight: "500" },
  errorBox: {
    marginTop: 40,
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  errorText: { fontSize: 16, fontWeight: "bold", textAlign: "center" },
  noMoreBox: {
    marginTop: 40,
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  noMoreText: { fontSize: 16, fontWeight: "500", textAlign: "center" },
  loadMoreButton: {
    marginVertical: 20,
    marginHorizontal: 40,
    backgroundColor: "#2196F3",
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  loadMoreText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  commentsSection: { marginTop: 10, paddingTop: 10, flex: 1 },
  commentsListContainer: { marginBottom: 10 },
  commentItemContainer: { paddingVertical: 8, borderBottomWidth: 1 },
  commentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  commentUsername: {
    fontWeight: "bold",
    fontSize: 13,
    flexShrink: 1,
    marginRight: 8,
  },
  commentOwnerActions: { flexDirection: "row" },
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
  editActionsContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 4,
  },
  editActionButton: {
    marginLeft: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
    minWidth: 70,
    alignItems: "center",
  },
  editActionButtonText: { color: "#FFFFFF", fontWeight: "600", fontSize: 13 },
  commentContent: { fontSize: 14, lineHeight: 18 },
  commentTimestamp: {
    fontSize: 10,
    opacity: 0.7,
    marginTop: 4,
    textAlign: "right",
  },
  noCommentsText: {
    textAlign: "center",
    marginVertical: 15,
    fontSize: 14,
    opacity: 0.7,
  },
  addCommentContainer: {
    flexDirection: "row",
    alignItems: "center",
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
    backgroundColor: "#007AFF",
  },
  postCommentButtonDisabled: { backgroundColor: "#B0C4DE" },
  postCommentButtonText: { color: "#FFFFFF", fontWeight: "600", fontSize: 14 },
  fullscreenModalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.95)",
  },
  fullscreenHeader: {
    paddingTop: Platform.OS === "ios" ? 50 : 30,
    paddingHorizontal: 16,
    paddingBottom: 12,
    alignItems: "flex-start",
  },
  fullscreenExitButton: {
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: 22,
    padding: 10,
    alignSelf: "flex-start",
  },
  fullscreenImageScroll: {
    flex: 1,
  },
  fullscreenImageContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  fullscreenImage: {
    width: "100%",
    height: undefined,
    aspectRatio: 16 / 9,
  },
  reportButtonAbsolute: {
    position: "absolute",
    top: 8,
    right: 8,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 6,
    zIndex: 10,
  },
  reportText: {
    marginLeft: 4,
    fontSize: 13,
    color: "#2C2C2E",
    fontWeight: "500",
  },
});
