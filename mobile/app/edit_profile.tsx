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
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from './_layout';
import { API_BASE_URL } from './apiConfig';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';

const API_BASE = API_BASE_URL;

export const unstable_settings = {
  initialRouteName: 'edit_profile',
};

export const options = {
  tabBarStyle: { display: 'none' },
  tabBarButton: () => null,
  headerTitle: 'Edit Profile',
};

type ErrorState = { key: string | null; message: string | null; resolved?: string | null };

export default function EditProfileScreen() {
  const navigation = useNavigation<any>();
  const { username } = useContext(AuthContext);
  const colorScheme = useColorScheme();
  const { t, i18n } = useTranslation();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: t('editProfileTitle'),
    });
  }, [navigation, i18n.language, t]);

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
  const uploadButtonBgColor = isDarkMode ? '#0A84FF' : '#2196F3';

  const [bio, setBio] = useState('');
  const [avatarDisplayUrl, setAvatarDisplayUrl] = useState<string | null>(null);
  const [newAvatarAsset, setNewAvatarAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingBio, setSavingBio] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [errState, setErrState] = useState<ErrorState>({ key: null, message: null, resolved: null });

  const resolveErrorText = (state: ErrorState) => {
    if (state.key) return t(state.key);
    if (state.message) return state.message;
    return t('errorGeneric');
  };

  const alertError = (state: ErrorState) => {
    const base = resolveErrorText(state);
    const raw = state.message && __DEV__ ? `\n\n${state.message}` : '';
    Alert.alert(t('error'), `${base}${raw}`);
  };

  useEffect(() => {
    (async () => {
      if (!username) {
        setLoadingProfile(false);
        return;
      }
      setLoadingProfile(true);
      setErrState({ key: null, message: null, resolved: null });
      try {
        const response = await fetch(`${API_BASE}/api/profile/info?username=${encodeURIComponent(username)}`);
        if (!response.ok) {
          const txt = await response.text().catch(() => '');
          throw new Error(`Server error: ${response.status} ${txt}`);
        }
        const data = await response.json();
        setBio(data?.biography ?? '');
        setAvatarDisplayUrl(data?.photoUrl ?? null);
      } catch (e) {
        console.error('Failed to load profile', e);
        const s: ErrorState =
          e instanceof Error && /Server error:\s*\d+/.test(e.message)
            ? { key: 'errorProfileLoadFailed', message: e.message }
            : { key: 'errorProfileLoadGeneric', message: e instanceof Error ? e.message : null };
        setErrState({ ...s, resolved: resolveErrorText(s) });
        alertError(s);
      } finally {
        setLoadingProfile(false);
      }
    })();
  }, [username]);

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert(t('permissionRequired'), t('allowPhotosAccessAvatar'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setNewAvatarAsset(result.assets[0]);
      setAvatarDisplayUrl(result.assets[0].uri);
    }
  };

  const handleUploadProfilePhoto = async () => {
    if (!newAvatarAsset) {
      Alert.alert(t('noNewPhoto'), t('selectPhotoFirst'));
      return;
    }
    if (!username) {
      const s = { key: 'errorUserNotIdentified', message: null };
      setErrState({ ...s, resolved: resolveErrorText(s) });
      alertError(s);
      return;
    }

    setUploadingPhoto(true);
    setErrState({ key: null, message: null, resolved: null });
    try {
      const formData = new FormData();
      const uriParts = newAvatarAsset.uri.split('.');
      const fileType = uriParts[uriParts.length - 1] || 'jpg';
      const fileName = (newAvatarAsset as any).fileName || `avatar-${username}.${fileType}`;

      formData.append('file', {
        uri: newAvatarAsset.uri,
        name: fileName,
        type: newAvatarAsset.mimeType || `image/${fileType}`,
      } as any);

      const token = await AsyncStorage.getItem('token');
      const headers: HeadersInit = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`${API_BASE}/api/profile/${encodeURIComponent(username)}/photo`, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.text().catch(() => '');
        let raw = `Server error: ${response.status}`;
        try {
          const parsed = JSON.parse(errorData);
          if (parsed?.message || parsed?.error) {
            raw = `Server error: ${response.status} ${parsed.message || parsed.error}`;
          } else if (errorData) {
            raw = `Server error: ${response.status} ${errorData}`;
          }
        } catch {
          if (errorData) raw = `Server error: ${response.status} ${errorData}`;
        }
        throw new Error(raw);
      }

      const updatedProfileInfo = await response.json().catch(() => ({}));
      if (updatedProfileInfo && updatedProfileInfo.photoUrl) {
        setAvatarDisplayUrl(updatedProfileInfo.photoUrl);
      }
      setNewAvatarAsset(null);
      Alert.alert(t('success'), t('successPhotoUploaded'));
    } catch (e) {
      console.error('Photo upload error:', e);
      const s: ErrorState =
        e instanceof Error && /Server error:\s*\d+/.test(e.message)
          ? { key: 'errorUploadPhotoFailed', message: e.message }
          : { key: 'errorUploadPhotoGeneric', message: e instanceof Error ? e.message : null };
      setErrState({ ...s, resolved: resolveErrorText(s) });
      alertError(s);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const onSaveBio = async () => {
    if (!username) {
      const s = { key: 'errorUserNotIdentified', message: null };
      setErrState({ ...s, resolved: resolveErrorText(s) });
      alertError(s);
      return;
    }
    setSavingBio(true);
    setErrState({ key: null, message: null, resolved: null });
    try {
      const token = await AsyncStorage.getItem('token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`${API_BASE}/api/profile/edit`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ username, biography: bio }),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        let raw = `Server error: ${response.status}`;
        try {
          const parsed = JSON.parse(errorText);
          if (parsed?.message || parsed?.error) {
            raw = `Server error: ${response.status} ${parsed.message || parsed.error}`;
          } else if (errorText) {
            raw = `Server error: ${response.status} ${errorText}`;
          }
        } catch {
          if (errorText) raw = `Server error: ${response.status} ${errorText}`;
        }
        throw new Error(raw);
      }

      Alert.alert(t('success'), t('successBioUpdated'));
    } catch (e) {
      console.error('Bio update error:', e);
      const s: ErrorState =
        e instanceof Error && /Server error:\s*\d+/.test(e.message)
          ? { key: 'errorBioUpdateFailed', message: e.message }
          : { key: 'errorBioUpdateGeneric', message: e instanceof Error ? e.message : null };
      setErrState({ ...s, resolved: resolveErrorText(s) });
      alertError(s);
    } finally {
      setSavingBio(false);
    }
  };

  const onCancel = () => navigation.goBack();

  if (loadingProfile) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', backgroundColor: screenBackgroundColor }]}>
        <ActivityIndicator size="large" color={isDarkMode ? '#FFF' : '#000'} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: screenBackgroundColor }]}>
      {(errState.key || errState.message) && (
        <View style={[styles.errorBanner, { backgroundColor: isDarkMode ? '#5D1F1A' : '#FFCDD2' }]}>
          <Text style={[styles.errorBannerText, { color: isDarkMode ? '#FF9DA3' : '#C62828' }]}>
            {t('error')}: {resolveErrorText(errState)}
          </Text>
        </View>
      )}

      <View style={styles.avatarContainer}>
        {avatarDisplayUrl ? (
          <Image source={{ uri: avatarDisplayUrl }} style={styles.avatar} />
        ) : (
          <Ionicons name="person-circle-outline" size={120} color={avatarPlaceholderColor} />
        )}
        <TouchableOpacity onPress={pickImage} style={styles.imagePickerButton} disabled={uploadingPhoto || savingBio}>
          <Ionicons name="camera-outline" size={24} color={iconColor} />
          <Text style={[styles.imagePickerText, { color: inputTextColor }]}>
            {avatarDisplayUrl ? t('changeAvatar') : t('selectAvatar')}
          </Text>
        </TouchableOpacity>
        {newAvatarAsset && (
          <TouchableOpacity
            style={[styles.uploadButton, { backgroundColor: uploadButtonBgColor }, uploadingPhoto && styles.disabledButton]}
            onPress={handleUploadProfilePhoto}
            disabled={uploadingPhoto}
          >
            {uploadingPhoto ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.uploadButtonText}>{t('uploadPhoto')}</Text>
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
          },
        ]}
        value={bio}
        onChangeText={setBio}
        placeholder={t('writeShortBio')}
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
          disabled={savingBio || uploadingPhoto}
        >
          <Text style={[styles.btnText, { color: cancelButtonTextColor }]}>{t('cancel')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btn, styles.save, (savingBio || uploadingPhoto) && styles.disabledButton]}
          onPress={onSaveBio}
          disabled={savingBio || uploadingPhoto}
        >
          {savingBio ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.btnText}>{t('saveBio')}</Text>
          )}
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
  errorBanner: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  errorBannerText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
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
    justifyContent: 'space-around',
    marginTop: 24,
  },
  btn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 6,
    alignItems: 'center',
    minWidth: 120,
    marginHorizontal: 8,
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
