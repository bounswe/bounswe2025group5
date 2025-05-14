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
  Image, // Import Image for preview
  ActivityIndicator, // Import ActivityIndicator
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from './_layout';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker'; 
import { Ionicons } from '@expo/vector-icons'; 

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
  const iconColor = isDarkMode ? inputTextColor : '#555';


  const [content, setContent] = useState('');
  const [image, setImage] = useState<ImagePicker.ImagePickerAsset | null>(null); // Store selected image asset
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert("Permission Required!", "You need to allow access to your photos to upload an image.");
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3], // You can adjust aspect ratio
      quality: 0.7,    // Compress image slightly
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImage(result.assets[0]);
    }
  };


  const handleCreatePost = async () => {
    if (!content.trim() && !image) { // Require content or an image
      Alert.alert('Error', 'Please write something or select an image before posting.');
      return;
    }
    if (!username) {
      Alert.alert('Error', 'User not identified. Cannot create post.');
      return;
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');

      const formData = new FormData();
      formData.append('content', content.trim());
      formData.append('username', username);

      if (image) {

        const uriParts = image.uri.split('.');
        const fileType = uriParts[uriParts.length - 1];
        const fileName = image.fileName || `photo.${fileType}`; // Use original filename or generate one

        formData.append('photoFile', {
          uri: image.uri,
          name: fileName,
          type: image.mimeType || `image/${fileType}`, // Mime type
        } as any); // Cast to any because TS definition for FormDataValue might be strict
      }


      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_BASE}/api/posts/create`, {
        method: 'POST',
        headers: headers,
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.text();
        console.error("Create post API error:", res.status, errorData);
        let backendMessage = `Failed to create post (Status: ${res.status})`;
        try {
            const parsedError = JSON.parse(errorData);
            backendMessage = parsedError.message || parsedError.error || backendMessage;
        } catch(e) {
            if(errorData && errorData.length < 150 && errorData.length > 0) {
                 backendMessage += `: ${errorData.substring(0,150)}`;
            }
        }
        throw new Error(backendMessage);
      }

      const data = await res.json();
      console.log('Post created:', data);

      Alert.alert('Success', 'Your post was created successfully.');
      setContent(''); 
      setImage(null); 
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

      <View style={styles.imagePickerContainer}>
        <TouchableOpacity onPress={pickImage} style={styles.imagePickerButton}>
          <Ionicons name="attach" size={28} color={iconColor} />
          <ThemedText style={[styles.imagePickerText, {color: inputTextColor}]}>
            {image ? 'Change Image' : 'Add Image (Optional)'}
          </ThemedText>
        </TouchableOpacity>
        {image && (
          <Image source={{ uri: image.uri }} style={styles.imagePreview} />
        )}
      </View>


      <TouchableOpacity
        style={[
            styles.postButton,
            { backgroundColor: postButtonBackgroundColor },
            (loading || (!content.trim() && !image)) && { opacity: 0.6 } 
        ]}
        onPress={handleCreatePost}
        disabled={loading || (!content.trim() && !image)}
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
    imagePickerContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
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
    imagePickerText: {
        marginLeft: 10,
        fontSize: 16,
    },
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
    postButtonText: {
      fontSize: 16,
      fontWeight: 'bold',
    },
  });