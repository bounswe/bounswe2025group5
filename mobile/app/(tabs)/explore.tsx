<<<<<<< HEAD
import React from 'react';
import { ScrollView, StyleSheet, View, Image } from 'react-native';
=======
// app/(tabs)/explore.tsx
import React, { useContext } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  Image,
  TextInput,
} from 'react-native';
>>>>>>> 880011bd67092880e939009b52ae79e348c4e792
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { AuthContext } from '../_layout';

type Post = {
  id: string;
  title: string;
  content: string;
  likes: number;
  comments: number;
  image: string;
};

const mockPosts: Post[] = [
  {
    id: '1',
    title: 'Post Title 1',
    content: 'This is a short preview of the post content…',
    likes: 12,
    comments: 4,
    image: 'https://via.placeholder.com/300x150',
  },
  {
    id: '2',
    title: 'Post Title 2',
    content: 'Another preview text goes here as a placeholder.',
    likes: 8,
    comments: 2,
    image: 'https://via.placeholder.com/300x150',
  },
];

function PostSkeleton({ post }: { post: Post }) {
  return (
    <View style={styles.postContainer}>
      <Image source={{ uri: post.image }} style={styles.postImage} />
<<<<<<< HEAD

=======
>>>>>>> 880011bd67092880e939009b52ae79e348c4e792
      <ThemedText type="title" style={styles.postTitle}>
        {post.title}
      </ThemedText>
      <ThemedText style={styles.postContent}>
        {post.content}
      </ThemedText>

      <View style={styles.postFooter}>
        <Ionicons name="heart-outline" size={16} />
        <ThemedText style={styles.footerText}>{post.likes}</ThemedText>
        <Ionicons name="chatbubble-outline" size={16} />
        <ThemedText style={styles.footerText}>{post.comments}</ThemedText>
      </View>
    </View>
  );
}

export default function ExploreScreen() {
  const navigation = useNavigation();
  const { userType,username } = useContext(AuthContext);

  useFocusEffect(
    React.useCallback(() => {
      console.log('userType:', userType);
      console.log('username:', username);
    }, [userType])
  );

  React.useEffect(() => {
    if (!userType) {
      navigation.navigate('index' as never);
    }
  }, [userType]);

  if (!userType) return null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <ThemedText type="title">Explore</ThemedText>
      </View>

      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={Math.random() < 0.5 ? "Search for a specific topic…" : "Find something interesting…"}
          placeholderTextColor="#888"
        />
      </View>

      {mockPosts.map(post => (
        <PostSkeleton key={post.id} post={post} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 24,
  },
  header: {
    paddingHorizontal: 16,
    marginTop: 48,     
    marginBottom: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    marginHorizontal: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  postContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  postImage: {
    width: '100%',
    height: 150,
    borderRadius: 4,
    marginBottom: 10,
    backgroundColor: '#eee',
  },
  postTitle: {
    fontSize: 18,
    marginBottom: 6,
  },
  postContent: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  postFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    marginHorizontal: 8,
  },
});
