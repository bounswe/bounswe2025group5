// app/edit_profile.tsx
import React, { useState, useEffect, useContext, useLayoutEffect } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  Text,
  Image,
  ScrollView,
  Alert,
  Platform,
  useColorScheme,
  ActivityIndicator, // Keep for loading states
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from './_layout';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HOST = Platform.select({ android: '10.0.2.2', ios: 'localhost' , web: 'localhost' });
const API_BASE = `http://${HOST}:8080`;

export const unstable_settings = {
  initialRouteName: 'edit_profile',
};

export const options = {
  tabBarStyle: { display: 'none' },
  tabBarButton: () => null,
  headerTitle: 'Edit Profile',
};


export default function EditProfileScreen() {
  const navigation = useNavigation<any>();
  const { username } = useContext(AuthContext);
  const colorScheme = useColorScheme();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: 'Edit Profile',
    });
  }, [navigation]);

  const isDarkMode = colorScheme === 'dark';
  const screenBackgroundColor = isDarkMode ? '#151718' : '#F0F2F5';
  const inputBackgroundColor = isDarkMode ? '#1C1C1E' : '#FFFFFF';
  const inputBorderColor = isDarkMode ? '#3A3A3C' : '#ccc';
  const inputTextColor = isDarkMode ? '#E0E0E0' : '#000000';
  const placeholderTextColor = isDarkMode ? '#8E8E93' : '#A0A0A0';
  const avatarPlaceholderColor = isDarkMode ? '#5A5A5D' : '#999';
  const charCountColor = isDarkMode ? '#8E8E93' : '#666';
  const cancelButtonBgColor = isDarkMode ? '#3A3A3C' : '#ddd';
  const cancelButtonTextColor = isDarkMode ? '#E0E0E0' : '#333333';
  const iconColor = isDarkMode ? inputTextColor : '#555';
  const uploadButtonBgColor = isDarkMode ? '#0A84FF' : '#2196F3'; // For new upload button

  const [bio, setBio] = useState('');
  const [avatarDisplayUrl, setAvatarDisplayUrl] = useState<string | null>(null);
  const [newAvatarAsset, setNewAvatarAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true); // For initial profile load
  const [savingBio, setSavingBio] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);


  useEffect(() => {
    (async () => {
      if (!username) {
        setLoadingProfile(false);
        return;
      }
      setLoadingProfile(true);
      try {
        const response = await fetch(`${API_BASE}/api/profile/info?username=${encodeURIComponent(username)}`);
        if (!response.ok) {
            throw new Error(`Failed to load profile: ${response.status}`);
        }
        const data = await response.json();
        setBio(data.biography ?? '');
        setAvatarDisplayUrl(data.photoUrl ?? null);
      } catch (e) {
        console.error('Failed to load profile', e);
        Alert.alert('Error', 'Could not load profile data.');
      } finally {
        setLoadingProfile(false);
      }
    })();
  }, [username]);

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert("Permission Required!", "You need to allow access to your photos to change your avatar.");
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setNewAvatarAsset(result.assets[0]);
      setAvatarDisplayUrl(result.assets[0].uri); // Preview the newly selected local image
    }
  };

  const handleUploadProfilePhoto = async () => {
    if (!newAvatarAsset) {
      Alert.alert("No New Photo", "Please select a new photo to upload.");
      return;
    }
    if (!username) {
      Alert.alert("Error", "User not identified.");
      return;
    }

    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      const uriParts = newAvatarAsset.uri.split('.');
      const fileType = uriParts[uriParts.length - 1];
      const fileName = newAvatarAsset.fileName || `avatar-${username}.${fileType}`;

      formData.append('file', { // Key is 'file' as per your Postman
        uri: newAvatarAsset.uri,
        name: fileName,
        type: newAvatarAsset.mimeType || `image/${fileType}`,
      } as any);

      const token = await AsyncStorage.getItem('token');
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE}/api/profile/${username}/photo`, {
        method: 'POST',
        headers: headers,
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error("Upload photo API error:", response.status, errorData);
        let backendMessage = `Failed to upload photo (Status: ${response.status})`;
        try {
            const parsedError = JSON.parse(errorData);
            backendMessage = parsedError.message || parsedError.error || backendMessage;
        } catch(e) {
            if(errorData && errorData.length < 150) backendMessage += `: ${errorData}`;
        }
        throw new Error(backendMessage);
      }

      const updatedProfileInfo = await response.json(); // Assuming API returns updated profile info or new URL
      if (updatedProfileInfo && updatedProfileInfo.photoUrl) {
        setAvatarDisplayUrl(updatedProfileInfo.photoUrl); // Update display with URL from server
      }
      setNewAvatarAsset(null); // Clear the selected asset after successful upload
      Alert.alert('Success', 'Profile photo uploaded successfully!');

    } catch (e) {
      console.error('Photo upload error:', e);
      Alert.alert('Error', `Failed to upload photo. ${e instanceof Error ? e.message : ''}`);
    } finally {
      setUploadingPhoto(false);
    }
  };


  const onSaveBio = async () => { // Renamed from onSave to be specific
    if (!username) {
        Alert.alert('Error', 'User not identified.');
        return;
    }
    setSavingBio(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      // Now only sending username and biography to /api/profile/edit
      // photoUrl is handled by the dedicated upload endpoint.
      await fetch(`${API_BASE}/api/profile/edit`, {
        method: 'PUT',
        headers: headers,
        body: JSON.stringify({ username, biography: bio }),
      });
      Alert.alert('Success', 'Biography updated successfully!');
      // navigation.goBack(); // Consider if you want to go back after only bio save
    } catch (e) {
      console.error('Bio update error:', e);
      Alert.alert('Error', `Failed to update biography. ${e instanceof Error ? e.message : ''}`);
    } finally {
      setSavingBio(false);
    }
  };

  const onCancel = () => navigation.goBack();

  if (loadingProfile) {
    return (
        <View style={[styles.container, {justifyContent: 'center', alignItems: 'center', backgroundColor: screenBackgroundColor}]}>
            <ActivityIndicator size="large" color={isDarkMode ? '#FFF' : '#000'} />
        </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: screenBackgroundColor }]}>
      <View style={styles.avatarContainer}>
        {avatarDisplayUrl ? (
          <Image source={{ uri: avatarDisplayUrl }} style={styles.avatar} />
        ) : (
          <Ionicons name="person-circle-outline" size={120} color={avatarPlaceholderColor} />
        )}
        <TouchableOpacity onPress={pickImage} style={styles.imagePickerButton} disabled={uploadingPhoto || savingBio}>
            <Ionicons name="camera-outline" size={24} color={iconColor} />
            <Text style={[styles.imagePickerText, {color: inputTextColor}]}>
                {avatarDisplayUrl ? 'Change Avatar' : 'Select Avatar'}
            </Text>
        </TouchableOpacity>
        {newAvatarAsset && ( // Show upload button only if a new image is picked
          <TouchableOpacity 
            style={[styles.uploadButton, {backgroundColor: uploadButtonBgColor}, uploadingPhoto && styles.disabledButton]} 
            onPress={handleUploadProfilePhoto} 
            disabled={uploadingPhoto}
          >
            {uploadingPhoto ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.uploadButtonText}>Upload Photo</Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      <TextInput
        style={[
          styles.bioInput,
          {
            borderColor: inputBorderColor,
            color: inputTextColor,
            backgroundColor: inputBackgroundColor,
          }
        ]}
        value={bio}
        onChangeText={setBio}
        placeholder="Write a short bio…"
        placeholderTextColor={placeholderTextColor}
        multiline
        maxLength={100}
        editable={!savingBio && !uploadingPhoto}
      />
      <Text style={[styles.charCount, { color: charCountColor }]}>{bio.length}/100</Text>

      <View style={styles.buttonRow}>
        <TouchableOpacity 
            style={[styles.btn, styles.cancel, { backgroundColor: cancelButtonBgColor }]} 
            onPress={onCancel} 
            disabled={savingBio || uploadingPhoto}>
          <Text style={[styles.btnText, { color: cancelButtonTextColor }]}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity 
            style={[styles.btn, styles.save, savingBio && styles.disabledButton]} 
            onPress={onSaveBio} 
            disabled={savingBio || uploadingPhoto}>
          {savingBio ? <ActivityIndicator color="#fff" size="small"/> : <Text style={styles.btnText}>Save Bio</Text>}
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
    marginBottom: 20,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#ddd',
    marginBottom: 10,
  },
  imagePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 10,
  },
  imagePickerText: {
    marginLeft: 8,
    fontSize: 14,
  },
  uploadButton: {
    marginTop: 5,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
    alignItems: 'center',
  },
  uploadButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  bioInput: {
    borderWidth: 1,
    borderRadius: 6,
    padding: 12,
    minHeight: 80,
    textAlignVertical: 'top',
    fontSize: 16,
  },
  charCount: {
    textAlign: 'right',
    marginTop: 4,
    fontSize: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around', // Changed to space-around
    marginTop: 24,
  },
  btn: {
    // flex: 1, // Removed flex:1 to allow buttons to size based on content or specific width
    paddingVertical: 12,
    paddingHorizontal: 20, // Added more horizontal padding
    borderRadius: 6,
    alignItems: 'center',
    minWidth: 120, // Give buttons a minimum width
    marginHorizontal: 8, // Add some margin between buttons
  },
  cancel: {},
  save: {
    backgroundColor: '#4CAF50',
  },
  btnText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  disabledButton: {
    opacity: 0.6,
  },
});