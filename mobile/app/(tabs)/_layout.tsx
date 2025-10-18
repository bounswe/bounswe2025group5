import { Tabs } from 'expo-router';
import React, { useContext } from 'react';
import { Platform } from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';

import { HapticTab } from '@/components/HapticTab';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { AuthContext } from '../_layout';

import { useTranslation } from 'react-i18next';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { username, userType } = useContext(AuthContext);

  const { t } = useTranslation();

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
          title: t('tabHome'),
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
          title: t('tabExplore'),
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="send" size={iconSize} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="wastegoal"
        options={{
          title: t('tabGoals'),
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
          title: t('tabChallenges'),
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
          title: t('tabProfile'),
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="person" size={iconSize} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}