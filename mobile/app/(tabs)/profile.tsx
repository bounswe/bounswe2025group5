// app/(tabs)/profile.tsx
import React, { useContext, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  StyleSheet,
  Image,
  View,
  TouchableOpacity,
  Text,
  ActivityIndicator,
} from 'react-native';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { AuthContext } from '../_layout';
import Ionicons from '@expo/vector-icons/Ionicons';

const API_BASE = 'http://10.0.2.2:8080'; // Updated to match explore.tsx for consistency

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { userType, setUserType, username, setUsername } = useContext(AuthContext);
  const [bio, setBio] = useState('');
  const [avatarUri, setAvatarUri] = useState('');
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<number | null>(null); // Add userId state

  useFocusEffect(
    useCallback(() => {
      if (userType === 'guest') {
        navigation.navigate('index', { error: 'You need to sign up first!' });
        return;
      }
  
      (async () => {
        try {
          const res = await fetch(`${API_BASE}/api/profile/info?username=${username}`);
          if (res.status === 404) {
            // Automatically create profile if not found
            await fetch(`${API_BASE}/api/profile/create`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ username, biography: '', photoUrl: '' }),
            });
            // Now retry
            const retryRes = await fetch(`${API_BASE}/api/profile/info?username=${username}`);
            const retryData = await retryRes.json();
            setBio(retryData.biography ?? '');
            setAvatarUri(retryData.photoUrl ?? '');
            setUserId(retryData.userId); // Set userId from profile response
          } else {
            const data = await res.json();
            setBio(data.biography ?? '');
            setAvatarUri(data.photoUrl ?? '');
            setUserId(data.userId); // Set userId from profile response
          }
        } catch (err) {
          console.error('Failed to fetch or create profile:', err);
        } finally {
          setLoading(false);
        }
      })();
    }, [userType])
  );
  

  const handleLogout = async () => {
    await AsyncStorage.multiRemove(['username', 'password', 'email', 'token']);
    setUserType(null);
    setUsername('');
    navigation.reset({ index: 0, routes: [{ name: 'index' }] });
  };

  const navigateToSavedPosts = () => {
    if (userId) {
      navigation.navigate('saved_posts', { userId });
    } else {
      console.error('Cannot navigate to saved posts: userId is null');
    }
  };

  if (userType !== 'user' || loading) {
    return loading ? <ActivityIndicator style={{ flex: 1 }} /> : null;
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
      <View style={styles.contentContainer}>
        <View style={styles.logoutContainer}>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.editProfileContainer}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => navigation.navigate('edit_profile')}
          >
            <Text style={styles.editButtonText}>Edit profile</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.profileContainer}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.profilePic} />
          ) : (
            <Ionicons name="person-circle-outline" size={100} color="#999" />
          )}
          <View style={{ marginLeft: 12 }}>
            <ThemedText type="default" style={{ fontSize: 20 }}>
              Hello, {username}
            </ThemedText>
            <ThemedText
              type="default"
              style={{ marginTop: 4, fontStyle: bio ? 'normal' : 'italic' }}
            >
              {bio || 'No bio yet.'}
            </ThemedText>
          </View>
        </View>

        {/* Action Buttons */}
        {[
          { label: 'Saved Posts', action: navigateToSavedPosts, color: '#3F51B5' }, // Added Saved Posts option
          { label: 'Add a Waste Log', action: 'add_waste_log', color: '#4CAF50' },
          { label: 'Add a Waste Goal', action: 'add_waste_goal', color: '#2E7D32' },
          { label: 'Create a post', action: 'create_post', color: '#2196F3' },
          { label: 'Leaderboard', action: 'leaderboard', color: '#FF9800' },
          { label: 'Challenges', action: 'challenges', color: '#9C27B0' },
        ].map((item) => (
          <TouchableOpacity
            key={item.label}
            style={[styles.actionButton, { backgroundColor: item.color }]}
            onPress={typeof item.action === 'function' ? item.action : () => navigation.navigate(item.action)}
          >
            <Text style={styles.actionText}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: { width: '100%', height: undefined, aspectRatio: 0.88 },
  contentContainer: { flex: 1, padding: 16, marginTop: -20 },
  logoutContainer: { alignItems: 'flex-end' },
  logoutButton: { paddingHorizontal: 20, paddingVertical: 6, borderRadius: 4, backgroundColor: '#E53935' },
  logoutText: { color: '#fff', fontSize: 14 },
  editProfileContainer: { alignItems: 'flex-end', marginVertical: 8 },
  editButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4, backgroundColor: '#007AFF' },
  editButtonText: { color: '#fff', fontSize: 14 },
  profileContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  profilePic: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#ddd' },
  actionButton: { width: '100%', paddingVertical: 12, borderRadius: 8, marginBottom: 12, alignItems: 'center' },
  actionText: { color: '#fff', fontSize: 16 },
});
