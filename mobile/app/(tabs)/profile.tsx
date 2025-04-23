// app/(tabs)/profile.tsx
import React, { useContext, useState, useEffect } from 'react';
import { StyleSheet, Image, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { AuthContext } from '../_layout';

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { userType } = useContext(AuthContext);
  const [username, setUsername] = useState<string>('');

  // load saved username
  useEffect(() => {
    AsyncStorage.getItem('username').then(u => {
      if (u) setUsername(u);
    });
  }, []);

  // redirect guests back to Home with error
  useFocusEffect(
    React.useCallback(() => {
      if (userType === 'guest') {
        navigation.navigate('index', {
          error: 'You need to sign up first!',
        });
      }
    }, [userType])
  );

  // only real users see Profile
  if (userType !== 'user') {
    return null;
  }

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#fff', dark: '#000' }}
      headerImage={
        <Image
          source={require('@/assets/images/wallpaper.png')}
          style={styles.headerImage}
          resizeMode="cover"
        />
      }
    >
      <ThemedView style={styles.contentContainer}>
        {/* separator between image and content */}
        



        {/* personalized greeting */}
        <ThemedText type="default" style={styles.greeting}>
          Hello, {username}
        </ThemedText>

        {/* TODO: add your profile details/components here */}
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    width: '100%',
    height: undefined,
    aspectRatio: 0.88,
  },
  contentContainer: {
    flex: 1,
    padding: 16,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#ccc',
    marginVertical: 16,
  },
  greeting: {
    fontSize: 18,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
  },
});
