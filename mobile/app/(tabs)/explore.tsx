//app/(tabs)/explore.tsx
import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
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
  Modal,
  Switch,
  NativeSyntheticEvent,
  NativeScrollEvent,
  InteractionManager,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AccessibleText from "@/components/AccessibleText";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { AuthContext } from "../_layout";
import { apiRequest } from "../services/apiClient";
import { apiUrl } from "../apiConfig";
import PostItem from "../components/PostItem";
import { useTranslation } from "react-i18next";

type CommentData = {
  commentId: number;
  username: string;
  content: string;
  createdAt: string | Date;
  avatarUrl?: string | null;
};

type Post = {
  id: number;
  title: string;
  content: string;
  likes: number;
  comments: number;
  photoUrl: string | null;
  likedByUser: boolean;
  savedByUser: boolean;
  createdAt?: string | null;
  authorAvatarUrl?: string | null;
};

type NotificationItem = {
  id: number;
  message?: string | null;
  type?: string | null;
  actorId?: string | null;
  isRead: boolean;
  createdAt: string | Date | null;
  objectId?: string | null;
  objectType?: string | null;
  actorUsername?: string | null;
  actorAvatarUrl?: string | null;
};

type NotificationFetchError = Error & { status?: number };

const WASTE_TYPES = ["Plastic", "Paper", "Glass", "Metal", "Organic"] as const;

export default function ExploreScreen() {
  const navigation = useNavigation();

  const { t, i18n } = useTranslation();

  const authContext = useContext(AuthContext);
  const userType = authContext?.userType;
  const username = authContext?.username;

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastPostId, setLastPostId] = useState<number | null>(null);
  const [error, setError] = useState(false);
  const [noMorePosts, setNoMorePosts] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Post[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [inSearchMode, setInSearchMode] = useState(false);

  const [expandedPostId, setExpandedPostId] = useState<number | null>(null);
  const [commentsByPostId, setCommentsByPostId] = useState<{
    [postId: number]: CommentData[];
  }>({});
  const [loadingCommentsPostId, setLoadingCommentsPostId] = useState<
    number | null
  >(null);
  const [commentInputs, setCommentInputs] = useState<{
    [postId: number]: string;
  }>({}); // For NEW comments
  const [postingCommentPostId, setPostingCommentPostId] = useState<
    number | null
  >(null);

  const [editingCommentDetails, setEditingCommentDetails] = useState<{
    postId: number;
    commentId: number;
    currentText: string;
  } | null>(null);
  const [isSubmittingCommentEdit, setIsSubmittingCommentEdit] = useState(false);
  const [userAvatars, setUserAvatars] = useState<{
    [username: string]: string | null;
  }>({});
  const [isNotificationsVisible, setNotificationsVisible] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState<string | null>(
    null
  );
  const [selectedNotificationPostId, setSelectedNotificationPostId] = useState<
    number | null
  >(null);
  const [selectedNotificationActor, setSelectedNotificationActor] = useState<
    string | null
  >(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationThumbnails, setNotificationThumbnails] = useState<
    Record<number, string | null>
  >({});
  const [notificationCommentPreviews, setNotificationCommentPreviews] =
    useState<Record<number, string | null>>({});
  const [notificationPostBodies, setNotificationPostBodies] = useState<
    Record<number, string | null>
  >({});
  const [isPostPreviewVisible, setPostPreviewVisible] = useState(false);
  const [previewPost, setPreviewPost] = useState<Post | null>(null);
  const [previewComments, setPreviewComments] = useState<CommentData[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const hasLoadedPostsRef = useRef(false);
  const scrollViewRef = useRef<ScrollView | null>(null);
  const lastScrollOffsetRef = useRef(0);
  const notificationThumbnailFetchesRef = useRef<Set<number>>(new Set());
  const notificationCommentPreviewFetchesRef = useRef<Set<number>>(new Set());
  const notificationMarkingRef = useRef<Set<number>>(new Set());
  const [selectedWasteFilter, setSelectedWasteFilter] = useState<string | null>(
    null
  );

  const colorScheme = useColorScheme();
  const screenBackgroundColor = colorScheme === "dark" ? "#151718" : "#F0F2F5";
  const cardBackgroundColor = colorScheme === "dark" ? "#1C1C1E" : "#FFFFFF";
  const generalTextColor = colorScheme === "dark" ? "#E5E5E7" : "#1C1C1E";
  const searchBarBackgroundColor =
    colorScheme === "dark" ? "#1C1C1E" : "#FFFFFF";
  const searchInputColor = colorScheme === "dark" ? "#E5E5E7" : "#000000";
  const searchPlaceholderColor = colorScheme === "dark" ? "#8E8E93" : "#8E8E93";
  const iconColor = colorScheme === "dark" ? "#8E8E93" : "#6C6C70";
  const commentInputBorderColor =
    colorScheme === "dark" ? "#545458" : "#C7C7CD";
  const commentInputTextColor = generalTextColor;
  const commentInputPlaceholderColor = iconColor;
  const commentInputBackgroundColor =
    colorScheme === "dark" ? "#2C2C2E" : "#F0F2F5";
  const themedErrorBoxBackgroundColor =
    colorScheme === "dark" ? "#5D1F1A" : "#ffcccc";
  const themedErrorBoxTextColor =
    colorScheme === "dark" ? "#FFA094" : "#cc0000";
  const themedNoMoreBoxBackgroundColor =
    colorScheme === "dark" ? "#1A3A4A" : "#e0f7fa";
  const themedNoMoreBoxTextColor =
    colorScheme === "dark" ? "#9EE8FF" : "#00796b";
  const activityIndicatorColor = colorScheme === "dark" ? "#FFFFFF" : "#000000";
  const notificationButtonBackground =
    colorScheme === "dark" ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)";
  const notificationIconColor = colorScheme === "dark" ? "#FFFFFF" : "#1C1C1E";
  const notificationCardBackground =
    colorScheme === "dark" ? "#1F1F21" : "#FFFFFF";
  const notificationUnreadAccent =
    colorScheme === "dark" ? "#4ADE80" : "#2E7D32";
  const notificationReadBorderColor =
    colorScheme === "dark" ? "#3A3A3C" : "#C7C7CC";
  const notificationReadDotColor =
    colorScheme === "dark" ? "#5A5A5F" : "#B8B8BF";
  const notificationAvatarBackground =
    colorScheme === "dark" ? "#2F2F31" : "#D9D9D9";
  const notificationAvatarTextColor =
    colorScheme === "dark" ? "#F5F5F7" : "#111111";
  const feedAccentColor = "#1976D2";
  const feedAccentShadow = "rgba(13, 71, 161, 0.2)";
  const resolvedPreviewImageUri = previewPost?.photoUrl
    ? previewPost.photoUrl.startsWith("http")
      ? previewPost.photoUrl
      : apiUrl(previewPost.photoUrl)
    : null;

  useEffect(() => {
    if (!userType && username !== undefined) {
      (navigation as any).navigate("index");
    }
  }, [userType, username, navigation]);

  const mapApiItemToPost = (item: any): Post => ({
    id: item.postId,
    title: item.creatorUsername,
    content: item.content,
    likes: item.likes || 0,
    comments: Array.isArray(item.comments)
      ? item.comments.length
      : Number(item.comments) || 0,
    photoUrl: item.photoUrl,
    likedByUser:
      typeof item.liked === "boolean"
        ? item.liked
        : item.likedByUser ||
          (Array.isArray(item.likedByUsers) &&
            item.likedByUsers.some((u: any) => u.username === username)) ||
          false,
    savedByUser: typeof item.saved === "boolean" ? item.saved : false,
    createdAt: item.createdAt ?? null,
    authorAvatarUrl:
      item.profile_photo ?? item.profilePhoto ?? item.creatorPhotoUrl ?? null,
  });

  const fetchLikeStatusesForPosts = async (
    currentPostsToUpdate: Post[],
    currentUsername: string
  ): Promise<Post[]> => {
    if (!currentUsername || currentPostsToUpdate.length === 0)
      return currentPostsToUpdate;
    const promises = currentPostsToUpdate.map(async (post) => {
      try {
        const res = await apiRequest(`/api/posts/${post.id}/likes`);
        if (!res.ok) return post;
        const likesData = await res.json();
        const likedByCurrent =
          likesData.likedByUsers?.some(
            (liker: any) => liker.username === currentUsername
          ) || false;
        return { ...post, likedByUser: likedByCurrent };
      } catch (e) {
        return post;
      }
    });
    return Promise.all(promises);
  };

  const fetchSavedStatusesForPosts = async (
    currentPostsToUpdate: Post[],
    currentUsername: string
  ): Promise<Post[]> => {
    if (!currentUsername || currentPostsToUpdate.length === 0)
      return currentPostsToUpdate;
    try {
      const res = await apiRequest(
        `/api/users/${encodeURIComponent(currentUsername)}/saved-posts`
      );
      if (!res.ok) return currentPostsToUpdate;
      const savedPostsData = await res.json();
      const savedPostIds = new Set(
        savedPostsData.map((post: any) => post.postId)
      );
      return currentPostsToUpdate.map((post) => ({
        ...post,
        savedByUser: savedPostIds.has(post.id),
      }));
    } catch (e) {
      console.error("Error fetching saved statuses:", e);
      return currentPostsToUpdate;
    }
  };

  const fetchAvatarForUsername = async (username: string) => {
    if (!username) return null;
    try {
      const encoded = encodeURIComponent(username);
      const response = await apiRequest(
        `/api/users/${encoded}/profile?username=${encoded}`
      );
      if (!response.ok) return null;
      const data = await response.json();
      return data?.photoUrl ?? null;
    } catch {
      return null;
    }
  };

  const ensureAvatarsForUsernames = async (usernames: string[]) => {
    const uniqueUsernames = Array.from(new Set(usernames.filter(Boolean)));
    const missing = uniqueUsernames.filter(
      (name) => userAvatars[name] === undefined
    );
    if (!missing.length) return {};
    const fetchedEntries = await Promise.all(
      missing.map(async (name) => {
        const url = await fetchAvatarForUsername(name);
        return [name, url] as const;
      })
    );
    const newMap = Object.fromEntries(fetchedEntries);
    if (Object.keys(newMap).length > 0) {
      setUserAvatars((prev) => ({ ...prev, ...newMap }));
    }
    return newMap;
  };

  const attachAvatarsToPosts = async (
    postsToDecorate: Post[]
  ): Promise<Post[]> => {
    if (!postsToDecorate.length) return postsToDecorate;
    const usernames = postsToDecorate.map((post) => post.title).filter(Boolean);
    const fetched = await ensureAvatarsForUsernames(usernames);
    const merged = { ...userAvatars, ...fetched };
    return postsToDecorate.map((post) => ({
      ...post,
      authorAvatarUrl: post.title
        ? merged[post.title] ?? post.authorAvatarUrl ?? null
        : post.authorAvatarUrl ?? null,
    }));
  };

  const attachAvatarsToNotifications = async (
    items: NotificationItem[]
  ): Promise<NotificationItem[]> => {
    const usernames = items
      .map((item) => item.actorUsername)
      .filter((name): name is string =>
        Boolean(name && name.trim().length > 0)
      );
    if (!usernames.length) return items;
    const avatarUpdates = await ensureAvatarsForUsernames(usernames);
    const lookup = { ...userAvatars, ...avatarUpdates };
    return items.map((item) => ({
      ...item,
      actorAvatarUrl: item.actorUsername
        ? resolveAvatarUri(lookup[item.actorUsername])
        : null,
    }));
  };

  const hydratePostsForPreview = async (
    postsToProcess: Post[]
  ): Promise<Post[]> => {
    if (!postsToProcess.length) return postsToProcess;
    // Profile photos are now included in the post response, no need to fetch separately
    // let hydrated = await attachAvatarsToPosts(postsToProcess);
    let hydrated = postsToProcess;
    if (username && userType === "user") {
      // hydrated = await fetchLikeStatusesForPosts(hydrated, username);
      // hydrated = await fetchSavedStatusesForPosts(hydrated, username);
    }
    return hydrated;
  };

  const formatNotificationTimestamp = useCallback(
    (value: string | Date | null | undefined) => {
      if (!value) return "";
      const dateInstance = value instanceof Date ? value : new Date(value);
      if (Number.isNaN(dateInstance.getTime())) return "";
      const diffSeconds = Math.max(
        0,
        Math.round((Date.now() - dateInstance.getTime()) / 1000)
      );
      if (diffSeconds < 5) {
        return t("timeJustNow", { defaultValue: "just now" });
      }
      if (diffSeconds < 60) {
        return t("timeSecondsAgo", {
          count: diffSeconds,
          defaultValue: `${diffSeconds} seconds ago`,
        });
      }
      const minutes = Math.max(1, Math.round(diffSeconds / 60));
      if (minutes < 60) {
        return t("timeMinutesAgo", {
          count: minutes,
          defaultValue: `${minutes} minutes ago`,
        });
      }
      const hours = Math.max(1, Math.round(minutes / 60));
      if (hours < 24) {
        return t("timeHoursAgo", {
          count: hours,
          defaultValue: `${hours} hours ago`,
        });
      }
      const days = Math.max(1, Math.round(hours / 24));
      if (days < 7) {
        return t("timeDaysAgo", {
          count: days,
          defaultValue: `${days} days ago`,
        });
      }
      const weeks = Math.max(1, Math.round(days / 7));
      return t("timeWeeksAgo", {
        count: weeks,
        defaultValue: `${weeks} weeks ago`,
      });
    },
    [t]
  );

  const resolveAvatarUri = (uri?: string | null) => {
    if (!uri) return null;
    return uri.startsWith("http") ? uri : apiUrl(uri);
  };

  const resolvePostImageUri = (uri?: string | null) => {
    if (!uri) return null;
    return uri.startsWith("http") ? uri : apiUrl(uri);
  };

  const deriveActorUsername = (
    actorId?: string | null,
    message?: string | null
  ) => {
    if (actorId && `${actorId}`.trim().length) return `${actorId}`.trim();
    if (!message) return null;
    const trimmed = message.trim();
    if (!trimmed.length) return null;

    const likeMatch = trimmed.match(/^(.+?)\s+liked your post/i);
    if (likeMatch) return likeMatch[1].trim();

    const commentMatch = trimmed.match(/^User\s+(.+?)\s+left a comment/i);
    if (commentMatch) return commentMatch[1].trim();

    const createMatch = trimmed.match(/^User\s+(.+?)\s+has created a post/i);
    if (createMatch) return createMatch[1].trim();

    const followMatch = trimmed.match(/^User\s+(.+?)\s+started following/i);
    if (followMatch) return followMatch[1].trim();

    return null;
  };

  const buildNotificationMessage = (
    type?: string | null,
    objectType?: string | null,
    actorId?: string | null,
    rawMessage?: string | null,
    objectId?: string | null,
    currentUsername?: string | null,
    rawPayload?: any
  ) => {
    if (rawMessage && `${rawMessage}`.trim().length) {
      return `${rawMessage}`.trim();
    }

    const normalizedActorId =
      actorId && `${actorId}`.trim().length ? `${actorId}`.trim() : null;
    const actor =
      normalizedActorId ??
      t("notificationUnknownActor", { defaultValue: "Someone" });
    const normalizedType = type?.toLowerCase();
    const normalizedObject = objectType?.toLowerCase();
    const defaultTarget = t("notificationTargetYou", { defaultValue: "you" });
    const normalizedCurrentUsername =
      currentUsername && `${currentUsername}`.trim().length
        ? `${currentUsername}`.trim()
        : null;
    const trimmedObjectId =
      objectId && `${objectId}`.trim().length ? `${objectId}`.trim() : null;
    const target = trimmedObjectId ?? defaultTarget;
    const normalizedActorLower = normalizedActorId?.toLowerCase();
    const normalizedCurrentUsernameLower =
      normalizedCurrentUsername?.toLowerCase();
    const trimmedObjectIdLower = trimmedObjectId?.toLowerCase();
    const targetMatchesActor = Boolean(
      normalizedActorLower &&
        trimmedObjectIdLower &&
        normalizedActorLower === trimmedObjectIdLower
    );
    const targetMatchesCurrentUser = Boolean(
      normalizedCurrentUsernameLower &&
        trimmedObjectIdLower &&
        normalizedCurrentUsernameLower === trimmedObjectIdLower
    );
    const followTargetsCurrentUser =
      targetMatchesActor ||
      Boolean(
        (normalizedCurrentUsernameLower && !trimmedObjectIdLower) ||
          targetMatchesCurrentUser
      );

    if (normalizedType === "like") {
      if (normalizedObject === "post") {
        return t("notificationLikePost", {
          actor,
          defaultValue: `${actor} liked your post`,
        });
      }
      return t("notificationLikeContent", {
        actor,
        defaultValue: `${actor} liked your content`,
      });
    }

    if (
      normalizedType === "comment" ||
      (normalizedType === "create" && normalizedObject === "comment")
    ) {
      return t("notificationComment", {
        actor,
        defaultValue: `${actor} commented on your post`,
      });
    }

    if (normalizedType === "create" && normalizedObject === "post") {
      return t("notificationCreatePost", {
        actor,
        defaultValue: `${actor} created a new post`,
      });
    }

    if (normalizedType === "follow") {
      if (followTargetsCurrentUser) {
        return t("notificationFollowYou", {
          actor,
          defaultValue: `${actor} started following you`,
        });
      }
      return t("notificationFollowUser", {
        actor,
        target,
        defaultValue: `${actor} started following ${target}`,
      });
    }

    if (normalizedType === "create" && normalizedObject === "challenge") {
      return t("notificationCreateChallenge", {
        actor,
        defaultValue: `${actor} created a challenge`,
      });
    }

    if (normalizedType === "end" && normalizedObject === "challenge") {
      return t("notificationChallengeEnded", {
        defaultValue: "Challenge has ended",
      });
    }

    try {
      return JSON.stringify(
        rawPayload ?? { type, objectType, actorId, objectId }
      );
    } catch {
      return "Notification payload unavailable";
    }
  };

  const coerceNotificationBoolean = (value: any): boolean => {
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value !== 0;
    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();
      if (normalized === "true" || normalized === "1") return true;
      if (normalized === "false" || normalized === "0") return false;
    }
    return false;
  };

  const normalizeNotificationsPayload = (payload: any): NotificationItem[] =>
    Array.isArray(payload)
      ? payload.map((item: any) => {
          const rawType =
            item?.type ?? item?.notification_type ?? item?.notificationType;
          const rawObjectType = item?.objectType ?? item?.object_type;
          const rawObjectId = item?.objectId ?? item?.object_id;
          const rawActorId =
            item?.actorId ??
            item?.actor_id ??
            item?.actorUsername ??
            item?.actor;
          const typeValue = rawType != null ? String(rawType) : null;
          const objectTypeValue =
            rawObjectType != null ? String(rawObjectType) : null;
          const actorIdValue = rawActorId != null ? String(rawActorId) : null;
          const actorUsername = deriveActorUsername(
            actorIdValue,
            item?.message
          );
          const friendlyMessage = buildNotificationMessage(
            typeValue,
            objectTypeValue,
            actorIdValue,
            item?.message ?? null,
            rawObjectId != null ? String(rawObjectId) : null,
            username ?? null,
            item
          );
          return {
            id:
              typeof item?.id === "number"
                ? item.id
                : Number(item?.id ?? item?.notificationId) ||
                  Date.now() + Math.random(),
            message: friendlyMessage,
            type: typeValue,
            actorId: actorIdValue,
            isRead: coerceNotificationBoolean(item?.isRead ?? item?.is_read),
            createdAt: item?.createdAt ?? null,
            objectId: rawObjectId != null ? String(rawObjectId) : null,
            objectType: objectTypeValue,
            actorUsername,
            actorAvatarUrl: null,
          };
        })
      : [];

  const fetchNotificationsFromEndpoint = async (
    path: string
  ): Promise<NotificationItem[]> => {
    const response = await apiRequest(path);
    if (!response.ok) {
      const responseText = await response.text();
      const error: NotificationFetchError = new Error(
        responseText || `Failed to fetch notifications (${response.status})`
      );
      error.status = response.status;
      throw error;
    }
    const data = await response.json();
    return normalizeNotificationsPayload(data);
  };

  const fetchNotifications = useCallback(async () => {
    if (userType !== "user") {
      setNotifications([]);
      setNotificationsLoading(false);
      setNotificationsError(null);
      return;
    }
    setNotificationsLoading(true);
    setNotificationsError(null);
    try {
      const encodedUsername = username ? encodeURIComponent(username) : null;
      const endpoints: string[] = [];
      if (encodedUsername) {
        endpoints.push(`/api/notifications/${encodedUsername}`);
      }
      let fetched: NotificationItem[] | null = null;
      let lastError: NotificationFetchError | null = null;
      for (const path of endpoints) {
        try {
          fetched = await fetchNotificationsFromEndpoint(path);
          break;
        } catch (error: any) {
          lastError = error as NotificationFetchError;
          const status = lastError?.status;
          const shouldFallback =
            status === 404 ||
            status === 405 ||
            status === 400 ||
            status === 403;
          if (!shouldFallback) {
            break;
          }
        }
      }
      if (fetched) {
        const withAvatars = await attachAvatarsToNotifications(fetched);
        setNotifications(withAvatars);
        return;
      }
      throw lastError ?? new Error("Failed to fetch notifications.");
    } catch (err: any) {
      console.error("Failed to fetch notifications:", err);
      setNotifications([]);
      const status = (err as NotificationFetchError)?.status;
      if (status === 401 || status === 403) {
        setNotificationsError(
          t("notificationsAuthError", {
            defaultValue: "Please sign in again to view notifications.",
          })
        );
      } else {
        setNotificationsError(
          err?.message ||
            t("notificationsLoadError", {
              defaultValue: "Unable to load notifications.",
            })
        );
      }
    } finally {
      setNotificationsLoading(false);
    }
  }, [username, userType, t]);

  const handleNotificationsRefresh = useCallback(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const getNotificationInitial = (notif: NotificationItem) => {
    const source = notif.actorUsername ?? notif.actorId ?? notif.message ?? "";
    const trimmed = source.trim();
    if (!trimmed.length) return "?";
    return trimmed.charAt(0).toUpperCase();
  };

  const deriveNotificationPostId = (notif: NotificationItem): number | null => {
    const rawId = notif.objectId && `${notif.objectId}`.trim();
    if (rawId && !Number.isNaN(Number(rawId))) {
      return Number(rawId);
    }
    const message = notif.message?.trim();
    if (!message) return null;
    const idMatch = message.match(/post(?:\s+with\s+id)?\s+(\d+)/i);
    if (idMatch) {
      const parsed = Number(idMatch[1]);
      if (!Number.isNaN(parsed)) {
        return parsed;
      }
    }
    return null;
  };

  const shouldDisplayNotificationAvatar = (notif: NotificationItem) => {
    const normalizedType = notif.type?.toLowerCase();
    const normalizedObject = notif.objectType?.toLowerCase();
    return !(normalizedType === "end" && normalizedObject === "challenge");
  };

  const closePostPreview = () => {
    setPostPreviewVisible(false);
    setSelectedNotificationPostId(null);
    setSelectedNotificationActor(null);
    setPreviewPost(null);
    setPreviewComments([]);
    setPreviewError(null);
    setPreviewLoading(false);
  };

  const fetchPreviewComments = async (
    postId: number
  ): Promise<CommentData[]> => {
    const response = await apiRequest(`/api/posts/${postId}/comments`);
    if (!response.ok) {
      throw new Error(`Failed to fetch comments: ${response.status}`);
    }
    const apiResponse = await response.json();
    const apiComments =
      apiResponse?.comments ?? (Array.isArray(apiResponse) ? apiResponse : []);
    const usernamesNeedingAvatars = apiComments
      .map((apiComment: any) => apiComment?.creatorUsername)
      .filter(Boolean);
    const newlyFetchedAvatars = await ensureAvatarsForUsernames(
      usernamesNeedingAvatars
    );
    const avatarLookup = { ...userAvatars, ...newlyFetchedAvatars };
    return apiComments.map((apiComment: any) => ({
      commentId: apiComment?.commentId,
      content: apiComment?.content,
      createdAt: apiComment?.createdAt,
      username: apiComment?.creatorUsername,
      avatarUrl: apiComment?.creatorUsername
        ? avatarLookup[apiComment.creatorUsername] ?? null
        : null,
    }));
  };

  const fetchPostFromUserPosts = async (
    postId: number,
    ownerUsername?: string | null
  ): Promise<Post | null> => {
    const normalizedUsername =
      ownerUsername && ownerUsername.trim().length
        ? ownerUsername.trim()
        : null;
    if (!normalizedUsername) return null;
    try {
      const encodedUsername = encodeURIComponent(normalizedUsername);
      const response = await apiRequest(`/api/users/${encodedUsername}/posts`);
      if (!response.ok) {
        throw new Error(
          `User posts fetch failed (${normalizedUsername}): ${response.status}`
        );
      }
      const rawPosts = await response.json();
      if (!Array.isArray(rawPosts)) return null;
      const matchedPost = rawPosts.find(
        (item: any) => Number(item?.postId) === postId
      );
      if (!matchedPost) return null;
      const hydrated = await hydratePostsForPreview([
        mapApiItemToPost(matchedPost),
      ]);
      return hydrated[0] ?? null;
    } catch (error) {
      console.error(
        `Failed to fetch preview post from user (${normalizedUsername}) posts:`,
        error
      );
      return null;
    }
  };

  const fetchPostFromRecentFeed = async (
    postId: number
  ): Promise<Post | null> => {
    if (userType !== "user") return null;
    try {
      const response = await apiRequest("/api/posts?size=30");
      if (!response.ok) {
        throw new Error(`Feed fetch failed: ${response.status}`);
      }
      const data = await response.json();
      if (!Array.isArray(data)) return null;
      const hydrated = await hydratePostsForPreview(data.map(mapApiItemToPost));
      return hydrated.find((post) => post.id === postId) ?? null;
    } catch (error) {
      console.error("Failed to fetch preview post from feed:", error);
      return null;
    }
  };

  const fetchPostByIdForPreview = async (
    postId: number,
    ownerCandidates: (string | null | undefined)[] = []
  ): Promise<Post | null> => {
    const normalizedCandidates = ownerCandidates
      .map((candidate) =>
        candidate && candidate.trim().length ? candidate.trim() : null
      )
      .filter((candidate): candidate is string => Boolean(candidate));
    const seen = new Set<string>();
    const fetchPromises = normalizedCandidates
      .filter((candidate) => {
        const key = candidate.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map((candidate) => fetchPostFromUserPosts(postId, candidate));

    if (fetchPromises.length) {
      const results = await Promise.all(fetchPromises);
      for (const result of results) {
        if (result) return result;
      }
    }

    return fetchPostFromRecentFeed(postId);
  };

  const loadNotificationPostPreview = useCallback(
    async (postId: number) => {
      setPreviewLoading(true);
      setPreviewError(null);
      setPreviewComments([]);
      setPreviewPost(null);
      try {
        const fromExisting =
          posts.find((p) => p.id === postId) ||
          searchResults.find((p) => p.id === postId) ||
          null;
        const ownerCandidates = [
          username ?? null,
          selectedNotificationActor ?? null,
        ];
        const resolvedPost =
          fromExisting ||
          (await fetchPostByIdForPreview(postId, ownerCandidates));
        if (!resolvedPost) {
          throw new Error(
            t("notificationPostPreviewError", {
              defaultValue: "Unable to load the post.",
            })
          );
        }
        setPreviewPost(resolvedPost);
        try {
          const comments = await fetchPreviewComments(postId);
          setPreviewComments(comments);
        } catch (commentsErr) {
          console.error("Failed to fetch preview comments:", commentsErr);
        }
      } catch (err: any) {
        const message =
          err?.message ||
          t("notificationPostPreviewError", {
            defaultValue: "Unable to load the post.",
          });
        setPreviewError(message);
      } finally {
        setPreviewLoading(false);
      }
    },
    [
      posts,
      searchResults,
      t,
      userType,
      username,
      userAvatars,
      selectedNotificationActor,
    ]
  );

  const handleNotificationPress = (notif: NotificationItem) => {
    const normalizedType = notif.type?.toLowerCase();
    const normalizedObjectType = notif.objectType?.toLowerCase();
    const isChallengeEnd =
      normalizedType === "end" && normalizedObjectType === "challenge";
    markNotificationAsRead(notif);
    if (isChallengeEnd) return;
    const derivedPostId = deriveNotificationPostId(notif);
    const messageLower = notif.message?.toLowerCase() ?? "";
    const actorUsername =
      notif.actorUsername ?? deriveActorUsername(notif.actorId, notif.message);
    const followsCurrentUser =
      normalizedType === "follow" &&
      Boolean(
        messageLower.includes("started following you") ||
          (username &&
            notif.objectId &&
            notif.objectId.toLowerCase() === username.toLowerCase()) ||
          (username && !notif.objectId)
      );
    if (followsCurrentUser && actorUsername) {
      closePostPreview();
      closeNotifications();
      (navigation as any).navigate("user_profile", { username: actorUsername });
      return;
    }
    const allowsPreview =
      normalizedObjectType === "post" ||
      normalizedObjectType === "comment" ||
      derivedPostId !== null;
    if (allowsPreview && derivedPostId !== null) {
      setPreviewPost(null);
      setPreviewComments([]);
      setPreviewError(null);
      setPreviewLoading(true);
      setSelectedNotificationActor(notif.actorUsername ?? null);
      setSelectedNotificationPostId(derivedPostId);
      setPostPreviewVisible(true);
      return;
    }
    closePostPreview();
  };

  useEffect(() => {
    if (isNotificationsVisible && userType === "user") {
      fetchNotifications();
    }
  }, [isNotificationsVisible, userType, fetchNotifications]);

  useEffect(() => {
    if (isPostPreviewVisible && selectedNotificationPostId !== null) {
      loadNotificationPostPreview(selectedNotificationPostId);
    }
  }, [
    isPostPreviewVisible,
    selectedNotificationPostId,
    loadNotificationPostPreview,
  ]);

  const findPostInState = useCallback(
    (postId: number): Post | null => {
      const fromFeed = posts.find((p) => p.id === postId);
      if (fromFeed) return fromFeed;
      const fromSearch = searchResults.find((p) => p.id === postId);
      if (fromSearch) return fromSearch;
      if (previewPost?.id === postId) return previewPost;
      return null;
    },
    [posts, previewPost, searchResults]
  );

  const getPhotoUrlForPostFromState = useCallback(
    (postId: number) => {
      const match = findPostInState(postId);
      const candidate = match?.photoUrl ?? null;
      return resolvePostImageUri(candidate ?? null);
    },
    [findPostInState, resolvePostImageUri]
  );

  const getPostContentFromState = useCallback(
    (postId: number) => {
      const match = findPostInState(postId);
      return match?.content ?? null;
    },
    [findPostInState]
  );

  const getCommentPreviewFromState = useCallback(
    (postId: number, actorUsername?: string | null) => {
      const comments = commentsByPostId[postId];
      if (!comments || !comments.length) return null;
      const normalizedActor = actorUsername?.trim().toLowerCase();
      if (normalizedActor) {
        const byActor = comments.find(
          (c) => c.username?.toLowerCase() === normalizedActor
        );
        if (byActor?.content) return byActor.content;
      }
      return comments[0]?.content ?? null;
    },
    [commentsByPostId]
  );

  const markNotificationAsRead = useCallback(
    async (notif: NotificationItem) => {
      if (notif.isRead || notificationMarkingRef.current.has(notif.id)) return;
      notificationMarkingRef.current.add(notif.id);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notif.id
            ? {
                ...n,
                isRead: true,
              }
            : n
        )
      );
      try {
        await apiRequest(`/api/notifications/read/${notif.id}`, {
          method: "POST",
        });
      } catch (err) {
        // If it fails, keep it marked locally to avoid flicker; backend is best-effort
      } finally {
        notificationMarkingRef.current.delete(notif.id);
      }
    },
    []
  );

  const fetchNotificationPostThumbnail = useCallback(
    async (postId: number) => {
      if (notificationThumbnailFetchesRef.current.has(postId)) return;
      notificationThumbnailFetchesRef.current.add(postId);
      try {
        const cached = getPhotoUrlForPostFromState(postId);
        const cachedBody = getPostContentFromState(postId);
        if (cachedBody) {
          setNotificationPostBodies((prev) =>
            prev[postId] === cachedBody
              ? prev
              : { ...prev, [postId]: cachedBody }
          );
        }
        if (cached) {
          setNotificationThumbnails((prev) =>
            prev[postId] === cached ? prev : { ...prev, [postId]: cached }
          );
          return;
        }

        const endpoint =
          username && username.trim().length > 0
            ? `/api/posts/${postId}?username=${encodeURIComponent(username)}`
            : `/api/posts/${postId}`;
        const response = await apiRequest(endpoint);
        if (!response.ok) {
          setNotificationThumbnails((prev) =>
            Object.prototype.hasOwnProperty.call(prev, postId)
              ? prev
              : { ...prev, [postId]: null }
          );
          return;
        }
        const data = await response.json();
        const rawPhoto =
          data?.photoUrl ??
          data?.photoURL ??
          data?.photo_url ??
          (Array.isArray(data?.photos) ? data.photos[0] : null);
        const resolved = resolvePostImageUri(rawPhoto ?? null);
        const rawContent =
          (typeof data?.content === "string" && data.content) ||
          (typeof data?.body === "string" && data.body) ||
          (typeof data?.text === "string" && data.text) ||
          null;
        setNotificationThumbnails((prev) =>
          prev[postId] === resolved
            ? prev
            : { ...prev, [postId]: resolved ?? null }
        );
        if (rawContent) {
          setNotificationPostBodies((prev) =>
            prev[postId] === rawContent
              ? prev
              : { ...prev, [postId]: rawContent }
          );
        } else if (
          !Object.prototype.hasOwnProperty.call(notificationPostBodies, postId)
        ) {
          setNotificationPostBodies((prev) => ({ ...prev, [postId]: null }));
        }
      } catch (err) {
        setNotificationThumbnails((prev) =>
          Object.prototype.hasOwnProperty.call(prev, postId)
            ? prev
            : { ...prev, [postId]: null }
        );
        setNotificationPostBodies((prev) =>
          Object.prototype.hasOwnProperty.call(prev, postId)
            ? prev
            : { ...prev, [postId]: null }
        );
      } finally {
        notificationThumbnailFetchesRef.current.delete(postId);
      }
    },
    [
      getPhotoUrlForPostFromState,
      getPostContentFromState,
      notificationPostBodies,
    ]
  );

  const fetchNotificationCommentPreview = useCallback(
    async (notif: NotificationItem, postId: number) => {
      if (notificationCommentPreviewFetchesRef.current.has(notif.id)) return;
      notificationCommentPreviewFetchesRef.current.add(notif.id);
      try {
        const cached = notificationCommentPreviews[notif.id];
        if (cached) return;

        const fromState = getCommentPreviewFromState(
          postId,
          notif.actorUsername ?? notif.actorId
        );
        if (fromState) {
          setNotificationCommentPreviews((prev) =>
            prev[notif.id] === fromState
              ? prev
              : { ...prev, [notif.id]: fromState }
          );
          return;
        }

        const res = await apiRequest(`/api/posts/${postId}/comments`);
        if (!res.ok) {
          setNotificationCommentPreviews((prev) =>
            Object.prototype.hasOwnProperty.call(prev, notif.id)
              ? prev
              : { ...prev, [notif.id]: null }
          );
          return;
        }
        const data = await res.json();
        const comments = Array.isArray(data?.comments)
          ? data.comments
          : Array.isArray(data?.comments?.comments)
          ? data.comments.comments
          : Array.isArray(data?.comments?.items)
          ? data.comments.items
          : [];
        const normalizedActor = notif.actorUsername?.toLowerCase();
        const matched =
          (normalizedActor &&
            comments.find(
              (c: any) =>
                typeof c?.creatorUsername === "string" &&
                c.creatorUsername.toLowerCase() === normalizedActor
            )) ||
          comments[0];
        const previewContent =
          typeof matched?.content === "string" ? matched.content : null;
        setNotificationCommentPreviews((prev) =>
          prev[notif.id] === previewContent
            ? prev
            : { ...prev, [notif.id]: previewContent }
        );
      } catch (err) {
        setNotificationCommentPreviews((prev) =>
          Object.prototype.hasOwnProperty.call(prev, notif.id)
            ? prev
            : { ...prev, [notif.id]: null }
        );
      } finally {
        notificationCommentPreviewFetchesRef.current.delete(notif.id);
      }
    },
    [getCommentPreviewFromState, notificationCommentPreviews]
  );

  useEffect(() => {
    if (!notifications.length) return;
    notifications.forEach((notif) => {
      const normalizedType = notif.type?.toLowerCase();
      const normalizedObject = notif.objectType?.toLowerCase();
      const postId = deriveNotificationPostId(notif);
      const looksPostRelated =
        postId !== null &&
        (normalizedObject === "post" ||
          normalizedObject === "comment" ||
          (!normalizedObject &&
            (normalizedType === "like" ||
              normalizedType === "comment" ||
              normalizedType === "create")));
      if (!looksPostRelated || postId === null) return;
      if (
        notificationThumbnailFetchesRef.current.has(postId) ||
        Object.prototype.hasOwnProperty.call(notificationThumbnails, postId)
      ) {
        return;
      }
      fetchNotificationPostThumbnail(postId);
    });
  }, [notifications, fetchNotificationPostThumbnail, notificationThumbnails]);

  useEffect(() => {
    if (!notifications.length) return;
    notifications.forEach((notif) => {
      const normalizedType = notif.type?.toLowerCase();
      const normalizedObject = notif.objectType?.toLowerCase();
      const postId = deriveNotificationPostId(notif);
      const isCommentOnPost =
        postId !== null &&
        ((normalizedType === "comment" &&
          (normalizedObject === "post" || !normalizedObject)) ||
          (normalizedType === "create" && normalizedObject === "comment"));
      if (!isCommentOnPost || postId === null) return;

      const previewAlready =
        Object.prototype.hasOwnProperty.call(
          notificationCommentPreviews,
          notif.id
        ) && notificationCommentPreviews[notif.id] !== undefined;

      const fromState = getCommentPreviewFromState(
        postId,
        notif.actorUsername ?? notif.actorId
      );
      if (!previewAlready && fromState) {
        setNotificationCommentPreviews((prev) =>
          prev[notif.id] === fromState
            ? prev
            : { ...prev, [notif.id]: fromState }
        );
        return;
      }

      if (
        previewAlready ||
        notificationCommentPreviewFetchesRef.current.has(notif.id)
      ) {
        return;
      }

      fetchNotificationCommentPreview(notif, postId);
    });
  }, [
    notifications,
    fetchNotificationCommentPreview,
    getCommentPreviewFromState,
    notificationCommentPreviews,
  ]);

  const fetchPosts = async (
    loadMore = false,
    options?: { preserveExisting?: boolean }
  ) => {
    const preserveExisting = Boolean(options?.preserveExisting);
    const isGuestUser = userType === "guest";
    const currentOperation = loadMore
      ? "loading more"
      : "fetching initial/refresh";
    try {
      if (isGuestUser && loadMore) {
        setLoadingMore(false);
        setNoMorePosts(true);
        return;
      }

      if (loadMore) setLoadingMore(true);
      else setLoading(true);

      let query = isGuestUser
        ? "/api/posts/mostLiked?size=15"
        : loadMore && lastPostId !== null
        ? `/api/posts?size=15&lastPostId=${lastPostId}`
        : "/api/posts?size=15";

      if (!isGuestUser && username) {
        query += `&username=${encodeURIComponent(username)}`;
      }

      const res = await apiRequest(query);
      if (!res.ok) throw new Error(`Fetch failed with status ${res.status}`);
      const data = await res.json();

      if (data.length === 0) {
        setNoMorePosts(true);
        if (!loadMore) setPosts([]);
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
        return;
      }

      let processedNewItems: Post[] = data.map(mapApiItemToPost);

      // Profile photos are now included in the post response, no need to fetch separately
      // if (processedNewItems.length > 0) {
      //   processedNewItems = await attachAvatarsToPosts(processedNewItems);
      // }

      // if (username && userType === "user" && processedNewItems.length > 0) {
      //   // processedNewItems = await fetchLikeStatusesForPosts(processedNewItems, username);
      //   processedNewItems = await fetchSavedStatusesForPosts(
      //     processedNewItems,
      //     username
      //   );
      // }

      if (loadMore) {
        setPosts((prevPosts) => [...prevPosts, ...processedNewItems]);
      } else if (preserveExisting) {
        setPosts((prevPosts) => {
          if (prevPosts.length === 0) return processedNewItems;
          const prevIds = new Set(prevPosts.map((post) => post.id));
          const newOnly = processedNewItems.filter(
            (post) => !prevIds.has(post.id)
          );
          const freshMap = new Map(
            processedNewItems.map((post) => [post.id, post])
          );
          const mergedExisting = prevPosts.map(
            (post) => freshMap.get(post.id) || post
          );
          return [...newOnly, ...mergedExisting];
        });
        if (
          expandedPostId &&
          processedNewItems.find((p) => p.id === expandedPostId)
        ) {
          fetchCommentsForPost(expandedPostId, true);
        }
      } else {
        setPosts(processedNewItems);
        if (
          expandedPostId &&
          processedNewItems.find((p) => p.id === expandedPostId)
        ) {
          fetchCommentsForPost(expandedPostId, true);
        } else if (expandedPostId) {
          setExpandedPostId(null);
          setCommentsByPostId((prev) => {
            const newComments = { ...prev };
            delete newComments[expandedPostId];
            return newComments;
          });
        }
      }

      if (isGuestUser) {
        setLastPostId(null);
        setNoMorePosts(true);
      } else if (loadMore || !preserveExisting) {
        if (data.length > 0)
          setLastPostId(processedNewItems[processedNewItems.length - 1].id);
        if (data.length < 5) setNoMorePosts(true);
        else setNoMorePosts(false);
      }

      setError(false);
    } catch (err) {
      console.error(`Failed to fetch posts (${currentOperation}):`, err);
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const refreshFeed = (
    useRefreshControlIndicator: boolean,
    preserveExisting = false
  ) => {
    if (useRefreshControlIndicator) setRefreshing(true);
    if (!preserveExisting) {
      setLastPostId(null);
      setNoMorePosts(false);
      setEditingCommentDetails(null);
    }
    setError(false);
    fetchPosts(false, { preserveExisting });
  };

  const handleRefresh = () => refreshFeed(true);

  useEffect(() => {
    hasLoadedPostsRef.current = posts.length > 0;
  }, [posts.length]);

  useEffect(() => {
    const unread = notifications.filter((n) => !n.isRead).length;
    setUnreadCount(unread);
  }, [notifications]);

  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;
      let rafId: number | null = null;
      const interactionHandle = InteractionManager.runAfterInteractions(() => {
        if (!isActive || lastScrollOffsetRef.current <= 0) return;
        rafId = requestAnimationFrame(() => {
          if (isActive && scrollViewRef.current) {
            scrollViewRef.current.scrollTo({
              y: lastScrollOffsetRef.current,
              animated: false,
            });
          }
        });
      });

      if (userType) {
        refreshFeed(false, hasLoadedPostsRef.current);
        if (userType === "user") {
          fetchNotifications();
        }
      } else if (username === null || username === "") {
        setPosts([]);
        setLoading(false);
      }
      return () => {
        isActive = false;
        if (rafId !== null) cancelAnimationFrame(rafId);
        interactionHandle?.cancel?.();
      };
    }, [userType, username, fetchNotifications])
  );

  const handleLoadMore = () => {
    if (
      !loading &&
      !loadingMore &&
      !refreshing &&
      !isSearching &&
      lastPostId !== null &&
      !noMorePosts
    ) {
      fetchPosts(true);
    }
  };

  const isCloseToBottom = (nativeEvent: NativeScrollEvent) => {
    const paddingToBottom = 150;
    return (
      nativeEvent.layoutMeasurement.height + nativeEvent.contentOffset.y >=
      nativeEvent.contentSize.height - paddingToBottom
    );
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    lastScrollOffsetRef.current = event.nativeEvent.contentOffset.y;
    if (isCloseToBottom(event.nativeEvent)) {
      handleLoadMore();
    }
  };

  const executeSearch = async (query: string) => {
    try {
      setIsSearching(true);
      setSearchResults([]);
      setEditingCommentDetails(null);

      const res = await apiRequest(
        `/api/forum/search/semantic?query=${encodeURIComponent(
          query
        )}&username=${encodeURIComponent(
          username ?? ""
        )}&lang=${encodeURIComponent(i18n.language)}`
      );
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      let processedResults: Post[] = data.map(mapApiItemToPost);
      // Profile photos are now included in the post response, no need to fetch separately
      // if (processedResults.length > 0) {
      //   processedResults = await attachAvatarsToPosts(processedResults);
      // }
      // if (username && userType === "user" && processedResults.length > 0) {
      //   // processedResults = await fetchLikeStatusesForPosts(processedResults, username);
      //   processedResults = await fetchSavedStatusesForPosts(
      //     processedResults,
      //     username
      //   );
      // }
      setSearchResults(processedResults);
      setInSearchMode(true);
      if (expandedPostId) setExpandedPostId(null);
    } catch (err) {
      console.error("Search error:", err);
      setSearchResults([]);
      setInSearchMode(true);
    } finally {
      setIsSearching(false);
    }
  };

  const handleWasteFilterClick = async (wasteType: string) => {
    setSelectedWasteFilter(wasteType);
    setSearchQuery(wasteType);
    await executeSearch(wasteType);
  };

  const performSearch = async () => {
    const q = searchQuery.trim();
    if (!q) return;
    await executeSearch(q);
  };

  const handleBack = () => {
    setInSearchMode(false);
    setSearchQuery("");
    setSearchResults([]);
    setEditingCommentDetails(null);
    setSelectedWasteFilter(null);
    if (expandedPostId) setExpandedPostId(null);
  };

  const openNotifications = () => setNotificationsVisible(true);
  const closeNotifications = () => {
    setNotificationsVisible(false);
    closePostPreview();
  };

  const handleLikeToggle = async (postId: number, currentlyLiked: boolean) => {
    if (userType === "guest" || !username) {
      Alert.alert(t("loginRequired"), t("pleaseLogInToLike"));
      return;
    }
    const listToUpdate = inSearchMode ? searchResults : posts;
    const setListFunction = inSearchMode ? setSearchResults : setPosts;

    setListFunction((currentList) =>
      currentList.map((p) =>
        p.id === postId
          ? {
              ...p,
              likedByUser: !currentlyLiked,
              likes: currentlyLiked ? Math.max(0, p.likes - 1) : p.likes + 1,
            }
          : p
      )
    );
    try {
      const url = "/api/posts/like";
      const method = currentlyLiked ? "DELETE" : "POST";
      const body = JSON.stringify({ username, postId });
      const response = await apiRequest(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body,
      });
      const responseBodyText = await response.text();
      if (!response.ok) {
        let errorMsg = `Failed to ${
          currentlyLiked ? "unlike" : "like"
        }. Status: ${response.status}`;
        try {
          const errorData = JSON.parse(responseBodyText);
          errorMsg = errorData.message || errorMsg;
        } catch (e) {
          errorMsg += ` Response: ${responseBodyText.substring(0, 100)}`;
        }
        throw new Error(errorMsg);
      }
      const result = JSON.parse(responseBodyText);
      if (!result.success)
        throw new Error(
          result.message ||
            `Backend error on ${currentlyLiked ? "unlike" : "like"}.`
        );
    } catch (err: any) {
      console.error("Failed to toggle like:", err.message);
      Alert.alert(t("error"), err.message || t("couldNotUpdateLike"));
      setListFunction((currentList) =>
        currentList.map((p) =>
          p.id === postId
            ? {
                ...p,
                likedByUser: currentlyLiked,
                likes: currentlyLiked ? p.likes + 1 : Math.max(0, p.likes - 1),
              }
            : p
        )
      );
    }
  };

  const handleSaveToggle = async (postId: number, currentlySaved: boolean) => {
    if (userType === "guest" || !username) {
      Alert.alert(t("loginRequired"), t("pleaseLogInToSave"));
      return;
    }
    const listToUpdate = inSearchMode ? searchResults : posts;
    const setListFunction = inSearchMode ? setSearchResults : setPosts;

    setListFunction((currentList) =>
      currentList.map((p) =>
        p.id === postId ? { ...p, savedByUser: !currentlySaved } : p
      )
    );

    // api call for save POST {{base_url}}/api/posts/save with body { "username": "{{username} }", "postId": {{post_id}} } and header Content-Type: application/json
    // api call for unsave DELETE {{base_url}}/api/posts/unsave{{username}}/{{post_id}} no body
    try {
      const encodedUsername = encodeURIComponent(username);
      const response = currentlySaved
        ? await apiRequest(`/api/posts/${postId}/saves/${encodedUsername}`, {
            method: "DELETE",
          })
        : await apiRequest(`/api/posts/${postId}/save`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username }),
          });
      const responseBodyText = await response.text();
      if (!response.ok) {
        let errorMsg = `Failed to ${
          currentlySaved ? "unsave" : "save"
        }. Status: ${response.status}`;
        try {
          const errorData = JSON.parse(responseBodyText);
          errorMsg = errorData.message || errorMsg;
        } catch (e) {
          errorMsg += ` Response: ${responseBodyText.substring(0, 100)}`;
        }
        throw new Error(errorMsg);
      }
      const result = JSON.parse(responseBodyText);
      if (currentlySaved) {
        if (!result.deleted)
          throw new Error(result.message || `Backend error on unsave.`);
      } else {
        if (!result.username)
          throw new Error(result.message || `Backend error on save.`);
      }
      // success: optimistic update already applied above
    } catch (err: any) {
      console.error("Failed to toggle save:", err.message);
      Alert.alert(t("error"), err.message || t("couldNotUpdateSave"));
      const setListFunction = inSearchMode ? setSearchResults : setPosts;
      setListFunction((currentList) =>
        currentList.map((p) =>
          p.id === postId ? { ...p, savedByUser: currentlySaved } : p
        )
      );
    }
  };

  async function fetchCommentsForPost(postId: number, forceRefresh = false) {
    if (
      commentsByPostId[postId] &&
      !forceRefresh &&
      commentsByPostId[postId].length > 0
    ) {
      return;
    }
    if (editingCommentDetails?.postId === postId && !forceRefresh) {
      return;
    }
    setLoadingCommentsPostId(postId);
    try {
      const response = await apiRequest(`/api/posts/${postId}/comments`);
      if (!response.ok) {
        /* ... error handling ... */ throw new Error(
          `Failed to fetch comments: ${response.status}`
        );
      }
      const apiResponse = await response.json();
      const apiComments = apiResponse.comments || [];
      const usernamesNeedingAvatars = apiComments.map(
        (apiComment: any) => apiComment.creatorUsername
      );
      const newlyFetchedAvatars = await ensureAvatarsForUsernames(
        usernamesNeedingAvatars
      );
      const avatarLookup = { ...userAvatars, ...newlyFetchedAvatars };
      const fetchedComments: CommentData[] = apiComments.map(
        (apiComment: any) => ({
          commentId: apiComment.commentId,
          content: apiComment.content,
          createdAt: apiComment.createdAt,
          username: apiComment.creatorUsername,
          avatarUrl: avatarLookup[apiComment.creatorUsername] ?? null,
        })
      );
      setCommentsByPostId((prev) => ({ ...prev, [postId]: fetchedComments }));
      if (typeof apiResponse.totalComments === "number") {
        /* ... update post comment count ... */
      }
    } catch (e: any) {
      /* ... error handling ... */ Alert.alert(
        t("error"),
        t("couldNotLoadComments")
      );
    } finally {
      setLoadingCommentsPostId(null);
    }
  }

  const handleToggleComments = (postId: number) => {
    if (userType === "guest" || !username) {
      Alert.alert(t("loginRequired"), t("loginRequiredForComment"));
      return;
    }
    const isCurrentlyExpanded = expandedPostId === postId;
    if (
      editingCommentDetails &&
      editingCommentDetails.postId === postId &&
      !isCurrentlyExpanded
    ) {
    }
    if (isCurrentlyExpanded) {
      if (editingCommentDetails && editingCommentDetails.postId === postId) {
        setEditingCommentDetails(null);
      }
      setExpandedPostId(null);
    } else {
      setExpandedPostId(postId);
      if (!commentsByPostId[postId] || commentsByPostId[postId].length === 0) {
        fetchCommentsForPost(postId, false);
      }
    }
  };

  const handleCommentInputChange = (postId: number, text: string) => {
    // For NEW comments
    if (editingCommentDetails && editingCommentDetails.postId === postId) {
      setEditingCommentDetails(null);
    }
    setCommentInputs((prev) => ({ ...prev, [postId]: text }));
  };

  const handlePostComment = async (postId: number) => {
    // For NEW comments
    if (!username) {
      Alert.alert(t("loginRequired"), t("mustBeLoggedIn"));
      return;
    }
    const content = commentInputs[postId]?.trim();
    if (!content) {
      Alert.alert(t("emptyComment"), t("commentCannotBeEmpty"));
      return;
    }
    if (editingCommentDetails?.postId === postId) {
      setEditingCommentDetails(null);
    }
    setPostingCommentPostId(postId);
    Keyboard.dismiss();
    try {
      const response = await apiRequest(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, content }),
      });
      const apiResponseData = await response.json();
      if (!response.ok)
        throw new Error(apiResponseData.message || `Failed to post comment`);
      const authorUsername = apiResponseData.creatorUsername || username;
      const avatarUpdates = await ensureAvatarsForUsernames([authorUsername]);
      const avatarLookup = { ...userAvatars, ...avatarUpdates };
      const newComment: CommentData = {
        commentId: apiResponseData.commentId,
        content: apiResponseData.content,
        createdAt: apiResponseData.createdAt,
        username: authorUsername,
        avatarUrl: avatarLookup[authorUsername] ?? null,
      };
      setCommentsByPostId((prev) => ({
        ...prev,
        [postId]: [newComment, ...(prev[postId] || [])],
      }));
      const listUpdater = (list: Post[]) =>
        list.map((p) =>
          p.id === postId ? { ...p, comments: p.comments + 1 } : p
        );
      setPosts(listUpdater);
      if (inSearchMode) setSearchResults(listUpdater);
      setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
    } catch (e: any) {
      Alert.alert(t("error"), t("couldNotPostComment", { message: e.message }));
    } finally {
      setPostingCommentPostId(null);
    }
  };

  const handleDeleteComment = async (postId: number, commentId: number) => {
    if (
      editingCommentDetails &&
      editingCommentDetails.commentId === commentId
    ) {
      setEditingCommentDetails(null);
    }
    if (!username) {
      return;
    }

    try {
      const response = await apiRequest(`/api/posts/comment/${commentId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to delete comment.");
      }
      setCommentsByPostId((prev) => ({
        ...prev,
        [postId]: (prev[postId] || []).filter((c) => c.commentId !== commentId),
      }));
      const listUpdater = (list: Post[]) =>
        list.map((p) =>
          p.id === postId ? { ...p, comments: Math.max(0, p.comments - 1) } : p
        );
      setPosts(listUpdater);
      if (inSearchMode) setSearchResults(listUpdater);
    } catch (e: any) {
      console.error("Failed to delete comment:", e);
    }
  };

  const handleStartEditComment = (
    postId: number,
    commentToEdit: CommentData
  ) => {
    setEditingCommentDetails({
      postId: postId,
      commentId: commentToEdit.commentId,
      currentText: commentToEdit.content,
    });
    setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
    if (expandedPostId !== postId) {
      setExpandedPostId(postId);
    }
  };

  const handleEditingCommentTextChange = (newText: string) => {
    setEditingCommentDetails((prev) =>
      prev ? { ...prev, currentText: newText } : null
    );
  };

  const handleCancelCommentEdit = () => {
    setEditingCommentDetails(null);
  };

  const handleSaveCommentEdit = async (
    postIdToSave: number,
    commentIdToSave: number
  ) => {
    if (
      !editingCommentDetails ||
      editingCommentDetails.commentId !== commentIdToSave ||
      !username
    ) {
      Alert.alert(t("error"), t("couldNotSaveEdit"));
      setEditingCommentDetails(null); // Reset state if something is wrong
      return;
    }

    const newContent = editingCommentDetails.currentText.trim();
    if (!newContent) {
      Alert.alert(t("emptyComment"), t("commentCannotBeEmpty"));
      return;
    }

    setIsSubmittingCommentEdit(true);
    Keyboard.dismiss();

    try {
      const response = await apiRequest(
        `/api/posts/comment/${commentIdToSave}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: newContent, username }),
        }
      );

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: "Failed to update comment." }));
        throw new Error(
          errorData.message || `Failed to update comment: ${response.status}`
        );
      }

      const updatedCommentData = await response.json();
      setCommentsByPostId((prev) => {
        const postComments = (prev[postIdToSave] || []).map((c) =>
          c.commentId === commentIdToSave
            ? {
                ...c,
                content: updatedCommentData.content,
                createdAt: updatedCommentData.createdAt || c.createdAt,
              }
            : c
        );
        return { ...prev, [postIdToSave]: postComments };
      });

      Alert.alert(t("success"), t("commentUpdated"));
      setEditingCommentDetails(null);
    } catch (e: any) {
      console.error(`Error updating comment ${commentIdToSave}:`, e.message);
      Alert.alert(
        t("error"),
        t("couldNotUpdateComment", { message: e.message })
      );
    } finally {
      setIsSubmittingCommentEdit(false);
    }
  };

  if (username === undefined && userType === undefined) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: screenBackgroundColor,
        }}
      >
        <ActivityIndicator size="large" color={activityIndicatorColor} />
      </View>
    );
  }

  const currentDisplayPosts = inSearchMode ? searchResults : posts;
  const isContentLoading =
    (loading && !inSearchMode && currentDisplayPosts.length === 0) ||
    (isSearching && inSearchMode && currentDisplayPosts.length === 0);
  const showInlineRefreshIndicator =
    !inSearchMode &&
    !isContentLoading &&
    currentDisplayPosts.length > 0 &&
    (refreshing || loading);

  return (
    <>
      <ScrollView
        ref={scrollViewRef}
        style={[styles.container, { backgroundColor: screenBackgroundColor }]}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            progressViewOffset={36}
          />
        }
        onScroll={handleScroll}
        scrollEventThrottle={32}
      >
        <View style={styles.header}>
          {userType === "guest" ? (
            <AccessibleText
              type="title"
              backgroundColor={screenBackgroundColor}
              style={styles.staticFeedLabel}
            >
              {t("exploreGlobal", { defaultValue: "Explore Global" })}
            </AccessibleText>
          ) : (
            <>
              <AccessibleText
                type="title"
                backgroundColor={screenBackgroundColor}
                style={[
                  styles.feedToggleLabel,
                  {
                    color: feedAccentColor,
                  },
                ]}
              >
                {t("explore", { defaultValue: "Explore" })}
              </AccessibleText>

              <TouchableOpacity
                style={[
                  styles.notificationButton,
                  { backgroundColor: notificationButtonBackground },
                ]}
                onPress={openNotifications}
                accessibilityRole="button"
                accessibilityLabel={
                  unreadCount > 0
                    ? t("openNotificationsWithCount", {
                        count: unreadCount,
                        defaultValue: `Open notifications. ${unreadCount} unread notifications`,
                      })
                    : t("openNotifications", {
                        defaultValue: "Open notifications",
                      })
                }
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons
                  name="notifications-outline"
                  size={28}
                  color={notificationIconColor}
                />
                {unreadCount > 0 && (
                  <View style={styles.notificationBadge}>
                    <AccessibleText
                      backgroundColor={notificationUnreadAccent}
                      style={styles.notificationBadgeText}
                    >
                      {unreadCount > 3 ? "3+" : unreadCount.toString()}
                    </AccessibleText>
                  </View>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>

        {userType === "guest" && (
          <View style={styles.guestActionHeader}>
            <TouchableOpacity
              style={styles.loginButton}
              onPress={() => (navigation as any).navigate("index")}
            >
              <AccessibleText
                backgroundColor={"#2196F3"}
                style={styles.loginButtonText}
              >
                {t("goToLogin")}
              </AccessibleText>
            </TouchableOpacity>
          </View>
        )}

        <View
          style={[
            styles.searchBar,
            { backgroundColor: searchBarBackgroundColor },
          ]}
        >
          {inSearchMode && (
            <TouchableOpacity onPress={handleBack} disabled={isSearching}>
              <Ionicons
                name="arrow-back"
                size={25}
                color={iconColor}
                style={[styles.searchIcon, { marginRight: 8 }]}
              />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={performSearch}
            disabled={isSearching || !!editingCommentDetails}
          >
            {isSearching ? (
              <ActivityIndicator
                size="small"
                color={iconColor}
                style={styles.searchIcon}
              />
            ) : (
              <Ionicons
                name="search"
                size={30}
                color={iconColor}
                style={styles.searchIcon}
              />
            )}
          </TouchableOpacity>
          <TextInput
            style={[styles.searchInput, { color: searchInputColor }]}
            placeholder={t("searchPlaceholder")}
            placeholderTextColor={searchPlaceholderColor}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            onSubmitEditing={performSearch}
            editable={!isSearching && !editingCommentDetails}
          />
        </View>

        {!inSearchMode && (
          <View style={styles.wasteFilterContainer}>
            <AccessibleText
              backgroundColor={screenBackgroundColor}
              style={[styles.wasteFilterLabel, { color: generalTextColor }]}
            >
              {t("filterByWasteType", { defaultValue: "Filter by Waste Type" })}
            </AccessibleText>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.wasteFilterScrollContent}
            >
              {WASTE_TYPES.map((wasteType) => (
                <TouchableOpacity
                  key={wasteType}
                  style={[
                    styles.wasteFilterButton,
                    selectedWasteFilter === wasteType &&
                      styles.wasteFilterButtonActive,
                    {
                      borderColor: iconColor,
                      backgroundColor:
                        selectedWasteFilter === wasteType
                          ? feedAccentColor
                          : "transparent",
                    },
                  ]}
                  onPress={() => handleWasteFilterClick(wasteType)}
                  disabled={isSearching}
                  accessibilityRole="button"
                  accessibilityLabel={`Filter by ${t(wasteType.toLowerCase())}`}
                >
                  <AccessibleText
                    backgroundColor={
                      selectedWasteFilter === wasteType
                        ? feedAccentColor
                        : "transparent"
                    }
                    style={[
                      styles.wasteFilterButtonText,
                      {
                        color:
                          selectedWasteFilter === wasteType
                            ? "#FFFFFF"
                            : generalTextColor,
                      },
                    ]}
                  >
                    {t(wasteType.toLowerCase())}
                  </AccessibleText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {showInlineRefreshIndicator && (
          <ActivityIndicator
            size="small"
            color={activityIndicatorColor}
            style={styles.refreshingIndicatorSpinner}
          />
        )}

        {isContentLoading ? (
          <ActivityIndicator
            style={{ marginTop: 20 }}
            size="large"
            color={activityIndicatorColor}
          />
        ) : error && currentDisplayPosts.length === 0 ? (
          <View
            style={[
              styles.errorBox,
              { backgroundColor: themedErrorBoxBackgroundColor },
            ]}
          >
            <AccessibleText
              backgroundColor={themedErrorBoxBackgroundColor}
              style={[styles.errorText, { color: themedErrorBoxTextColor }]}
            >
              {t("errorFailedToLoadPosts")}{" "}
            </AccessibleText>
          </View>
        ) : inSearchMode ? (
          <>
            {searchResults.length > 0 ? (
              searchResults.map((post) => (
                <PostItem
                  key={`search-${post.id}`}
                  post={post}
                  cardBackgroundColor={cardBackgroundColor}
                  iconColor={iconColor}
                  textColor={generalTextColor}
                  commentInputBorderColor={commentInputBorderColor}
                  commentInputTextColor={commentInputTextColor}
                  commentInputPlaceholderColor={commentInputPlaceholderColor}
                  commentInputBackgroundColor={commentInputBackgroundColor}
                  onLikePress={handleLikeToggle}
                  userType={userType}
                  loggedInUsername={username}
                  onSavePress={handleSaveToggle}
                  isExpanded={expandedPostId === post.id}
                  commentsList={commentsByPostId[post.id] || []}
                  isLoadingComments={loadingCommentsPostId === post.id}
                  commentInputText={
                    editingCommentDetails?.postId === post.id
                      ? ""
                      : commentInputs[post.id] || ""
                  }
                  isPostingComment={postingCommentPostId === post.id}
                  onToggleComments={() => handleToggleComments(post.id)}
                  onCommentInputChange={(text) =>
                    handleCommentInputChange(post.id, text)
                  }
                  onPostComment={() => handlePostComment(post.id)}
                  onDeleteComment={handleDeleteComment}
                  onTriggerEditComment={handleStartEditComment}
                  editingCommentDetailsForPost={
                    editingCommentDetails?.postId === post.id
                      ? editingCommentDetails
                      : null
                  }
                  onEditCommentContentChange={handleEditingCommentTextChange}
                  onSaveEditedCommentForPost={handleSaveCommentEdit}
                  onCancelCommentEdit={handleCancelCommentEdit}
                  isSubmittingCommentEditForPost={
                    editingCommentDetails?.postId === post.id &&
                    isSubmittingCommentEdit
                  }
                />
              ))
            ) : (
              <View
                style={[
                  styles.noMoreBox,
                  { backgroundColor: themedNoMoreBoxBackgroundColor },
                ]}
              >
                <AccessibleText
                  backgroundColor={themedNoMoreBoxBackgroundColor}
                  style={[
                    styles.noMoreText,
                    { color: themedNoMoreBoxTextColor },
                  ]}
                >
                  No results found.
                </AccessibleText>
              </View>
            )}
          </>
        ) : (
          <>
            {posts.length > 0 ? (
              <>
                {posts.map((post) => (
                  <PostItem
                    key={`feed-${post.id}`}
                    post={post}
                    cardBackgroundColor={cardBackgroundColor}
                    iconColor={iconColor}
                    textColor={generalTextColor}
                    commentInputBorderColor={commentInputBorderColor}
                    commentInputTextColor={commentInputTextColor}
                    commentInputPlaceholderColor={commentInputPlaceholderColor}
                    commentInputBackgroundColor={commentInputBackgroundColor}
                    onLikePress={handleLikeToggle}
                    onSavePress={handleSaveToggle}
                    userType={userType}
                    loggedInUsername={username}
                    isExpanded={expandedPostId === post.id}
                    commentsList={commentsByPostId[post.id] || []}
                    isLoadingComments={loadingCommentsPostId === post.id}
                    commentInputText={
                      editingCommentDetails?.postId === post.id
                        ? ""
                        : commentInputs[post.id] || ""
                    }
                    isPostingComment={postingCommentPostId === post.id}
                    onToggleComments={() => handleToggleComments(post.id)}
                    onCommentInputChange={(text) =>
                      handleCommentInputChange(post.id, text)
                    }
                    onPostComment={() => handlePostComment(post.id)}
                    onDeleteComment={handleDeleteComment}
                    onTriggerEditComment={handleStartEditComment}
                    editingCommentDetailsForPost={
                      editingCommentDetails?.postId === post.id
                        ? editingCommentDetails
                        : null
                    }
                    onEditCommentContentChange={handleEditingCommentTextChange}
                    onSaveEditedCommentForPost={handleSaveCommentEdit}
                    onCancelCommentEdit={handleCancelCommentEdit}
                    isSubmittingCommentEditForPost={
                      editingCommentDetails?.postId === post.id &&
                      isSubmittingCommentEdit
                    }
                  />
                ))}
                {loadingMore && posts.length > 0 && (
                  <ActivityIndicator
                    style={styles.listLoadingIndicator}
                    size="small"
                    color={activityIndicatorColor}
                  />
                )}
                {noMorePosts &&
                  posts.length > 0 &&
                  !loadingMore &&
                  !refreshing && (
                    <View
                      style={[
                        styles.noMoreBox,
                        {
                          backgroundColor: themedNoMoreBoxBackgroundColor,
                          marginTop: 20,
                          marginBottom: 20,
                        },
                      ]}
                    >
                      <AccessibleText
                        backgroundColor={themedNoMoreBoxBackgroundColor}
                        style={[
                          styles.noMoreText,
                          { color: themedNoMoreBoxTextColor },
                        ]}
                      >
                        {t("endOfFeed")}
                      </AccessibleText>
                    </View>
                  )}
              </>
            ) : (
              !loading &&
              !error &&
              !refreshing &&
              !isSearching && (
                <View
                  style={[
                    styles.noMoreBox,
                    { backgroundColor: themedNoMoreBoxBackgroundColor },
                  ]}
                >
                  <AccessibleText
                    backgroundColor={themedNoMoreBoxBackgroundColor}
                    style={[
                      styles.noMoreText,
                      { color: themedNoMoreBoxTextColor },
                    ]}
                  >
                    {t("noPostsAvailable")}
                  </AccessibleText>
                  <AccessibleText
                    backgroundColor={themedNoMoreBoxBackgroundColor}
                    style={[
                      styles.noMoreText,
                      {
                        color: themedNoMoreBoxTextColor,
                        fontSize: 14,
                        marginTop: 8,
                      },
                    ]}
                  >
                    {t("pullToRefresh")}
                  </AccessibleText>
                </View>
              )
            )}
          </>
        )}
      </ScrollView>
      <Modal
        visible={isNotificationsVisible}
        animationType="slide"
        onRequestClose={closeNotifications}
      >
        <View
          style={[
            styles.notificationsOverlay,
            { backgroundColor: screenBackgroundColor },
          ]}
          accessibilityViewIsModal={true}
        >
          <View style={styles.notificationsHeader}>
            <TouchableOpacity
              onPress={closeNotifications}
              accessibilityRole="button"
              accessibilityLabel={t("closeNotifications", {
                defaultValue: "Close notifications",
              })}
              style={styles.notificationsBackButton}
            >
              <Ionicons
                name="arrow-back"
                size={24}
                color={generalTextColor}
                importantForAccessibility="no-hide-descendants"
                accessibilityElementsHidden={true}
              />
            </TouchableOpacity>
            <AccessibleText
              backgroundColor={screenBackgroundColor}
              style={[styles.notificationsTitle, { color: generalTextColor }]}
            >
              {t("notificationsTitle", { defaultValue: "Notifications" })}
            </AccessibleText>
            {userType === "user" && username ? (
              <TouchableOpacity
                onPress={handleNotificationsRefresh}
                accessibilityRole="button"
                accessibilityLabel={t("refresh", { defaultValue: "Refresh" })}
                style={styles.notificationsRefreshButton}
                disabled={notificationsLoading}
              >
                <Ionicons
                  name="refresh"
                  size={22}
                  color={generalTextColor}
                  style={notificationsLoading ? { opacity: 0.5 } : undefined}
                />
              </TouchableOpacity>
            ) : (
              <View style={{ width: 32 }} />
            )}
          </View>
          <View style={styles.notificationsContent}>
            {userType !== "user" ? (
              <View style={styles.notificationsEmptyState}>
                <AccessibleText
                  backgroundColor={screenBackgroundColor}
                  style={[
                    styles.notificationsEmptyText,
                    { color: generalTextColor },
                  ]}
                >
                  {t("loginRequired", {
                    defaultValue: "Please log in to view notifications.",
                  })}
                </AccessibleText>
              </View>
            ) : notificationsLoading ? (
              <ActivityIndicator
                size="large"
                color={activityIndicatorColor}
                style={styles.notificationsSpinner}
              />
            ) : notificationsError ? (
              <View style={styles.notificationsEmptyState}>
                <AccessibleText
                  backgroundColor={screenBackgroundColor}
                  style={[
                    styles.notificationsEmptyText,
                    { color: themedErrorBoxTextColor },
                  ]}
                >
                  {notificationsError}
                </AccessibleText>
                <TouchableOpacity
                  onPress={handleNotificationsRefresh}
                  style={[
                    styles.notificationsActionButton,
                    { borderColor: notificationUnreadAccent },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={t("refresh", { defaultValue: "Refresh" })}
                >
                  <AccessibleText
                    backgroundColor={screenBackgroundColor}
                    style={[
                      styles.notificationsActionButtonText,
                      { color: notificationUnreadAccent },
                    ]}
                  >
                    {t("tryAgain", { defaultValue: "Try again" })}
                  </AccessibleText>
                </TouchableOpacity>
              </View>
            ) : notifications.length === 0 ? (
              <View style={styles.notificationsEmptyState}>
                <AccessibleText
                  backgroundColor={screenBackgroundColor}
                  style={[styles.notificationsEmptyText, { color: iconColor }]}
                >
                  {t("notificationsEmpty", {
                    defaultValue: "You're all caught up!",
                  })}
                </AccessibleText>
                <TouchableOpacity
                  onPress={handleNotificationsRefresh}
                  style={[
                    styles.notificationsActionButton,
                    { borderColor: iconColor },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={t("refresh", { defaultValue: "Refresh" })}
                >
                  <AccessibleText
                    backgroundColor={screenBackgroundColor}
                    style={[
                      styles.notificationsActionButtonText,
                      { color: iconColor },
                    ]}
                  >
                    {t("refresh", { defaultValue: "Refresh" })}
                  </AccessibleText>
                </TouchableOpacity>
              </View>
            ) : (
              <ScrollView
                style={styles.notificationsList}
                contentContainerStyle={styles.notificationsListContent}
                showsVerticalScrollIndicator={false}
              >
                {notifications.map((notif) => {
                  const timestamp = formatNotificationTimestamp(
                    notif.createdAt
                  );
                  const showAvatar = shouldDisplayNotificationAvatar(notif);
                  const avatarInitial = showAvatar
                    ? getNotificationInitial(notif)
                    : null;
                  const resolvedAvatarUri = showAvatar
                    ? resolveAvatarUri(notif.actorAvatarUrl)
                    : null;
                  const avatarContent = showAvatar ? (
                    resolvedAvatarUri ? (
                      <Image
                        source={{ uri: resolvedAvatarUri }}
                        style={styles.notificationAvatarImage}
                      />
                    ) : (
                      <View
                        style={[
                          styles.notificationAvatarFallback,
                          { backgroundColor: notificationAvatarBackground },
                        ]}
                      >
                        <AccessibleText
                          backgroundColor={notificationAvatarBackground}
                          style={[
                            styles.notificationAvatarInitial,
                            { color: notificationAvatarTextColor },
                          ]}
                        >
                          {avatarInitial}
                        </AccessibleText>
                      </View>
                    )
                  ) : null;
                  const derivedPostIdForThumb = deriveNotificationPostId(notif);
                  const normalizedNotifType = notif.type?.toLowerCase();
                  const normalizedNotifObject = notif.objectType?.toLowerCase();
                  const isPostRelated =
                    derivedPostIdForThumb !== null &&
                    (normalizedNotifObject === "post" ||
                      normalizedNotifObject === "comment" ||
                      (!normalizedNotifObject &&
                        (normalizedNotifType === "like" ||
                          normalizedNotifType === "comment" ||
                          normalizedNotifType === "create")));
                  const isLikePost =
                    normalizedNotifType === "like" &&
                    (normalizedNotifObject === "post" ||
                      !normalizedNotifObject);
                  const isCreatePost =
                    normalizedNotifType === "create" &&
                    (normalizedNotifObject === "post" ||
                      !normalizedNotifObject);
                  const isChallengeEnd =
                    normalizedNotifType === "end" &&
                    normalizedNotifObject === "challenge";
                  const isCommentOnPost =
                    (normalizedNotifType === "comment" &&
                      (normalizedNotifObject === "post" ||
                        !normalizedNotifObject)) ||
                    (normalizedNotifType === "create" &&
                      normalizedNotifObject === "comment");
                  const maxPostBodyExcerptLength = 25;
                  const maxCommentExcerptLength = 25;
                  const hasFetchedThumbnail =
                    derivedPostIdForThumb !== null &&
                    Object.prototype.hasOwnProperty.call(
                      notificationThumbnails,
                      derivedPostIdForThumb
                    );
                  const resolvedThumbnailUri =
                    derivedPostIdForThumb !== null
                      ? notificationThumbnails[derivedPostIdForThumb] ?? null
                      : null;
                  const shouldShowThumbnail =
                    isPostRelated &&
                    Boolean(
                      resolvedThumbnailUri && resolvedThumbnailUri.length
                    );
                  const shouldReserveThumbnailSpace =
                    isPostRelated && !hasFetchedThumbnail;
                  let messageText = notif.message?.trim()?.length
                    ? notif.message
                    : t("notificationFallbackMessage", {
                        defaultValue: "You have a new notification.",
                      });
                  if (
                    (isLikePost || isCreatePost) &&
                    derivedPostIdForThumb !== null
                  ) {
                    const bodyFromState = getPostContentFromState(
                      derivedPostIdForThumb
                    );
                    const body =
                      notificationPostBodies[derivedPostIdForThumb] ??
                      bodyFromState ??
                      null;
                    if (body && body.trim().length) {
                      const normalizedBody = body.trim().replace(/\s+/g, " ");
                      const shouldTruncate =
                        normalizedBody.length > maxPostBodyExcerptLength;
                      const excerpt = shouldTruncate
                        ? `${normalizedBody.slice(
                            0,
                            maxPostBodyExcerptLength - 1
                          )}…`
                        : normalizedBody;
                      messageText = `${messageText}: "${excerpt}"`;
                    }
                  }
                  if (isCommentOnPost && derivedPostIdForThumb !== null) {
                    const commentPreview =
                      notificationCommentPreviews[notif.id] ??
                      getCommentPreviewFromState(
                        derivedPostIdForThumb,
                        notif.actorUsername ?? notif.actorId
                      ) ??
                      null;
                    if (commentPreview && commentPreview.trim().length) {
                      const normalized = commentPreview
                        .trim()
                        .replace(/\s+/g, " ");
                      const shouldTruncate =
                        normalized.length > maxCommentExcerptLength;
                      const excerpt = shouldTruncate
                        ? `${normalized.slice(0, maxCommentExcerptLength - 1)}…`
                        : normalized;
                      messageText = `${messageText}: "${excerpt}"`;
                    }
                  }
                  return (
                    <TouchableOpacity
                      key={`${notif.id}-${notif.createdAt ?? "timestamp"}`}
                      style={[
                        styles.notificationItem,
                        {
                          backgroundColor: notificationCardBackground,
                          borderColor: notif.isRead
                            ? notificationReadBorderColor
                            : notificationUnreadAccent,
                        },
                      ]}
                      activeOpacity={0.8}
                      onPress={() => handleNotificationPress(notif)}
                      accessibilityRole="button"
                      accessibilityLabel={t("notificationItemLabel", {
                        status: notif.isRead
                          ? t("read", { defaultValue: "Read" })
                          : t("unread", { defaultValue: "Unread" }),
                        message: messageText,
                        time: timestamp,
                        defaultValue: `${
                          notif.isRead ? "Read" : "Unread"
                        }. ${messageText}. ${timestamp}`,
                      })}
                      accessibilityHint={t("doubleTapToOpenNotification", {
                        defaultValue: "Double tap to open notification",
                      })}
                    >
                      <View style={styles.notificationBody}>
                        {avatarContent}
                        <View
                          style={[
                            styles.notificationTextGroup,
                            !showAvatar &&
                              styles.notificationTextGroupFullWidth,
                          ]}
                        >
                          <View style={styles.notificationItemHeader}>
                            <View
                              style={[
                                styles.notificationStatusDot,
                                {
                                  backgroundColor: notif.isRead
                                    ? notificationReadDotColor
                                    : notificationUnreadAccent,
                                  opacity: notif.isRead ? 0.7 : 1,
                                },
                              ]}
                            />
                            <AccessibleText
                              backgroundColor={notificationCardBackground}
                              style={[
                                styles.notificationMessage,
                                { color: generalTextColor },
                              ]}
                            >
                              {messageText}
                            </AccessibleText>
                          </View>
                          {timestamp ? (
                            <AccessibleText
                              backgroundColor={notificationCardBackground}
                              style={[
                                styles.notificationTimestamp,
                                { color: iconColor },
                              ]}
                            >
                              {timestamp}
                            </AccessibleText>
                          ) : null}
                        </View>
                        {(shouldShowThumbnail ||
                          shouldReserveThumbnailSpace) && (
                          <View
                            style={[
                              styles.notificationThumbnailWrapper,
                              { backgroundColor: commentInputBackgroundColor },
                            ]}
                          >
                            {shouldShowThumbnail && resolvedThumbnailUri ? (
                              <Image
                                source={{ uri: resolvedThumbnailUri }}
                                style={styles.notificationThumbnailImage}
                                resizeMode="cover"
                              />
                            ) : (
                              <View
                                style={[
                                  styles.notificationThumbnailPlaceholder,
                                  {
                                    backgroundColor:
                                      colorScheme === "dark"
                                        ? "#2F2F31"
                                        : "#E5E5EA",
                                  },
                                ]}
                              />
                            )}
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
      <Modal
        visible={isPostPreviewVisible && selectedNotificationPostId !== null}
        transparent
        animationType="fade"
        onRequestClose={() => {
          closePostPreview();
        }}
      >
        <View style={styles.notificationPreviewBackdrop}>
          <View style={styles.notificationPreviewCard}>
            <AccessibleText
              style={styles.notificationPreviewTitle}
              backgroundColor="#FFFFFF"
            >
              {t("notificationPostPreviewHeader", {
                defaultValue: "Post preview",
              })}
            </AccessibleText>
            {previewLoading ? (
              <View style={styles.notificationPreviewLoading}>
                <ActivityIndicator size="large" color="#007AFF" />
                <AccessibleText
                  style={styles.notificationPreviewMuted}
                  backgroundColor="#FFFFFF"
                >
                  {t("notificationPostPreviewLoading", {
                    defaultValue: "Loading post...",
                  })}
                </AccessibleText>
              </View>
            ) : previewError ? (
              <AccessibleText
                style={[
                  styles.notificationPreviewText,
                  { color: themedErrorBoxTextColor },
                ]}
                backgroundColor="#FFFFFF"
              >
                {previewError}
              </AccessibleText>
            ) : previewPost ? (
              <ScrollView
                style={styles.notificationPreviewScroll}
                showsVerticalScrollIndicator={false}
              >
                {resolvedPreviewImageUri ? (
                  <Image
                    source={{ uri: resolvedPreviewImageUri }}
                    style={styles.notificationPreviewImage}
                  />
                ) : null}
                <AccessibleText
                  style={styles.notificationPreviewPostAuthor}
                  backgroundColor="#FFFFFF"
                >
                  {previewPost.title ||
                    t("notificationUnknownActor", { defaultValue: "Someone" })}
                </AccessibleText>
                {previewPost.createdAt ? (
                  <AccessibleText
                    style={styles.notificationPreviewMetaText}
                    backgroundColor="#FFFFFF"
                  >
                    {formatNotificationTimestamp(previewPost.createdAt)}
                  </AccessibleText>
                ) : null}
                {previewPost.content ? (
                  <AccessibleText
                    style={styles.notificationPreviewText}
                    backgroundColor="#FFFFFF"
                  >
                    {previewPost.content}
                  </AccessibleText>
                ) : (
                  <AccessibleText
                    style={styles.notificationPreviewMuted}
                    backgroundColor="#FFFFFF"
                  >
                    {t("notificationPostPreviewNoContent", {
                      defaultValue: "No content available.",
                    })}
                  </AccessibleText>
                )}
                <View style={styles.notificationPreviewMetaRow}>
                  <View style={styles.notificationPreviewMetaItem}>
                    <Ionicons
                      name="heart"
                      size={16}
                      color="#d32f2f"
                      style={styles.notificationPreviewMetaIcon}
                    />
                    <AccessibleText
                      style={styles.notificationPreviewMetaValue}
                      backgroundColor="#FFFFFF"
                    >
                      {previewPost.likes}
                    </AccessibleText>
                  </View>
                  <View style={styles.notificationPreviewMetaItem}>
                    <Ionicons
                      name="chatbubble-ellipses"
                      size={16}
                      color={iconColor}
                      style={styles.notificationPreviewMetaIcon}
                    />
                    <AccessibleText
                      style={styles.notificationPreviewMetaValue}
                      backgroundColor="#FFFFFF"
                    >
                      {previewPost.comments}
                    </AccessibleText>
                  </View>
                </View>
                <AccessibleText
                  style={styles.notificationPreviewCommentsTitle}
                  backgroundColor="#FFFFFF"
                >
                  {t("notificationPostPreviewComments", {
                    defaultValue: "Comments",
                  })}
                </AccessibleText>
                {previewComments.length > 0 ? (
                  previewComments.map((comment) => (
                    <View
                      key={`${comment.commentId}-${comment.createdAt}`}
                      style={styles.notificationPreviewComment}
                    >
                      <AccessibleText
                        style={styles.notificationPreviewCommentAuthor}
                        backgroundColor="#FFFFFF"
                      >
                        {comment.username ||
                          t("notificationUnknownActor", {
                            defaultValue: "Someone",
                          })}
                      </AccessibleText>
                      <AccessibleText
                        style={styles.notificationPreviewCommentBody}
                        backgroundColor="#FFFFFF"
                      >
                        {comment.content}
                      </AccessibleText>
                    </View>
                  ))
                ) : (
                  <AccessibleText
                    style={styles.notificationPreviewMuted}
                    backgroundColor="#FFFFFF"
                  >
                    {t("notificationPostPreviewNoComments", {
                      defaultValue: "No comments yet.",
                    })}
                  </AccessibleText>
                )}
              </ScrollView>
            ) : (
              <AccessibleText
                style={styles.notificationPreviewText}
                backgroundColor="#FFFFFF"
              >
                {t("notificationPostPreviewLoading", {
                  defaultValue: "Loading post...",
                })}
              </AccessibleText>
            )}
            <TouchableOpacity
              style={styles.notificationPreviewCloseButton}
              onPress={() => {
                closePostPreview();
              }}
              accessibilityRole="button"
              accessibilityLabel={t("close", { defaultValue: "Close" })}
            >
              <AccessibleText
                backgroundColor="#007AFF"
                style={styles.notificationPreviewCloseText}
              >
                {t("close", { defaultValue: "Close" })}
              </AccessibleText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 80 },
  header: {
    paddingHorizontal: 16,
    marginTop: Platform.OS === "ios" ? 48 : 48,
    marginBottom: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  titleContainer: {
    flex: 1,
    marginRight: 8,
  },
  feedToggle: {
    flexDirection: "row",
    alignItems: "center",
  },
  feedToggleLabel: {
    paddingHorizontal: 4,
    paddingVertical: 4,
    fontWeight: "700",
  },
  staticFeedLabel: {
    flex: 1,
    textAlign: "left",
    fontWeight: "700",
    color: "#1976D2",
  },
  guestActionHeader: {
    paddingHorizontal: 16,
    marginBottom: 18,
    alignItems: "flex-start",
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
  postImage: {
    width: "100%",
    aspectRatio: 16 / 9,
    maxHeight: 180,
    borderRadius: 6,
    marginBottom: 10,
    backgroundColor: "#eee",
    resizeMode: "cover",
  },
  postTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 8 },
  postContent: { fontSize: 14, lineHeight: 20, marginBottom: 12 },
  postFooter: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  footerAction: { flexDirection: "row", alignItems: "center", minHeight: 20 },
  footerText: { fontSize: 14, marginRight: 8 },
  loginButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#2196F3",
    borderRadius: 20,
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
  listLoadingIndicator: { marginVertical: 20 },
  commentsSection: { marginTop: 10, paddingTop: 10 },
  commentsListContainer: { maxHeight: 200, marginBottom: 10 },
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
  notificationButton: {
    position: "relative",
    padding: 8,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  notificationsOverlay: {
    flex: 1,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingHorizontal: 16,
  },
  notificationsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },

  refreshingIndicatorSpinner: {
    alignSelf: "center",
    marginTop: -8,
    marginBottom: 10,
  },
  languageToggleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  notificationsBackButton: { padding: 6, marginRight: 8 },
  notificationsTitle: { fontSize: 20, fontWeight: "700" },
  notificationsContent: {
    flex: 1,
    alignSelf: "stretch",
  },
  notificationsEmptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  notificationsEmptyText: { fontSize: 16, textAlign: "center", lineHeight: 22 },
  notificationsSpinner: { marginTop: 32 },
  notificationsActionButton: {
    marginTop: 16,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
  },
  notificationsActionButtonText: { fontSize: 14, fontWeight: "600" },
  notificationsRefreshButton: { padding: 6 },
  notificationsList: { flex: 1 },
  notificationsListContent: { paddingBottom: 20 },
  notificationItem: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  notificationBody: { flexDirection: "row", alignItems: "center" },
  notificationTextGroup: { flex: 1, marginLeft: 12 },
  notificationTextGroupFullWidth: { marginLeft: 0 },
  notificationBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#2E7D32",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  notificationBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 14,
    textAlign: "center",
  },
  notificationItemHeader: { flexDirection: "row", alignItems: "center" },
  notificationStatusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  notificationMessage: { fontSize: 15, flexShrink: 1, fontWeight: "500" },
  notificationTimestamp: { fontSize: 12, marginTop: 8 },
  notificationAvatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  notificationAvatarImage: { width: 48, height: 48, borderRadius: 24 },
  notificationAvatarInitial: { fontSize: 18, fontWeight: "700" },
  notificationThumbnailWrapper: {
    width: 64,
    height: 64,
    marginLeft: 12,
    borderRadius: 14,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  notificationThumbnailImage: { width: "100%", height: "100%" },
  notificationThumbnailPlaceholder: {
    width: "100%",
    height: "100%",
    opacity: 0.6,
  },
  notificationPreviewBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  notificationPreviewCard: {
    width: "100%",
    borderRadius: 20,
    padding: 20,
    backgroundColor: "#FFFFFF",
    maxHeight: "80%",
  },
  notificationPreviewTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  notificationPreviewText: { fontSize: 16, marginBottom: 16 },
  notificationPreviewScroll: { maxHeight: 420 },
  notificationPreviewImage: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: "#f2f2f2",
  },
  notificationPreviewPostAuthor: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  notificationPreviewMetaText: {
    fontSize: 12,
    color: "#666666",
    marginBottom: 8,
  },
  notificationPreviewMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
  },
  notificationPreviewMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  notificationPreviewMetaIcon: { marginRight: 6 },
  notificationPreviewMetaValue: { fontSize: 14, fontWeight: "600" },
  notificationPreviewCommentsTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginTop: 10,
    marginBottom: 6,
  },
  notificationPreviewComment: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e8e8e8",
  },
  notificationPreviewCommentAuthor: { fontWeight: "700", marginBottom: 4 },
  notificationPreviewCommentBody: { fontSize: 14, lineHeight: 18 },
  notificationPreviewLoading: { alignItems: "center", marginVertical: 12 },
  notificationPreviewMuted: { fontSize: 14, color: "#777777", marginBottom: 8 },
  notificationPreviewCloseButton: {
    alignSelf: "flex-end",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: "#007AFF",
  },
  notificationPreviewCloseText: { color: "#FFFFFF", fontWeight: "600" },
  wasteFilterContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  wasteFilterLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 10,
    opacity: 0.8,
  },
  wasteFilterScrollContent: {
    paddingVertical: 4,
    gap: 8,
  },
  wasteFilterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    marginRight: 8,
    minWidth: 80,
    alignItems: "center",
  },
  wasteFilterButtonActive: {
    borderWidth: 0,
  },
  wasteFilterButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
