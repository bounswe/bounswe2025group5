import React, { useEffect, useState, useCallback, useContext } from "react";
import {
  View,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  useColorScheme,
  Text,
  Alert,
  ScrollView,
  Modal,
} from "react-native";
// import ParallaxScrollView from '@/components/ParallaxScrollView';
import AccessibleText from "@/components/AccessibleText";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { apiRequest } from "./services/apiClient";
import PostItem from "./components/PostItem";
import { AuthContext } from "./_layout";
import {
  getBadgeImageSource,
  normalizeBadgeTranslationKey,
} from "@/utils/badgeUtils";

export default function UserProfileScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const usernameParam = route?.params?.username as string | undefined;
  const { userType, username } = useContext(AuthContext);

  const [loading, setLoading] = useState(true);
  const [bio, setBio] = useState<string>("");
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [followersCount, setFollowersCount] = useState<number | null>(null);
  const [followingCount, setFollowingCount] = useState<number | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [badges, setBadges] = useState<string[]>([]);
  const [badgesLoading, setBadgesLoading] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<string | null>(null);
  const [badgeModalVisible, setBadgeModalVisible] = useState(false);

  const fetchProfile = useCallback(
    async (uname?: string) => {
      if (!uname) return;
      setLoading(true);
      try {
        const encoded = encodeURIComponent(uname);
        const res = await apiRequest(
          `/api/users/${encoded}/profile?username=${encoded}`
        );
        if (!res.ok) {
          throw new Error(`Failed to load profile: ${res.status}`);
        }
        const data = await res.json();
        setBio(data.biography ?? "");
        setAvatarUri(data.photoUrl ?? null);
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

        // Check if current user is following this user
        if (userType === "user" && username && uname !== username) {
          try {
            const checkRes = await apiRequest(
              `/api/users/${encodeURIComponent(
                username
              )}/is-following/${encoded}`
            );
            if (checkRes.ok) {
              const checkData = await checkRes.json();
              const followFlag =
                typeof checkData.follow === "boolean"
                  ? checkData.follow
                  : checkData.isFollowing;
              setIsFollowing(!!followFlag);
            }
          } catch (e) {
            console.warn("Could not check follow status", e);
          }
        }
      } catch (e) {
        console.warn("Could not fetch user profile", e);
      } finally {
        setLoading(false);
      }
    },
    [userType, username]
  );

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
            comments: Array.isArray(item.comments)
              ? item.comments.length
              : Number(item.comments) || 0,
            photoUrl: item.photoUrl ?? null,
            likedByUser: false,
            savedByUser: false,
            createdAt: item.createdAt ?? null,
            authorAvatarUrl: null,
          }))
        : [];
      setPosts(mapped);
    } catch (e) {
      console.warn("Could not fetch posts for user", e);
      setPosts([]);
    } finally {
      setPostsLoading(false);
    }
  }, []);

  const fetchBadges = useCallback(async (uname?: string) => {
    if (!uname) return;
    setBadgesLoading(true);
    try {
      const encoded = encodeURIComponent(uname);
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
        ? data.map((b: any) =>
            normalizeBadgeTranslationKey(b.badgeName || "")
          )
        : [];
      setBadges(badgeNames);
    } catch (e: any) {
      console.warn("Could not fetch badges", e);
      setBadges([]);
    } finally {
      setBadgesLoading(false);
    }
  }, []);

  const handleFollowToggle = useCallback(async () => {
    if (userType !== "user" || !username || !usernameParam) {
      Alert.alert(
        t("loginRequired"),
        t("pleaseLogInToFollow", {
          defaultValue: "Please log in to follow users.",
        })
      );
      return;
    }

    if (username === usernameParam) {
      Alert.alert(
        t("error"),
        t("cannotFollowYourself", {
          defaultValue: "You cannot follow yourself.",
        })
      );
      return;
    }

    setFollowLoading(true);
    try {
      const encodedFollower = encodeURIComponent(username);
      const encodedFollowing = encodeURIComponent(usernameParam);

      if (isFollowing) {
        // Unfollow
        const res = await apiRequest(
          `/api/users/${encodedFollower}/unfollow/${encodedFollowing}`,
          {
            method: "DELETE",
          }
        );
        if (!res.ok) {
          throw new Error("Failed to unfollow user");
        }
        setIsFollowing(false);
        setFollowersCount((prev) =>
          prev !== null ? Math.max(0, prev - 1) : prev
        );
      } else {
        // Follow
        const res = await apiRequest(
          `/api/users/${encodedFollower}/follow/${encodedFollowing}`,
          {
            method: "POST",
          }
        );
        if (!res.ok) {
          throw new Error("Failed to follow user");
        }
        setIsFollowing(true);
        setFollowersCount((prev) => (prev !== null ? prev + 1 : prev));
      }
    } catch (e) {
      console.error("Error toggling follow status:", e);
      Alert.alert(
        t("error"),
        t("couldNotUpdateFollowStatus", {
          defaultValue: "Could not update follow status. Please try again.",
        })
      );
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
    fetchBadges(uname);
  }, [usernameParam, fetchProfile, fetchPosts, fetchBadges, navigation]);

  if (loading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: colorScheme === "dark" ? "#151718" : "#F0F2F5" },
        ]}
      >
        <ActivityIndicator
          size="large"
          color={colorScheme === "dark" ? "#FFF" : "#000"}
        />
      </View>
    );
  }

  return (
    <ScrollView
      style={{
        flex: 1,
        backgroundColor: colorScheme === "dark" ? "#151718" : "#F0F2F5",
      }}
      keyboardShouldPersistTaps="handled"
    >
      <View
        style={{
          height: 250,
          backgroundColor: colorScheme === "dark" ? "#000" : "#F0F2F5",
        }}
      >
        <Image
          source={require("@/assets/images/wallpaper.png")}
          style={{ width: "100%", height: "100%" }}
          resizeMode="cover"
        />
      </View>
      <View
        style={[
          styles.contentContainer,
          { backgroundColor: colorScheme === "dark" ? "#151718" : "#F0F2F5" },
        ]}
      >
        <View style={styles.profileContainer}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.profilePic} />
          ) : (
            <View
              style={[
                styles.profilePic,
                { alignItems: "center", justifyContent: "center" },
              ]}
            >
              <Text style={{ fontSize: 36, color: "#888" }}>
                {usernameParam ? usernameParam.charAt(0).toUpperCase() : "?"}
              </Text>
            </View>
          )}

          <View style={styles.profileInfo}>
            <AccessibleText
              type="default"
              backgroundColor={colorScheme === "dark" ? "#151718" : "#F0F2F5"}
              style={{ fontSize: 20, textAlign: "left", alignSelf: "stretch" }}
            >
              {usernameParam}
            </AccessibleText>

            <AccessibleText
              type="default"
              backgroundColor={colorScheme === "dark" ? "#151718" : "#F0F2F5"}
              style={{
                marginTop: 4,
                fontStyle: bio ? "normal" : "italic",
                textAlign: "left",
                alignSelf: "stretch",
              }}
              numberOfLines={2}
            >
              {bio || t("noBioYet")}
            </AccessibleText>

            <View style={styles.followRow}>
              <View style={{ alignItems: "flex-start", minWidth: 64 }}>
                <AccessibleText
                  backgroundColor={
                    colorScheme === "dark" ? "#151718" : "#F0F2F5"
                  }
                  style={{ fontWeight: "700" }}
                >
                  {followersCount ?? "-"}
                </AccessibleText>
                <AccessibleText
                  backgroundColor={
                    colorScheme === "dark" ? "#151718" : "#F0F2F5"
                  }
                  style={{ opacity: 0.8 }}
                >
                  {t("followers")}
                </AccessibleText>
              </View>
              <View style={{ alignItems: "flex-start", minWidth: 64 }}>
                <AccessibleText
                  backgroundColor={
                    colorScheme === "dark" ? "#151718" : "#F0F2F5"
                  }
                  style={{ fontWeight: "700" }}
                >
                  {followingCount ?? "-"}
                </AccessibleText>
                <AccessibleText
                  backgroundColor={
                    colorScheme === "dark" ? "#151718" : "#F0F2F5"
                  }
                  style={{ opacity: 0.8 }}
                >
                  {t("following")}
                </AccessibleText>
              </View>
            </View>

            {userType === "user" && username && username !== usernameParam && (
              <TouchableOpacity
                style={[
                  styles.followButton,
                  {
                    backgroundColor: isFollowing ? "#888" : "#007AFF",
                  },
                ]}
                onPress={handleFollowToggle}
                disabled={followLoading}
              >
                {followLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <AccessibleText
                    backgroundColor={isFollowing ? "#888" : "#007AFF"}
                    style={{ color: "#fff", fontWeight: "600" }}
                  >
                    {isFollowing
                      ? t("unfollow", { defaultValue: "Unfollow" })
                      : t("follow", { defaultValue: "Follow" })}
                  </AccessibleText>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={{ height: 10 }} />

        {/* BADGES SECTION */}
        {badgesLoading ? (
          <View style={{ marginVertical: 12, alignItems: "center" }}>
            <ActivityIndicator
              size="small"
              color={colorScheme === "dark" ? "#FFF" : "#000"}
            />
            <AccessibleText
              backgroundColor={colorScheme === "dark" ? "#151718" : "#F0F2F5"}
              style={{ marginTop: 4, fontSize: 12, opacity: 0.7 }}
            >
              {t("loadingBadges")}
            </AccessibleText>
          </View>
        ) : badges.length > 0 ? (
          <View style={{ marginVertical: 12 }}>
            <AccessibleText
              backgroundColor={colorScheme === "dark" ? "#151718" : "#F0F2F5"}
              style={{ fontSize: 16, fontWeight: "700", marginBottom: 8 }}
            >
              {t("badges")}
            </AccessibleText>
            {(() => {
              const displayedBadges = badges.slice(0, 4);

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
                            color={colorScheme === "dark" ? "#FBBF24" : "#FB8C00"}
                            style={{ marginRight: 0 }}
                          />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                  <TouchableOpacity
                    style={styles.viewAllBadge}
                    accessible
                    accessibilityRole="button"
                  accessibilityLabel={t("viewAllBadges", {
                    defaultValue: "View all",
                  })}
                    onPress={() =>
                      navigation.navigate("badges", { username: usernameParam })
                    }
                    activeOpacity={0.8}
                  >
                    <Text style={styles.viewAllBadgeText}>
                      {t("viewAllBadges", { defaultValue: "View all" })}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })()}
          </View>
        ) : null}

        <AccessibleText
          backgroundColor={colorScheme === "dark" ? "#151718" : "#F0F2F5"}
          style={{ fontSize: 18, fontWeight: "700", marginBottom: 12 }}
        >
          {t("profilePostsTitle")}
        </AccessibleText>

        {postsLoading ? (
          <ActivityIndicator />
        ) : posts.length === 0 ? (
          <AccessibleText
            backgroundColor={colorScheme === "dark" ? "#151718" : "#F0F2F5"}
            style={{ color: "#888" }}
          >
            {t("noPostsYet")}
          </AccessibleText>
        ) : (
          posts.map((post) => (
            <PostItem
              key={`guest-post-${post.id}`}
              post={post}
              cardBackgroundColor={
                colorScheme === "dark" ? "#1C1C1E" : "#FFFFFF"
              }
              iconColor={colorScheme === "dark" ? "#8E8E93" : "#6C6C70"}
              textColor={colorScheme === "dark" ? "#E5E5E7" : "#1C1C1E"}
              commentInputBorderColor={
                colorScheme === "dark" ? "#545458" : "#C7C7CD"
              }
              commentInputTextColor={
                colorScheme === "dark" ? "#E5E5E7" : "#1C1C1E"
              }
              commentInputPlaceholderColor={
                colorScheme === "dark" ? "#8E8E93" : "#6C6C70"
              }
              commentInputBackgroundColor={
                colorScheme === "dark" ? "#2C2C2E" : "#F0F2F5"
              }
              onLikePress={() => {}}
              onSavePress={() => {}}
              userType={"guest"}
              loggedInUsername={null}
              isExpanded={false}
              commentsList={[]}
              isLoadingComments={false}
              commentInputText={""}
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

      {/* Badge Details Modal */}
      {badgeModalVisible && selectedBadge && (
        <Modal
          visible={badgeModalVisible}
          onRequestClose={() => setBadgeModalVisible(false)}
          transparent
          animationType="fade"
        >
          <View style={styles.modalOverlay}>
            <TouchableOpacity
              style={styles.modalBackdrop}
              activeOpacity={1}
              onPress={() => setBadgeModalVisible(false)}
            />
            <View
              style={[
                styles.modalCard,
                {
                  backgroundColor:
                    colorScheme === "dark" ? "#1C1C1E" : "#FFFFFF",
                },
              ]}
            >
              <View style={styles.modalHeader}>
                <AccessibleText
                  backgroundColor={
                    colorScheme === "dark" ? "#1C1C1E" : "#FFFFFF"
                  }
                  style={[
                    styles.modalTitle,
                    { color: colorScheme === "dark" ? "#E5E5E7" : "#1C1C1E" },
                  ]}
                >
                  {t("badgeDetails")}
                </AccessibleText>
                <TouchableOpacity
                  onPress={() => setBadgeModalVisible(false)}
                  style={styles.closeButton}
                  accessibilityLabel={t("close")}
                >
                  <Ionicons
                    name="close"
                    size={20}
                    color={colorScheme === "dark" ? "#E5E5E7" : "#1C1C1E"}
                  />
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
                      color={colorScheme === "dark" ? "#FF9800" : "#FFA726"}
                    />
                  );
                })()}
                <AccessibleText
                  backgroundColor={
                    colorScheme === "dark" ? "#1C1C1E" : "#FFFFFF"
                  }
                  style={{
                    fontSize: 18,
                    fontWeight: "700",
                    color: colorScheme === "dark" ? "#E5E5E7" : "#1C1C1E",
                    marginTop: 12,
                  }}
                >
                  {t(selectedBadge)}
                </AccessibleText>
              </View>

              <AccessibleText
                backgroundColor={colorScheme === "dark" ? "#1C1C1E" : "#FFFFFF"}
                style={{
                  fontSize: 14,
                  color: colorScheme === "dark" ? "#E5E5E7" : "#1C1C1E",
                  lineHeight: 20,
                  textAlign: "center",
                  paddingHorizontal: 16,
                  paddingBottom: 16,
                }}
              >
                {t(`${selectedBadge}Desc`)}
              </AccessibleText>
            </View>
          </View>
        </Modal>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: { width: "100%", height: undefined, aspectRatio: 0.88 },
  contentContainer: { flex: 1, padding: 16, marginTop: -20, zIndex: 2 },
  profileContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  profilePic: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#ddd",
  },
  profileInfo: {
    flex: 1,
    alignItems: "flex-start",
    marginLeft: 12,
  },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  followButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    alignSelf: "flex-start",
    minWidth: 160,
  },
  followRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 24,
    marginTop: 8,
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
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
    minWidth: 84,
    alignItems: "center",
    justifyContent: "center",
  },
  viewAllBadgeText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 13,
  },
  badgeModalImage: { width: 160, height: 160 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalCard: {
    width: "90%",
    maxWidth: 360,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 8,
    zIndex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    paddingBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  closeButton: {
    padding: 8,
    marginLeft: 12,
  },
});
