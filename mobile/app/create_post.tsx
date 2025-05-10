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
  const [photoUrl, setPhotoUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreatePost = async () => {
    if (!content.trim()) {
      Alert.alert('Error', 'Please write something before posting.');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/posts/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content.trim(),
          photoUrl: photoUrl.trim() || null,
          username: username,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to create post');
      }

      const data = await res.json();
      console.log('Post created:', data);

      Alert.alert('Success', 'Your post was created successfully.');
      navigation.goBack();
    } catch (err) {
      console.error('Create post error:', err);
      Alert.alert('Error', 'Failed to create post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: screenBackgroundColor }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
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
    },
    title: {
      marginVertical: 30,
      marginBottom: 60,
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
      minHeight: 360,
    },
    photoUrlInput: {
        minHeight: 50,
        height: 50,
        marginBottom: 24,
        textAlignVertical: 'center', // For single line URL input
    },
    postButton: {
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 8,
      alignSelf: 'center',
    },
    postButtonText: {
      fontSize: 16,
      fontWeight: 'bold',
    },
  });