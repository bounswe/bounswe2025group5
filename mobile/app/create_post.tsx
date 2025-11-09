// app/create_post.tsx
import React, { useContext, useState, useLayoutEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  useColorScheme,
  Image,
  ActivityIndicator,
} from 'react-native';
import AccessibleText from '@/components/AccessibleText';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from './_layout';

import { apiRequest, getAccessToken } from './services/apiClient';
import { apiUrl } from './apiConfig';
import * as ImagePicker from 'expo-image-picker'; 
import { Ionicons } from '@expo/vector-icons'; 
import * as FileSystem from 'expo-file-system';
import { useTranslation } from 'react-i18next';

export const unstable_settings = {
  initialRouteName: 'create_post',
};

export const options = {
  tabBarStyle: { display: 'none' },
  tabBarButton: () => null,
};

type ErrorState = { key: string | null; message: string | null; resolved?: string | null };

export default function CreatePostScreen() {
  const navigation = useNavigation();
  const { username } = useContext(AuthContext);
  const colorScheme = useColorScheme();
  const { t, i18n } = useTranslation(); 

  useLayoutEffect(() => {
    navigation.setOptions({ headerTitle: t('createPostTitle') });
  }, [navigation, i18n.language, t]);

  const isDarkMode = colorScheme === 'dark';
  const screenBackgroundColor = isDarkMode ? '#151718' : '#F0F2F5';
  const inputBackgroundColor = isDarkMode ? '#1C1C1E' : '#FFFFFF';
  const inputBorderColor = isDarkMode ? '#3A3A3C' : '#ccc';
  const inputTextColor = isDarkMode ? '#E0E0E0' : '#000000';
  const placeholderTextColor = isDarkMode ? '#8E8E93' : '#A0A0A0';
  const postButtonBackgroundColor = isDarkMode ? '#0A84FF' : '#2196F3';
  const postButtonTextColor = '#FFFFFF';
  const iconColor = isDarkMode ? inputTextColor : '#555';

  const [content, setContent] = useState('');
  const [image, setImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [loading, setLoading] = useState(false);

  const [errState, setErrState] = useState<ErrorState>({ key: null, message: null, resolved: null });

  const resolveErrorText = (state: ErrorState) => {
    if (state.key) return t(state.key);
    if (state.message) return state.message;
    return t('errorGeneric');
  };

  const showErrorAlert = (state: ErrorState) => {
    const base = resolveErrorText(state);
    const raw = state.message && __DEV__ ? `\n\n${state.message}` : '';
    Alert.alert(t('error'), `${base}${raw}`);
  };

  const showSuccessAlert = (key: string) => {
    Alert.alert(t('success'), t(key));
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert(t('permissionRequired'), t('allowPhotosAccess'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImage(result.assets[0]);
    }
  };

  const handleCreatePost = async () => {
    console.log('[create_post] submit pressed');
    if (!content.trim() && !image) {
      const s = { key: 'errorPostContentOrImage', message: null };
      setErrState({ ...s, resolved: resolveErrorText(s) });
      showErrorAlert(s);
      console.log('[create_post] validation: empty content & no image');
      return;
    }
    if (!username) {
      const s = { key: 'errorUserNotIdentified', message: null };
      setErrState({ ...s, resolved: resolveErrorText(s) });
      showErrorAlert(s);
      console.log('[create_post] validation: no username');
      return;
    }

    try {
      setLoading(true);
      setErrState({ key: null, message: null, resolved: null });

  setLoading(true);
  try {
    const fd = new FormData();
    fd.append('content', content.trim());
    fd.append('username', username);
    if (image) {
      // iOS: convert ph:// → file:// so fetch can read it
      const normalizeUri = async (uri: string) => {
        if (Platform.OS !== 'web' && uri.startsWith('ph://')) {
          const dest = `${FileSystem.cacheDirectory}upload-${Date.now()}.jpg`;
          await FileSystem.copyAsync({ from: uri, to: dest });
          return dest;
        }
        return uri;
      };

      const type = image.mimeType ?? 'image/jpeg';
      const ext = type.split('/')[1] || 'jpg';
      const name = image.fileName ?? `photo-${Date.now()}.${ext}`;

      if (Platform.OS === 'web') {
        // Web: convert URI → File
        const resp = await fetch(image.uri);
        const blob = await resp.blob();
        const file = new File([blob], name, { type });
        fd.append('photoFile', file);
      } else {
        const uri = await normalizeUri(image.uri);
        fd.append('photoFile', { uri, name, type } as any);
      }
    }

    const token = await getAccessToken();

    const res = await fetch(apiUrl('/api/posts'), {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: fd, // DO NOT set Content-Type manually
    });

    if (!res.ok) {
        const errorText = await res.text().catch(() => '');
        let raw = `Server error: ${res.status}`;
        try {
          const parsed = JSON.parse(errorText);
          if (parsed?.message || parsed?.error) {
            raw = `Server error: ${res.status} ${parsed.message || parsed.error}`;
          } else if (errorText) {
            raw = `Server error: ${res.status} ${errorText}`;
          }
        } catch {
          if (errorText) raw = `Server error: ${res.status} ${errorText}`;
        }
        console.log('[create_post] response not ok -> throwing', raw);
        throw new Error(raw);
      }

      const data = await res.json().catch(() => ({}));
      console.log('[create_post] success payload', data);

      showSuccessAlert('successPostCreated');
      setContent('');
      setImage(null);
      (navigation as any).goBack();
    } catch (err) {
      console.log('[create_post] catch reached', err);
      let rawMessage: string | null = null;
      if (err instanceof Error) rawMessage = err.message;
      else if (typeof err === 'string') rawMessage = err;

      const isServerish = !!rawMessage && /Server error:\s*\d+/.test(rawMessage);
      const s: ErrorState = isServerish
        ? { key: 'errorCreatePostFailed', message: rawMessage }
        : { key: 'errorCreatePostGeneric', message: rawMessage };

      const resolved = resolveErrorText(s);
      setErrState({ ...s, resolved });
      // show alert no matter what
      showErrorAlert({ ...s, resolved });
    } finally {
      setLoading(false);
    }

    Alert.alert('Success', 'Your post was created successfully.');
    setContent('');
    setImage(null);
    navigation.goBack();
  } catch (e) {
    console.error('Create post error:', e);
    Alert.alert('Error', e instanceof Error ? e.message : 'Failed to create post.');
  } finally {
    setLoading(false);
  }
};

  const isDisabled = loading || (!content.trim() && !image);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: screenBackgroundColor }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <AccessibleText type="title" backgroundColor={screenBackgroundColor} style={styles.title}>
        {t('createNewPost')}
      </AccessibleText>

      {/* Inline error banner */}
      {(errState.key || errState.message) && (
        <View style={[styles.errorBanner, { backgroundColor: isDarkMode ? '#5D1F1A' : '#FFCDD2' }]}> 
          <AccessibleText backgroundColor={isDarkMode ? '#5D1F1A' : '#FFCDD2'} style={[styles.errorBannerText, { color: isDarkMode ? '#FF9DA3' : '#C62828' }]}> 
            {t('error')}: {errState.resolved}
          </AccessibleText>
        </View>
      )}

      <TextInput
        style={[
          styles.input,
          {
            borderColor: inputBorderColor,
            color: inputTextColor,
            backgroundColor: inputBackgroundColor,
          },
        ]}
        placeholder={t('writePostPlaceholder')}
        placeholderTextColor={placeholderTextColor}
        multiline
        value={content}
        onChangeText={setContent}
        editable={!loading}
      />

      <View style={styles.imagePickerContainer}>
        <TouchableOpacity onPress={pickImage} style={styles.imagePickerButton}>
          <Ionicons name="attach" size={28} color={iconColor} />
          <AccessibleText backgroundColor={screenBackgroundColor} style={[styles.imagePickerText, { color: inputTextColor }]}> 
            {image ? t('changeImage') : t('addImageOptional')}
          </AccessibleText>
        </TouchableOpacity>
        {image && <Image source={{ uri: image.uri }} style={styles.imagePreview} />}
      </View>

      <TouchableOpacity
        style={[
          styles.postButton,
          { backgroundColor: postButtonBackgroundColor },
          isDisabled && { opacity: 0.6 },
        ]}
        onPress={handleCreatePost}
        disabled={isDisabled}
      >
        {loading ? (
          <ActivityIndicator size="small" color={postButtonTextColor} />
        ) : (
          <AccessibleText backgroundColor={postButtonBackgroundColor} style={[styles.postButtonText, { color: postButtonTextColor }]}> 
            {t('post')}
          </AccessibleText>
        )}
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, justifyContent: 'center' },
  title: { marginBottom: 12, textAlign: 'center' },

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

  input: {
    width: '100%',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    textAlignVertical: 'top',
    fontSize: 16,
    marginBottom: 16,
    minHeight: 150,
  },
  imagePickerContainer: { alignItems: 'center', marginBottom: 24 },
  imagePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 10,
  },
  imagePickerText: { marginLeft: 10, fontSize: 16 },
  imagePreview: {
    width: 200,
    height: 200,
    resizeMode: 'contain',
    borderRadius: 8,
    marginTop: 10,
  },
  postButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignSelf: 'center',
    marginTop: 10,
  },
  postButtonText: { fontSize: 16, fontWeight: 'bold' },
});
