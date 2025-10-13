// app/(tabs)/index.tsx
import React, { useState, useEffect, useContext } from 'react';
import {
  Image,
  StyleSheet,
  TextInput,
  View,
  TouchableOpacity,
  Text,
  Switch, // Import Switch for the toggle
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import { AuthContext } from '../_layout';
import { API_BASE_URL } from '../apiConfig';
import { ScrollView } from 'react-native';
import CheckBox from '../components/CheckBox';

// --- I18N ---
import { useTranslation } from 'react-i18next';
// --- END I18N ---

const MOCK_API = true; // Set to true to use mock data instead of real API calls.
// user
// password123

const API_BASE = `${API_BASE_URL}/api/auth`;


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

  // --- I18N ---
  const { t, i18n } = useTranslation();
  //const [isTurkish, setIsTurkish] = useState(i18n.language.startsWith('tr'));
  //const toggleLanguage = (value: boolean) => {
  //  const lang = value ? 'tr-TR' : 'en-US';
  //  i18n.changeLanguage(lang);
  //  setIsTurkish(value);
  //};
  const isTurkish = (i18n.resolvedLanguage || i18n.language || '').toLowerCase().startsWith('tr');
 const toggleLanguage = (value: boolean) => i18n.changeLanguage(value ? 'tr-TR' : 'en-US');
  // --- END I18N ---

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
  const [trendingPosts, setTrendingPosts] = useState<TrendingPost[]>([]);

  useEffect(() => {
    const fetchUserCount = async () => {
      if (MOCK_API) {
        setUsersCount(57492);
        return;
      }
      try {
        const token = await AsyncStorage.getItem('token');
        const res = await fetch(`${API_BASE_URL}/api/users/count`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        const body = await res.json().catch(() => ({}));
        if (res.ok) {
          setUsersCount(body.userCount ?? 0);
        }
      } catch (err) {
        console.warn('Network error while fetching user count', err);
      }
    };
    fetchUserCount();
  }, []);

  useEffect(() => {
    const fetchTrending = async () => {
      if (MOCK_API) {
        setTrendingPosts([
          { postId: 1, content: "Mock post content about recycling.", likes: 152, comments: 12, creatorUsername: 'EcoMock', photoUrl: null },
          { postId: 2, content: "Another mock post here.", likes: 98, comments: 25, creatorUsername: 'GreenMock', photoUrl: null },
        ]);
        return;
      }
      try {
        const res = await fetch(`${API_BASE_URL}/api/posts/mostLikedPosts?size=4`);
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

  const showError = (msgKey: string) => {
    setErrorMessage(t(msgKey));
    setErrorVisible(true);
    setTimeout(() => setErrorVisible(false), 5000);
  };

  const sendLoginRequest = async (emailOrUsername: string, pwd: string) => {
    if (MOCK_API) {
        console.log(' MOCKING: Simulating login request.');
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
      const res = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrUsername, password: pwd }),
      });

      if (!res.ok) {
        return showError("errorInvalidCredentials");
      }

      const { token, username } = (await res.json()) as { token: string; username: string; };
      await AsyncStorage.multiSet([['token', token], ['username', username]]);
      setUserType('user');
      setUsername(username);
      setLoggedIn(true);
    } catch (error: any) {
      showError('Network error, please try again');
    }
  };

  const sendRegisterRequest = async (regUsername: string, regEmail: string, regPass: string) => {
    if (!regUsername.trim() || !regEmail.includes('@') || regPass.length < 8) {
      return showError('errorFillCredentials');
    }
    if (regPass !== confirmPassword) {
      return showError("errorPasswordsDontMatch");
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
      const res = await fetch(`${API_BASE}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: regUsername, email: regEmail, password: regPass }),
      });
      if (!res.ok) {
        const err = await res.json();
        return showError(err.message || 'Registration failed');
      }
      const { username: u } = (await res.json()) as { username: string; };
      await AsyncStorage.setItem('username', u);
      setIsRegistering(false);
      setUsernameInput(u);
      setKvkkChecked(false);
      showError('registrationSuccess');
    } catch {
      showError('Network error, please try again');
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
        headerImage={<Image source={require('@/assets/images/wasteless-logo.png')} style={styles.recycleLogo} />}
      >
        <View style={styles.languageToggleContainer}>
          <Text style={styles.languageLabel}>EN</Text>
          <Switch
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={isTurkish ? '#f5dd4b' : '#f4f3f4'}
            ios_backgroundColor="#3e3e3e"
            onValueChange={value => { void toggleLanguage(value); }}
            value={isTurkish}
          />
          <Text style={styles.languageLabel}>TR</Text>
        </View>

        {!showAuthFields && (
          <>
            <View style={styles.statsContainer}>
              <ThemedText style={styles.statLine}>
                <Text style={styles.statNumber}>{usersCount}</Text>{' '}
                {t('usersAreReducingWastes', { count: usersCount })}
              </ThemedText>
              <ThemedText style={styles.sectionTitle}>{t('trendingPosts')}</ThemedText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.trendingContainer}>
                {trendingPosts.map(post => (
                  <View key={post.postId} style={styles.postContainer}>
                    <ThemedText type="title" style={styles.postTitle}>{post.creatorUsername}</ThemedText>
                    <ThemedText style={styles.postContent} numberOfLines={3}>{post.content}</ThemedText>
                    {post.photoUrl && <Image source={{ uri: post.photoUrl }} style={styles.postImage} />}
                    <View style={styles.postFooter}>
                      <Ionicons name="heart-outline" size={16} />
                      <ThemedText style={styles.footerText}>{post.likes}</ThemedText>
                      <Ionicons name="chatbubble-outline" size={16} />
                      <ThemedText style={styles.footerText}>{post.comments}</ThemedText>
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>

            <View style={[styles.buttonsColumn, { marginTop: -5 }]}>
              <TouchableOpacity style={[styles.authButtonFull, styles.loginAreaFull]} onPress={() => { setShowAuthFields(true); setIsRegistering(false); }}>
                <Text style={styles.authText}>{t('logIn')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.authButtonFull, styles.registerAreaFull]} onPress={() => { setShowAuthFields(true); setIsRegistering(true); }}>
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
            <Text style={styles.modeHeader}>{isRegistering ? t('createAccount') : t('loginHere')}</Text>
            <TextInput
              style={[styles.input, styles.inputLight]}
              onChangeText={setUsernameInput}
              placeholder={isRegistering ? t('username') : t('emailOrUsername')}
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
                  <CheckBox checked={kvkkChecked} onPress={() => setKvkkChecked(!kvkkChecked)} />
                  <Text style={styles.kvkkText}>{t('kvkkAcknowledge')}</Text>
                </View>
              </>
            )}

            <View style={styles.buttonsColumn}>
              {isRegistering ? (
                <>
                  <TouchableOpacity style={[styles.authButtonFull, styles.registerAreaFull]} onPress={() => sendRegisterRequest(usernameInput, email, password)}>
                    <Text style={styles.authText}>{t('register')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.authButtonFull, styles.loginAreaFull]} onPress={() => setIsRegistering(false)}>
                    <Text style={styles.authText}>{t('backToLogIn')}</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity style={[styles.authButtonFull, styles.loginAreaFull]} onPress={() => sendLoginRequest(usernameInput, password)}>
                    <Text style={styles.authText}>{t('logIn')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.authButtonFull, styles.registerAreaFull]} onPress={() => setIsRegistering(true)}>
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
    position: 'absolute', // Use absolute positioning
    top: 16,              // Distance from the top
    right: 16,            // Distance from the right
    zIndex: 1,            // Ensure it sits on top of other content
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
  postContainer: { width: 250, height: 240, marginRight: 16, backgroundColor: '#f5f5f5', borderRadius: 8, padding: 12, justifyContent: 'space-between', overflow: 'hidden' },
  postTitle: { fontSize: 16, fontWeight: 'bold', marginTop: -5, color: '#000'},
  postContent: { fontSize: 14, marginTop: -20, color: '#000'},
  postImage: { width: '100%', aspectRatio: 16 / 9, maxHeight: 120, borderRadius: 6, resizeMode: 'cover' },
  postFooter: { flexDirection: 'row', alignItems: 'center' },
  footerText: { fontSize: 12, marginHorizontal: 4, color: '#000' },
  modeHeader: { fontSize: 20, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginTop: 16 },
  input: { height: 40, borderColor: '#ccc', borderWidth: 1, marginHorizontal: 16, marginVertical: 8, paddingHorizontal: 8, borderRadius: 4 },
  inputLight: { color: '#000', backgroundColor: '#fff' },
  buttonsColumn: { marginHorizontal: 16, marginBottom: 8 },
  authButtonFull: { width: '100%', height: 40, marginVertical: 8, borderRadius: 4, justifyContent: 'center', alignItems: 'center', borderColor: '#fff', borderWidth: 1 },
  registerAreaFull: { backgroundColor: '#2196F3' },
  loginAreaFull: { backgroundColor: '#4CAF50' },
  authText: { color: '#000', fontSize: 16 },
  continueButton: { width: '100%', height: 40, backgroundColor: '#f9f6ee', borderRadius: 4, justifyContent: 'center', alignItems: 'center', marginVertical: 8, borderColor: '#000', borderWidth: 1 },
  kvkkRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginTop: 4 },
  kvkkText: { marginLeft: 8, color: '#fff' },
  errorBox: { position: 'absolute', bottom: 20, left: 16, right: 16, backgroundColor: 'red', padding: 12, borderRadius: 4, alignItems: 'center' },
  errorText: { color: '#fff', fontSize: 14, textAlign: 'center' },
});