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
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from './_layout';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HOST = Platform.select({ android: '10.0.2.2', ios: 'localhost' , web: 'localhost' });
const API_BASE = `http://${HOST}:8080`;

export const unstable_settings = {
  initialRouteName: 'create_post',
};

export const options = {
  tabBarStyle: { display: 'none' },
  tabBarButton: () => null,
};


export default function CreatePostScreen() {
  const navigation = useNavigation();
  const { username } = useContext(AuthContext);
  const colorScheme = useColorScheme();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: 'Create Post',
    });
  }, [navigation]);

  const isDarkMode = colorScheme === 'dark';
  const screenBackgroundColor = isDarkMode ? '#151718' : '#F0F2F5';
  const inputBackgroundColor = isDarkMode ? '#1C1C1E' : '#FFFFFF';
  const inputBorderColor = isDarkMode ? '#3A3A3C' : '#ccc';
  const inputTextColor = isDarkMode ? '#E0E0E0' : '#000000';
  const placeholderTextColor = isDarkMode ? '#8E8E93' : '#A0A0A0';
  const postButtonBackgroundColor = isDarkMode ? '#0A84FF' : '#2196F3';
  const postButtonTextColor = '#FFFFFF';


  const [content, setContent] = useState('');
  const [photoUrl, setPhotoUrl] = useState(''); // This will be sent as 'photoFile' if it's a URL
  const [loading, setLoading] = useState(false);

  const handleCreatePost = async () => {
    if (!content.trim()) {
      Alert.alert('Error', 'Please write something before posting.');
      return;
    }
    if (!username) {
      Alert.alert('Error', 'User not identified. Cannot create post.');
      return;
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');

      // Create FormData object
      const formData = new FormData();
      formData.append('content', content.trim());
      formData.append('username', username);

      // The Postman screenshot shows 'photoFile' as the key for the file.
      // If the user provides a URL in the photoUrl input, we send that URL
      // as the value for 'photoFile'. The backend must be able to handle
      // receiving a URL string for a field it might expect a file for.
      // If photoUrl is empty, 'photoFile' is not appended.
      if (photoUrl.trim()) {
        formData.append('photoFile', photoUrl.trim());
      }
      // If actual file upload is implemented later, photoUrl state might be replaced
      // with a file object, and that object would be appended to formData.

      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      // Do NOT set 'Content-Type': 'multipart/form-data' manually for FormData.
      // Fetch API handles this.

      const res = await fetch(`${API_BASE}/api/posts/create`, {
        method: 'POST',
        headers: headers,
        body: formData, // Send FormData
      });

      if (!res.ok) {
        const errorData = await res.text();
        console.error("Create post API error:", res.status, errorData);
        let backendMessage = `Failed to create post (Status: ${res.status})`; // Default message
        try {
            const parsedError = JSON.parse(errorData);
            // Use more specific messages if available from backend JSON error
            backendMessage = parsedError.message || parsedError.error || backendMessage;
        } catch(e) {
            // errorData was not JSON, or no specific message field.
            // Append raw errorData if it's short and provides context.
            if(errorData && errorData.length < 150 && errorData.length > 0) {
                 backendMessage += `: ${errorData.substring(0,150)}`;
            }
        }
        throw new Error(backendMessage);
      }

      const data = await res.json();
      console.log('Post created:', data);

      Alert.alert('Success', 'Your post was created successfully.');
      navigation.goBack();
    } catch (err) {
      console.error('Create post error:', err);
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to create post. Please try again.');
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
        Create a New Post
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
        placeholder="Write your post here..."
        placeholderTextColor={placeholderTextColor}
        multiline
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
        placeholder="Photo file URL (Optional)"
        placeholderTextColor={placeholderTextColor}
        value={photoUrl}
        onChangeText={setPhotoUrl}
        editable={!loading}
        autoCapitalize="none"
        keyboardType="url"
      />

      <TouchableOpacity
        style={[
            styles.postButton,
            { backgroundColor: postButtonBackgroundColor },
            loading && { opacity: 0.6 }
        ]}
        onPress={handleCreatePost}
        disabled={loading}
      >
        <ThemedText style={[styles.postButtonText, { color: postButtonTextColor }]}>
          {loading ? 'Posting...' : 'Post'}
        </ThemedText>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 16,
      justifyContent: 'center',
    },
    title: {
      marginBottom: 20,
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
    photoUrlInput: {
        minHeight: 50,
        height: 50,
        marginBottom: 24,
        textAlignVertical: 'center',
    },
    postButton: {
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 8,
      alignSelf: 'center',
      marginTop: 10,
    },
    postButtonText: {
      fontSize: 16,
      fontWeight: 'bold',
    },
  });