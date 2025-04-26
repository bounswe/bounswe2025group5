import React, { useContext, useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from './_layout';

const API_BASE = 'http://localhost:8080';

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

  const [content, setContent] = useState('');
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
          photoUrl: null,
          username: username,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to create post');
      }

      const data = await res.json();
      console.log('Post created:', data);

      Alert.alert('Success', 'Your post was created successfully.');
      navigation.goBack(); // go back to previous screen
    } catch (err) {
      console.error('Create post error:', err);
      Alert.alert('Error', 'Failed to create post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ThemedText type="title" style={{ marginBottom: 16 }}>
        Create a New Post
      </ThemedText>

      <TextInput
        style={styles.input}
        placeholder="Write your post here..."
        multiline
        numberOfLines={6}
        value={content}
        onChangeText={setContent}
        editable={!loading}
      />

      <TouchableOpacity
        style={[styles.postButton, loading && { opacity: 0.6 }]}
        onPress={handleCreatePost}
        disabled={loading}
      >
        <ThemedText style={styles.postButtonText}>
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
      backgroundColor: '#fff',
      alignItems: 'center',
    },
    input: {
      width: '100%',
      height: 150,
      borderColor: '#ccc',
      borderWidth: 1,
      borderRadius: 8,
      padding: 12,
      textAlignVertical: 'top',
      fontSize: 16,
      marginBottom: 24,
    },
    postButton: {
      backgroundColor: '#2196F3',
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 8,
    },
    postButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: 'bold',
    },
  });
  