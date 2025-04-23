// app/(tabs)/profile.tsx
import React, { useContext } from 'react';
import { StyleSheet, Image, View } from 'react-native';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { AuthContext } from '../_layout';

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { userType } = useContext(AuthContext);

  useFocusEffect(
    React.useCallback(() => {
      if (userType === 'guest') {
        navigation.navigate('index', {
          error: 'You need to sign up first!',
        });
      }
    }, [userType])
  );

  // only real users see Profile
  if (userType !== 'user') {
    return null;
  }

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#fff', dark: '#000' }}
      headerImage={
        <Image
          source={require('@/assets/images/wallpaper.png')}
          style={styles.headerImage}
          resizeMode="cover"
        />
      }
    >
      <ThemedView style={styles.contentContainer}>
        {/* separator between image and content */}
        <View style={styles.separator} />

        <ThemedText type="title" style={styles.title}>
          Profile
        </ThemedText>
        {/* TODO: add your profile details/components here */}
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    width: '100%',
    height: undefined,
    aspectRatio: 0.88,           
  },
  contentContainer: {
    flex: 1,
    padding: 16,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#ccc',
    marginVertical: 16,
  },
  title: {
    fontSize: 24,
  },
});
