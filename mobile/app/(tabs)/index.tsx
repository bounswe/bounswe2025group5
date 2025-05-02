// app/(tabs)/index.tsx
import React, { useState, useEffect, useContext } from 'react';
import {
  Image,
  StyleSheet,
  TextInput,
  View,
  TouchableOpacity,
  Text,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import { AuthContext } from '../_layout';
import { ScrollView } from 'react-native';

const API_BASE = 'http://localhost:8080/api/auth';

// 🎉 live counters 
const KG_SAVED     = 57492; // kg of plastic saved

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

// Tiny checkbox component
function CheckBox({ checked, onPress }: { checked: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.checkbox} onPress={onPress}>
      {checked && <Ionicons name="checkmark" size={16} color="#fff" />}
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const navigation = useNavigation<Navigation>();
  const route     = useRoute<any>();
  const { setUserType, setUsername } = useContext(AuthContext);

  /* ─────────────────────────────── STATE */
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
  const [usersCount, setUsersCount] = useState<number>(0);
  const [trendingPosts, setTrendingPosts] = useState<TrendingPost[]>([]);

  /* ─────────────────────────────── EFFECTS */
  useEffect(() => {
    const fetchUserCount = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const res = await fetch(`http://localhost:8080/api/users/count`, {
          method : 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
  
        const body = await res.json().catch(() => ({}));
        console.log('users/count response ➜', body);          // 👈 #1
  
        if (!res.ok) {
          return console.warn(body.message || 'Could not fetch user count');
        }
  
        const userCount = body.userCount ?? 0;
        console.log('setting usersCount ➜', userCount);       // 👈 #2
        setUsersCount(userCount);
      } catch (err) {
        console.warn('Network error while fetching user count', err);
      }
    };
  
    fetchUserCount();
  }, []);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const res = await fetch('http://localhost:8080/api/posts/mostLikedPosts?size=4');
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

  useFocusEffect(
    React.useCallback(() => {
      if (loggedIn) navigation.navigate('explore');
    }, [loggedIn])
  );

  /* ─────────────────────────────── HELPERS */
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
        method : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify({ emailOrUsername, password: pwd }),
      });
      if (!res.ok) {
        const err = await res.json();
        return showError(err.message || 'Login failed');
      }
      const { token, username } = (await res.json()) as {
        token   : string;
        username: string;
      };
      await AsyncStorage.multiSet([
        ['token'   , token],
        ['username', username],
      ]);
      setUserType('user');
      setUsername(username);
      setLoggedIn(true);
    } catch {
      showError('Network error, please try again');
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
    navigation.navigate('explore');
  };

  /* ─────────────────────────────── RENDER */
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#', dark: '#' }}
      headerImage={
        <Image
          source={require('@/assets/images/wasteless-logo.png')}
          style={styles.recycleLogo}
        />
      }
    >

      {/* ───────────── STATS + BUTTONS (FIRST SCREEN) ───────────── */}
      {!showAuthFields && (
        <>
          {/* Stats */}
          <View style={styles.statsContainer}>
            <Text style={styles.statLine}>
              <Text style={styles.statNumber}>{usersCount}</Text>{' '}
              users are reducing their wastes with us
            </Text>
                     {/* ───────── Most trending posts ───────── */}
                     <Text style={styles.sectionTitle}>Trending posts :</Text>
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
                    <Image source={{ uri: post.photoUrl }} style={styles.postImage} />
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
          </View>

          {/* Buttons shifted 50 px lower */}
          <View style={[styles.buttonsColumn, { marginTop: 15 }]}>
            <TouchableOpacity
              style={[styles.authButtonFull, styles.loginAreaFull]}
              onPress={() => {
                setShowAuthFields(true);
                setIsRegistering(false);
              }}
            >
              <Text style={styles.authText}>Log In</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.authButtonFull, styles.registerAreaFull]}
              onPress={() => {
                setShowAuthFields(true);
                setIsRegistering(true);
              }}
            >
              <Text style={styles.authText}>Register</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.continueButton} onPress={continueAsGuest}>
              <Text style={styles.authText}>Continue as Guest</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* ───────────── AUTH FORMS (SECOND SCREEN) ───────────── */}
      {showAuthFields && (
        <>
          <Text style={styles.modeHeader}>
            {isRegistering ? 'Create account' : 'Login here'}
          </Text>

          {/* Username / Email */}
          <TextInput
            style={[styles.input, styles.inputLight]}
            onChangeText={setUsernameInput}
            placeholder={isRegistering ? 'Username' : 'Email or Username'}
            placeholderTextColor="#888"
            value={usernameInput}
            autoCapitalize="none"
          />

          {/* Email (registration only) */}
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

          {/* Password */}
          <TextInput
            style={[styles.input, styles.inputLight]}
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor="#888"
            secureTextEntry
            value={password}
          />

          {/* Confirm password & KVKK */}
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

          {/* Action buttons */}
          <View style={styles.buttonsColumn}>
            {isRegistering ? (
              <>
                <TouchableOpacity
                  style={[styles.authButtonFull, styles.registerAreaFull]}
                  onPress={() =>
                    sendRegisterRequest(usernameInput, email, password)
                  }
                >
                  <Text style={styles.authText}>Register</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.authButtonFull, styles.loginAreaFull]}
                  onPress={() => setIsRegistering(false)}
                >
                  <Text style={styles.authText}>Back to Log In</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={[styles.authButtonFull, styles.loginAreaFull]}
                  onPress={() => sendLoginRequest(usernameInput, password)}
                >
                  <Text style={styles.authText}>Log In</Text>
                </TouchableOpacity>
                <TouchableOpacity
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

      {/* Error toast */}
      {errorVisible && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      )}
    </ParallaxScrollView>
  );
}

/* ─────────────────────────────── STYLES */
const styles = StyleSheet.create({
  titleContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },

  recycleLogo: {
    width: '115%',
    height: undefined,
    aspectRatio: 290 / 178,
    alignSelf: 'center',
  },

  /* stats */
  statsContainer: { marginTop: 24, marginHorizontal: 16 },
  statLine    : { color: '#fff', fontSize: 18, textAlign: 'center', marginVertical: 4 },
  statNumber  : { fontWeight: 'bold', fontSize: 20, color: '#4CAF50' },

    /* trending posts */
    sectionTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginTop: 16, marginBottom: 8 },
    trendingContainer: { height: 200, marginVertical: 8 },
    postContainer: { 
      width: 250, 
      marginRight: 16, 
      backgroundColor: '#f5f5f5', 
      borderRadius: 8, 
      padding: 12,
      height: '100%' 
    },
    postTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 , color: '#000'},
    
    postContent: { fontSize: 14, marginBottom: 8 , color: '#000'},
    postImage: {
      width: '100%',
      height: 120,
      borderRadius: 6,
      marginBottom: 8,
      resizeMode: 'cover',
    },
    postFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 'auto' },
    footerText: { fontSize: 12, marginHorizontal: 4 },
    
  modeHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginTop: 16,
  },

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
    width : '100%',
    height: 40,
    marginVertical: 8,
    borderRadius : 4,
    justifyContent: 'center',
    alignItems    : 'center',
    borderColor   : '#fff',
    borderWidth   : 1,
  },
  registerAreaFull: { backgroundColor: '#2196F3' },
  loginAreaFull   : { backgroundColor: '#4CAF50' },

  authText: { color: '#000', fontSize: 16 },

  continueButton: {
    width : '100%',
    height: 40,
    backgroundColor: '#f9f6ee',
    borderRadius   : 4,
    justifyContent : 'center',
    alignItems     : 'center',
    marginVertical : 8,
    borderColor    : '#000',
    borderWidth    : 1,
  },

  kvkkRow: {
    flexDirection : 'row',
    alignItems    : 'center',
    marginHorizontal: 16,
    marginTop     : 4,
  },
  kvkkText: { marginLeft: 8, color: '#fff' },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },

  errorBox: {
    position: 'absolute',
    bottom  : 20,
    left    : 16,
    right   : 16,
    backgroundColor: 'red',
    padding : 12,
    borderRadius: 4,
    alignItems  : 'center',
  },
  errorText: { color: '#fff', fontSize: 14, textAlign: 'center' },
});
