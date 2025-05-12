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
  useColorScheme,
} from 'react-native';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { AuthContext } from '../_layout';
import Ionicons from '@expo/vector-icons/Ionicons';

const HOST = Platform.select({ android: '10.0.2.2', ios: 'localhost' , web: 'localhost' });
const API_BASE = `http://${HOST}:8080`;

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { userType, setUserType, username, setUsername } = useContext(AuthContext); // Removed user_id as it's not used in this version
  const colorScheme = useColorScheme();

  const [bio, setBio] = useState('');
  const [avatarUri, setAvatarUri] = useState('');
  const [loading, setLoading] = useState(true);

  const isDarkMode = colorScheme === 'dark';
  const parallaxHeaderBgColor = isDarkMode ? '#151718' : '#F0F2F5';
  const contentBackgroundColor = isDarkMode ? '#151718' : '#F0F2F5';
  const avatarPlaceholderColor = isDarkMode ? '#5A5A5D' : '#999';
  const buttonTextColor = '#FFFFFF';
  const activityIndicatorColor = isDarkMode ? '#FFF' : '#000';

  useFocusEffect(
    useCallback(() => {
      if (userType === 'guest') {
        navigation.reset({
          index: 0,
          routes: [{ name: 'index', params: { error: 'You need to sign up first!' } }],
        });
        return;
      }

      if (!username) {
        setLoading(false);
        return;
      }

      const fetchProfileData = async () => {
        setLoading(true);
        try {
          const res = await fetch(`${API_BASE}/api/profile/info?username=${encodeURIComponent(username)}`);

          if (res.status === 404) {
            const createRes = await fetch(`${API_BASE}/api/profile/create`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ username, biography: '', photoUrl: '' }),
            });
            if (!createRes.ok) {
                const errorText = await createRes.text();
                throw new Error(`Failed to create profile: ${createRes.status} ${errorText}`);
            }
            const retryRes = await fetch(`${API_BASE}/api/profile/info?username=${encodeURIComponent(username)}`);
            if (!retryRes.ok) {
                const errorText = await retryRes.text();
                throw new Error(`Failed to fetch profile after creation: ${retryRes.status} ${errorText}`);
            }
            const retryData = await retryRes.json();
            setBio(retryData.biography ?? '');
            setAvatarUri(retryData.photoUrl ?? '');
          } else if (res.ok) {
            const data = await res.json();
            setBio(data.biography ?? '');
            setAvatarUri(data.photoUrl ?? '');
          } else {
            const errorText = await res.text();
            console.error('Failed to fetch profile, status:', res.status, errorText);
            throw new Error(`Failed to fetch profile: ${res.status}`);
          }
        } catch (err) {
          console.error('Error in profile data handling:', err);
        } finally {
          setLoading(false);
        }
      };

      fetchProfileData();
    }, [userType, username, navigation])
  );

  const handleLogout = async () => {
    await AsyncStorage.multiRemove(['username', 'userType', 'token']);
    setUserType(null);
    setUsername('');
    navigation.reset({ index: 0, routes: [{ name: 'index' }] });
  };

  if (userType !== 'user' || loading) {
    return loading ? (
      <View style={[styles.loadingContainer, {backgroundColor: contentBackgroundColor}]}>
         <ActivityIndicator size="large" color={activityIndicatorColor} />
      </View>
    ) : null;
  }

  return (
    <ParallaxScrollView
      headerBackgroundColor={{
        light: parallaxHeaderBgColor,
        dark: parallaxHeaderBgColor
      }}
      headerImage={
        <Image
          source={require('@/assets/images/wallpaper.png')}
          style={styles.headerImage}
          resizeMode="cover"
        />
      }
    >
      <View style={[styles.innerContentWrapper, { backgroundColor: contentBackgroundColor }]}>
        <View style={styles.contentContainer}>
            <View style={styles.logoutContainer}>
            <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                <Text style={[styles.logoutText, {color: buttonTextColor}]}>Log Out</Text>
            </TouchableOpacity>
            </View>

            <View style={styles.editProfileContainer}>
            <TouchableOpacity
                style={styles.editButton}
                onPress={() => navigation.navigate('edit_profile')}
            >
                <Text style={[styles.editButtonText, {color: buttonTextColor}]}>Edit profile</Text>
            </TouchableOpacity>
            </View>

            <View style={styles.profileContainer}>
            {avatarUri ? (
                <Image
                    source={{ uri: avatarUri }}
                    style={styles.profilePic}
                    onError={(e) => {
                        console.warn("Failed to load profile image:", avatarUri, e.nativeEvent.error);
                        setAvatarUri('');
                    }}
                />
            ) : (
                <Ionicons name="person-circle-outline" size={100} color={avatarPlaceholderColor} />
            )}
            <View style={{ marginLeft: 12, flexShrink: 1 }}>
                <ThemedText type="default" style={{ fontSize: 20 }}>
                Hello, {username}
                </ThemedText>
                <ThemedText
                type="default"
                style={{ marginTop: 4, fontStyle: bio ? 'normal' : 'italic' }}
                numberOfLines={3}
                >
                {bio || 'No bio yet.'}
                </ThemedText>
            </View>
            </View>

            <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#2196F3' }]}
            onPress={() => navigation.navigate('create_post')}
            >
            <Text style={[styles.actionText, {color: buttonTextColor}]}>Create a post</Text>
            </TouchableOpacity>

            <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#00008B' }]}
            onPress={() => navigation.navigate('posts')}
            >
            <Text style={[styles.actionText, {color: buttonTextColor}]}>Manage Posts</Text>
            </TouchableOpacity>
        </View>
      </View>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: { width: '100%', height: undefined, aspectRatio: 0.88 },
  innerContentWrapper: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    padding: 16,
  },
  logoutContainer: { alignItems: 'flex-end' },
  logoutButton: { paddingHorizontal: 20, paddingVertical: 6, borderRadius: 4, backgroundColor: '#E53935' },
  logoutText: { fontSize: 14 },
  editProfileContainer: { alignItems: 'flex-end', marginVertical: 8 },
  editButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4, backgroundColor: '#007AFF' },
  editButtonText: { fontSize: 14 },
  profileContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  profilePic: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#ddd' },
  actionButton: { width: '100%', paddingVertical: 12, borderRadius: 8, marginBottom: 12, alignItems: 'center' },
  actionText: { fontSize: 16 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});