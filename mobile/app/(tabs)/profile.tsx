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
  Platform,
  useColorScheme, // Import useColorScheme
} from 'react-native';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { AuthContext } from '../_layout';
import { API_BASE_URL } from '../apiConfig';
import Ionicons from '@expo/vector-icons/Ionicons';

const API_BASE = API_BASE_URL;

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  
  const { userType, setUserType, username, setUsername} = useContext(AuthContext);
    
  const colorScheme = useColorScheme(); // Get current color scheme

  const [bio, setBio] = useState('');
  const [avatarUri, setAvatarUri] = useState('');
  const [loading, setLoading] = useState(true);

  // Dynamic Colors
  const isDarkMode = colorScheme === 'dark';
  const parallaxHeaderBgColor = isDarkMode ? '#000000' : '#FFFFFF'; // Example colors
  const avatarPlaceholderColor = isDarkMode ? '#5A5A5D' : '#999';
  const contentBackgroundColor = isDarkMode ? '#151718' : '#F0F2F5'; // Match other screens
  const buttonTextColor = '#FFFFFF'; // Assuming buttons have solid backgrounds

  useFocusEffect(
    useCallback(() => {
      if (userType === 'guest') {
        navigation.reset({
          index: 0,
          routes: [{ name: 'index', params: { error: 'You need to sign up first!' } }],
        });
        return;
      }

      (async () => {
        try {
          setLoading(true); 
          const res = await fetch(`${API_BASE}/api/profile/info?username=${username}`);
          if (res.status === 404) {
            await fetch(`${API_BASE}/api/profile/create`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ username, biography: '', photoUrl: '' }),
            });
            const retryRes = await fetch(`${API_BASE}/api/profile/info?username=${username}`);
            const retryData = await retryRes.json();
            setBio(retryData.biography ?? '');
            setAvatarUri(retryData.photoUrl ?? '');
          } else {
            const data = await res.json();
            setBio(data.biography ?? '');
            setAvatarUri(data.photoUrl ?? '');
          }
        } catch (err) {
          console.error('Failed to fetch or create profile:', err);
        } finally {
          setLoading(false);
        }
      })();
    }, [userType, username]) 
  );

  const handleLogout = async () => {
    await AsyncStorage.multiRemove(['username', 'password', 'email', 'token']);
    setUserType(null);
    setUsername('');
    navigation.reset({ index: 0, routes: [{ name: 'index' }] });
  };

  if (userType !== 'user' || loading) {
    return loading ? (
      <View style={[styles.loadingContainer, {backgroundColor: contentBackgroundColor}]}>
         <ActivityIndicator testID="profile-loading-indicator" size="large" color={isDarkMode ? '#FFF' : '#000'} />
      </View>
    ) : null;
  }

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: parallaxHeaderBgColor, dark: parallaxHeaderBgColor }}
      headerImage={
        <Image
          source={require('@/assets/images/wallpaper.png')}
          style={styles.headerImage}
          resizeMode="cover"
        />
      }
    >
      <View style={[styles.contentContainer, {backgroundColor: contentBackgroundColor}]}>
        <View style={styles.logoutContainer}>
          <TouchableOpacity testID="logout-button" onPress={handleLogout} style={styles.logoutButton}>
            <Text style={[styles.logoutText, {color: buttonTextColor}]}>Log Out</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.editProfileContainer}>
          <TouchableOpacity
            testID="edit-profile-button"
            style={styles.editButton}
            onPress={() => navigation.navigate('edit_profile')}
          >
            <Text style={[styles.editButtonText, {color: buttonTextColor}]}>Edit profile</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.badgesContainer}>
          <TouchableOpacity
            testID="my-badges-button"
            style={styles.badgesButton}
            onPress={() => navigation.navigate('badges')}
          >
            <Text style={[styles.badgesButtonText, {color: buttonTextColor}]}>My Badges</Text>
          </TouchableOpacity>
        </View>

        

        <View style={styles.profileContainer}>
          {avatarUri ? (
            <Image testID="profile-avatar-image" source={{ uri: avatarUri }} style={styles.profilePic} />
          ) : (
            <Ionicons testID="profile-avatar-placeholder" name="person-circle-outline" size={100} color={avatarPlaceholderColor} />
          )}
          <View style={{ marginLeft: 12, flexShrink: 1 }}>
            <ThemedText testID="profile-username-text" type="default" style={{ fontSize: 20 }}>
              Hello, {username}
            </ThemedText>
            <ThemedText
              testID="profile-bio-text"
              type="default"
              style={{ marginTop: 4, fontStyle: bio ? 'normal' : 'italic' }}
              numberOfLines={3}
            >
              {bio || 'No bio yet.'}
            </ThemedText>
          </View>
        </View>
        
        <TouchableOpacity
          testID="create-post-button"
          style={[styles.actionButton, { backgroundColor: '#2196F3' }]}
          onPress={() => navigation.navigate('create_post')}
        >
          <Text style={[styles.actionText, {color: buttonTextColor}]}>Create Post</Text>
        </TouchableOpacity>

        <TouchableOpacity
          testID="my-posts-button"
          style={[styles.actionButton, { backgroundColor: '#00008B' }]} 
          onPress={() => navigation.navigate('posts')} 
        >
          <Text style={[styles.actionText, {color: buttonTextColor}]}>Manage Posts</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#D4AF37' }]}
          onPress={() => navigation.navigate('saved_posts')}
        >
          <Text style={[styles.actionText, {color: buttonTextColor}]}>Saved Posts</Text>
        </TouchableOpacity>


      </View>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: { width: '100%', height: undefined, aspectRatio: 0.88 },
  contentContainer: { flex: 1, padding: 16, marginTop: -20 }, 
  logoutContainer: { alignItems: 'flex-end', margin: 4  },
  logoutButton: { paddingHorizontal: 20, paddingVertical: 6, borderRadius: 4, backgroundColor: '#E53935' },
  logoutText: { fontSize: 14 }, 
  editProfileContainer: { alignItems: 'flex-end', margin: 4 },
  editButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4, backgroundColor: '#007AFF' },
  editButtonText: { fontSize: 14 }, 
  badgesContainer: { alignItems: 'flex-end', margin: 4 },
  badgesButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4, backgroundColor: '#FF9800' },
  badgesButtonText: { fontSize: 14 },
  profileContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  profilePic: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#ddd' }, 
  actionButton: { width: '100%', paddingVertical: 12, borderRadius: 8, marginBottom: 12, alignItems: 'center' },
  actionText: { fontSize: 16 }, 
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center',},
});
