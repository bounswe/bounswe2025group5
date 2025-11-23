// app/_layout.tsx
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState, createContext } from 'react';
import 'react-native-reanimated';

import './i18n'; 

import { useColorScheme } from '@/hooks/useColorScheme';

export type UserType = 'guest' | 'user' | null;

export type AuthContextType = {
  userType: UserType;
  setUserType: React.Dispatch<React.SetStateAction<UserType>>;
  username: string;
  setUsername: React.Dispatch<React.SetStateAction<string>>;
};

export const AuthContext = createContext<AuthContextType>({
  userType: null,
  setUserType: () => {},
  username: '',
  setUsername: () => {},
});

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  const [userType, setUserType] = useState<UserType>(null);
  const [username, setUsername] = useState<string>('');

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  const authContextValue = { userType, setUserType, username, setUsername};

  return (
    <AuthContext.Provider value={authContextValue}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen 
            name="edit_profile" 
            options={{ 
              presentation: 'modal', 
            }} 
          />
          <Stack.Screen
            name="badges"
            options={{
            }}
            />
          <Stack.Screen 
            name="user_profile" 
            options={{ 
              title: 'User Profile',
            }} 
          />
          <Stack.Screen 
            name="create_post" 
            options={{ 
              presentation: 'modal', 
            }} 
          />
          <Stack.Screen 
            name="posts" 
            options={{ 
            }} 
          />
          <Stack.Screen 
            name="saved_posts"
            options={{ 
            }}
          />
          <Stack.Screen 
            name="edit_post_detail" 
            options={{ 
              presentation: 'modal', 
            }} 
          />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      </ThemeProvider>
    </AuthContext.Provider>
  );
}