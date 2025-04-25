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
import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import { AuthContext } from '../_layout';

//const API_BASE = 'http://localhost:8080/api/auth';
const API_BASE = 'http://34.58.140.184:8080/api/auth';

type Navigation = {
  navigate: (screen: string, params?: any) => void;
  setParams?: (params: any) => void;
};

export default function HomeScreen() {
  const navigation = useNavigation<Navigation>();
  const route = useRoute<any>();
  const { setUserType, setUsername } = useContext(AuthContext);

  const [usernameInput, setUsernameInput] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [errorVisible, setErrorVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // auto-login if token saved
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

  // show any route-passed errors
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
      if (loggedIn) {
        navigation.navigate('explore');
      }
    }, [loggedIn])
  );

  // common error handler
  const showError = (msg: string) => {
      setErrorMessage(msg);
      setErrorVisible(true);
      setTimeout(() => setErrorVisible(false), 5000);
    };

  const sendLoginRequest = async (emailOrUsername: string, pwd: string) => {
      //bypass for testing
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
          const err = await res.json();
          return showError(err.message || 'Login failed');
        }
        const { token, username } = await res.json() as {
          token: string;
          username: string;
        };
        // store and navigate
        await AsyncStorage.multiSet([
          ['token', token],
          ['username', username],
        ]);
        setUserType('user');
        setUsername(username);
        setLoggedIn(true);
      } catch (e) {
        showError('Network error, please try again');
      }
    };

  const sendRegisterRequest = async (
      regUsername: string,
      regEmail: string,
      regPass: string
    ) => {
      if (!regUsername.trim() || !regEmail.includes('@') || regPass.length < 8) {
        return showError('Please fill in valid registration info');
      }
      if (regPass !== confirmPassword) {
        return showError("Passwords don't match");
      }
      try {
        const res = await fetch(`${API_BASE}/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: regUsername,
            email: regEmail,
            password: regPass,
          }),
        });
        if (!res.ok) {
          const err = await res.json();
          return showError(err.message || 'Registration failed');
        }
        const { username: u, email: e, message } =
          await res.json() as { message: string; username: string; email: string };
  
        // Optionally show success message
        // e.g. alert(message);
        await AsyncStorage.multiSet([
          ['username', u],
          ['email', e],
        ]);
  
        setIsRegistering(false);
        setUsernameInput(u);
        showError('Registered! Please log in.');
      } catch (e) {
        showError('Network error, please try again');
      }
    };

  const continueAsGuest = () => {
    setUserType('guest');
    setUsername('');
    navigation.navigate('explore');
  };

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
      <View style={styles.titleContainer}>
        {loggedIn && (
          <ThemedText type="title" style={{ fontSize: 28 }}>
            Welcome to WasteLess
          </ThemedText>
        )}
        <HelloWave />
      </View>

      <Text style={styles.modeHeader}>
        {isRegistering ? 'Create account' : 'Login here'}
      </Text>

      {/* Username / Email, when Registering, only username since email is requested below*/}
      <TextInput
        style={[styles.input, { color: '#000', backgroundColor: '#fff' }]}
        onChangeText={setUsernameInput}
        placeholder={isRegistering ? 'Username' : 'Email or Username'} 
        placeholderTextColor="#888"
        value={usernameInput}
        autoCapitalize="none"
      />

      {/* Registration needs Email field */}
      {isRegistering && (
        <TextInput
          style={[styles.input, { color: '#000', backgroundColor: '#fff' }]}
          onChangeText={setEmail}
          placeholder="Email"
          placeholderTextColor="#888"
          value={email}
          autoCapitalize="none"
        />
      )}

      {/* Password */}
      <TextInput
        style={[styles.input, { color: '#000', backgroundColor: '#fff' }]}
        onChangeText={setPassword}
        placeholder="Password"
        placeholderTextColor="#888"
        secureTextEntry
        value={password}
      />

      {isRegistering && (
        <TextInput
          style={[styles.input, { color: '#000', backgroundColor: '#fff' }]}
          onChangeText={setConfirmPassword}
          placeholder="Confirm password"
          placeholderTextColor="#888"
          secureTextEntry
          value={confirmPassword}
        />
      )}

      {/* Buttons */}
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
        <TouchableOpacity
          style={styles.continueButton}
          onPress={continueAsGuest}
        >
          <Text style={styles.authText}>Continue as Guest</Text>
        </TouchableOpacity>
      </View>

      {errorVisible && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      )}
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recycleLogo: {
    width: '115%',
    height: undefined,
    aspectRatio: 290 / 178,
    alignSelf: 'center',
  },
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
    color: '#fff',
  },
  buttonsColumn: {
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 8,
  },
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
  registerAreaFull: {
    backgroundColor: '#2196F3',
  },
  loginAreaFull: {
    backgroundColor: '#4CAF50',
  },
  authText: {
    color: '#000',
    fontSize: 16,
  },
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
  errorText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
  },
});
