// explore.tsx
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';

type Post = {
  id: string;
  title: string;
  content: string;
  likes: number;
  comments: number;
};

const mockPosts: Post[] = [
  {
    id: '1',
    title: 'Post Title 1',
    content: 'This is a short preview of the post content…',
    likes: 12,
    comments: 4,
  },
  {
    id: '2',
    title: 'Post Title 2',
    content: 'Another preview text goes here as a placeholder.',
    likes: 8,
    comments: 2,
  },
];

function PostSkeleton({ post }: { post: Post }) {
  return (
    <View style={styles.postContainer}>
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
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <ThemedText type="title">Explore</ThemedText>
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
    marginVertical: 12,
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

