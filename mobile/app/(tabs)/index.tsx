// app/(tabs)/index.tsx
import React, { useState, useEffect, useContext, useRef, useMemo } from "react";
import {
  Image,
  StyleSheet,
  TextInput,
  View,
  TouchableOpacity,
  Text,
  Switch,
  ScrollView,
  useColorScheme,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import AccessibleText from "@/components/AccessibleText";
import { Colors } from "@/constants/Colors";
import { pickAccessibleTextColor } from "@/utils/contrast";
import {
  useNavigation,
  useFocusEffect,
  useRoute,
} from "@react-navigation/native";
import { AuthContext } from "../_layout";
import { API_BASE_URL } from "../apiConfig";
import {
  apiRequest,
  login as loginRequest,
  register as registerRequest,
} from "../services/apiClient";
import CheckBox from "../components/CheckBox";
import { useTranslation } from "react-i18next";

// Toggle this if you want to run without a backend during development
const MOCK_API = false;

const KG_SAVED = 57492;

type Navigation = {
  navigate: (screen: string, params?: any) => void;
  setParams?: (params: any) => void;
};

type TrendingPost = {
  postId: number;
  content: string;
  likes: number;
  comments: number;
  creatorUsername: string;
  photoUrl: string | null;
};

type SustainabilityFact = {
  tr: string;
  en: string;
  source: string;
};

const FACT_SEED_OFFSET = 9173;

const SUSTAINABILITY_FACTS: SustainabilityFact[] = [
  {
    tr: "1 ton ofis kağıdını geri dönüştürmek, 17 yetişkin ağacın kesilmesini önlüyor.",
    en: "Recycling one ton of office paper prevents cutting down 17 mature trees.",
    source: "U.S. Environmental Protection Agency (EPA)",
  },
  {
    tr: "Sadece 1 alüminyum içecek kutusunu geri dönüştürmek, bir televizyonu 3 saat çalıştıracak enerjiyi geri kazandırır.",
    en: "Recycling a single aluminum drink can powers a TV for three hours.",
    source: "The Aluminum Association",
  },
  {
    tr: "Tek bir kot pantolonun üretimi için 7.500-10.000 litre su harcanıyor; tekstili geri dönüştürmek bu suyu korur.",
    en: "Making one pair of jeans uses about 7,500–10,000 liters of water; recycling textiles preserves that water.",
    source: "United Nations (UN) Environment Programme",
  },
  {
    tr: "1 ton plastiği geri dönüştürmek yaklaşık 16,3 varil (~2.500 litre) petrol tasarrufu sağlar.",
    en: "Recycling a ton of plastic saves roughly 16.3 barrels (about 2,500 liters) of oil.",
    source: "Stanford University Recycling Center / EPA",
  },
  {
    tr: "1 ton cep telefonundan elde edilen altın, 1 ton maden cevherindekinden daha fazladır (150–300 gr vs. 5–30 gr).",
    en: "A ton of cell phones contains more gold than a ton of ore (about 150–300 g vs. 5–30 g).",
    source: "United Nations University (Global E-waste Monitor)",
  },
  {
    tr: "Geri dönüştürülen her 1 ton cam, doğadan 1.2 ton hammadde çıkarılmasını engeller; cam kalite kaybı olmadan sonsuz kez dönüşür.",
    en: "Every ton of recycled glass keeps 1.2 tons of raw materials in the ground; glass reprocesses endlessly without losing quality.",
    source: "Glass Packaging Institute (GPI)",
  },
  {
    tr: "1 plastik şişeyi geri dönüştürmek, 60 Watt'lık bir ampulü 6 saat yakacak enerjiyi kazandırır.",
    en: "Recycling one plastic bottle saves enough energy to light a 60W bulb for six hours.",
    source: "U.S. Environmental Protection Agency (EPA)",
  },
  {
    tr: "1 ton kağıdı geri dönüştürmek, sıfırdan üretime kıyasla yaklaşık 26.500 litre su tasarrufu sağlar.",
    en: "Recycling a ton of paper saves about 26,500 liters of water compared with making new paper.",
    source: "Washington University in St. Louis / EPA",
  },
];

const seededRandomIndex = (seed: number, max: number) => {
  if (max <= 0) return 0;
  const x = Math.sin(seed) * 10000;
  const normalized = x - Math.floor(x);
  return Math.min(max - 1, Math.floor(normalized * max));
};

export default function HomeScreen() {
  const navigation = useNavigation<Navigation>();
  const route = useRoute<any>();
  const { setUserType, setUsername } = useContext(AuthContext);
  const colorScheme = useColorScheme();

  const { t, i18n } = useTranslation();
  const isTurkish = (i18n.resolvedLanguage || i18n.language || "")
    .toLowerCase()
    .startsWith("tr");
  const toggleLanguage = (value: boolean) =>
    i18n.changeLanguage(value ? "tr-TR" : "en-US");

  // Get theme colors
  const themeColors = Colors[colorScheme ?? "light"];

  // Compute accessible foreground colors for key backgrounds used in this screen
  const registerBg = themeColors.buttonPrimary;
  const loginBg = themeColors.buttonSuccess ?? themeColors.buttonPrimary;
  const registerTextColor = pickAccessibleTextColor(registerBg);
  const loginTextColor = pickAccessibleTextColor(loginBg);
  const continueBg = themeColors.tint ?? themeColors.buttonSecondary ?? themeColors.cardBackground ?? "#f9f6ee";
  const continueTextColor = pickAccessibleTextColor(continueBg);
  const postBg = themeColors.commentBackground ?? "#f5f5f5";
  const postTextColor = pickAccessibleTextColor(postBg);

  const sustainabilityFact = useMemo(() => {
    const today = new Date();
    const seed =
      FACT_SEED_OFFSET +
      today.getFullYear() * 10000 +
      (today.getMonth() + 1) * 100 +
      today.getDate();
    const factIndex = seededRandomIndex(seed, SUSTAINABILITY_FACTS.length);
    return SUSTAINABILITY_FACTS[factIndex];
  }, []);

  const [showAuthFields, setShowAuthFields] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  const [usernameInput, setUsernameInput] = useState("");
  const [password, setPassword] = useState("");
  const [passwordStrength, setPasswordStrength] = useState({ label: 'Very weak', color: '#D32F2F', score: 0 });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [email, setEmail] = useState("");
  const [kvkkChecked, setKvkkChecked] = useState(false);

  const [loggedIn, setLoggedIn] = useState(false);
  const [errorVisible, setErrorVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [usersCount, setUsersCount] = useState<number>(0);
  const [displayedUsersCount, setDisplayedUsersCount] = useState<number>(0);
  const userCountAnimationRef = useRef<NodeJS.Timeout | null>(null);
  const displayedCountRef = useRef<number>(0);
  const [trendingPosts, setTrendingPosts] = useState<TrendingPost[]>([]);

  useEffect(() => {
    const fetchUserCount = async () => {
      try {
        const res = await apiRequest("/api/users/count", {
          method: "GET",
          auth: false,
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          return console.warn(body.message || "Could not fetch user count");
        }
        const userCount = body.userCount ?? 0;
        setUsersCount(userCount);
      } catch (err) {
        console.warn("Network error while fetching user count", err);
      }
    };
    fetchUserCount();
  }, []);

  useEffect(() => {
    displayedCountRef.current = displayedUsersCount;
  }, [displayedUsersCount]);

  useEffect(() => {
    const target = usersCount;
    if (typeof jest !== "undefined") {
      setDisplayedUsersCount(target);
      displayedCountRef.current = target;
      if (userCountAnimationRef.current) {
        clearInterval(userCountAnimationRef.current);
        userCountAnimationRef.current = null;
      }
      return;
    }

    if (userCountAnimationRef.current) {
      clearInterval(userCountAnimationRef.current);
      userCountAnimationRef.current = null;
    }

    const start = displayedCountRef.current;
    if (start === target) return;

    const step = target > start ? 1 : -1;
    const totalSteps = Math.max(Math.abs(target - start), 1);
    const duration = Math.min(1200, totalSteps * 80);
    const intervalMs = Math.max(16, Math.floor(duration / totalSteps));

    userCountAnimationRef.current = setInterval(() => {
      setDisplayedUsersCount((prev) => {
        if (prev === target) {
          if (userCountAnimationRef.current) {
            clearInterval(userCountAnimationRef.current);
            userCountAnimationRef.current = null;
          }
          return prev;
        }
        const next = prev + step;
        displayedCountRef.current = next;
        if (next === target && userCountAnimationRef.current) {
          clearInterval(userCountAnimationRef.current);
          userCountAnimationRef.current = null;
        }
        return next;
      });
    }, intervalMs);

    return () => {
      if (userCountAnimationRef.current) {
        clearInterval(userCountAnimationRef.current);
        userCountAnimationRef.current = null;
      }
    };
  }, [usersCount]);

  useEffect(() => {
    const fetchTrending = async () => {
      if (MOCK_API) {
        setTrendingPosts([
          {
            postId: 1,
            content: "Mock post content about recycling.",
            likes: 152,
            comments: 12,
            creatorUsername: "EcoMock",
            photoUrl: null,
          },
          {
            postId: 2,
            content: "Another mock post here.",
            likes: 98,
            comments: 25,
            creatorUsername: "GreenMock",
            photoUrl: null,
          },
        ]);
        return;
      }
      try {
        const res = await apiRequest("/api/posts/mostLiked?size=4", {
          auth: false,
        });
        if (!res.ok) throw new Error("Failed to fetch trending posts");
        const data = (await res.json()) as TrendingPost[];
        setTrendingPosts(data);
      } catch (err) {
        console.warn("Unable to load trending posts", err);
      }
    };
    fetchTrending();
  }, []);

  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem("token");
      const storedUser = await AsyncStorage.getItem("username");
      if (token && storedUser) {
        setUserType("user");
        setUsername(storedUser);
        setLoggedIn(true);
        navigation.navigate("explore");
      }
    })();
  }, []);

  useEffect(() => {
    if (route.params?.error) {
      showError("errorGeneric");
      navigation.setParams?.({ error: undefined });
    }
  }, [route.params?.error]);

  useFocusEffect(
    React.useCallback(() => {
      if (loggedIn) navigation.navigate("explore");
    }, [loggedIn])
  );

  // Only accepts translation keys to show user-friendly translated messages
  const showError = (translationKey: string) => {
    const translatedMessage = t(translationKey);
    setErrorMessage(translatedMessage);
    setErrorVisible(true);
    setTimeout(() => setErrorVisible(false), 5000);
  };

  const sendLoginRequest = async (emailOrUsername: string, pwd: string) => {
    if (MOCK_API) {
      // Dev-only happy path for quick testing
      if (emailOrUsername === "user" && pwd === "password123") {
        await AsyncStorage.multiSet([
          ["token", "mock-auth-token-12345"],
          ["username", "mockUser"],
        ]);
        setUserType("user");
        setUsername("mockUser");
        setLoggedIn(true);
        navigation.navigate("explore");
      } else {
        showError("errorInvalidCredentials");
      }
      return;
    }

    if (!emailOrUsername.trim() || pwd.length < 8) {
      return showError("errorFillCredentials");
    }

    try {
      const result = await loginRequest(emailOrUsername, pwd);
      setUserType("user");
      setUsername(result.username);
      setLoggedIn(true);
      navigation.navigate("explore");
    } catch (error: any) {
      showError("errorInvalidCredentials");
    }
  };

  const sendRegisterRequest = async (
    regUsername: string,
    regEmail: string,
    regPass: string
  ) => {
    if (!regUsername.trim() || !regEmail.includes("@") || regPass.length < 8) {
      return showError("errorFillCredentials");
    }
    if (passwordStrength.score <= 2) {
      return showError("errorPasswordTooWeak");
    }
    if (regPass !== confirmPassword) {
      return showError("errorPasswordsDontMatch");
    }
    if (!kvkkChecked) {
      return showError("errorAcknowledgeKvkk");
    }

    if (MOCK_API) {
      setIsRegistering(false);
      setUsernameInput(regUsername);
      setKvkkChecked(false);
      showError("registrationSuccess");
      return;
    }

    try {
      await registerRequest(regUsername, regEmail, regPass);
      setIsRegistering(false);
      setUsernameInput(regUsername);
      setKvkkChecked(false);
      showError("registrationSuccess");
    } catch (err: any) {
      showError("errorRegistrationFailed");
    }
  };

  const continueAsGuest = () => {
    setUserType("guest");
    setUsername("");
    setLoggedIn(false);
    navigation.navigate("explore");
  };

  const evaluatePasswordStrength = (value: string) => {
    const score =
      (value.length >= 8 ? 1 : 0) +
      (/[A-Z]/.test(value) ? 1 : 0) +
      (/[0-9]/.test(value) ? 1 : 0) +
      (/[^A-Za-z0-9]/.test(value) ? 1 : 0) +
      (value.length >= 12 ? 1 : 0);
    if (!value) return { label: 'Very weak', color: '#D32F2F', score: 0 };
    if (score <= 1) return { label: 'Very weak', color: '#D32F2F', score };
    if (score === 2) return { label: 'Weak', color: '#F44336', score };
    if (score === 3) return { label: 'Fair', color: '#FBC02D', score };
    if (score === 4) return { label: 'Good', color: '#66BB6A', score };
    return { label: 'Strong', color: '#2E7D32', score };
  };

  return (
    <>
      <ParallaxScrollView
        headerBackgroundColor={{ light: "#FFFFFF", dark: "#000000" }}
        headerImage={
          <Image
            source={require("@/assets/images/wasteless-logo.png")}
            style={styles.recycleLogo}
          />
        }
      >
        <TouchableOpacity
          style={styles.languageToggleContainer}
          onPress={() => toggleLanguage(!isTurkish)}
          accessible={true}
          accessibilityRole="none"
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
              thumbColor={isTurkish ? "#f5dd4b" : "#f4f3f4"}
              ios_backgroundColor="#3e3e3e"
              onValueChange={(value) => {
                void toggleLanguage(value);
              }}
              value={isTurkish}
            />
          </View>
          <Text style={styles.languageLabel}>TR</Text>
        </TouchableOpacity>

        {!showAuthFields && (
          <>
            <View style={styles.statsContainer}>
              <ThemedText style={styles.statLine}>
                <Text style={styles.statNumber}>{displayedUsersCount}</Text>{" "}
                {t("usersAreReducingWastes", { count: displayedUsersCount })}
              </ThemedText>

              <ThemedText style={styles.sectionTitle}>
                {t("trendingPosts")}
              </ThemedText>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.trendingRow}
                style={styles.trendingContainer}
              >
                {trendingPosts.map((post) => {
                  const initials =
                    post.creatorUsername?.substring(0, 2).toUpperCase() ?? "US";
                  const imageUri = post.photoUrl
                    ? post.photoUrl.startsWith("http")
                      ? post.photoUrl
                      : `${API_BASE_URL}${post.photoUrl}`
                    : null;

                  return (
                    <View
                      key={post.postId}
                      style={[styles.trendingCard, { backgroundColor: postBg }]}
                    >
                      <View style={styles.trendingHeaderRow}>
                        <View style={styles.trendingAvatar}>
                          <Text style={styles.trendingAvatarText}>{initials}</Text>
                        </View>
                        <View style={styles.trendingHeaderText}>
                          <AccessibleText
                            backgroundColor={postBg}
                            style={styles.trendingName}
                          >
                            {post.creatorUsername}
                          </AccessibleText>
                          <Text style={styles.trendingSubtitle}>
                            {t("trendingCardSubtitle", {
                              defaultValue: "Community member",
                            })}
                          </Text>
                        </View>
                      </View>

                      {post.content ? (
                        <AccessibleText
                          backgroundColor={postBg}
                          style={[styles.trendingContent, { color: postTextColor }]}
                          numberOfLines={3}
                        >
                          {post.content}
                        </AccessibleText>
                      ) : null}

                      {imageUri && (
                        <Image
                          source={{ uri: imageUri }}
                          style={styles.trendingImage}
                          onError={(e) =>
                            console.warn(
                              "Image failed to load:",
                              e.nativeEvent.error
                            )
                          }
                        />
                      )}

                      <View style={styles.trendingFooter}>
                        <View style={styles.trendingStat}>
                          <Ionicons name="heart-outline" size={14} color="#FF6B6B" />
                          <AccessibleText
                            backgroundColor={postBg}
                            style={styles.trendingStatText}
                          >
                            {post.likes}
                          </AccessibleText>
                        </View>
                        <View style={styles.trendingStat}>
                          <Ionicons name="chatbubble-outline" size={14} color="#FFFFFF" />
                          <AccessibleText
                            backgroundColor={postBg}
                            style={styles.trendingStatText}
                          >
                            {post.comments}
                          </AccessibleText>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
            </View>

            <View style={[styles.buttonsColumn, { marginTop: -5 }]}>
              <TouchableOpacity
                style={[
                  styles.authButtonFull,
                  { backgroundColor: loginBg, borderColor: themeColors.borderColor },
                ]}
                onPress={() => {
                  setShowAuthFields(true);
                  setIsRegistering(false);
                }}
              >
                <Text style={[styles.authText, { color: loginTextColor }]}>
                  {t("logIn")}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.authButtonFull,
                  { backgroundColor: registerBg, borderColor: themeColors.borderColor },
                ]}
                onPress={() => {
                  setShowAuthFields(true);
                  setIsRegistering(true);
                }}
              >
                <Text style={[styles.authText, { color: registerTextColor }]}> 
                  {t("register")}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.continueButton,
                  { backgroundColor: continueBg, borderColor: continueBg },
                ]}
                onPress={continueAsGuest}
              >
                <Text style={[styles.authText, { color: continueTextColor }]}> 
                  {t("continueAsGuest")}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {showAuthFields && (
          <>
            <Text style={[styles.modeHeader, { color: themeColors.text }]}> 
              {isRegistering ? t("createAccount") : t("loginHere")}
            </Text>

            <TextInput
              style={[
                styles.input,
                { color: themeColors.inputText, backgroundColor: themeColors.inputBackground, borderColor: themeColors.inputBorder },
              ]}
              onChangeText={setUsernameInput}
              placeholder={isRegistering ? t("username") : t("emailOrUsername")}
              placeholderTextColor={themeColors.inputPlaceholder ?? '#888'}
              value={usernameInput}
              autoCapitalize="none"
            />

            {isRegistering && (
              <TextInput
                style={[styles.input, styles.inputLight]}
                onChangeText={setEmail}
                placeholder={t("email")}
                placeholderTextColor="#888"
                value={email}
                autoCapitalize="none"
              />
            )}

            <View>
              <TextInput
                style={[
                  styles.input,
                  styles.passwordInput,
                  { color: themeColors.inputText, backgroundColor: themeColors.inputBackground, borderColor: themeColors.inputBorder },
                ]}
                onChangeText={(value) => {
                  setPassword(value);
                  setPasswordStrength(evaluatePasswordStrength(value));
                }}
                placeholder={t("password")}
                placeholderTextColor={themeColors.inputPlaceholder ?? '#888'}
                secureTextEntry
                value={password}
              />
              {isRegistering && (
                <View style={styles.passwordStrengthContainer}>
                  <View style={styles.passwordStrengthBarBackground}>
                    <View
                      style={[
                        styles.passwordStrengthBarFill,
                        {
                          backgroundColor: passwordStrength.color,
                          width: `${(passwordStrength.score / 5) * 100}%`,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.passwordStrengthLabel, { color: passwordStrength.color }]}>
                    {t(passwordStrength.label.replace(' ', '').toLowerCase(), {
                      defaultValue: passwordStrength.label,
                    })}
                  </Text>
                </View>
              )}
            </View>

            {!isRegistering && sustainabilityFact && (
              <View
                style={[
                  styles.factBox,
                  {
                    backgroundColor: themeColors.cardBackground,
                    borderColor: themeColors.borderColor,
                  },
                ]}
              >
                <Text style={[styles.factText, { color: themeColors.text }]}>
                  {isTurkish ? sustainabilityFact.tr : sustainabilityFact.en}
                </Text>
                <Text
                  style={[
                    styles.factSource,
                    {
                      color:
                        themeColors.textSubtle ??
                        themeColors.textSecondary ??
                        "#555",
                    },
                  ]}
                >
                  {sustainabilityFact.source}
                </Text>
              </View>
            )}

            {isRegistering && (
              <>
                <TextInput
                  style={[
                    styles.input,
                    styles.confirmInput,
                    { color: themeColors.inputText, backgroundColor: themeColors.inputBackground, borderColor: themeColors.inputBorder },
                  ]}
                  onChangeText={setConfirmPassword}
                  placeholder={t("confirmPassword")}
                  placeholderTextColor={themeColors.inputPlaceholder ?? '#888'}
                  secureTextEntry
                  value={confirmPassword}
                />

                <View style={styles.kvkkRow}>
                  <CheckBox
                    checked={kvkkChecked}
                    onPress={() => setKvkkChecked(!kvkkChecked)}
                  />
                  <Text style={[styles.kvkkText, { color: themeColors.text }]}>
                    {t("kvkkAcknowledge")}
                  </Text>
                </View>
              </>
            )}

            <View style={styles.buttonsColumn}>
              {isRegistering ? (
                <>
                  <TouchableOpacity
                    style={[
                      styles.authButtonFull,
                      { backgroundColor: registerBg, borderColor: themeColors.borderColor },
                    ]}
                    onPress={() =>
                      sendRegisterRequest(usernameInput, email, password)
                    }
                  >
                    <Text style={[styles.authText, { color: registerTextColor }]}>
                      {t("register")}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.authButtonFull,
                      { backgroundColor: loginBg, borderColor: themeColors.borderColor },
                    ]}
                    onPress={() => setIsRegistering(false)}
                  >
                    <Text style={[styles.authText, { color: loginTextColor }]}>
                      {t("backToLogIn")}
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity
                    style={[
                      styles.authButtonFull,
                      { backgroundColor: loginBg, borderColor: themeColors.borderColor },
                    ]}
                    onPress={() => sendLoginRequest(usernameInput, password)}
                  >
                    <Text style={[styles.authText, { color: loginTextColor }]}>
                      {t("logIn")}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.authButtonFull,
                      { backgroundColor: registerBg, borderColor: themeColors.borderColor },
                    ]}
                    onPress={() => setIsRegistering(true)}
                  >
                    <Text style={[styles.authText, { color: registerTextColor }]}>
                      {t("register")}
                    </Text>
                  </TouchableOpacity>
                </>
              )}
              <TouchableOpacity
                style={[
                  styles.continueButton,
                  { backgroundColor: continueBg, borderColor: continueBg },
                ]}
                onPress={continueAsGuest}
              >
                <Text style={[styles.authText, { color: continueTextColor }]}>
                  {t("continueAsGuest")}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {errorVisible && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}
      </ParallaxScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  languageToggleContainer: {
    position: "absolute",
    top: 8,
    right: 48,
    zIndex: 1,
    flexDirection: "row",
    alignItems: "center",
    padding: 0,
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 20,
  },
  languageLabel: {
    color: "#fff",
    fontWeight: "bold",
    marginHorizontal: 8,
  },
  titleContainer: { flexDirection: "row", alignItems: "center", gap: 8 },
  recycleLogo: {
    width: "115%",
    height: undefined,
    aspectRatio: 290 / 178,
    alignSelf: "center",
  },
  statsContainer: { marginTop: 24, marginHorizontal: 16 },
  statLine: { fontSize: 18, textAlign: "center", marginVertical: 4 },
  statNumber: { fontWeight: "bold", fontSize: 20, color: "#4CAF50" },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 8,
    marginBottom: 8,
  },
  trendingContainer: { marginVertical: 8 },
  trendingRow: { paddingHorizontal: 0, paddingVertical: 6 },
  trendingCard: {
    width: 250,
    minHeight: 220,
    borderRadius: 16,
    padding: 14,
    marginRight: 14,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
    justifyContent: "center",
  },
  trendingHeaderRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  trendingAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  trendingAvatarText: { fontWeight: "700", color: "#1F2933" },
  trendingHeaderText: { flex: 1 },
  trendingName: { fontSize: 15, fontWeight: "700" },
  trendingSubtitle: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  trendingContent: { fontSize: 14, lineHeight: 18, marginBottom: 8 },
  trendingImage: { width: "100%", height: 120, borderRadius: 10, marginBottom: 8, resizeMode: "cover" },
  trendingFooter: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  trendingStat: { flexDirection: "row", alignItems: "center", marginRight: 16 },
  trendingStatText: { marginLeft: 4, fontSize: 13, fontWeight: "600" },
  modeHeader: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginTop: 16,
  },
  input: {
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    marginHorizontal: 16,
    marginVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  inputLight: { color: "#000", backgroundColor: "#fff" },
  buttonsColumn: { marginHorizontal: 16, marginBottom: 8 },
  authButtonFull: {
    width: "100%",
    height: 40,
    marginVertical: 8,
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
    borderColor: "#fff",
    borderWidth: 1,
  },
  registerAreaFull: { backgroundColor: "#2196F3" },
  loginAreaFull: { backgroundColor: "#4CAF50" },
  authText: { color: "#000", fontSize: 16 },
  continueButton: {
    width: "100%",
    height: 40,
    backgroundColor: "#f9f6ee",
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 8,
    borderColor: "#000",
    borderWidth: 1,
  },
  kvkkRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 4,
  },
  kvkkText: {
    marginLeft: 8,
    fontSize: 14,
    lineHeight: 20,
  },
  errorBox: {
    position: "absolute",
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: "red",
    padding: 12,
    borderRadius: 4,
    alignItems: "center",
  },
  errorText: { color: "#fff", fontSize: 14, textAlign: "center" },
  passwordStrengthContainer: { marginTop: 8, marginBottom: 4, marginHorizontal: 16, alignItems: 'center' },
  passwordStrengthBarBackground: { height: 4, borderRadius: 3, backgroundColor: '#E0E0E0', overflow: 'hidden', width: '50%' },
  passwordStrengthBarFill: { height: '100%', borderRadius: 3 },
  passwordStrengthLabel: { marginTop: 4, fontSize: 12, fontWeight: '600', textAlign: 'center' },
  passwordInput: { marginBottom: 0 },
  confirmInput: { marginTop: -10 },
  factBox: {
    marginHorizontal: 16,
    marginVertical: 10,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  factText: { fontSize: 14, lineHeight: 19 },
  factSource: { marginTop: 6, fontSize: 12, lineHeight: 16, fontStyle: "italic" },
});
