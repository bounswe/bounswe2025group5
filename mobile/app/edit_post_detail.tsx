// app/edit_post_detail.tsx
import React, { useContext, useState, useLayoutEffect, useEffect } from 'react';
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
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { AuthContext } from './_layout';
import { apiRequest } from './services/apiClient';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

type EditPostDetailRouteParams = {
  postId: number;
  initialContent: string;
  initialPhotoUrl?: string | null;
};

type EditPostDetailScreenRouteProp = RouteProp<{ params: EditPostDetailRouteParams }, 'params'>;

export default function EditPostDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute<EditPostDetailScreenRouteProp>();
  const { username } = useContext(AuthContext);
  const colorScheme = useColorScheme();
  const { t } = useTranslation();

  const postId = route.params?.postId;
  const initialContent = route.params?.initialContent;
  const initialPhotoUrl = route.params?.initialPhotoUrl;

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: t('editPostHeader'),
    });
  }, [navigation, t]);

  const isDarkMode = colorScheme === 'dark';
  const screenBackgroundColor = isDarkMode ? '#151718' : '#F0F2F5';
  const inputBackgroundColor = isDarkMode ? '#1C1C1E' : '#FFFFFF';
  const inputBorderColor = isDarkMode ? '#3A3A3C' : '#ccc';
  const inputTextColor = isDarkMode ? '#E0E0E0' : '#000000';
  const placeholderTextColor = isDarkMode ? '#8E8E93' : '#A0A0A0';
  const saveButtonBackgroundColor = isDarkMode ? '#0A84FF' : '#2196F3';
  const saveButtonTextColor = '#FFFFFF';
  const iconColor = isDarkMode ? inputTextColor : '#555';

  const [content, setContent] = useState(initialContent || '');
  const [newImage, setNewImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [currentPhotoDisplayUrl, setCurrentPhotoDisplayUrl] = useState<string | null>(initialPhotoUrl || null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!postId) {
      Alert.alert(t('error'), t('postIdMissing'));
      navigation.goBack();
      return;
    }
    setContent(initialContent || '');
    setCurrentPhotoDisplayUrl(initialPhotoUrl || null);
    setNewImage(null);
  }, [postId, initialContent, initialPhotoUrl, navigation, t]);

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert(t('permissionRequiredTitle'), t('permissionRequiredBody'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setNewImage(result.assets[0]);
      setCurrentPhotoDisplayUrl(result.assets[0].uri);
    }
  };

  const handleSaveChanges = async () => {
    if (!content.trim() && !currentPhotoDisplayUrl) {
      Alert.alert(t('error'), t('contentEmptyIfNoImage'));
      return;
    }
    if (!postId) {
      Alert.alert(t('error'), t('postIdMissing'));
      return;
    }
    if (!username) {
      Alert.alert(t('error'), t('usernameMissingGeneric'));
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('content', content.trim());
      formData.append('username', username);

      if (newImage) {
        const uriParts = newImage.uri.split('.');
        const fileType = uriParts[uriParts.length - 1];
        const fileName = (newImage as any).fileName || `photo-edit-${postId}.${fileType}`;

        formData.append('photoFile', {
          uri: newImage.uri,
          name: fileName,
          type: newImage.mimeType || `image/${fileType}`,
        } as any);
      } else if (initialPhotoUrl && !currentPhotoDisplayUrl) {
        // Signal removal if backend supports it:
        formData.append('photoFile', '');
      }
      // else: keep existing image by omitting photoFile

      const res = await apiRequest(`/api/posts/${postId}`, {
        method: 'PUT',
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.text();
        console.error('API Error Data on Save:', errorData);
        let specificErrorMessage = t('failedToUpdatePostWithStatus', { status: res.status });
        try {
          const jsonError = JSON.parse(errorData);
          specificErrorMessage = (jsonError.message || jsonError.error) ?? specificErrorMessage;
        } catch {
          if (errorData.length < 200) {
            specificErrorMessage += ` ${t('serverResponse')}: ${errorData}`;
          }
        }
        throw new Error(specificErrorMessage);
      }

      await res.json(); // not strictly needed, but keeps symmetry
      Alert.alert(t('success'), t('postUpdated'));
      navigation.goBack();
    } catch (err) {
      console.error('Update post error:', err);
      Alert.alert(t('error'), `${err instanceof Error ? err.message : t('unknownError')}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: screenBackgroundColor }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ThemedText type="title" style={styles.title}>
        {t('editYourPost')}
      </ThemedText>

      <TextInput
        style={[
          styles.input,
          {
            borderColor: inputBorderColor,
            color: inputTextColor,
            backgroundColor: inputBackgroundColor,
          },
        ]}
        placeholder={t('editPostPlaceholder')}
        placeholderTextColor={placeholderTextColor}
        multiline
        value={content}
        onChangeText={setContent}
        editable={!loading}
      />

      <View style={styles.imagePickerContainer}>
        <TouchableOpacity onPress={pickImage} style={styles.imagePickerButton}>
          <Ionicons name="attach" size={28} color={iconColor} />
          <ThemedText style={[styles.imagePickerText, { color: inputTextColor }]}>
            {newImage ? t('changeImage') : currentPhotoDisplayUrl ? t('changeImage') : t('addNewImage')}
          </ThemedText>
        </TouchableOpacity>

        {currentPhotoDisplayUrl && (
          <>
            <Image source={{ uri: currentPhotoDisplayUrl }} style={styles.imagePreview} />
            {!newImage && (
              <TouchableOpacity
                onPress={() => setCurrentPhotoDisplayUrl(null)}
                style={styles.removeImageButton}
              >
                <ThemedText style={styles.removeImageText}>{t('removeImage')}</ThemedText>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>

      <TouchableOpacity
        style={[
          styles.saveButton,
          { backgroundColor: saveButtonBackgroundColor },
          (loading || (!content.trim() && !currentPhotoDisplayUrl)) && { opacity: 0.6 },
        ]}
        onPress={handleSaveChanges}
        disabled={loading || (!content.trim() && !currentPhotoDisplayUrl)}
      >
        <ThemedText style={[styles.saveButtonText, { color: saveButtonTextColor }]}>
          {loading ? t('saving') : t('saveChanges')}
        </ThemedText>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, justifyContent: 'center' },
  title: { marginBottom: 20, textAlign: 'center' },
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
  imagePreview: { width: 200, height: 200, resizeMode: 'contain', borderRadius: 8, marginTop: 10 },
  removeImageButton: {
    marginTop: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#E53935',
    borderRadius: 6,
  },
  removeImageText: { color: '#FFFFFF', fontSize: 14 },
  saveButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignSelf: 'center',
    marginTop: 10,
  },
  saveButtonText: { fontSize: 16, fontWeight: 'bold' },
});