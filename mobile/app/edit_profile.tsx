// app/edit_profile.tsx
import React, { useState, useEffect, useContext } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  Text,
  Image,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from './_layout';
import Ionicons from '@expo/vector-icons/Ionicons';

const API_BASE = 'http://localhost:8080';

const isValidImageUrl = (url: string) => {
    return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(url);
  };
  
export const unstable_settings = {
  // This tells Expo Router not to show it in the bottom tab bar
  initialRouteName: 'edit_profile',
};

export const options = {
  tabBarStyle: { display: 'none' },
  tabBarButton: () => null,
};


export default function EditProfileScreen() {
  const navigation = useNavigation<any>();
  const { username } = useContext(AuthContext);
  const [bio, setBio] = useState('');
  const [avatarUri, setAvatarUri] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch(`${API_BASE}/api/profile/info?username=${username}`);
        const data = await response.json();
        setBio(data.biography ?? '');
        setAvatarUri(data.photoUrl ?? '');
      } catch (e) {
        console.error('Failed to load profile', e);
      }
    })();
  }, []);

  const onSave = async () => {
    try {
      await fetch(`${API_BASE}/api/profile/edit`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, biography: bio, photoUrl: avatarUri }),
      });
      navigation.goBack()
    } catch (e) {
      Alert.alert('Error', 'Failed to update profile.');
    }
  };

  const onCancel = () => navigation.goBack();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.avatarContainer}>
        {isValidImageUrl(avatarUri) ? (
          <Image source={{ uri: avatarUri }} style={styles.avatar} />
        ) : (
          <Ionicons name="person-circle-outline" size={120} color="#999" />
        )}
      </View>

      <TextInput
        style={styles.avatarUrlInput}
        value={avatarUri}
        onChangeText={setAvatarUri}
        placeholder="Paste avatar image URL…"
        autoCapitalize="none"
        keyboardType="url"
      />

      <TextInput
        style={styles.bioInput}
        value={bio}
        onChangeText={setBio}
        placeholder="Write a short bio…"
        multiline
        maxLength={100}
      />
      <Text style={styles.charCount}>{bio.length}/100</Text>

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
