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

// AsyncStorage keys
const BIO_KEY = 'userBio';
const AVATAR_KEY = 'userAvatarUri';

// load from storage
async function getProfile() {
  const [bio, avatarUri] = await Promise.all([
    AsyncStorage.getItem(BIO_KEY),
    AsyncStorage.getItem(AVATAR_KEY),
  ]);
  return { bio: bio ?? '', avatarUri: avatarUri ?? '' };
}

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { userType, setUserType, username, setUsername } = useContext(AuthContext);
  const [bio, setBio] = useState('');
  const [avatarUri, setAvatarUri] = useState('');
  const [loading, setLoading] = useState(true);

  // redirect guests & fetch profile
  useFocusEffect(
    useCallback(() => {
      if (userType === 'guest') {
        navigation.navigate('index', { error: 'You need to sign up first!' });
        return;
      }
      (async () => {
        const { bio, avatarUri } = await getProfile();
        setBio(bio);
        setAvatarUri(avatarUri);
        setLoading(false);
      })();
    }, [userType])
  );

  const handleLogout = async () => {
    await AsyncStorage.multiRemove(['username', 'password', 'email']);
    setUserType(null);
    setUsername('');
  
    navigation.reset({
      index: 0,
      routes: [{ name: 'index' }],
    });
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
        {/* Logout */}
        <View style={styles.logoutContainer}>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </View>

        {/* Edit Profile */}
        <View style={styles.editProfileContainer}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => navigation.navigate('edit_profile')}
          >
            <Text style={styles.editButtonText}>Edit profile</Text>
          </TouchableOpacity>
        </View>

        {/* Profile Info */}
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
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
          onPress={() => navigation.navigate('add_waste_log')}
        >
          <Text style={styles.actionText}>Add a Waste Log</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#2E7D32' }]}
          onPress={() => navigation.navigate('add_waste_goal')}
        >
          <Text style={styles.actionText}>Add a Waste Goal</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#2196F3' }]}
          onPress={() => navigation.navigate('create_post')}
        >
          <Text style={styles.actionText}>Create a post</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#FF9800' }]}
          onPress={() => navigation.navigate('leaderboard')}
        >
          <Text style={styles.actionText}>Leaderboard</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#9C27B0' }]}
          onPress={() => navigation.navigate('challenges')}
        >
          <Text style={styles.actionText}>Challenges</Text>
        </TouchableOpacity>
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
