import React, { useState, useEffect } from 'react';
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
import { useNavigation } from '@react-navigation/native';

type Navigation = {
  navigate: (screen: string) => void;
};

export default function HomeScreen() {
  const navigation = useNavigation<Navigation>();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [extraInput, setExtraInput] = useState('');
  const [errorVisible, setErrorVisible] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const storedUsername = await AsyncStorage.getItem('username');
        const storedPassword = await AsyncStorage.getItem('password');
        if (storedUsername && storedPassword) {
          setUsername(storedUsername);
          setPassword(storedPassword);
          setLoggedIn(true);
          navigation.navigate('explore');
        }
      } catch (error) {
        console.error('Failed to load credentials:', error);
      }
    })();
  }, []);

  const sendLoginRequest = async (username: string, password: string) => {
    if (username === 'test' && password === 'password') {
      setLoggedIn(true);
      try {
        await AsyncStorage.setItem('username', username);
        await AsyncStorage.setItem('password', password);
      } catch (error) {
        console.error('Error saving data:', error);
      }
      navigation.navigate('explore');
    } else {
      setLoggedIn(false);
      setErrorVisible(true);
      setTimeout(() => setErrorVisible(false), 5000);
    }
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1DCA1', dark: '#1D473D' }}
      headerImage={
        <Image
          source={require('@/assets/images/recycle-logo-white.png')}
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

      {/* Mode Header */}
      <Text style={styles.modeHeader}>
        {isRegistering ? 'Create account' : 'Login here'}
      </Text>

      {/* Inputs */}
      <TextInput
        style={styles.input}
        onChangeText={setUsername}
        placeholder="Username"
        placeholderTextColor="#fff"
        value={username}
      />

      {isRegistering && (
        <TextInput
          style={styles.input}
          onChangeText={setExtraInput}
          placeholder="Email"
          placeholderTextColor="#fff"
          value={extraInput}
        />
      )}

      <TextInput
        style={styles.input}
        onChangeText={setPassword}
        placeholder="Password"
        placeholderTextColor="#fff"
        secureTextEntry
        value={password}
      />

      {/* Action Buttons */}
      <View style={styles.buttonsColumn}>
        {isRegistering ? (
          <>
            <TouchableOpacity
              style={[styles.authButtonFull, styles.registerAreaFull]}
              onPress={() => {/* handle registration */}}
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
              onPress={() => sendLoginRequest(username, password)}
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
          onPress={() => navigation.navigate('explore')}
        >
          <Text style={styles.authText}>Continue to Explore Page</Text>
        </TouchableOpacity>
      </View>

      {errorVisible && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>Login failed, please try again.</Text>
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
    backgroundColor: '#fff',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 8,
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