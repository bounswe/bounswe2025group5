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
  Image, // Import Image
  ActivityIndicator,
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { AuthContext } from './_layout';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker'; // Import expo-image-picker
import { Ionicons } from '@expo/vector-icons'; // For the attachment icon

const HOST = '161.35.42.102';
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
  const iconColor = isDarkMode ? inputTextColor : '#555';

  const [content, setContent] = useState(initialContent || '');
  // newImage will store the newly selected image asset from ImagePicker
  const [newImage, setNewImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  // currentPhotoDisplayUrl will store the URL of the image to be displayed (either initial or new)
  const [currentPhotoDisplayUrl, setCurrentPhotoDisplayUrl] = useState<string | null>(initialPhotoUrl || null);
  const [loading, setLoading] = useState(false);


  useEffect(() => {
    if (!postId) {
      Alert.alert('Error', 'Post ID is missing. Cannot edit.');
      navigation.goBack();
      return;
    }
    setContent(initialContent || '');
    setCurrentPhotoDisplayUrl(initialPhotoUrl || null); // Initialize display URL
    setNewImage(null); // Reset any newly picked image when params change
  }, [postId, initialContent, initialPhotoUrl, navigation]);


  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert("Permission Required!", "You need to allow access to your photos to upload an image.");
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setNewImage(result.assets[0]); // Store the full asset for upload
      setCurrentPhotoDisplayUrl(result.assets[0].uri); // Update display URL to the local URI of the new image
    }
  };

  const handleSaveChanges = async () => {
    if (!content.trim() && !currentPhotoDisplayUrl) { // Check if there's content or any image to display/upload
      Alert.alert('Error', 'Post content cannot be empty if no image is present.');
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

      if (newImage) { // If a new image was picked, upload it
        const uriParts = newImage.uri.split('.');
        const fileType = uriParts[uriParts.length - 1];
        const fileName = newImage.fileName || `photo-edit-${postId}.${fileType}`;

        formData.append('photoFile', {
          uri: newImage.uri,
          name: fileName,
          type: newImage.mimeType || `image/${fileType}`,
        } as any);
      } else if (initialPhotoUrl && !currentPhotoDisplayUrl) {
        // If there was an initialPhotoUrl but currentPhotoDisplayUrl is now null/empty,
        // it means the user wants to remove the existing image.
        // Your backend needs to handle how to remove an image.
        // Sending an empty string or a specific flag for 'photoFile' might be one way.
        // This example assumes sending empty 'photoFile' signals removal IF backend supports it.
        formData.append('photoFile', ''); 
      } else if (initialPhotoUrl && currentPhotoDisplayUrl === initialPhotoUrl) {
        // No new image picked, and the initial photo URL is still the one to display
        // This means "keep the existing image".
        // For PUT requests, some backends might require you to resend the existing URL
        // if 'photoFile' is a required field in the form-data, or omit it if it's truly optional
        // and the absence of a new file means "no change to image".
        // The Postman screenshot does not check 'content', but checks 'photoFile' and 'username'.
        // This implies 'photoFile' might be expected. If so, send the existing URL.
        // formData.append('photoFile', initialPhotoUrl); // Uncomment if backend expects this to keep image
      }
      // If newImage is null AND initialPhotoUrl was null, no 'photoFile' is appended.

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
        value={content}
        onChangeText={setContent}
        editable={!loading}
      />

      <View style={styles.imagePickerContainer}>
        <TouchableOpacity onPress={pickImage} style={styles.imagePickerButton}>
          <Ionicons name="attach" size={28} color={iconColor} />
          <ThemedText style={[styles.imagePickerText, {color: inputTextColor}]}>
            {newImage ? 'Change Image' : (currentPhotoDisplayUrl ? 'Change Image' : 'Add New Image')}
          </ThemedText>
        </TouchableOpacity>
        {currentPhotoDisplayUrl && (
          <Image source={{ uri: currentPhotoDisplayUrl }} style={styles.imagePreview} />
        )}
        {currentPhotoDisplayUrl && !newImage && ( // Show remove button only if it's an existing image
            <TouchableOpacity 
                onPress={() => {
                    setCurrentPhotoDisplayUrl(null); // Clear display
                    // setNewImage(null); // newImage is already null or will be replaced by pickImage
                }} 
            >
            </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity
        style={[
            styles.saveButton,
            { backgroundColor: saveButtonBackgroundColor },
            (loading || (!content.trim() && !currentPhotoDisplayUrl)) && { opacity: 0.6 }
        ]}
        onPress={handleSaveChanges}
        disabled={loading || (!content.trim() && !currentPhotoDisplayUrl)}
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
    removeImageButton: {
        marginTop: 10,
        paddingVertical: 6,
        paddingHorizontal: 12,
        backgroundColor: '#E53935', // A red color for remove
        borderRadius: 6,
    },
    removeImageText: {
        color: '#FFFFFF',
        fontSize: 14,
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