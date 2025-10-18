// app/(tabs)/index.tsx
import React, { useState, useEffect, useContext, useRef } from 'react';
import {
  Image,
  StyleSheet,
  TextInput,
  View,
  TouchableOpacity,
  Text,
  Switch,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import { AuthContext } from '../_layout';
import { API_BASE_URL } from '../apiConfig';
import {
  apiRequest,
  login as loginRequest,
  register as registerRequest,
} from '../services/apiClient';
import CheckBox from '../components/CheckBox';
import { useTranslation } from 'react-i18next';

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

export default function HomeScreen() {
  const navigation = useNavigation<Navigation>();
  const route = useRoute<any>();
  const { setUserType, setUsername } = useContext(AuthContext);

  const { t, i18n } = useTranslation();
  const isTurkish = (i18n.resolvedLanguage || i18n.language || '')
    .toLowerCase()
    .startsWith('tr');
  const toggleLanguage = (value: boolean) =>
    i18n.changeLanguage(value ? 'tr-TR' : 'en-US');

  const [showAuthFields, setShowAuthFields] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  const [usernameInput, setUsernameInput] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [kvkkChecked, setKvkkChecked] = useState(false);

  const [loggedIn, setLoggedIn] = useState(false);
  const [errorVisible, setErrorVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [usersCount, setUsersCount] = useState<number>(0);
  const [displayedUsersCount, setDisplayedUsersCount] = useState<number>(0);
  const userCountAnimationRef = useRef<NodeJS.Timeout | null>(null);
  const displayedCountRef = useRef<number>(0);
  const [trendingPosts, setTrendingPosts] = useState<TrendingPost[]>([]);

  useEffect(() => {
    const fetchUserCount = async () => {
      try {
        const res = await apiRequest('/api/users/count', {
          method: 'GET',
          auth: false,
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          return console.warn(body.message || 'Could not fetch user count');
        }
        const userCount = body.userCount ?? 0;
        setUsersCount(userCount);
      } catch (err) {
        console.warn('Network error while fetching user count', err);
      }
    };
    fetchUserCount();
  }, []);

  useEffect(() => {
    displayedCountRef.current = displayedUsersCount;
  }, [displayedUsersCount]);

  useEffect(() => {
    const target = usersCount;
    if (typeof jest !== 'undefined') {
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
            content: 'Mock post content about recycling.',
            likes: 152,
            comments: 12,
            creatorUsername: 'EcoMock',
            photoUrl: null,
          },
          {
            postId: 2,
            content: 'Another mock post here.',
            likes: 98,
            comments: 25,
            creatorUsername: 'GreenMock',
            photoUrl: null,
          },
        ]);
        return;
      }
      try {
        const res = await apiRequest('/api/posts/mostLiked?size=4', {
          auth: false,
        });
        if (!res.ok) throw new Error('Failed to fetch trending posts');
        const data = (await res.json()) as TrendingPost[];
        setTrendingPosts(data);
      } catch (err) {
        console.warn('Unable to load trending posts', err);
      }
    };
    fetchTrending();
  }, []);

  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem('token');
      const storedUser = await AsyncStorage.getItem('username');
      if (token && storedUser) {
        setUserType('user');
        setUsername(storedUser);
        setLoggedIn(true);
        navigation.navigate('explore');
      }
    })();
  }, []);

  useEffect(() => {
    if (route.params?.error) {
      setErrorMessage(route.params.error);
      setErrorVisible(true);
      setTimeout(() => setErrorVisible(false), 5000);
      navigation.setParams?.({ error: undefined });
    }
  }, [route.params?.error]);

  useFocusEffect(
    React.useCallback(() => {
      if (loggedIn) navigation.navigate('explore');
    }, [loggedIn])
  );

  // Accepts either an i18n key or a literal message; preserves translations.
  const showError = (msgKeyOrText: string) => {
    const maybeTranslated = t(msgKeyOrText);
    const safeText =
      typeof maybeTranslated === 'string' && maybeTranslated !== msgKeyOrText
        ? maybeTranslated
        : msgKeyOrText;
    setErrorMessage(safeText);
    setErrorVisible(true);
    setTimeout(() => setErrorVisible(false), 5000);
  };

  const sendLoginRequest = async (emailOrUsername: string, pwd: string) => {
    if (MOCK_API) {
      // Dev-only happy path for quick testing
      if (emailOrUsername === 'user' && pwd === 'password123') {
        await AsyncStorage.multiSet([
          ['token', 'mock-auth-token-12345'],
          ['username', 'mockUser'],
        ]);
        setUserType('user');
        setUsername('mockUser');
        setLoggedIn(true);
        navigation.navigate('explore');
      } else {
        showError('errorInvalidCredentials');
      }
      return;
    }

    if (!emailOrUsername.trim() || pwd.length < 8) {
      return showError('errorFillCredentials');
    }

    try {
      const result = await loginRequest(emailOrUsername, pwd);
      setUserType('user');
      setUsername(result.username);
      setLoggedIn(true);
      navigation.navigate('explore');
    } catch (error: any) {
      console.error('Network/login exception:', error);
      const message =
        error instanceof Error && error.message
          ? error.message
          : t('errorInvalidCredentials');
      showError(message);
    }
  };

  const sendRegisterRequest = async (
    regUsername: string,
    regEmail: string,
    regPass: string
  ) => {
    if (!regUsername.trim() || !regEmail.includes('@') || regPass.length < 8) {
      return showError('errorFillCredentials');
    }
    if (regPass !== confirmPassword) {
      return showError('errorPasswordsDontMatch');
    }
    if (!kvkkChecked) {
      return showError('errorAcknowledgeKvkk');
    }

    if (MOCK_API) {
      setIsRegistering(false);
      setUsernameInput(regUsername);
      setKvkkChecked(false);
      showError('registrationSuccess');
      return;
    }

    try {
      await registerRequest(regUsername, regEmail, regPass);
      setIsRegistering(false);
      setUsernameInput(regUsername);
      setKvkkChecked(false);
      showError('registrationSuccessPromptLogin'); // e.g., "Registered! Please log in."
    } catch (err: any) {
      console.error('Registration exception:', err);
      showError(
        err instanceof Error && err.message ? err.message : t('errorRegistrationFailed')
      );
    }
  };

  const continueAsGuest = () => {
    setUserType('guest');
    setUsername('');
    setLoggedIn(false);
    navigation.navigate('explore');
  };

  return (
    <>
      <ParallaxScrollView
        headerBackgroundColor={{ light: '#FFFFFF', dark: '#000000' }}
        headerImage={
          <Image
            source={require('@/assets/images/wasteless-logo.png')}
            style={styles.recycleLogo}
          />
        }
      >
        <View style={styles.languageToggleContainer}>
          <Text style={styles.languageLabel}>EN</Text>
          <Switch
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={isTurkish ? '#f5dd4b' : '#f4f3f4'}
            ios_backgroundColor="#3e3e3e"
            onValueChange={(value) => {
              void toggleLanguage(value);
            }}
            value={isTurkish}
          />
          <Text style={styles.languageLabel}>TR</Text>
        </View>

        {!showAuthFields && (
          <>
            <View style={styles.statsContainer}>
              <ThemedText style={styles.statLine}>
                <Text style={styles.statNumber}>{displayedUsersCount}</Text>{' '}
                {t('usersAreReducingWastes', { count: displayedUsersCount })}
              </ThemedText>

              <ThemedText style={styles.sectionTitle}>
                {t('trendingPosts')}
              </ThemedText>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.trendingContainer}
              >
                {trendingPosts.map((post) => (
                  <View key={post.postId} style={styles.postContainer}>
                    <ThemedText type="title" style={styles.postTitle}>
                      {post.creatorUsername}
                    </ThemedText>

                    <ThemedText style={styles.postContent} numberOfLines={3}>
                      {post.content}
                    </ThemedText>

                    {post.photoUrl && (
                      <Image
                        source={{
                          uri: post.photoUrl.startsWith('http')
                            ? post.photoUrl
                            : `${API_BASE_URL}${post.photoUrl}`,
                        }}
                        style={styles.postImage}
                        onError={(e) =>
                          console.warn('Image failed to load:', e.nativeEvent.error)
                        }
                      />
                    )}

                    <View style={styles.postFooter}>
                      <Ionicons name="heart-outline" size={16} />
                      <ThemedText style={styles.footerText}>
                        {post.likes}
                      </ThemedText>
                      <Ionicons name="chatbubble-outline" size={16} />
                      <ThemedText style={styles.footerText}>
                        {post.comments}
                      </ThemedText>
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>

            <View style={[styles.buttonsColumn, { marginTop: -5 }]}>
              <TouchableOpacity
                style={[styles.authButtonFull, styles.loginAreaFull]}
                onPress={() => {
                  setShowAuthFields(true);
                  setIsRegistering(false);
                }}
              >
                <Text style={styles.authText}>{t('logIn')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.authButtonFull, styles.registerAreaFull]}
                onPress={() => {
                  setShowAuthFields(true);
                  setIsRegistering(true);
                }}
              >
                <Text style={styles.authText}>{t('register')}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.continueButton} onPress={continueAsGuest}>
                <Text style={styles.authText}>{t('continueAsGuest')}</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {showAuthFields && (
          <>
            <Text style={styles.modeHeader}>
              {isRegistering ? t('createAccount') : t('loginHere')}
            </Text>

            <TextInput
              style={[styles.input, styles.inputLight]}
              onChangeText={setUsernameInput}
              placeholder={
                isRegistering ? t('username') : t('emailOrUsername')
              }
              placeholderTextColor="#888"
              value={usernameInput}
              autoCapitalize="none"
            />

            {isRegistering && (
              <TextInput
                style={[styles.input, styles.inputLight]}
                onChangeText={setEmail}
                placeholder={t('email')}
                placeholderTextColor="#888"
                value={email}
                autoCapitalize="none"
              />
            )}

            <TextInput
              style={[styles.input, styles.inputLight]}
              onChangeText={setPassword}
              placeholder={t('password')}
              placeholderTextColor="#888"
              secureTextEntry
              value={password}
            />

            {isRegistering && (
              <>
                <TextInput
                  style={[styles.input, styles.inputLight]}
                  onChangeText={setConfirmPassword}
                  placeholder={t('confirmPassword')}
                  placeholderTextColor="#888"
                  secureTextEntry
                  value={confirmPassword}
                />

                <View style={styles.kvkkRow}>
                  <CheckBox
                    checked={kvkkChecked}
                    onPress={() => setKvkkChecked(!kvkkChecked)}
                  />
                  <Text style={styles.kvkkText}>{t('kvkkAcknowledge')}</Text>
                </View>
              </>
            )}

            <View style={styles.buttonsColumn}>
              {isRegistering ? (
                <>
                  <TouchableOpacity
                    style={[styles.authButtonFull, styles.registerAreaFull]}
                    onPress={() =>
                      sendRegisterRequest(usernameInput, email, password)
                    }
                  >
                    <Text style={styles.authText}>{t('register')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.authButtonFull, styles.loginAreaFull]}
                    onPress={() => setIsRegistering(false)}
                  >
                    <Text style={styles.authText}>{t('backToLogIn')}</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity
                    style={[styles.authButtonFull, styles.loginAreaFull]}
                    onPress={() => sendLoginRequest(usernameInput, password)}
                  >
                    <Text style={styles.authText}>{t('logIn')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.authButtonFull, styles.registerAreaFull]}
                    onPress={() => setIsRegistering(true)}
                  >
                    <Text style={styles.authText}>{t('register')}</Text>
                  </TouchableOpacity>
                </>
              )}
              <TouchableOpacity style={styles.continueButton} onPress={continueAsGuest}>
                <Text style={styles.authText}>{t('continueAsGuest')}</Text>
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
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
  },
  languageLabel: {
    color: '#fff',
    fontWeight: 'bold',
    marginHorizontal: 8,
  },
  titleContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  recycleLogo: { width: '115%', height: undefined, aspectRatio: 290 / 178, alignSelf: 'center' },
  statsContainer: { marginTop: 24, marginHorizontal: 16 },
  statLine: { fontSize: 18, textAlign: 'center', marginVertical: 4 },
  statNumber: { fontWeight: 'bold', fontSize: 20, color: '#4CAF50' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 8, marginBottom: 8 },
  trendingContainer: { height: 260, marginVertical: 8 },
  postContainer: {
    width: 250,
    height: 240,
    marginRight: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  postTitle: { fontSize: 16, fontWeight: 'bold', marginTop: -5, color: '#000' },
  postContent: { fontSize: 14, marginTop: -20, color: '#000' },
  postImage: { width: '100%', aspectRatio: 16 / 9, maxHeight: 120, borderRadius: 6, resizeMode: 'cover' },
  postFooter: { flexDirection: 'row', alignItems: 'center' },
  footerText: { fontSize: 12, marginHorizontal: 4, color: '#000' },
  modeHeader: { fontSize: 20, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginTop: 16 },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    marginHorizontal: 16,
    marginVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  inputLight: { color: '#000', backgroundColor: '#fff' },
  buttonsColumn: { marginHorizontal: 16, marginBottom: 8 },
  authButtonFull: {
    width: '100%',
    height: 40,
    marginVertical: 8,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: '#fff',
    borderWidth: 1,
  },
  registerAreaFull: { backgroundColor: '#2196F3' },
  loginAreaFull: { backgroundColor: '#4CAF50' },
  authText: { color: '#000', fontSize: 16 },
  continueButton: {
    width: '100%',
    height: 40,
    backgroundColor: '#f9f6ee',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 8,
    borderColor: '#000',
    borderWidth: 1,
  },
  kvkkRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginTop: 4 },
  kvkkText: { marginLeft: 8, color: '#fff' },
  errorBox: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: 'red',
    padding: 12,
    borderRadius: 4,
    alignItems: 'center',
  },
  errorText: { color: '#fff', fontSize: 14, textAlign: 'center' },
});
