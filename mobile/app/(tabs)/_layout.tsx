import { Tabs } from 'expo-router';
import React, { useContext } from 'react';
import { Platform } from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';

import { HapticTab } from '@/components/HapticTab';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { AuthContext } from '../_layout';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { username, userType } = useContext(AuthContext);

  const iconSize = 28;
  const tint = Colors[colorScheme ?? 'light'].tint;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            position: 'absolute',
            display: userType === 'user' ? 'flex' : 'none',
          },
          default: {
            display: userType === 'user' ? 'flex' : 'none',
          },
        }),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="home" size={iconSize} color={color} />
          ),
          tabBarItemStyle: {
            display: userType === 'user' ? 'none' : 'flex',
          },
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="send" size={iconSize} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="wastegoal"
        options={{
          title: 'Goals',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons
              name="target"
              size={iconSize}
              color={color}
            />
          ),
          tabBarItemStyle: {
            display: userType === 'user' ? 'flex' : 'none',
          },
        }}
      />
      <Tabs.Screen
        name="challenges"
        options={{
          title: 'Challenges',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons
              name="flag"
              size={iconSize}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="person" size={iconSize} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}