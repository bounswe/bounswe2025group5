// app/(tabs)/profile.tsx
import React, { useContext, useState, useEffect } from 'react';
import {
  StyleSheet,
  Image,
  View,
  TouchableOpacity,
  Text,
} from 'react-native';
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

        {/* profile picture + edit button */}
        <View style={styles.profileContainer}>
          <View style={styles.profilePic} />
          <TouchableOpacity style={styles.editButton}>
            <Text style={styles.editButtonText}>Edit profile</Text>
          </TouchableOpacity>
        </View>

        {/* greeting */}
        <ThemedText type="default" style={styles.greeting}>
          Hello, {username}
        </ThemedText>

        {/* action buttons */}
        <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}>
          <Text style={styles.actionText}>Log waste</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#2196F3' }]}>
          <Text style={styles.actionText}>Create a post</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#FF9800' }]}>
          <Text style={styles.actionText}>Leaderboard</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#9C27B0' }]}>
          <Text style={styles.actionText}>Challenges</Text>
        </TouchableOpacity>
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
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  profilePic: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#ddd',
    marginRight: 12,
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    backgroundColor: '#007AFF',
  },
  editButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  greeting: {
    fontSize: 18,
    marginBottom: 16,
    textAlign: 'center',
  },
  actionButton: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  actionText: {
    color: '#fff',
    fontSize: 16,
  },
  title: {
    fontSize: 24,
  },
});
