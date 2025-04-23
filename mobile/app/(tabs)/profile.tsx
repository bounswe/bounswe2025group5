// app/(tabs)/profile.tsx
import React, { useContext, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../_layout';

export default function ProfileScreen() {
  const navigation = useNavigation();
  const { userType } = useContext(AuthContext);

  useEffect(() => {
    if (!userType) {
      navigation.navigate('index' as never);
    }
  }, [userType]);

  if (!userType) return null;

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>Profile</ThemedText>
      {/* TODO: add profile details/components here */}
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
  title: { fontSize: 24 },
});
