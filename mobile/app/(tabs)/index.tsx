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
import { useNavigation, useRoute } from '@react-navigation/native';
import { AuthContext } from '../_layout';

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

  // auto-login if credentials saved
  useEffect(() => {
    (async () => {
      try {
        const [u, p] = await Promise.all([
          AsyncStorage.getItem('username'),
          AsyncStorage.getItem('password'),
        ]);
        if (u && p) {
          setUsernameInput(u);
          setPassword(p);
          setLoggedIn(true);
          setUserType('user');
          setUsername(u);
          navigation.navigate('explore');
        }
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  // catch 'error' param and show red box
  useEffect(() => {
    if (route.params?.error) {
      setErrorMessage(route.params.error);
      setErrorVisible(true);
      setTimeout(() => setErrorVisible(false), 5000);
      if (navigation.setParams) navigation.setParams({ error: undefined });
    }
  }, [route.params?.error]);

  const sendRegisterRequest = async (u: string, e: string, p: string) => {
    if (u.includes('@')) {
      setErrorMessage('username cant include special character');
      setErrorVisible(true);
      setTimeout(() => setErrorVisible(false), 5000);
      return;
    }
    if (p.length < 8) {
      setErrorMessage('Password must be at least 8 characters long');
      setErrorVisible(true);
      setTimeout(() => setErrorVisible(false), 5000);
      return;
    }
    if (p !== confirmPassword) {
      setErrorMessage("Passwords doesn't match");
      setErrorVisible(true);
      setTimeout(() => setErrorVisible(false), 5000);
      return;
    }
    if (u && e && p) {
      setLoggedIn(true);
      setUserType('user');
      setUsername(u);
      await AsyncStorage.multiSet([
        ['username', u],
        ['email', e],
        ['password', p],
      ]);
      navigation.navigate('explore');
    } else {
      setErrorMessage('Login failed, please try again.');
      setErrorVisible(true);
      setTimeout(() => setErrorVisible(false), 5000);
    }
  };

  const sendLoginRequest = async (u: string, p: string) => {
    if (p.length < 8) {
      setErrorMessage('Password needs to be secure');
      setErrorVisible(true);
      setTimeout(() => setErrorVisible(false), 5000);
      return;
    }
    //Change this to your backend login request   !!!!!!!!
    if (u === 'test' && p === 'password') { // Mock login for testing purposes
      setLoggedIn(true);
      setUserType('user');
      setUsername(u);
      await AsyncStorage.multiSet([
        ['username', u],
        ['password', p],
      ]);
      navigation.navigate('explore');
    } else {
      setErrorMessage('Login failed, please try again.');
      setErrorVisible(true);
      setTimeout(() => setErrorVisible(false), 5000);
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
      <ThemedView style={styles.titleContainer}>
        {loggedIn && (
          <ThemedText type="title" style={{ fontSize: 28 }}>
            Welcome to WasteLess
          </ThemedText>
        )}
        <HelloWave />
      </ThemedView>

      <Text style={styles.modeHeader}>
        {isRegistering ? 'Create account' : 'Login here'}
      </Text>

      <TextInput
        style={[styles.input, { color: '#000', backgroundColor: '#fff' }]}
        onChangeText={setUsernameInput}
        placeholder="Username"
        placeholderTextColor="#888"
        value={usernameInput}
      />

      {isRegistering && (
        <TextInput
          style={[styles.input, { color: '#000', backgroundColor: '#fff' }]}
          onChangeText={setEmail}
          placeholder="Email"
          placeholderTextColor="#888"
          value={email}
        />
      )}

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

      <View style={styles.buttonsColumn}>
        {isRegistering ? (
          <>
            <TouchableOpacity
              style={[styles.authButtonFull, styles.registerAreaFull]}
              onPress={() => sendRegisterRequest(usernameInput, email, password)}
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
