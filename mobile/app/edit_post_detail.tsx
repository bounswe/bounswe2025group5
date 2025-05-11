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
  ActivityIndicator, // Keep for save operation
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { AuthContext } from './_layout'; // Adjust if your AuthContext is elsewhere
import AsyncStorage from '@react-native-async-storage/async-storage'; // For token if API needs it

const HOST = Platform.select({ android: '10.0.2.2', ios: 'localhost' , web: 'localhost' });
const API_BASE = `http://${HOST}:8080`;

// Define the type for the route params
// Ensure these match what you pass from MyPostsScreen
type EditPostDetailRouteParams = {
  postId: number;
  initialContent: string;
  initialPhotoUrl?: string | null; // photoUrl can be optional or null
};

// Define the type for the route prop
type EditPostDetailScreenRouteProp = RouteProp<{ params: EditPostDetailRouteParams }, 'params'>;


export default function EditPostDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute<EditPostDetailScreenRouteProp>();
  const { username } = useContext(AuthContext); // We need username for the PUT request body
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
  // activityIndicatorColor is not used if fetchingPost is removed, but keep if save has its own indicator
  // const activityIndicatorColor = isDarkMode ? '#FFFFFF' : '#000000';


  // Initialize state with passed parameters
  const [content, setContent] = useState(initialContent || '');
  const [photoUrl, setPhotoUrl] = useState(initialPhotoUrl || '');
  const [loading, setLoading] = useState(false); // For the save operation

  useEffect(() => {
    if (!postId) {
      Alert.alert('Error', 'Post ID is missing. Cannot edit.');
      navigation.goBack();
      return;
    }
    // Pre-fill state based on navigation params
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
      const token = await AsyncStorage.getItem('token'); // Get token if API needs auth for PUT
      
      // Construct body as per Postman screenshot (form-data)
      // For React Native fetch with form-data (especially for files), you'd use FormData.
      // However, your Postman uses form-data for text and a file.
      // If photoFile is truly a file, this approach needs to change to FormData.
      // If photoFile is meant to be a URL and the backend handles it, then JSON is fine.
      // Given the API returns `photoUrl`, I'll assume for now we are still sending `photoUrl` in JSON
      // and the backend handles the "file" part based on this URL or if no file is provided.
      // If photoFile *must* be a file upload from the client, this needs a different approach.

      const body = {
        content: content.trim(),
        username: username,
        // If your API strictly expects 'photoFile' as a key, even for a URL or null:
        // photoFile: photoUrl.trim() || null, 
        // Or, if it expects 'photoUrl' when no actual file is uploaded:
        photoUrl: photoUrl.trim() || null,
      };
      
      const headers: HeadersInit = {
        // If sending JSON:
        'Content-Type': 'application/json',
        // If sending FormData, 'Content-Type': 'multipart/form-data' is set automatically by fetch
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // The Postman screenshot shows form-data. If you are NOT uploading an actual file,
      // sending JSON is usually simpler if the backend supports it for text fields.
      // If the backend *requires* form-data even for text and URL (as photoFile),
      // then you'd construct a FormData object.
      // For now, assuming JSON is acceptable if no actual file upload from client.
      const res = await fetch(`${API_BASE}/api/posts/edit/${postId}`, {
        method: 'PUT',
        headers: headers,
        body: JSON.stringify(body), // Sending as JSON
      });

      if (!res.ok) {
        const errorData = await res.text();
        console.error("API Error Data on Save:", errorData);
        throw new Error(`Failed to update post. Status: ${res.status}`);
      }

      const data = await res.json();
      console.log('Post updated:', data);

      Alert.alert('Success', 'Your post was updated successfully.');
      navigation.goBack(); // Or navigate to MyPosts and trigger a refresh
    } catch (err) {
      console.error('Update post error:', err);
      Alert.alert('Error', `Failed to update post. ${err instanceof Error ? err.message : 'Please try again.'}`);
    } finally {
      setLoading(false);
    }
  };

  // No initial fetchingPost loader needed if data is passed via params
  // if (fetchingPost) { ... } removed

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
    // loadingContainer removed as initial fetch is removed
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