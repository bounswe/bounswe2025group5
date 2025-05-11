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
  ActivityIndicator,
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { AuthContext } from './_layout';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HOST = Platform.select({ android: '10.0.2.2', ios: 'localhost' , web: 'localhost' });
const API_BASE = `http://${HOST}:8080`;

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

  const postId = route.params?.postId;
  const initialContent = route.params?.initialContent;
  const initialPhotoUrl = route.params?.initialPhotoUrl;

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: 'Edit Post',
    });
  }, [navigation]);

  const isDarkMode = colorScheme === 'dark';
  const screenBackgroundColor = isDarkMode ? '#151718' : '#F0F2F5';
  const inputBackgroundColor = isDarkMode ? '#1C1C1E' : '#FFFFFF';
  const inputBorderColor = isDarkMode ? '#3A3A3C' : '#ccc';
  const inputTextColor = isDarkMode ? '#E0E0E0' : '#000000';
  const placeholderTextColor = isDarkMode ? '#8E8E93' : '#A0A0A0';
  const saveButtonBackgroundColor = isDarkMode ? '#0A84FF' : '#2196F3';
  const saveButtonTextColor = '#FFFFFF';

  const [content, setContent] = useState(initialContent || '');
  const [photoUrl, setPhotoUrl] = useState(initialPhotoUrl || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!postId) {
      Alert.alert('Error', 'Post ID is missing. Cannot edit.');
      navigation.goBack();
      return;
    }
    setContent(initialContent || '');
    setPhotoUrl(initialPhotoUrl || '');
  }, [postId, initialContent, initialPhotoUrl, navigation]);

  const handleSaveChanges = async () => {
    if (!content.trim()) {
      Alert.alert('Error', 'Post content cannot be empty.');
      return;
    }
    if (!postId) {
        Alert.alert('Error', 'Post ID is missing, cannot save changes.');
        return;
    }
    if (!username) {
        Alert.alert('Error', 'Username is missing. Cannot save changes.');
        return;
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');

      const formData = new FormData();
      formData.append('content', content.trim());
      formData.append('username', username);

      if (photoUrl.trim()) {
        formData.append('photoFile', photoUrl.trim());
      }

      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_BASE}/api/posts/edit/${postId}`, {
        method: 'PUT',
        headers: headers,
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.text();
        console.error("API Error Data on Save:", errorData);
        let specificErrorMessage = `Failed to update post. Status: ${res.status}`;
        try {
            const jsonError = JSON.parse(errorData);
            specificErrorMessage = jsonError.message || jsonError.error || specificErrorMessage;
        } catch (e) {
            if (errorData.length < 200) {
                specificErrorMessage += ` Server response: ${errorData}`;
            }
        }
        throw new Error(specificErrorMessage);
      }

      const data = await res.json();
      console.log('Post updated:', data);

      Alert.alert('Success', 'Your post was updated successfully.');
      navigation.goBack();
    } catch (err) {
      console.error('Update post error:', err);
      Alert.alert('Error', `${err instanceof Error ? err.message : 'An unknown error occurred. Please try again.'}`);
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
        Edit Your Post
      </ThemedText>

      <TextInput
        style={[
          styles.input,
          {
            borderColor: inputBorderColor,
            color: inputTextColor,
            backgroundColor: inputBackgroundColor,
          }
        ]}
        placeholder="Edit your post content here..."
        placeholderTextColor={placeholderTextColor}
        multiline
        numberOfLines={6}
        value={content}
        onChangeText={setContent}
        editable={!loading}
      />

      <TextInput
        style={[
          styles.input,
          styles.photoUrlInput,
          {
            borderColor: inputBorderColor,
            color: inputTextColor,
            backgroundColor: inputBackgroundColor,
          }
        ]}
        placeholder="Photo URL (Optional)"
        placeholderTextColor={placeholderTextColor}
        value={photoUrl}
        onChangeText={setPhotoUrl}
        editable={!loading}
        autoCapitalize="none"
        keyboardType="url"
      />

      <TouchableOpacity
        style={[
            styles.saveButton,
            { backgroundColor: saveButtonBackgroundColor },
            loading && { opacity: 0.6 }
        ]}
        onPress={handleSaveChanges}
        disabled={loading}
      >
        <ThemedText style={[styles.saveButtonText, { color: saveButtonTextColor }]}>
          {loading ? 'Saving...' : 'Save Changes'}
        </ThemedText>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 16,
    },
    title: {
      marginBottom: 16,
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
      minHeight: 120,
    },
    photoUrlInput: {
        minHeight: 50,
        height: 50,
        marginBottom: 24,
        textAlignVertical: 'center',
    },
    saveButton: {
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 8,
      alignSelf: 'center',
      marginTop: 10,
    },
    saveButtonText: {
      fontSize: 16,
      fontWeight: 'bold',
    },
});