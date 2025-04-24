// app/(tabs)/edit_profile.tsx
import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  Text,
  Image,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';

// AsyncStorage keys
const BIO_KEY = 'userBio';
const AVATAR_KEY = 'userAvatarUri';

// fetch profile
async function getProfile() {
  const [bio, avatarUri] = await Promise.all([
    AsyncStorage.getItem(BIO_KEY),
    AsyncStorage.getItem(AVATAR_KEY),
  ]);
  return { bio: bio ?? '', avatarUri: avatarUri ?? '' };
}

// save profile
async function updateProfile({
  bio,
  avatarUri,
}: {
  bio: string;
  avatarUri: string;
}) {
  await AsyncStorage.multiSet([
    [BIO_KEY, bio],
    [AVATAR_KEY, avatarUri],
  ]);
}

export default function EditProfileScreen() {
  const navigation = useNavigation<any>();
  const [bio, setBio] = useState('');
  const [avatarUri, setAvatarUri] = useState('');

  useEffect(() => {
    (async () => {
      const { bio, avatarUri } = await getProfile();
      setBio(bio);
      setAvatarUri(avatarUri);
    })();
  }, []);

  const onSave = async () => {
    await updateProfile({ bio, avatarUri });
    navigation.navigate('profile');
  };

  const onCancel = () => {
    // simply discard and return to Profile
    navigation.navigate('profile');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Avatar Preview */}
      <View style={styles.avatarContainer}>
        {avatarUri ? (
          <Image source={{ uri: avatarUri }} style={styles.avatar} />
        ) : (
          <Ionicons name="person-circle-outline" size={120} color="#999" />
        )}
      </View>

      {/* Avatar URL input */}
      <TextInput
        style={styles.avatarUrlInput}
        value={avatarUri}
        onChangeText={setAvatarUri}
        placeholder="Paste avatar image URL…"
        autoCapitalize="none"
        keyboardType="url"
      />

      {/* Bio input */}
      <TextInput
        style={styles.bioInput}
        value={bio}
        onChangeText={setBio}
        placeholder="Write a short bio…"
        multiline
        maxLength={100}
      />
      <Text style={styles.charCount}>{bio.length}/100</Text>

      {/* Cancel & Save */}
      <View style={styles.buttonRow}>
        <TouchableOpacity style={[styles.btn, styles.cancel]} onPress={onCancel}>
          <Text style={styles.btnText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.save]} onPress={onSave}>
          <Text style={styles.btnText}>Save</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    flexGrow: 1,
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#ddd',
  },
  avatarUrlInput: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 6,
    padding: 12,
    marginBottom: 16,
  },
  bioInput: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 6,
    padding: 12,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  charCount: {
    textAlign: 'right',
    marginTop: 4,
    color: '#666',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  btn: {
    flex: 1,
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  cancel: {
    backgroundColor: '#ddd',
  },
  save: {
    backgroundColor: '#4CAF50',
  },
  btnText: {
    color: '#fff',
    fontSize: 16,
  },
});
