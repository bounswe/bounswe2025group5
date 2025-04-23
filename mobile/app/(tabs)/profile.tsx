// app/(tabs)/profile.tsx
import React, { useContext } from 'react';
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
  const { userType, setUserType, username, setUsername } = useContext(AuthContext);

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

  // handle logout
  const handleLogout = async () => {
    await AsyncStorage.multiRemove(['username', 'password', 'email']);
    setUserType(null);
    setUsername('');
    navigation.navigate('index');
  };

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
        {/* logout button */}
        <View style={styles.logoutContainer}>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </View>

        {/* edit profile button below logout */}
        <View style={styles.editProfileContainer}>
          <TouchableOpacity style={styles.editButton}>
            <Text style={styles.editButtonText}>Edit profile</Text>
          </TouchableOpacity>
        </View>

        {/* profile picture and greeting side by side */}
        <View style={styles.profileContainer}>
          <View style={styles.profilePic} />
            <ThemedText type="default" style={[styles.greeting, { fontSize: 20, marginLeft: 10 }]}>
              Hello, {username}
            </ThemedText>
        </View>

        {/* action buttons */}
        <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}>
          <Text style={styles.actionText}>Add a Waste Log</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#2E7D32' }]}>
          <Text style={styles.actionText}>Add a Waste Goal</Text>
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
    marginTop: -20, // lift content up by 20px
  },
  logoutContainer: {
    alignItems: 'flex-end',
  },
  logoutButton: {
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: 4,
    backgroundColor: '#E53935',
  },
  logoutText: {
    color: '#fff',
    fontSize: 14,
  },
  editProfileContainer: {
    alignItems: 'flex-end',
    marginVertical: 8,
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
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start', // move to left
    marginBottom: 16,
  },
  profilePic: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#ddd',
    marginRight: 12,
  },
  greeting: {
    fontSize: 18,
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
});
