// app/(tabs)/profile.tsx
import React, { useContext } from 'react';
import { StyleSheet } from 'react-native';
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

  // only render for real users
  if (userType !== 'user') {
    return null;
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        Profile
      </ThemedText>
      {/* TODO: add your profile details/components here */}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
  },
});
