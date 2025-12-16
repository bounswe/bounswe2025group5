// app/saved_posts.tsx
import React, {
  useContext,
  useState,
  useCallback,
  useLayoutEffect,
} from "react";
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  ActivityIndicator,
  RefreshControl,
  useColorScheme,
  Image,
  Alert,
} from "react-native";
import CachedImage from "@/components/CachedImage";
import { Ionicons } from "@expo/vector-icons";
import AccessibleText from "@/components/AccessibleText";
import { useNavigation, useFocusEffect } from "@react-navigation/native";

import { useTranslation } from "react-i18next";
import { AuthContext } from "./_layout"; // Adjust path if necessary
import { apiUrl } from "./apiConfig";
import { apiRequest } from "./services/apiClient";

// Types
type PostData = {
  postId: number;
  creatorUsername: string;
  content: string;
  likeCount: number;
  commentCount: number;
  photoUrl: string | null;
};

type ErrorState = { key: string | null; message: string | null };

// Single Card
function SavedPostCard({
  post,
  cardBackgroundColor,
  iconColor,
  actionIconColor,
  isSavedLocally,
  onUnsave,
  onSave,
}: {
  post: PostData;
  cardBackgroundColor: string;
  iconColor: string;
  actionIconColor: string;
  isSavedLocally: boolean;
  onUnsave: (postId: number) => void;
  onSave: (postId: number) => void;
}) {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();

  const handleViewPost = () => {
    // navigation.navigate('post_detail', { postId: post.postId });
    console.log("Navigate to post detail for:", post.postId);
  };

  const handleBookmarkPress = () => {
    if (isSavedLocally) onUnsave(post.postId);
    else onSave(post.postId);
  };

  return (
    <TouchableOpacity
      onPress={handleViewPost}
      style={[styles.postContainer, { backgroundColor: cardBackgroundColor }]}
    >
      {post.photoUrl && (
        <CachedImage
          source={{
            uri: post.photoUrl.startsWith("http")
              ? post.photoUrl
              : `${apiUrl}${post.photoUrl}`,
          }}
          style={styles.postImage}
          onError={(e) =>
            console.warn(
              "Saved Post Card: Image load error",
              e.nativeEvent.error
            )
          }
        />
      )}
      <AccessibleText
        backgroundColor={cardBackgroundColor}
        style={styles.postContent}
        numberOfLines={post.photoUrl ? 3 : 6}
      >
        {post.content}
      </AccessibleText>

      <AccessibleText
        backgroundColor={cardBackgroundColor}
        style={styles.creatorText}
      >
        {t("byLabel")} {post.creatorUsername}
      </AccessibleText>

      <View style={styles.postFooter}>
        <View style={styles.postStats}>
          <Ionicons name="heart-outline" size={16} color={iconColor} />
          <AccessibleText
            backgroundColor={cardBackgroundColor}
            style={[styles.footerText, { color: iconColor }]}
          >
            {post.likeCount}
          </AccessibleText>
          <Ionicons name="chatbubble-outline" size={16} color={iconColor} />
          <AccessibleText
            backgroundColor={cardBackgroundColor}
            style={[styles.footerText, { color: iconColor }]}
          >
            {post.commentCount}
          </AccessibleText>
        </View>
        <View style={styles.postActions}>
          <TouchableOpacity
            onPress={handleBookmarkPress}
            style={styles.actionIcon}
          >
            <Ionicons
              name={isSavedLocally ? "bookmark" : "bookmark-outline"}
              size={20}
              color={actionIconColor}
            />
            <AccessibleText
              backgroundColor={cardBackgroundColor}
              style={{
                color: actionIconColor,
                marginLeft: 5,
                fontWeight: "500",
              }}
            >
              {isSavedLocally ? t("saved") : t("save")}
            </AccessibleText>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// Main Screen
export default function SavedPostsScreen() {
  const navigation = useNavigation<any>();
  const { username } = useContext(AuthContext);
  const colorScheme = useColorScheme();
  const { t, i18n } = useTranslation();

  // State
  const [savedPosts, setSavedPosts] = useState<PostData[]>([]);
  const [locallyUnsavedIds, setLocallyUnsavedIds] = useState<Set<number>>(
    new Set()
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<ErrorState>({ key: null, message: null });

  // Theming
  const isDarkMode = colorScheme === "dark";
  const screenBackgroundColor = isDarkMode ? "#151718" : "#F0F2F5";
  const cardBackgroundColor = isDarkMode ? "#1C1C1E" : "#FFFFFF";
  const iconColor = isDarkMode ? "#8E8E93" : "#6C6C70";
  const actionIconColor = "#FFC107";
  const activityIndicatorColor = isDarkMode ? "#FFFFFF" : "#000000";
  const refreshControlColors = isDarkMode
    ? { tintColor: "#FFFFFF", titleColor: "#FFFFFF" }
    : { tintColor: "#000000", titleColor: "#000000" };
  const errorTextColor = isDarkMode ? "#FF9494" : "#D32F2F";
  const primaryButtonColor = "#007AFF";

  // Header
  useLayoutEffect(() => {
    navigation.setOptions({ headerTitle: t("savedPostsTitle") });
  }, [navigation, i18n.language, t]);

  // Fetch
  const fetchSavedPosts = useCallback(async () => {
    if (!username) {
      setError({ key: "loginRequiredSaved", message: null });
      setLoading(false);
      setRefreshing(false);
      setSavedPosts([]);
      setLocallyUnsavedIds(new Set());
      return;
    }

    // Indicate loading only if not refreshing
    if (!refreshing) {
      setLoading(true);
    }
    setError({ key: null, message: null });

    try {
      // --- API Call to GET saved posts ---
      // Remember to encode username for URL safety
      const response = await apiRequest(
        `/api/users/${encodeURIComponent(username)}/saved-posts`
      );

      if (!response.ok) {
        if (response.status === 404) {
          // Handle no saved posts gracefully
          setSavedPosts([]);
        } else {
          throw new Error(
            `Failed to fetch saved posts. Status: ${response.status}`
          );
        }
      } else {
        const data: PostData[] = await response.json();
        setSavedPosts(data);
      }
      // --- Sync local state with fetch results ---
      setLocallyUnsavedIds(new Set()); // Reset local unsaved status on successful fetch/refresh
    } catch (err: any) {
      console.error("Error fetching saved posts:", err);
      setError({
        key: null,
        message: err.message || "An unknown error occurred.",
      });
      // Keep potentially stale 'savedPosts' data visible on error? Or clear? Current: Keep.
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [username, refreshing]); // Dependencies

  // Effect to fetch data on focus or when username changes
  useFocusEffect(
    useCallback(() => {
      // If auth is still resolving, show loader; if logged in, fetch; if logged out, show login required
      if (username === undefined) {
        setLoading(true);
        setError({ key: null, message: null });
      } else if (username) {
        fetchSavedPosts();
      } else {
        setError({ key: "loginRequiredSaved", message: null });
        setSavedPosts([]);
        setLocallyUnsavedIds(new Set());
        setLoading(false);
      }
    }, [username, fetchSavedPosts])
  );

  // On focus / username change
  useFocusEffect(
    useCallback(() => {
      if (username === undefined) {
        setLoading(true);
        setError({ key: null, message: null });
      } else if (username) {
        fetchSavedPosts();
      } else {
        setError({ key: "loginRequiredSaved", message: null });
        setSavedPosts([]);
        setLocallyUnsavedIds(new Set());
        setLoading(false);
      }
    }, [username, fetchSavedPosts])
  );

  // Pull-to-Refresh
  const handleRefresh = () => {
    if (username) {
      setRefreshing(true);
    } else {
      Alert.alert(t("loginRequired"), t("loginToViewSaved"));
    }
  };

  // Unsave
  const handleUnsavePost = async (postId: number) => {
    if (!username) {
      Alert.alert(t("loginRequired"));
      return;
    }

    setLocallyUnsavedIds((prev) => new Set(prev).add(postId));

    try {
      const response = await apiRequest(
        `/api/posts/${postId}/saves/${encodeURIComponent(username)}`,
        {
          method: "DELETE",
        }
      );
      const responseBodyText = await response.text();

      if (!response.ok) {
        throw new Error(`Server error: ${response.status} ${responseBodyText}`);
      }

      try {
        const result = JSON.parse(responseBodyText);
        if (!result || result.deleted !== true) {
          throw new Error("format-mismatch");
        }
      } catch (e: any) {
        throw new Error(`format-mismatch ${e?.message || ""}`.trim());
      }

      setSavedPosts((prev) => prev.filter((post) => post.postId !== postId));
      setLocallyUnsavedIds((prev) => {
        const copy = new Set(prev);
        copy.delete(postId);
        return copy;
      });
    } catch (err) {
      console.error("Error during unsave:", err);
      Alert.alert(t("error"), t("errorUnsavePost"));
      setLocallyUnsavedIds((prev) => {
        const copy = new Set(prev);
        copy.delete(postId);
        return copy;
      });
    }
  };

  // Save (re-save)
  const handleSavePost = async (postId: number) => {
    if (!username) {
      Alert.alert(t("loginRequired"));
      return;
    }

    setLocallyUnsavedIds((prev) => {
      const copy = new Set(prev);
      copy.delete(postId);
      return copy;
    });

    try {
      const response = await apiRequest(`/api/posts/${postId}/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      const responseBodyText = await response.text();

      if (!response.ok) {
        throw new Error(`Server error: ${response.status} ${responseBodyText}`);
      }

      try {
        const result = JSON.parse(responseBodyText);
        if (
          !result ||
          result.username !== username ||
          result.postId !== postId
        ) {
          throw new Error("format-mismatch");
        }
      } catch (e: any) {
        throw new Error(`format-mismatch ${e?.message || ""}`.trim());
      }
    } catch (err) {
      console.error("Error during save:", err);
      Alert.alert(t("error"), t("errorSavePost"));
      setLocallyUnsavedIds((prev) => {
        const copy = new Set(prev);
        copy.add(postId);
        return copy;
      });
    }
  };

  // Render states

  if (username === undefined) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: screenBackgroundColor },
        ]}
      >
        <ActivityIndicator size="large" color={activityIndicatorColor} />
      </View>
    );
  }

  if (!username) {
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
        <View style={styles.centeredMessageContainer}>
          <AccessibleText
            backgroundColor={screenBackgroundColor}
            style={[
              styles.messageText,
              { color: errorTextColor, marginBottom: 20 },
            ]}
          >
            {t("loginRequiredSaved")}
          </AccessibleText>
          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: primaryButtonColor },
            ]}
            onPress={() => navigation.navigate("index" as never)}
          >
            <AccessibleText
              backgroundColor={primaryButtonColor}
              style={styles.buttonText}
            >
              {t("goToLogin")}
            </AccessibleText>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  if (loading && savedPosts.length === 0) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: screenBackgroundColor },
        ]}
      >
        <ActivityIndicator size="large" color={activityIndicatorColor} />
      </View>
    );
  }

  if (error.key || error.message) {
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
        <View style={styles.centeredMessageContainer}>
          <AccessibleText
            backgroundColor={screenBackgroundColor}
            style={[
              styles.messageText,
              { color: errorTextColor, marginBottom: 20 },
            ]}
          >
            {error.key ? t(error.key) : error.message}
          </AccessibleText>
          <TouchableOpacity
            onPress={fetchSavedPosts}
            style={styles.retryButton}
          >
            <AccessibleText style={styles.retryButtonText}>
              {t("retry")}
            </AccessibleText>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  if (!loading && savedPosts.length === 0) {
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
        <View style={styles.centeredMessageContainer}>
          <AccessibleText
            backgroundColor={screenBackgroundColor}
            style={styles.messageText}
          >
            {t("noSavedPosts")}
          </AccessibleText>
          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: primaryButtonColor, marginTop: 20 },
            ]}
            onPress={() => navigation.navigate("(tabs)", { screen: "explore" })}
          >
            <AccessibleText
              backgroundColor={primaryButtonColor}
              style={styles.buttonText}
            >
              {t("explorePosts")}
            </AccessibleText>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: screenBackgroundColor }]}
      contentContainerStyle={styles.listContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={refreshControlColors.tintColor}
          titleColor={refreshControlColors.titleColor}
        />
      }
    >
      {savedPosts.map((post) => (
        <SavedPostCard
          key={post.postId}
          post={post}
          cardBackgroundColor={cardBackgroundColor}
          iconColor={iconColor}
          actionIconColor={actionIconColor}
          isSavedLocally={!locallyUnsavedIds.has(post.postId)}
          onUnsave={handleUnsavePost}
          onSave={handleSavePost}
        />
      ))}
    </ScrollView>
  );
}

// Styles
const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  listContent: { padding: 16, paddingBottom: 24 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  centeredMessageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  messageText: { fontSize: 16, textAlign: "center", marginBottom: 15 },
  postContainer: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(128, 128, 128, 0.2)",
  },
  postImage: {
    width: "100%",
    aspectRatio: 16 / 9,
    maxHeight: 250,
    borderRadius: 6,
    marginBottom: 12,
    resizeMode: "cover",
    backgroundColor: "#e0e0e0",
  },
  postContent: { fontSize: 15, marginBottom: 6, lineHeight: 22 },
  creatorText: { fontSize: 13, color: "#8E8E93", marginBottom: 10 },
  postFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(128, 128, 128, 0.3)",
    paddingTop: 10,
    marginTop: 10,
  },
  postStats: { flexDirection: "row", alignItems: "center" },
  footerText: { fontSize: 14, marginHorizontal: 8 },
  postActions: { flexDirection: "row", alignItems: "center" },
  actionIcon: {
    padding: 8,
    marginLeft: 8,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
  },
  actionButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 150,
  },
  buttonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
  retryButton: {
    marginTop: 15,
    borderColor: "#007AFF",
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 150,
  },
  retryButtonText: { color: "#007AFF", fontSize: 15, fontWeight: "500" },
});
