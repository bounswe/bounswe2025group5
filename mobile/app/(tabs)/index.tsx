import React, { useState, useEffect } from 'react';
import {
  Image,
  StyleSheet,
  TextInput,
  Button,
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

  useEffect(() => {
    (async () => {
      try {
        const storedUsername = await AsyncStorage.getItem('username');
        const storedPassword = await AsyncStorage.getItem('password');
        if (storedUsername && storedPassword) {
          setUsername(storedUsername);
          setPassword(storedPassword);
          setLoggedIn(true);
          navigation.navigate('Feed');
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
      navigation.navigate('Feed');
    } else {
      console.error('Login failed');
      setLoggedIn(false);
    }
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
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
        <View style={styles.loginWrapper}>
          <Button
            title="Log In"
            onPress={() => sendLoginRequest(username, password)}
          />
        </View>
        <TouchableOpacity
          style={styles.registerButton}
          onPress={() => navigation.navigate('Register')}
        >
          <Text style={styles.registerText}>Register</Text>
        </TouchableOpacity>
      </View>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
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
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginVertical: 8,
  },
  loginWrapper: {
    flex: 1,
    marginRight: 8,
  },
  registerButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    height: 40,
  },
  registerText: {
    color: '#000',
    fontSize: 16,
  },
});
