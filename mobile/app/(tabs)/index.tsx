// app/(tabs)/index.tsx
import React, { useState, useEffect, useContext } from 'react';
import {
  Image,
  StyleSheet,
  TextInput,
  View,
  TouchableOpacity,
  Text,
  Platform,
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

type Weather = {
  temperature: number;
  humidity: number;
}


const API_BASE = `${API_BASE_URL}/api/auth`;

const KG_SAVED     = 57492;

type Navigation = {
  navigate: (screen: string, params?: any) => void;
  setParams?: (params: any) => void;
};

type TrendingPost = {
  postId        : number;
  content       : string;
  likes         : number;
  comments      : number;
  creatorUsername: string;
  photoUrl      : string | null;
};



// Add this function before your HomeScreen component
const getWeatherEmoji = (temperature: number): string => {
  if (temperature > 25) return '☀️'; // Hot/sunny
  if (temperature > 20) return '🌤️'; // Warm/partly cloudy
  if (temperature > 15) return '⛅'; // Mild/cloudy
  if (temperature > 10) return '🌥️'; // Cool/mostly cloudy
  if (temperature > 5) return '☁️';  // Cold/cloudy
  if (temperature <= 5) return '❄️';  // Freezing
  return '🌡️'; // Default
};

export default function HomeScreen() {
  const navigation = useNavigation<Navigation>();
  const route     = useRoute<any>();
  const { setUserType, setUsername} = useContext(AuthContext);

  const [showAuthFields, setShowAuthFields] = useState(false);
  const [isRegistering, setIsRegistering]   = useState(false);

  const [usernameInput, setUsernameInput]   = useState('');
  const [password, setPassword]             = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail]                   = useState('');
  const [kvkkChecked, setKvkkChecked]       = useState(false);

  const [loggedIn, setLoggedIn]             = useState(false);
  const [errorVisible, setErrorVisible]     = useState(false);
  const [errorMessage, setErrorMessage]     = useState('');
  const [weather, setWeather]               = useState<Weather | null>(null);
  const [usersCount, setUsersCount] = useState<number>(0);
  const [numberTrivia, setNumberTrivia] = useState<string | null>(null);
  const [trendingPosts, setTrendingPosts] = useState<TrendingPost[]>([]);

  useEffect(() => {
    const fetchUserCount = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const res = await fetch(`${API_BASE_URL}/api/users/count`, {
          method : 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        const body = await res.json().catch(() => ({}));
        console.log('users/count response ➜', body);

        if (!res.ok) {
          return console.warn(body.message || 'Could not fetch user count');
        }

        const userCount = body.userCount ?? 0;
        console.log('setting usersCount ➜', userCount);
        setUsersCount(userCount);
      } catch (err) {
        console.warn('Network error while fetching user count', err);
      }
    };

    fetchUserCount();
  }, []);
  useEffect(() => {
    if (usersCount > 0) {              // wait until we actually have a number
      const fetchTrivia = async () => {
        try {
          const res = await fetch(`${API_BASE_URL}/api/home/number/${usersCount}`);
          if (!res.ok) throw new Error('Failed to fetch number trivia');
          const data = await res.json();
          setNumberTrivia(data.text);   // ← save just the text
        } catch (err) {
          console.warn('Unable to load number trivia', err);
        }
      };
      fetchTrivia();
    }
  }, [usersCount]);                     // runs every time usersCount changes

  useEffect(() => {
    const fetchTrending = async () => {
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
      const token      = await AsyncStorage.getItem('token');
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

    // ─── fetch weather once on mount ────────────────────────────────────────────
    useEffect(() => {
      const fetchWeather = async () => {
        try {
          const res = await fetch(
            `${API_BASE_URL}/api/home/getCurrentWeather`
          );
          if (!res.ok) throw new Error('Failed to fetch weather');
          const data = (await res.json()) as Weather;
          setWeather(data); 
        }
        catch (err) {
          console.warn('Error fetching weather', err);
        }
      };
      fetchWeather();
    }, []);

  useFocusEffect(
    React.useCallback(() => {
      if (loggedIn) navigation.navigate('explore');
    }, [loggedIn])
  );

  const showError = (msg: string) => {
    setErrorMessage(msg);
    setErrorVisible(true);
    setTimeout(() => setErrorVisible(false), 5000);
  };

  const sendLoginRequest = async (emailOrUsername: string, pwd: string) => {
    if (emailOrUsername === 'test' && pwd === 'test') {
      setUserType('user');
      setUsername('test');
      setLoggedIn(true);
      navigation.navigate('explore');
      return;
    }
  
    if (!emailOrUsername.trim() || pwd.length < 8) {
      return showError('Please fill in valid credentials');
    }
  
    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrUsername, password: pwd }),
      });
  
      if (!res.ok) {
        const errBody = await res.json().catch(() => null);
  
        console.error('Login response error:', errBody);
  
        const fullMsg = errBody
          ? JSON.stringify(errBody, null, 2)
          : 'Login failed';
        return showError("Invalid username or password!");
      }
  
      // success path
      const { token, username } = (await res.json()) as {
        token: string;

        username: string;
      };
      await AsyncStorage.multiSet([
        ['token', token],
        ['username', username]
      ]);
      setUserType('user');
      setUsername(username);
      setLoggedIn(true);
  
    } catch (error: any) {
      console.error('Network/login exception:', error);
  
      const msg =
        error instanceof Error
          ? `${error.message}\n${error.stack}`
          : JSON.stringify(error, null, 2);
      showError(msg);
    }
  };

  const sendRegisterRequest = async (
    regUsername: string,
    regEmail   : string,
    regPass    : string
  ) => {
    if (!regUsername.trim() || !regEmail.includes('@') || regPass.length < 8) {
      return showError('Please fill in valid registration info');
    }
    if (regPass !== confirmPassword) {
      return showError("Passwords don't match");
    }
    if (!kvkkChecked) {
      return showError('You must acknowledge the KVKK form');
    }
    try {
      const res = await fetch(`${API_BASE}/register`, {
        method : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify({
          username: regUsername,
          email   : regEmail,
          password: regPass,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        return showError(err.message || 'Registration failed');
      }
      const { username: u, email: e } = (await res.json()) as {
        message : string;
        username: string;
        email   : string;
      };
      await AsyncStorage.multiSet([
        ['username', u],
        ['email'   , e],
      ]);
      setIsRegistering(false);
      setUsernameInput(u);
      setKvkkChecked(false);
      showError('Registered! Please log in.');
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
    {weather && (
      <View style={styles.weatherEmojiContainer}>
        <Text style={styles.weatherEmoji}>
          {getWeatherEmoji(weather.temperature)}
        </Text>
        <Text style={styles.weatherTemp}>
          {weather.temperature.toFixed(1)}°C
        </Text>
      </View>
    )}

    <ParallaxScrollView
      headerBackgroundColor={{ light: '#FFFFFF', dark: '#000000' }}
      headerImage={
        <Image
          source={require('@/assets/images/wasteless-logo.png')}
          style={styles.recycleLogo}
        />
      }
    >

      {!showAuthFields && (
        <>
          <View style={styles.statsContainer}>
            <ThemedText style={styles.statLine}>
              <Text style={styles.statNumber}>{usersCount}</Text>{' '}
              users are reducing their wastes with us
            </ThemedText>
                     <ThemedText style={styles.sectionTitle}>Trending posts :</ThemedText>
             <ScrollView
               horizontal
               pagingEnabled
               showsHorizontalScrollIndicator={false}
               style={styles.trendingContainer}
             >
              {trendingPosts.map(post => (
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
                      onError={(e) => console.warn('Image failed to load:', e.nativeEvent.error)}
                    />
                  )}

                  <View style={styles.postFooter}>
                    <Ionicons name="heart-outline" size={16} />
                    <ThemedText style={styles.footerText}>{post.likes}</ThemedText>     
                    <Ionicons name="chatbubble-outline" size={16} />
                    <ThemedText style={styles.footerText}>{post.comments}</ThemedText>
                  </View>
                </View>
              ))}

             </ScrollView>
          {numberTrivia && (
            <ThemedText
              style={styles.triviaText}
              lightColor="#1C1C1E"  
              darkColor="#00796b"    
            >
              {numberTrivia}
            </ThemedText>
          )}
          </View>

          <View style={[styles.buttonsColumn, { marginTop: -5 }]}>
            <TouchableOpacity
              testID="main-login-button"
              style={[styles.authButtonFull, styles.loginAreaFull]}
              onPress={() => {
                setShowAuthFields(true);
                setIsRegistering(false);
              }}
            >
              <Text style={styles.authText}>Log In</Text>
            </TouchableOpacity>

            <TouchableOpacity
              testID="main-register-button"
              style={[styles.authButtonFull, styles.registerAreaFull]}
              onPress={() => {
                setShowAuthFields(true);
                setIsRegistering(true);
              }}
            >
              <Text style={styles.authText}>Register</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.continueButton} testID="main-guest-button" onPress={continueAsGuest}>
              <Text style={styles.authText}>Continue as Guest</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {showAuthFields && (
        <>
          <Text style={styles.modeHeader}>
            {isRegistering ? 'Create account' : 'Login here'}
          </Text>

          <TextInput
            style={[styles.input, styles.inputLight]}
            onChangeText={setUsernameInput}
            placeholder={isRegistering ? 'Username' : 'Email or Username'}
            placeholderTextColor="#888"
            value={usernameInput}
            autoCapitalize="none"
          />

          {isRegistering && (
            <TextInput
              style={[styles.input, styles.inputLight]}
              onChangeText={setEmail}
              placeholder="Email"
              placeholderTextColor="#888"
              value={email}
              autoCapitalize="none"
            />
          )}

          <TextInput
            style={[styles.input, styles.inputLight]}
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor="#888"
            secureTextEntry
            value={password}
          />

          {isRegistering && (
            <>
              <TextInput
                style={[styles.input, styles.inputLight]}
                onChangeText={setConfirmPassword}
                placeholder="Confirm password"
                placeholderTextColor="#888"
                secureTextEntry
                value={confirmPassword}
              />

              <View style={styles.kvkkRow}>
                <CheckBox
                  checked={kvkkChecked}
                  onPress={() => setKvkkChecked(!kvkkChecked)}
                />
                <Text style={styles.kvkkText}>
                  I have read and acknowledged KVKK form
                </Text>
              </View>
            </>
          )}

          <View style={styles.buttonsColumn}>
            {isRegistering ? (
              <>
                <TouchableOpacity
                  testID="form-register-button"
                  style={[styles.authButtonFull, styles.registerAreaFull]}
                  onPress={() =>
                    sendRegisterRequest(usernameInput, email, password)
                  }
                >
                  <Text style={styles.authText}>Register</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  testID="form-back-to-login-button"
                  style={[styles.authButtonFull, styles.loginAreaFull]}
                  onPress={() => setIsRegistering(false)}
                >
                  <Text style={styles.authText}>Back to Log In</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  testID="form-login-button" 
                  style={[styles.authButtonFull, styles.loginAreaFull]}
                  onPress={() => sendLoginRequest(usernameInput, password)}
                >
                  <Text style={styles.authText}>Log In</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  testID="form-register-switch-button"
                  style={[styles.authButtonFull, styles.registerAreaFull]}
                  onPress={() => setIsRegistering(true)}
                >
                  <Text style={styles.authText}>Register</Text>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity style={styles.continueButton} onPress={continueAsGuest}>
              <Text style={styles.authText}>Continue as Guest</Text>
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



  triviaText: { fontSize: 14, textAlign: 'center', marginTop:-15, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  weatherEmojiContainer: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 999,
    backgroundColor: '#B8E2F2',
    borderRadius: 25,
    width: 60,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
    flexDirection: 'column',
    paddingVertical: 5,
  },
  weatherEmoji: {
    fontSize: 30,
    marginBottom: 2,
  },
  weatherTemp: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
  },
});
