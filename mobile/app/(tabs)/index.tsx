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
      console.log('Login successful');
      setLoggedIn(true);
      try {
        await AsyncStorage.setItem('username', username);
        await AsyncStorage.setItem('password', password);
        console.log('Data saved successfully');
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
        {loggedIn && <ThemedText type="title">Welcome</ThemedText>}
        <HelloWave />
      </ThemedView>

      <TextInput
        style={styles.input}
        onChangeText={setUsername}
        placeholder="Username"
        placeholderTextColor="#fff"
        value={username}
      />
      <TextInput
        style={styles.input}
        onChangeText={setPassword}
        placeholder="Password"
        placeholderTextColor="#fff"
        secureTextEntry
        value={password}
      />

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.authButton, styles.registerArea]}
          onPress={() => navigation.navigate('Register')}
        >
          <Text style={styles.authText}>Register</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.authButton, styles.loginArea]}
          onPress={() => sendLoginRequest(username, password)}
        >
          <Text style={styles.authText}>Log In</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.continueButton}
        onPress={() => navigation.navigate('explore')}
      >
        <Text style={[styles.continueText, { textAlign: 'center' }]}>
          Continue to Explore Page</Text>
      </TouchableOpacity>

      {errorVisible && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>
            Login failed, please try again.
          </Text>
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
  buttonContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginVertical: 8,
  },
  authButton: {
    flex: 1,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    height: 40,
  },
  registerArea: {
    backgroundColor: '#fff',
    marginRight: 8,
  },
  loginArea: {
    backgroundColor: '#4CAF50',
    marginLeft: 8,
  },
  authText: {
    color: '#000',
    fontSize: 16,
  },
  continueButton: {
    marginHorizontal: 16,
    marginVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 4,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueText: {
    color: '#000',
    fontSize: 16,
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
