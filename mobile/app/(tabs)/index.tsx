import { Image, StyleSheet, Platform, TextInput , Button } from 'react-native';
import { MMKV } from 'react-native-mmkv';
import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import React from 'react';
import { useState, useEffect } from 'react';
import { store } from 'expo-router/build/global-state/router-store';
//import url from '@/constants/Url';

const storage = new MMKV();

export default function HomeScreen() {
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [logedIn, setLogedIn] = React.useState(false);
  
  useEffect(() => {
    const storedUsername = storage.getString('username');
    const storedPassword = storage.getString('password');
    if (storedUsername && storedPassword) {
      setUsername(storedUsername);
      setPassword(storedPassword);
      setLogedIn(true);
    }
  }, []);

  const sendLoginRequest = async (username: string, password: string) => {
    /*try {
      const response = await fetch(url +'/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Login successful:', data);
      } else {
        console.error('Login failed:', response.statusText);
      }
    } catch (error) {
      console.error('Error during login:', error);
    }*/
   if (username === 'test' && password === 'password') {
      console.log('Login successful');
      setLogedIn(true);
      try {
        storage.set('username', username);
        storage.set('password', password);
        console.log('Data saved successfully');
      }
      catch (error) {
        console.error('Error saving data:', error);
      }
    } else {  
      console.error('Login failed');
      setLogedIn(false);
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
      }>
      <ThemedView style={styles.titleContainer}>
        {logedIn && <ThemedText type="title">Welcome</ThemedText>}
        <HelloWave />
      </ThemedView>
      <TextInput
          style={styles.input}
          onChangeText={setUsername}
          placeholder='Username'
          value={username}
        />
        <TextInput
          style={styles.input}
          onChangeText={setPassword}
          placeholder='Password'
          value={password}
        />
        <Button
          title="Press me"
          onPress={() => sendLoginRequest(username, password)}
        />
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Step 1: Try it</ThemedText>
        <ThemedText>
          Edit <ThemedText type="defaultSemiBold">app/(tabs)/index.tsx</ThemedText> to see changes.
          Press{' '}
          <ThemedText type="defaultSemiBold">
            {Platform.select({
              ios: 'cmd + d',
              android: 'cmd + m',
              web: 'F12'
            })}
          </ThemedText>{' '}
          to open developer tools.
        </ThemedText>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Step 2: Explore</ThemedText>
        <ThemedText>
          Tap the Explore tab to learn more about what's included in this starter app.
        </ThemedText>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Step 3: Get a fresh start</ThemedText>
        <ThemedText>
          When you're ready, run{' '}
          <ThemedText type="defaultSemiBold">npm run reset-project</ThemedText> to get a fresh{' '}
          <ThemedText type="defaultSemiBold">app</ThemedText> directory. This will move the current{' '}
          <ThemedText type="defaultSemiBold">app</ThemedText> to{' '}
          <ThemedText type="defaultSemiBold">app-example</ThemedText>.
        </ThemedText>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
});
