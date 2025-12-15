import React, {
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  StyleSheet,
  Image,
  View,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Platform,
  useColorScheme,
  Switch,
  Modal,
  Alert,
  Keyboard,
  Dimensions,
} from "react-native";
import Svg, { Line, Rect, Text as SvgText } from "react-native-svg";
// import ParallaxScrollView from "@/components/ParallaxScrollView";
import AccessibleText from "@/components/AccessibleText";
import CachedImage from "@/components/CachedImage";
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import { AuthContext } from "../_layout";
import { apiRequest, clearSession } from "../services/apiClient";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useTranslation } from "react-i18next";
import PostItem from "../components/PostItem";
import { ScrollView } from "react-native";
import {
  getBadgeImageSource,
  normalizeBadgeTranslationKey,
  sortBadgeNamesByPriority,
} from "@/utils/badgeUtils";
import FeedbackModal from "@/components/FeedbackModal";

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
  createdAt?: string | Date | null;
  authorAvatarUrl?: string | null;
};

type FollowUser = {
  username: string;
  photoUrl: string | null;
};

const WASTE_TYPES = ["Plastic", "Paper", "Glass", "Metal", "Organic"] as const;

const IMPACT_CONVERSION_RATES: Record<
  string,
  { factor: number; unitKey: string }
> = {
  Paper: { factor: 0.017, unitKey: "trees" }, // 1000kg = 17 trees -> 1kg = 0.017 trees
  Plastic: { factor: 0.0163, unitKey: "barrels" }, // 1000kg = 16.3 barrels -> 1kg = 0.0163 barrels
  Glass: { factor: 0.042, unitKey: "energy" }, // Placeholder
  Metal: { factor: 1.5, unitKey: "ore" }, // Placeholder
  Organic: { factor: 0.5, unitKey: "compost" }, // Placeholder
};

const GLOBAL_WASTE_AVERAGE_KG: Record<string, number> = {
  Plastic: 2.7,
  Paper: 3.8,
  Glass: 1.1,
  Metal: 0.9,
  Organic: 10,
};

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { t, i18n } = useTranslation();

  const { userType, setUserType, username, setUsername } =
    useContext(AuthContext);

  // Define ErrorState so useState<ErrorState> is valid
  type ErrorState = { key: string | null; message: string | null };

  const colorScheme = useColorScheme();

  const [bio, setBio] = useState("");
  const [avatarUri, setAvatarUri] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ErrorState>({ key: null, message: null });
  const [followersCount, setFollowersCount] = useState<number | null>(null);
  const [followingCount, setFollowingCount] = useState<number | null>(null);
  const [followersList, setFollowersList] = useState<FollowUser[]>([]);
  const [followingList, setFollowingList] = useState<FollowUser[]>([]);
  const [followersError, setFollowersError] = useState<string | null>(null);
  const [followingsError, setFollowingsError] = useState<string | null>(null);
  const [followersModalVisible, setFollowersModalVisible] = useState(false);
  const [followingModalVisible, setFollowingModalVisible] = useState(false);
  const [loadingFollowersModal, setLoadingFollowersModal] = useState(false);
  const [loadingFollowingModal, setLoadingFollowingModal] = useState(false);
  const [profileUpdateBannerVisible, setProfileUpdateBannerVisible] =
    useState(false);
  const [isAvatarModalVisible, setAvatarModalVisible] = useState(false);
  const [hasLoadedProfile, setHasLoadedProfile] = useState(false);
  const [hasLoadedPosts, setHasLoadedPosts] = useState(false);
  const [isProgressModalVisible, setProgressModalVisible] = useState(false);
  const [selectedWasteType, setSelectedWasteType] = useState<string>(
    WASTE_TYPES[0]
  );
  const [impactData, setImpactData] = useState<
    { year: number; month: number; totalWeight: number }[]
  >([]);
  const [impactLoading, setImpactLoading] = useState(false);
  const [descriptionIndex, setDescriptionIndex] = useState(0);
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsError, setPostsError] = useState<string | null>(null);
  const [expandedPostId, setExpandedPostId] = useState<number | null>(null);
  const [commentsByPostId, setCommentsByPostId] = useState<{
    [postId: number]: CommentData[];
  }>({});
  const [loadingCommentsPostId, setLoadingCommentsPostId] = useState<
    number | null
  >(null);
  const [commentInputs, setCommentInputs] = useState<{
    [postId: number]: string;
  }>({});
  const [postingCommentPostId, setPostingCommentPostId] = useState<
    number | null
  >(null);
  const [editingCommentDetails, setEditingCommentDetails] = useState<{
    postId: number;
    commentId: number;
    currentText: string;
  } | null>(null);
  const [isSubmittingCommentEdit, setIsSubmittingCommentEdit] = useState(false);
  const [commenterAvatars, setCommenterAvatars] = useState<{
    [username: string]: string | null;
  }>({});
  const [badges, setBadges] = useState<string[]>([]);
  const [badgesLoading, setBadgesLoading] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<string | null>(null);
  const [badgeModalVisible, setBadgeModalVisible] = useState(false);
  const [settingsMenuOpen, setSettingsMenuOpen] = useState(false);
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const isTurkish = (i18n.resolvedLanguage || i18n.language || "")
    .toLowerCase()
    .startsWith("tr");
  const toggleLanguage = (value: boolean) => {
    i18n.changeLanguage(value ? "tr-TR" : "en-US");
  };

  // Convert "PLASTIC SAVER" to "plasticSaver" for translation keys
  const normalizeBadgeName = (badgeName: string): string => {
    return badgeName
      .toLowerCase()
      .split(" ")
      .map((word, index) =>
        index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)
      )
      .join("");
  };

  const normalizeFollowList = useCallback((data: any): FollowUser[] => {
    if (!Array.isArray(data)) return [];
    return data
      .map((item: any) => {
        if (!item) return null;
        if (typeof item === "string") {
          return { username: item, photoUrl: null };
        }
        const uname =
          item.username ||
          item.userName ||
          item.user?.username ||
          item.user?.userName ||
          "";
        if (!uname) return null;
        return {
          username: uname,
          photoUrl: item.photoUrl ?? item.avatarUrl ?? null,
        };
      })
      .filter((item): item is FollowUser => Boolean(item && item.username));
  }, []);

  const fetchFollowersList = useCallback(async () => {
    if (!username) return;
    let cancelled = false;
    setLoadingFollowersModal(true);
    setFollowersError(null);
    try {
      const encoded = encodeURIComponent(username);
      const res = await apiRequest(`/api/users/${encoded}/followers`);
      if (!res.ok) {
        if (!cancelled) {
          setFollowersList([]);
          setFollowersError(t("followersLoadError"));
        }
        return;
      }
      const data = await res.json();
      if (!cancelled) {
        setFollowersList(normalizeFollowList(data));
      }
    } catch (e: any) {
      console.warn("Could not fetch followers list", e);
      if (!cancelled) {
        setFollowersError(t("followersLoadError"));
        setFollowersList([]);
      }
    } finally {
      if (!cancelled) setLoadingFollowersModal(false);
    }
  }, [username, t, normalizeFollowList]);

  const fetchFollowingList = useCallback(async () => {
    if (!username) return;
    let cancelled = false;
    setLoadingFollowingModal(true);
    setFollowingsError(null);
    try {
      const encoded = encodeURIComponent(username);
      const res = await apiRequest(`/api/users/${encoded}/followings`);
      if (!res.ok) {
        if (!cancelled) {
          setFollowingList([]);
          setFollowingsError(t("followingLoadError"));
        }
        return;
      }
      const data = await res.json();
      if (!cancelled) {
        setFollowingList(normalizeFollowList(data));
      }
    } catch (e: any) {
      console.warn("Could not fetch following list", e);
      if (!cancelled) {
        setFollowingsError(t("followingLoadError"));
        setFollowingList([]);
      }
    } finally {
      if (!cancelled) setLoadingFollowingModal(false);
    }
  }, [username, t, normalizeFollowList]);

  const fetchBadges = useCallback(async () => {
    if (!username) return;
    setBadgesLoading(true);
    try {
      const encoded = encodeURIComponent(username);
      const res = await apiRequest(
        `/api/users/${encoded}/badges?username=${encoded}`
      );
      if (!res.ok) {
        console.warn("Failed to fetch badges");
        setBadges([]);
        return;
      }
      const data = await res.json();
      const badgeNames = Array.isArray(data)
        ? sortBadgeNamesByPriority(
            data.map((b: any) =>
              normalizeBadgeTranslationKey(b.badgeName || "")
            )
          )
        : [];
      setBadges(badgeNames);
    } catch (e: any) {
      console.warn("Could not fetch badges", e);
      setBadges([]);
    } finally {
      setBadgesLoading(false);
    }
  }, [username]);

  const handleFollowersPress = useCallback(() => {
    setFollowersModalVisible(true);
    fetchFollowersList();
  }, [fetchFollowersList]);

  const handleFollowingPress = useCallback(() => {
    setFollowingModalVisible(true);
    fetchFollowingList();
  }, [fetchFollowingList]);

  const isDarkMode = colorScheme === "dark";
  const parallaxHeaderBgColor = isDarkMode ? "#000000" : "#F0F2F5";
  const avatarPlaceholderColor = isDarkMode ? "#5A5A5D" : "#999";
  const contentBackgroundColor = isDarkMode ? "#151718" : "#F0F2F5";
  const buttonTextColor = "#FFFFFF";
  const errorTextColor = isDarkMode ? "#FF9494" : "#D32F2F";
  const errorBackgroundColor = isDarkMode ? "#5D1F1A" : "#FFCDD2";
  const successBannerBgColor = isDarkMode
    ? "rgba(46, 125, 50, 0.25)"
    : "#E8F5E9";
  const successBannerTextColor = isDarkMode ? "#A5D6A7" : "#2E7D32";
  const cardBackgroundColor = isDarkMode ? "#1C1C1E" : "#FFFFFF";
  const generalTextColor = isDarkMode ? "#E5E5E7" : "#1C1C1E";
  const iconColor = isDarkMode ? "#8E8E93" : "#6C6C70";
  const commentInputBorderColor = isDarkMode ? "#545458" : "#C7C7CD";
  const commentInputTextColor = generalTextColor;
  const commentInputPlaceholderColor = iconColor;
  const commentInputBackgroundColor = isDarkMode ? "#2C2C2E" : "#F0F2F5";
  const modalMaxHeight = Math.min(Dimensions.get("window").height * 0.7, 520);
  const yAxisUnitLabel = t("chartYAxisUnit", {
    defaultValue: "Waste Log (kg)",
  });
  const xAxisUnitLabel = t("chartXAxisUnit", { defaultValue: "Months" });
  const globalAverageLabel = t("chartGlobalAverageLabel", {
    defaultValue: "Global average",
  });
  const personalLegendLabel = t("chartPersonalLabel", {
    defaultValue: "Your logs",
  });

  const fetchImpactData = useCallback(async () => {
    if (!username) return;
    setImpactLoading(true);
    try {
      const res = await apiRequest(
        `/api/logs/${encodeURIComponent(
          username
        )}/monthly?wasteType=${selectedWasteType}`
      );
      if (res.ok) {
        const data = await res.json();
        // Handle both array and object wrapper formats just in case
        const list = Array.isArray(data) ? data : data.monthlyData || [];
        setImpactData(list);
      } else {
        console.warn("Failed to fetch impact data", res.status);
        setImpactData([]);
      }
    } catch (e) {
      console.error("Error fetching impact data", e);
      setImpactData([]);
    } finally {
      setImpactLoading(false);
    }
  }, [username, selectedWasteType]);

  useEffect(() => {
    if (isProgressModalVisible) {
      fetchImpactData();
      setDescriptionIndex(Math.floor(Math.random() * 3));
    }
  }, [isProgressModalVisible, selectedWasteType, fetchImpactData]);

  const processedChartData = useMemo(() => {
    // Sort by year then month
    const sorted = [...impactData].sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });
    // Take last 5 entries to fit screen
    return sorted.slice(-5);
  }, [impactData]);

  const chartValues = useMemo(
    () =>
      processedChartData.map((d) =>
        parseFloat((d.totalWeight / 1000).toFixed(1))
      ),
    [processedChartData]
  );

  const invertedChartValues = useMemo(
    () => chartValues.map((value) => -value),
    [chartValues]
  );

  const chartLabels = useMemo(
    () =>
      processedChartData.map((d) => {
        const monthName = t(`month_${d.month}`);
        return `${monthName} '${d.year.toString().slice(2)}`;
      }),
    [processedChartData, t]
  );

  const chartWidth = useMemo(
    () => Math.min(Dimensions.get("window").width * 0.92, 450),
    []
  );
  const chartHeight = 240;
  const chartPadding = 50;
  const xLabelY = chartHeight - chartPadding / 2 - 6;
  const xAxisTitleY = xLabelY + 16;
  const barAreaWidth = chartWidth - chartPadding * 2;

  const globalAverageForWaste = GLOBAL_WASTE_AVERAGE_KG[selectedWasteType] ?? 0;

  const maxMagnitude = useMemo(() => {
    const candidates = [
      ...invertedChartValues.map((v) => Math.abs(v)),
      Math.abs(globalAverageForWaste),
    ].filter((v) => Number.isFinite(v) && v >= 0);
    const max = Math.max(...(candidates.length ? candidates : [1]));
    return max === 0 ? 1 : max;
  }, [invertedChartValues, globalAverageForWaste]);

  // Calculate nice tick increment ensuring 3-5 non-zero ticks
  // Allowed increments follow pattern: 0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, ...
  const { tickIncrement, numTicks } = useMemo(() => {
    const baseIncrements = [0.1, 0.2, 0.3, 0.4, 0.5];
    const generateIncrements = () => {
      const increments: number[] = [];
      for (let multiplier = 1; multiplier <= 1000; multiplier *= 10) {
        for (const base of baseIncrements) {
          increments.push(base * multiplier);
        }
      }
      return increments;
    };
    const allowedIncrements = generateIncrements();

    // Find the best increment that gives us 3-5 non-zero ticks
    for (const inc of allowedIncrements) {
      const ticks = Math.ceil(maxMagnitude / inc);
      if (ticks >= 3 && ticks <= 5) {
        return { tickIncrement: inc, numTicks: ticks };
      }
    }
    // Fallback: find smallest increment giving at least 3 ticks
    for (const inc of allowedIncrements) {
      const ticks = Math.ceil(maxMagnitude / inc);
      if (ticks >= 3) {
        return { tickIncrement: inc, numTicks: Math.min(ticks, 5) };
      }
    }
    return { tickIncrement: 1, numTicks: 4 };
  }, [maxMagnitude]);

  // Compute the actual max for the chart
  const chartMaxValue = useMemo(() => {
    return tickIncrement * numTicks;
  }, [tickIncrement, numTicks]);

  const scaleY =
    chartMaxValue > 0 ? (chartHeight - chartPadding * 2) / chartMaxValue : 1;

  const chartTicks = useMemo(() => {
    // numTicks non-zero ticks plus zero
    return new Array(numTicks + 1)
      .fill(0)
      .map((_, idx) => -(idx * tickIncrement));
  }, [tickIncrement, numTicks]);

  const columnWidth =
    invertedChartValues.length > 0
      ? barAreaWidth / invertedChartValues.length
      : barAreaWidth;
  const barWidth = Math.min(columnWidth * 0.5, 32);

  const totalImpact = useMemo(
    () => impactData.reduce((acc, curr) => acc + curr.totalWeight, 0) / 1000,
    [impactData]
  );

  const impactExplanation = useMemo(() => {
    const rate = IMPACT_CONVERSION_RATES[selectedWasteType];
    if (!rate) {
      return t("impactExplanation_Default", { amount: totalImpact.toFixed(1) });
    }
    const calculatedValue = (totalImpact * rate.factor).toFixed(2);
    return t(`impactExplanation_${selectedWasteType}`, {
      amount: totalImpact.toFixed(1),
      [rate.unitKey]: calculatedValue,
    });
  }, [selectedWasteType, totalImpact, t]);

  const handleLogout = async () => {
    await clearSession();
    await AsyncStorage.multiRemove(["password", "email"]);
    setUserType(null);
    setUsername("");
    navigation.reset({ index: 0, routes: [{ name: "index" }] });
  };

  const mapApiItemToPost = (item: any): Post => ({
    id: item.postId,
    title: item.creatorUsername,
    content: item.content,
    likes: item.likes || 0,
    comments: Array.isArray(item.comments)
      ? item.comments.length
      : Number(item.comments) || 0,
    photoUrl: item.photoUrl ?? null,
    likedByUser:
      item.liked ||
      item.likedByUser ||
      (Array.isArray(item.likedByUsers) &&
        item.likedByUsers.some((u: any) => u.username === username)) ||
      false,
    savedByUser: false,
    createdAt: item.createdAt ?? null,
    authorAvatarUrl:
      item.profile_picture ??
      item.profile_photo ??
      item.profilePhoto ??
      item.creatorPhotoUrl ??
      null,
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
        console.warn("Failed to fetch like status for post", post.id, e);
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
      console.warn("Error fetching saved statuses:", e);
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
      (name) => commenterAvatars[name] === undefined
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
      setCommenterAvatars((prev) => ({ ...prev, ...newMap }));
    }
    return newMap;
  };

  const attachAvatarsToPosts = async (
    postsToDecorate: Post[]
  ): Promise<Post[]> => {
    if (!postsToDecorate.length) return postsToDecorate;
    const usernames = postsToDecorate.map((post) => post.title).filter(Boolean);
    const fetchedEntries = await ensureAvatarsForUsernames(usernames);
    const merged = { ...commenterAvatars, ...fetchedEntries };
    return postsToDecorate.map((post) => ({
      ...post,
      authorAvatarUrl: post.title
        ? merged[post.title] ?? post.authorAvatarUrl ?? null
        : post.authorAvatarUrl ?? null,
    }));
  };

  const fetchUserPosts = useCallback(async () => {
    if (!username) {
      setPosts([]);
      setPostsLoading(false);
      setHasLoadedPosts(false);
      return;
    }
    const shouldShowSpinner = !hasLoadedPosts;
    if (shouldShowSpinner) {
      setPostsLoading(true);
    }
    setPostsError(null);
    try {
      const res = await apiRequest(
        `/api/users/${encodeURIComponent(username)}/posts`
      );
      if (!res.ok) {
        throw new Error(`Failed to fetch posts: ${res.status}`);
      }
      const data = await res.json();
      let mappedPosts: Post[] = Array.isArray(data)
        ? data.map(mapApiItemToPost)
        : [];
      // Profile photos are now included in the post response, no need to fetch separately
      // if (mappedPosts.length > 0) {
      //   mappedPosts = await attachAvatarsToPosts(mappedPosts);
      // }
      if (userType === "user") {
        // mappedPosts = await fetchLikeStatusesForPosts(mappedPosts, username);
        mappedPosts = await fetchSavedStatusesForPosts(mappedPosts, username);
      }
      setPosts(mappedPosts);
      setHasLoadedPosts(true);
    } catch (err) {
      console.error("Failed to fetch profile posts:", err);
      setPostsError(i18n.t("profilePostsLoadError"));
      setPosts([]);
    } finally {
      if (shouldShowSpinner) {
        setPostsLoading(false);
      }
    }
  }, [username, userType, hasLoadedPosts, i18n]);

  const handleLikeToggle = async (postId: number, currentlyLiked: boolean) => {
    if (userType !== "user") {
      Alert.alert(t("loginRequired"), t("pleaseLogInToLike"));
      return;
    }

    setPosts((currentList) =>
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
      setPosts((currentList) =>
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
    if (userType !== "user") {
      Alert.alert(t("loginRequired"), t("pleaseLogInToSavePosts"));
      return;
    }
    setPosts((currentList) =>
      currentList.map((p) =>
        p.id === postId ? { ...p, savedByUser: !currentlySaved } : p
      )
    );
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
        let errorMsg = `Failed to ${currentlySaved ? "unsave" : "save"} post.`;
        try {
          const errorData = JSON.parse(responseBodyText);
          errorMsg = errorData.message || errorMsg;
        } catch {
          errorMsg = `${errorMsg} ${responseBodyText.substring(0, 120)}`;
        }
        throw new Error(errorMsg);
      }
      const parsed = JSON.parse(responseBodyText || "{}");
      const successField = currentlySaved ? parsed.deleted : parsed.username;
      if (!successField) {
        throw new Error(
          parsed.message ||
            `Backend error on ${currentlySaved ? "unsave" : "save"}.`
        );
      }
    } catch (err: any) {
      console.error("Failed to toggle save:", err);
      Alert.alert(t("error"), err.message || t("couldNotUpdateSave"));
      setPosts((currentList) =>
        currentList.map((p) =>
          p.id === postId ? { ...p, savedByUser: currentlySaved } : p
        )
      );
    }
  };

  const fetchCommentsForPost = async (postId: number, forceRefresh = false) => {
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
        throw new Error(`Failed to fetch comments: ${response.status}`);
      }
      const apiResponse = await response.json();
      const apiComments = apiResponse.comments || [];
      const usernames = apiComments.map(
        (apiComment: any) => apiComment.creatorUsername
      );
      const newAvatarEntries = await ensureAvatarsForUsernames(usernames);
      const avatarLookup = { ...commenterAvatars, ...newAvatarEntries };
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
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId ? { ...p, comments: apiResponse.totalComments } : p
          )
        );
      }
    } catch (e) {
      console.error("Failed to load comments for post", postId, e);
      Alert.alert(t("error"), t("couldNotLoadComments"));
    } finally {
      setLoadingCommentsPostId(null);
    }
  };

  const handleToggleComments = (postId: number) => {
    if (userType !== "user") {
      Alert.alert(t("loginRequired"), t("loginRequiredForComment"));
      return;
    }
    const isCurrentlyExpanded = expandedPostId === postId;
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
    if (editingCommentDetails && editingCommentDetails.postId === postId) {
      setEditingCommentDetails(null);
    }
    setCommentInputs((prev) => ({ ...prev, [postId]: text }));
  };

  const handlePostComment = async (postId: number) => {
    if (userType !== "user") {
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
      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.message || "Failed to post comment.");
      }
      const authorUsername = responseData.creatorUsername || username;
      const avatarEntries = await ensureAvatarsForUsernames([authorUsername]);
      const avatarLookup = { ...commenterAvatars, ...avatarEntries };
      const newComment: CommentData = {
        commentId: responseData.commentId,
        content: responseData.content,
        createdAt: responseData.createdAt,
        username: authorUsername,
        avatarUrl: avatarLookup[authorUsername] ?? null,
      };
      setCommentsByPostId((prev) => ({
        ...prev,
        [postId]: [newComment, ...(prev[postId] || [])],
      }));
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, comments: p.comments + 1 } : p
        )
      );
      setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
    } catch (err: any) {
      console.error("Failed to post comment:", err);
      Alert.alert(
        t("error"),
        t("couldNotPostComment", { message: err.message })
      );
    } finally {
      setPostingCommentPostId(null);
    }
  };

  const handleDeleteComment = async (postId: number, commentId: number) => {
    if (userType !== "user") {
      Alert.alert(t("error"), t("mustBeLoggedIn"));
      return;
    }
    if (
      editingCommentDetails &&
      editingCommentDetails.commentId === commentId
    ) {
      setEditingCommentDetails(null);
    }
    Alert.alert(t("deleteCommentTitle"), t("deleteCommentMessage"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("delete"),
        style: "destructive",
        onPress: async () => {
          try {
            const response = await apiRequest(
              `/api/posts/comment/${commentId}`,
              { method: "DELETE" }
            );
            if (!response.ok) {
              throw new Error(`Failed to delete comment: ${response.status}`);
            }
            setCommentsByPostId((prev) => ({
              ...prev,
              [postId]: (prev[postId] || []).filter(
                (c) => c.commentId !== commentId
              ),
            }));
            setPosts((prev) =>
              prev.map((p) =>
                p.id === postId
                  ? { ...p, comments: Math.max(0, p.comments - 1) }
                  : p
              )
            );
            Alert.alert(t("success"), t("commentDeleted"));
          } catch (err) {
            console.error("Failed to delete comment:", err);
            Alert.alert(
              t("error"),
              t("couldNotDeleteComment", { message: (err as Error).message })
            );
          }
        },
      },
    ]);
  };

  const handleStartEditComment = (
    postId: number,
    commentToEdit: CommentData
  ) => {
    setEditingCommentDetails({
      postId,
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
      userType !== "user"
    ) {
      Alert.alert(t("error"), t("couldNotSaveEdit"));
      setEditingCommentDetails(null);
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
    } catch (err: any) {
      console.error("Error updating comment:", err);
      Alert.alert(
        t("error"),
        t("couldNotUpdateComment", { message: err.message })
      );
    } finally {
      setIsSubmittingCommentEdit(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (userType === "guest") {
        navigation.reset({
          index: 0,
          routes: [
            { name: "index", params: { error: "You need to sign up first!" } },
          ],
        });
        return;
      }

      let isMounted = true;
      const shouldShowInitialSpinner = !hasLoadedProfile;

      (async () => {
        try {
          if (shouldShowInitialSpinner) {
            setLoading(true);
          }
          setError({ key: null, message: null });
          const encodedUsername = encodeURIComponent(username);
          const profileUrl = `/api/users/${encodedUsername}/profile?username=${encodedUsername}`;

          let res = await apiRequest(profileUrl);

          if (res.status === 404) {
            await apiRequest(`/api/users/${encodedUsername}/profile`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ username, biography: "" }),
            });
            res = await apiRequest(profileUrl);
          }

          if (!res.ok) {
            throw new Error(`Failed to fetch profile: ${res.status}`);
          }

          const data = await res.json();
          if (!isMounted) return;
          setBio(data.biography ?? "");
          setAvatarUri(data.photoUrl ?? "");
          const followerCountValue =
            typeof data.followerCount === "number"
              ? data.followerCount
              : typeof data.followersCount === "number"
              ? data.followersCount
              : null;
          setFollowersCount(followerCountValue);
          setFollowingCount(
            typeof data.followingCount === "number" ? data.followingCount : null
          );
          setHasLoadedProfile(true);
          fetchUserPosts();
        } catch (err) {
          console.error("Failed to fetch or create profile:", err);
          if (isMounted) {
            setError({ key: "errorCouldNotFetchProfile", message: null });
          }
        } finally {
          if (isMounted && shouldShowInitialSpinner) {
            setLoading(false);
          }
        }
      })();

      fetchBadges();

      return () => {
        isMounted = false;
      };
    }, [
      userType,
      username,
      navigation,
      fetchUserPosts,
      hasLoadedProfile,
      fetchBadges,
    ])
  );

  useEffect(() => {
    const hasProfileUpdated = route?.params?.profileUpdated;
    if (hasProfileUpdated) {
      setProfileUpdateBannerVisible(true);
      fetchUserPosts();
      const timeout = setTimeout(
        () => setProfileUpdateBannerVisible(false),
        3000
      );
      navigation.setParams?.({ profileUpdated: undefined });
      return () => clearTimeout(timeout);
    }
  }, [route?.params?.profileUpdated, navigation, fetchUserPosts]);

  if (userType !== "user" || loading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: contentBackgroundColor },
        ]}
      >
        <ActivityIndicator
          testID="profile-loading-indicator"
          size="large"
          color={isDarkMode ? "#FFF" : "#000"}
        />
      </View>
    );
  }

  return (
    <>
      <ScrollView
        style={{ flex: 1, backgroundColor: contentBackgroundColor }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ height: 250, backgroundColor: parallaxHeaderBgColor }}>
          <Image
            source={require("@/assets/images/wallpaper.png")}
            style={{ width: "100%", height: "100%" }}
            resizeMode="cover"
          />
        </View>
        <View
          style={[
            styles.contentContainer,
            { backgroundColor: contentBackgroundColor },
          ]}
        >
          {settingsMenuOpen && (
            <TouchableOpacity
              style={styles.menuOverlay}
              activeOpacity={1}
              onPress={() => setSettingsMenuOpen(false)}
            />
          )}

          {profileUpdateBannerVisible && (
            <View
              style={[
                styles.successBanner,
                { backgroundColor: successBannerBgColor },
              ]}
            >
              <AccessibleText
                backgroundColor={successBannerBgColor}
                style={[
                  styles.successBannerText,
                  { color: successBannerTextColor },
                ]}
              >
                {t("successBioUpdated")}
              </AccessibleText>
            </View>
          )}

          <View style={styles.profileContainer}>
            {avatarUri ? (
              <>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setAvatarModalVisible(true)}
                  accessibilityRole="imagebutton"
                  accessibilityLabel={t("viewImageFullscreen")}
                >
                  <Image
                    testID="profile-avatar-image"
                    source={{ uri: avatarUri }}
                    style={styles.profilePic}
                  />
                </TouchableOpacity>
                <Modal
                  visible={isAvatarModalVisible}
                  onRequestClose={() => setAvatarModalVisible(false)}
                  transparent
                  animationType="fade"
                >
                  <View style={styles.avatarModalBackdrop}>
                    <TouchableOpacity
                      style={styles.avatarModalCloseButton}
                      onPress={() => setAvatarModalVisible(false)}
                      accessibilityRole="button"
                      accessibilityLabel={t("closeFullscreenImage")}
                    >
                      <Ionicons name="close" size={28} color="#FFFFFF" />
                    </TouchableOpacity>
                    <Image
                      source={{ uri: avatarUri }}
                      style={styles.avatarModalImage}
                      resizeMode="contain"
                    />
                  </View>
                </Modal>
              </>
            ) : (
              <Ionicons
                testID="profile-avatar-placeholder"
                name="person-circle-outline"
                size={100}
                color={avatarPlaceholderColor}
              />
            )}
            <View style={styles.profileInfoWrapper}>
              <View style={styles.profileGreetingRow}>
                <AccessibleText
                  testID="profile-username-text"
                  type="default"
                  backgroundColor={contentBackgroundColor}
                  style={{ fontSize: 20 }}
                >
                  {t("helloUser", { username })}
                </AccessibleText>
              </View>
              <AccessibleText
                testID="profile-bio-text"
                type="default"
                backgroundColor={contentBackgroundColor}
                style={{ marginTop: 4, fontStyle: bio ? "normal" : "italic" }}
                numberOfLines={3}
              >
                {bio || t("noBioYet")}
              </AccessibleText>

              <View style={{ flexDirection: "row", marginTop: 8 }}>
                <TouchableOpacity
                  style={{ marginRight: 16 }}
                  onPress={handleFollowersPress}
                >
                  <AccessibleText
                    backgroundColor={contentBackgroundColor}
                    style={{ fontWeight: "700" }}
                  >
                    {followersCount ?? "-"}
                  </AccessibleText>
                  <AccessibleText
                    backgroundColor={contentBackgroundColor}
                    style={{ opacity: 0.8 }}
                  >
                    {t("followers")}
                  </AccessibleText>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleFollowingPress}>
                  <AccessibleText
                    backgroundColor={contentBackgroundColor}
                    style={{ fontWeight: "700" }}
                  >
                    {followingCount ?? "-"}
                  </AccessibleText>
                  <AccessibleText
                    backgroundColor={contentBackgroundColor}
                    style={{ opacity: 0.8 }}
                  >
                    {t("following")}
                  </AccessibleText>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.settingsContainer}>
              <TouchableOpacity
                style={styles.settingsButton}
                onPress={() => setSettingsMenuOpen((prev) => !prev)}
                accessibilityRole="button"
                accessibilityLabel={t("settings", { defaultValue: "Settings" })}
              >
                <Ionicons
                  name="settings-outline"
                  size={22}
                  color={generalTextColor}
                />
              </TouchableOpacity>
              {settingsMenuOpen && (
                <View
                  style={[
                    styles.settingsMenu,
                    {
                      backgroundColor: cardBackgroundColor,
                      borderColor: isDarkMode ? "#2D3748" : "#E5E7EB",
                    },
                  ]}
                >
                  <View style={styles.settingsMenuRow}>
                    <Text
                      style={[styles.menuLabel, { color: generalTextColor }]}
                    >
                      {t("language", { defaultValue: "Language" })}
                    </Text>
                    <TouchableOpacity
                      style={styles.menuLanguageToggle}
                      onPress={() => toggleLanguage(!isTurkish)}
                      accessible={true}
                      accessibilityRole="switch"
                      accessibilityLabel={
                        isTurkish
                          ? "Current language: Turkish. Double tap to switch to English"
                          : "Current language: English. Double tap to switch to Turkish"
                      }
                    >
                      <Text style={styles.languageLabel}>EN</Text>
                      <View
                        pointerEvents="none"
                        importantForAccessibility="no-hide-descendants"
                        accessibilityElementsHidden={true}
                      >
                        <Switch
                          trackColor={{ false: "#767577", true: "#81b0ff" }}
                          thumbColor={
                            isDarkMode
                              ? isTurkish
                                ? "#f5dd4b"
                                : "#f4f4f4"
                              : isTurkish
                              ? "#f5dd4b"
                              : "#f4f4f4"
                          }
                          ios_backgroundColor="#3e3e3e"
                          onValueChange={toggleLanguage}
                          value={isTurkish}
                        />
                      </View>
                      <Text style={styles.languageLabel}>TR</Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.settingsMenuButton,
                      styles.settingsMenuPrimary,
                    ]}
                    onPress={() => {
                      setSettingsMenuOpen(false);
                      navigation.navigate("edit_profile");
                    }}
                  >
                    <Text
                      style={[
                        styles.settingsMenuButtonText,
                        { color: generalTextColor },
                      ]}
                    >
                      {t("editProfile")}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.settingsMenuButton,
                      styles.settingsMenuSecondary,
                    ]}
                    onPress={() => {
                      setSettingsMenuOpen(false);
                      setFeedbackModalVisible(true);
                    }}
                  >
                    <Text
                      style={[
                        styles.settingsMenuButtonText,
                        { color: generalTextColor },
                      ]}
                    >
                      {t("sendFeedback")}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.settingsMenuButton,
                      styles.settingsMenuLogout,
                    ]}
                    onPress={() => {
                      setSettingsMenuOpen(false);
                      handleLogout();
                    }}
                  >
                    <Text
                      style={[
                        styles.settingsMenuButtonText,
                        { color: "#FFFFFF" },
                      ]}
                    >
                      {t("logOut")}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>

          {/* ========================================================== */}
          {/* BADGES SECTION                                             */}
          {/* ========================================================== */}
          {badgesLoading ? (
            <View style={{ marginVertical: 12, alignItems: "center" }}>
              <ActivityIndicator
                size="small"
                color={isDarkMode ? "#FFF" : "#000"}
              />
              <AccessibleText
                backgroundColor={contentBackgroundColor}
                style={{ marginTop: 4, fontSize: 12, opacity: 0.7 }}
              >
                {t("loadingBadges")}
              </AccessibleText>
            </View>
          ) : badges.length > 0 ? (
            <View style={{ marginVertical: 12 }}>
              <AccessibleText
                backgroundColor={contentBackgroundColor}
                style={{ fontSize: 16, fontWeight: "700", marginBottom: 8 }}
              >
                {t("badges")}
              </AccessibleText>
              {(() => {
                const displayedBadges = badges.slice(0, 3);

                return (
                  <View
                    style={{
                      flexDirection: "row",
                      flexWrap: "wrap",
                      gap: 8,
                      alignItems: "center",
                    }}
                  >
                    {displayedBadges.map((badgeName, index) => {
                      const badgeImage = getBadgeImageSource(badgeName);

                      return (
                        <TouchableOpacity
                          key={index}
                          onPress={() => {
                            setSelectedBadge(badgeName);
                            setBadgeModalVisible(true);
                          }}
                          accessibilityRole="button"
                          accessibilityLabel={t(badgeName)}
                          style={styles.badgePill}
                        >
                          {badgeImage ? (
                            <Image
                              source={badgeImage}
                              style={styles.badgePillImage}
                              resizeMode="contain"
                            />
                          ) : (
                            <Ionicons
                              name="medal"
                              size={48}
                              color={isDarkMode ? "#FBBF24" : "#FB8C00"}
                              style={{ marginRight: 0 }}
                            />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                    <TouchableOpacity
                      style={[
                        styles.viewAllBadge,
                        {
                          backgroundColor: isDarkMode
                            ? "rgba(255,255,255,0.12)"
                            : "rgba(0,0,0,0.06)",
                          borderColor: isDarkMode
                            ? "rgba(255,255,255,0.24)"
                            : "rgba(0,0,0,0.14)",
                        },
                      ]}
                      accessible
                      accessibilityRole="button"
                      accessibilityLabel={t("viewAllBadges", {
                        defaultValue: "View all",
                      })}
                      onPress={() => navigation.navigate("badges")}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.viewAllBadgeText,
                          { color: isDarkMode ? "#FFFFFF" : "#111827" },
                        ]}
                      >
                        {t("viewAllBadges", { defaultValue: "View all" })}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })()}
            </View>
          ) : null}

          <TouchableOpacity
            testID="show-impact-button"
            style={[
              styles.actionButton,
              { backgroundColor: "#4CAF50", marginBottom: 20 },
            ]}
            onPress={() => setProgressModalVisible(true)}
          >
            <Text style={[styles.actionText, { color: buttonTextColor }]}>
              {t("showMyImpact")}
            </Text>
          </TouchableOpacity>

          {/* ERROR MESSAGE INSERTED HERE */}
          {error.key && (
            <AccessibleText
              backgroundColor={errorBackgroundColor}
              style={[
                styles.errorText,
                {
                  color: errorTextColor,
                  backgroundColor: errorBackgroundColor,
                },
              ]}
            >
              {t(error.key)}
            </AccessibleText>
          )}

          <TouchableOpacity
            testID="create-post-button"
            style={[styles.actionButton, { backgroundColor: "#2196F3" }]}
            onPress={() => navigation.navigate("create_post")}
          >
            <Text style={[styles.actionText, { color: buttonTextColor }]}>
              {t("createPost")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            testID="my-posts-button"
            style={[styles.actionButton, { backgroundColor: "#00008B" }]}
            onPress={() => navigation.navigate("posts")}
          >
            <Text style={[styles.actionText, { color: buttonTextColor }]}>
              {t("managePosts")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: "#D4AF37" }]}
            onPress={() => navigation.navigate("saved_posts")}
          >
            <Text style={[styles.actionText, { color: buttonTextColor }]}>
              {t("savedPosts")}
            </Text>
          </TouchableOpacity>

          <View
            style={[
              styles.sectionDivider,
              { backgroundColor: isDarkMode ? "#2E2E2E" : "#D9D9D9" },
            ]}
          />

          <AccessibleText
            backgroundColor={contentBackgroundColor}
            style={[styles.postsHeader, { color: generalTextColor }]}
          >
            {t("profilePostsTitle")}
          </AccessibleText>

          <View style={styles.postListContainer}>
            {postsLoading ? (
              <ActivityIndicator
                style={styles.postsLoadingIndicator}
                color={iconColor}
              />
            ) : postsError ? (
              <AccessibleText
                backgroundColor={contentBackgroundColor}
                style={[styles.postsErrorText, { color: errorTextColor }]}
              >
                {postsError}
              </AccessibleText>
            ) : posts.length === 0 ? (
              <AccessibleText
                backgroundColor={contentBackgroundColor}
                style={[styles.emptyPostsText, { color: iconColor }]}
              >
                {t("noPostsYet")}
              </AccessibleText>
            ) : (
              posts.map((post) => (
                <PostItem
                  key={`profile-post-${post.id}`}
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
              ))
            )}
          </View>
        </View>
      </ScrollView>

      {isProgressModalVisible ? (
        <View style={styles.progressModalOverlay}>
          <TouchableOpacity
            style={styles.progressModalBackdrop}
            activeOpacity={1}
            onPress={() => setProgressModalVisible(false)}
          />
          <View
            style={[
              styles.progressModalCard,
              { backgroundColor: cardBackgroundColor },
            ]}
          >
            <View style={styles.progressModalHeader}>
              <AccessibleText
                backgroundColor={cardBackgroundColor}
                style={[styles.progressModalTitle, { color: generalTextColor }]}
              >
                {t("impactTitle")}
              </AccessibleText>
              <TouchableOpacity
                onPress={() => setProgressModalVisible(false)}
                style={styles.progressModalCloseButton}
                accessibilityLabel={t("close")}
              >
                <Ionicons name="close" size={20} color={generalTextColor} />
              </TouchableOpacity>
            </View>

            <AccessibleText
              backgroundColor={cardBackgroundColor}
              style={[styles.impactDescription, { color: generalTextColor }]}
            >
              {t(`impactDescription_${descriptionIndex}`)}
            </AccessibleText>

            <AccessibleText
              backgroundColor={cardBackgroundColor}
              style={[styles.totalImpactText, { color: generalTextColor }]}
            >
              {t("totalImpact", { amount: totalImpact.toFixed(1) })}
            </AccessibleText>

            <View style={styles.chartArea}>
              {impactLoading ? (
                <ActivityIndicator
                  size="large"
                  color={iconColor}
                  style={{ marginVertical: 40 }}
                />
              ) : (
                <View>
                  {chartValues.length === 0 ? (
                    <AccessibleText
                      backgroundColor={cardBackgroundColor}
                      style={[styles.chartEmptyText, { color: iconColor }]}
                    >
                      {t("noData")}
                    </AccessibleText>
                  ) : (
                    <>
                      <View style={{ alignItems: "center" }}>
                        <Svg
                          width={chartWidth}
                          height={chartHeight}
                          testID="bar-chart"
                          accessibilityLabel={t("impactTitle")}
                        >
                          {/* Axes */}
                          <Line
                            x1={chartPadding}
                            y1={chartPadding}
                            x2={chartPadding}
                            y2={chartHeight - chartPadding / 2}
                            stroke={iconColor}
                            strokeWidth={1.5}
                          />
                          <Line
                            x1={chartPadding}
                            y1={chartPadding}
                            x2={chartWidth - chartPadding / 2}
                            y2={chartPadding}
                            stroke={iconColor}
                            strokeWidth={1.5}
                          />

                          {/* Y axis ticks & labels (negative direction) */}
                          {chartTicks.map((value, idx) => {
                            const y = chartPadding + Math.abs(value) * scaleY;
                            const isZero = Math.abs(value) < 0.0001;
                            return (
                              <React.Fragment key={`tick-${idx}`}>
                                <Line
                                  x1={chartPadding}
                                  y1={y}
                                  x2={chartWidth - chartPadding / 2}
                                  y2={y}
                                  stroke={iconColor}
                                  strokeWidth={isZero ? 1.6 : 1}
                                  strokeDasharray={isZero ? "2 6" : "6 8"}
                                  strokeOpacity={isZero ? 0.5 : 0.35}
                                />
                                <SvgText
                                  x={chartPadding - 8}
                                  y={y + 4}
                                  fontSize="11"
                                  fill={iconColor}
                                  textAnchor="end"
                                >
                                  {isZero ? "0" : Math.abs(value).toFixed(1)}
                                </SvgText>
                              </React.Fragment>
                            );
                          })}

                          {/* Bars */}
                          {invertedChartValues.map((value, idx) => {
                            const magnitude = Math.abs(value);
                            const barHeight = magnitude * scaleY;
                            const x =
                              chartPadding +
                              idx * columnWidth +
                              (columnWidth - barWidth) / 2;
                            const y = chartPadding;
                            const shouldShowValue = magnitude >= 0.05;
                            const valueInsideBar = barHeight > 24;
                            const labelY = valueInsideBar
                              ? y + barHeight - 8
                              : y + barHeight + 14;
                            const labelColor = valueInsideBar
                              ? "#FFFFFF"
                              : generalTextColor;
                            return (
                              <React.Fragment key={`bar-${idx}`}>
                                <Rect
                                  x={x}
                                  y={y}
                                  width={barWidth}
                                  height={barHeight}
                                  fill="#4CAF50"
                                  rx={4}
                                  ry={4}
                                />
                                {shouldShowValue && (
                                  <SvgText
                                    x={x + barWidth / 2}
                                    y={labelY}
                                    fontSize="11"
                                    fontWeight="600"
                                    fill={labelColor}
                                    textAnchor="middle"
                                  >
                                    {magnitude.toFixed(1)}
                                  </SvgText>
                                )}
                              </React.Fragment>
                            );
                          })}

                          {/* Global average line drawn above bars */}
                          {globalAverageForWaste > 0 && (
                            <Line
                              x1={chartPadding}
                              y1={chartPadding + globalAverageForWaste * scaleY}
                              x2={chartWidth - chartPadding / 2}
                              y2={chartPadding + globalAverageForWaste * scaleY}
                              stroke="#FFC107"
                              strokeWidth={2}
                              strokeDasharray="6 6"
                            />
                          )}

                          {/* X labels */}
                          {chartLabels.map((label, idx) => {
                            const x =
                              chartPadding +
                              idx * columnWidth +
                              columnWidth / 2;
                            return (
                              <SvgText
                                key={`xlabel-${idx}`}
                                x={x}
                                y={xLabelY}
                                fontSize="11"
                                fill={iconColor}
                                textAnchor="middle"
                              >
                                {label}
                              </SvgText>
                            );
                          })}

                          {/* Axis unit labels */}
                          <SvgText
                            x={chartPadding - 14}
                            y={chartPadding - 16}
                            fontSize="12"
                            fontWeight="600"
                            fill={generalTextColor}
                            textAnchor="start"
                          >
                            {yAxisUnitLabel}
                          </SvgText>
                          <SvgText
                            x={chartWidth / 2}
                            y={xAxisTitleY}
                            fontSize="12"
                            fontWeight="600"
                            fill={generalTextColor}
                            textAnchor="middle"
                          >
                            {xAxisUnitLabel}
                          </SvgText>
                        </Svg>
                      </View>
                      <View style={styles.chartLegendRow}>
                        <View style={styles.legendItem}>
                          <View
                            style={[
                              styles.legendSwatch,
                              { backgroundColor: "#4CAF50" },
                            ]}
                          />
                          <AccessibleText
                            backgroundColor={cardBackgroundColor}
                            style={[
                              styles.legendLabel,
                              { color: generalTextColor },
                            ]}
                          >
                            {personalLegendLabel}
                          </AccessibleText>
                        </View>

                        <View style={styles.legendItem}>
                          <View
                            style={[
                              styles.legendSwatch,
                              styles.legendSwatchDotted,
                              { borderColor: "#FFC107" },
                            ]}
                          />
                          <AccessibleText
                            backgroundColor={cardBackgroundColor}
                            style={[
                              styles.legendLabel,
                              { color: generalTextColor },
                            ]}
                          >
                            {`${globalAverageLabel} (${globalAverageForWaste.toFixed(
                              1
                            )} kg)`}
                          </AccessibleText>
                        </View>
                      </View>
                    </>
                  )}
                </View>
              )}
              <AccessibleText
                backgroundColor={cardBackgroundColor}
                style={[
                  styles.impactExplanationText,
                  { color: generalTextColor },
                ]}
              >
                {impactExplanation}
              </AccessibleText>
            </View>

            <View style={styles.wasteTypeSelector}>
              <AccessibleText
                backgroundColor={cardBackgroundColor}
                style={[styles.wasteTypeLabel, { color: generalTextColor }]}
              >
                {t("wasteTypeLabel")}
              </AccessibleText>
              <View style={styles.wasteTypeChips}>
                {WASTE_TYPES.map((type) => {
                  const isActive = selectedWasteType === type;
                  return (
                    <TouchableOpacity
                      key={type}
                      onPress={() => setSelectedWasteType(type)}
                      style={[
                        styles.wasteTypeChip,
                        { borderColor: iconColor },
                        isActive && styles.wasteTypeChipActive,
                      ]}
                    >
                      <AccessibleText
                        backgroundColor={cardBackgroundColor}
                        style={[
                          styles.wasteTypeChipText,
                          { color: isActive ? "#FFFFFF" : generalTextColor },
                        ]}
                      >
                        {t(type.toLowerCase())}
                      </AccessibleText>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        </View>
      ) : null}

      {followersModalVisible && (
        <View style={styles.progressModalOverlay}>
          <TouchableOpacity
            style={styles.progressModalBackdrop}
            activeOpacity={1}
            onPress={() => setFollowersModalVisible(false)}
          />
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: cardBackgroundColor,
                maxHeight: modalMaxHeight,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <AccessibleText
                backgroundColor={cardBackgroundColor}
                style={{
                  fontSize: 18,
                  fontWeight: "700",
                  color: generalTextColor,
                }}
              >
                {t("followers")}
              </AccessibleText>
              <TouchableOpacity onPress={() => setFollowersModalVisible(false)}>
                <Ionicons name="close" size={24} color={generalTextColor} />
              </TouchableOpacity>
            </View>
            {followersError ? (
              <AccessibleText
                backgroundColor={cardBackgroundColor}
                style={{
                  textAlign: "center",
                  marginVertical: 20,
                  color: iconColor,
                }}
              >
                {followersError}
              </AccessibleText>
            ) : loadingFollowersModal ? (
              <ActivityIndicator
                style={{ marginVertical: 20 }}
                color={iconColor}
              />
            ) : followersList.length === 0 ? (
              <AccessibleText
                backgroundColor={cardBackgroundColor}
                style={{
                  textAlign: "center",
                  marginVertical: 20,
                  color: iconColor,
                }}
              >
                {t("noFollowers")}
              </AccessibleText>
            ) : (
              <ScrollView
                style={[
                  styles.listContainer,
                  { maxHeight: modalMaxHeight - 70 },
                ]}
                contentContainerStyle={styles.listContent}
                nestedScrollEnabled
                keyboardShouldPersistTaps="handled"
              >
                {followersList.map(({ username: uname, photoUrl }) => (
                  <TouchableOpacity
                    key={uname}
                    style={[
                      styles.listItem,
                      { backgroundColor: cardBackgroundColor },
                    ]}
                    onPress={() => {
                      setFollowersModalVisible(false);
                      navigation.navigate("user_profile", { username: uname });
                    }}
                  >
                    <View
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
                      {photoUrl ? (
                        <CachedImage
                          source={{ uri: photoUrl }}
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 16,
                            backgroundColor: avatarPlaceholderColor,
                            marginRight: 12,
                          }}
                        />
                      ) : (
                        <View
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 16,
                            backgroundColor: avatarPlaceholderColor,
                            marginRight: 12,
                          }}
                        />
                      )}
                      <AccessibleText
                        backgroundColor={cardBackgroundColor}
                        style={{ color: generalTextColor, fontWeight: "500" }}
                      >
                        {uname}
                      </AccessibleText>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={iconColor}
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      )}

      {followingModalVisible && (
        <View style={styles.progressModalOverlay}>
          <TouchableOpacity
            style={styles.progressModalBackdrop}
            activeOpacity={1}
            onPress={() => setFollowingModalVisible(false)}
          />
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: cardBackgroundColor,
                maxHeight: modalMaxHeight,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <AccessibleText
                backgroundColor={cardBackgroundColor}
                style={{
                  fontSize: 18,
                  fontWeight: "700",
                  color: generalTextColor,
                }}
              >
                {t("following")}
              </AccessibleText>
              <TouchableOpacity onPress={() => setFollowingModalVisible(false)}>
                <Ionicons name="close" size={24} color={generalTextColor} />
              </TouchableOpacity>
            </View>
            {followingsError ? (
              <AccessibleText
                backgroundColor={cardBackgroundColor}
                style={{
                  textAlign: "center",
                  marginVertical: 20,
                  color: iconColor,
                }}
              >
                {followingsError}
              </AccessibleText>
            ) : loadingFollowingModal ? (
              <ActivityIndicator
                style={{ marginVertical: 20 }}
                color={iconColor}
              />
            ) : followingList.length === 0 ? (
              <AccessibleText
                backgroundColor={cardBackgroundColor}
                style={{
                  textAlign: "center",
                  marginVertical: 20,
                  color: iconColor,
                }}
              >
                {t("notFollowingAnyone")}
              </AccessibleText>
            ) : (
              <ScrollView
                style={[
                  styles.listContainer,
                  { maxHeight: modalMaxHeight - 70 },
                ]}
                contentContainerStyle={styles.listContent}
                nestedScrollEnabled
                keyboardShouldPersistTaps="handled"
              >
                {followingList.map(({ username: uname, photoUrl }) => (
                  <TouchableOpacity
                    key={uname}
                    style={[
                      styles.listItem,
                      { backgroundColor: cardBackgroundColor },
                    ]}
                    onPress={() => {
                      setFollowingModalVisible(false);
                      navigation.navigate("user_profile", { username: uname });
                    }}
                  >
                    <View
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
                      {photoUrl ? (
                        <CachedImage
                          source={{ uri: photoUrl }}
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 16,
                            backgroundColor: avatarPlaceholderColor,
                            marginRight: 12,
                          }}
                        />
                      ) : (
                        <View
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 16,
                            backgroundColor: avatarPlaceholderColor,
                            marginRight: 12,
                          }}
                        />
                      )}
                      <AccessibleText
                        backgroundColor={cardBackgroundColor}
                        style={{ color: generalTextColor, fontWeight: "500" }}
                      >
                        {uname}
                      </AccessibleText>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={iconColor}
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      )}

      {/* Badge Details Modal */}
      {badgeModalVisible && selectedBadge && (
        <Modal
          visible={badgeModalVisible}
          onRequestClose={() => setBadgeModalVisible(false)}
          transparent
          animationType="fade"
        >
          <View style={styles.progressModalOverlay}>
            <TouchableOpacity
              style={styles.progressModalBackdrop}
              activeOpacity={1}
              onPress={() => setBadgeModalVisible(false)}
            />
            <View
              style={[
                styles.progressModalCard,
                { backgroundColor: cardBackgroundColor },
              ]}
            >
              <View style={styles.progressModalHeader}>
                <AccessibleText
                  backgroundColor={cardBackgroundColor}
                  style={[
                    styles.progressModalTitle,
                    { color: generalTextColor },
                  ]}
                >
                  {t("badgeDetails")}
                </AccessibleText>
                <TouchableOpacity
                  onPress={() => setBadgeModalVisible(false)}
                  style={styles.progressModalCloseButton}
                  accessibilityLabel={t("close")}
                >
                  <Ionicons name="close" size={20} color={generalTextColor} />
                </TouchableOpacity>
              </View>

              <View style={{ alignItems: "center", marginVertical: 20 }}>
                {(() => {
                  const badgeImage = getBadgeImageSource(selectedBadge ?? "");
                  if (badgeImage) {
                    return (
                      <Image
                        source={badgeImage}
                        style={styles.badgeModalImage}
                        resizeMode="contain"
                      />
                    );
                  }
                  return (
                    <Ionicons
                      name="medal"
                      size={64}
                      color={isDarkMode ? "#FF9800" : "#FFA726"}
                    />
                  );
                })()}
                <AccessibleText
                  backgroundColor={cardBackgroundColor}
                  style={{
                    fontSize: 18,
                    fontWeight: "700",
                    color: generalTextColor,
                    marginTop: 12,
                  }}
                >
                  {t(selectedBadge)}
                </AccessibleText>
              </View>

              <AccessibleText
                backgroundColor={cardBackgroundColor}
                style={{
                  fontSize: 14,
                  color: generalTextColor,
                  lineHeight: 20,
                  textAlign: "center",
                  paddingHorizontal: 16,
                }}
              >
                {t(`${selectedBadge}Desc`)}
              </AccessibleText>
            </View>
          </View>
        </Modal>
      )}
      <FeedbackModal
        visible={feedbackModalVisible}
        onClose={() => setFeedbackModalVisible(false)}
        username={username}
        surfaceColor={cardBackgroundColor}
        textColor={generalTextColor}
      />
    </>
  );
}

const styles = StyleSheet.create({
  headerImage: { width: "100%", height: undefined, aspectRatio: 0.88 },
  contentContainer: {
    flex: 1,
    padding: 16,
    marginTop: -20,
    zIndex: 2,
    position: "relative",
  },
  menuOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  badgePill: {
    padding: 0,
    borderWidth: 0,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  badgePillImage: { width: 64, height: 64 },
  viewAllBadge: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.08)",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.16)",
    minWidth: 84,
    alignItems: "center",
    justifyContent: "center",
  },
  viewAllBadgeText: {
    color: "#111827",
    fontWeight: "700",
    fontSize: 13,
  },
  topButtonText: { fontSize: 14, color: "#FFFFFF" },
  settingsContainer: {
    position: "relative",
    alignItems: "flex-end",
    alignSelf: "flex-start",
    marginLeft: 12,
    marginTop: 4,
    zIndex: 2,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
  },
  settingsMenu: {
    position: "absolute",
    top: 50,
    right: 0,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    width: 220,
    gap: 10,
    zIndex: 3,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 6,
  },
  settingsMenuRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  menuLabel: { fontSize: 14, fontWeight: "600" },
  languageLabel: {
    color: "#888",
    fontWeight: "bold",
    fontSize: 12,
  },
  menuLanguageToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  settingsMenuButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 180,
  },
  settingsMenuButtonText: {
    fontSize: 14,
    fontWeight: "700",
  },
  settingsMenuPrimary: {
    backgroundColor: "rgba(0,122,255,0.12)",
    borderColor: "rgba(0,122,255,0.25)",
  },
  settingsMenuSecondary: {
    backgroundColor: "rgba(255,152,0,0.12)",
    borderColor: "rgba(255,152,0,0.25)",
  },
  settingsMenuLogout: {
    backgroundColor: "#E53935",
    borderColor: "#E53935",
  },
  profileContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  profileInfoWrapper: { marginLeft: 12, flex: 1, flexShrink: 1 },
  profilePic: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#ddd",
  },
  profileGreetingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  progressButton: {
    marginLeft: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#2E7D32",
    alignItems: "center",
    justifyContent: "center",
  },
  actionButton: {
    width: "100%",
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: "center",
  },
  actionText: { fontSize: 16 },
  sectionDivider: {
    height: 1,
    width: "100%",
    marginVertical: 20,
    borderRadius: 999,
  },
  postsHeader: { fontSize: 18, fontWeight: "700", marginBottom: 12 },
  postListContainer: { paddingBottom: 24 },
  postsLoadingIndicator: { marginVertical: 20 },
  postsErrorText: { textAlign: "center", marginVertical: 12 },
  emptyPostsText: {
    textAlign: "center",
    marginVertical: 12,
    fontStyle: "italic",
  },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorText: {
    textAlign: "center",
    marginBottom: 12,
    padding: 10,
    borderRadius: 6,
  }, // STYLE FOR ERROR
  successBanner: {
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 12,
    alignItems: "center",
  },
  successBannerText: {
    fontSize: 14,
    fontWeight: "600",
  },
  avatarModalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.95)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  avatarModalCloseButton: {
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : 30,
    right: 24,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: 24,
    padding: 10,
  },
  avatarModalImage: {
    width: "100%",
    height: "70%",
  },
  badgeModalImage: {
    width: 160,
    height: 160,
  },
  progressModalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    pointerEvents: "box-none",
  },
  progressModalBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  progressModalCard: {
    width: "98%",
    maxWidth: 520,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 8,
    zIndex: 1,
  },
  progressModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  progressModalTitle: { fontSize: 20, fontWeight: "700" },
  impactDescription: {
    fontSize: 14,
    marginBottom: 6,
    lineHeight: 20,
    opacity: 0.8,
  },
  totalImpactText: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
    textAlign: "center",
  },
  progressModalCloseButton: { padding: 8, marginLeft: 12 },
  chartArea: { marginTop: 6, marginBottom: 10, alignItems: "center" },
  chartEmptyText: { alignSelf: "center", marginTop: 32, fontSize: 14 },
  impactExplanationText: {
    marginTop: 16,
    fontSize: 14,
    textAlign: "center",
    fontStyle: "italic",
    paddingHorizontal: 8,
  },
  chartLegendRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
    marginTop: 8,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 6,
    marginVertical: 4,
  },
  legendSwatch: { width: 14, height: 14, borderRadius: 3, marginRight: 6 },
  legendSwatchDotted: {
    width: 24,
    height: 0,
    borderTopWidth: 2,
    borderColor: "#FFC107",
    borderStyle: "dotted",
    marginRight: 6,
  },
  legendLabel: { fontSize: 12, fontWeight: "600" },
  wasteTypeSelector: { marginTop: 20 },
  wasteTypeLabel: { fontSize: 14, fontWeight: "600", marginBottom: 12 },
  wasteTypeChips: { flexDirection: "row", flexWrap: "wrap" },
  wasteTypeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8,
  },
  wasteTypeChipActive: { backgroundColor: "#2E7D32", borderColor: "#2E7D32" },
  wasteTypeChipText: { fontSize: 12, fontWeight: "600" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  modalCard: {
    width: "90%",
    maxWidth: 400,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 8,
    overflow: "hidden",
  },
  listContainer: { paddingHorizontal: 0, flexGrow: 0 },
  listContent: { paddingBottom: 12 },
  listItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
});
