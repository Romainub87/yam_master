import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { HapticTab } from '@/components/HapticTab';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { Redirect } from 'expo-router';

export default function TabLayout() {
    const { user } = useAuth();

  if (!user) {
      return <Redirect href="/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.dark.tabIconSelected,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            position: 'absolute',
          },
          default: {
            backgroundColor: Colors.dark,
            borderTopWidth: 0,
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 70,
          },
        }),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ color }) => <FontAwesome name="home" size={30} color={color} />,
        }}
      />
      <Tabs.Screen
        name="rules"
        options={{
          title: 'Règles',
          tabBarIcon: ({ color }) => <FontAwesome name="question-circle" size={30} color={color} />,
        }}
      />
    </Tabs>
  );
}
