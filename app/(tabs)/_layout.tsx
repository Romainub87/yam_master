import { Tabs } from 'expo-router';
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Redirect } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import CustomSideTabBar from '@/components/CustomSideTabBar';

export default function TabLayout() {
  const { user } = useAuth();

  if (!user) {
    return <Redirect href="/login" />;
  }

  return (
    <Tabs
      tabBar={(props) => <CustomSideTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="rules"
        options={{
          title: 'Règles',
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="question-circle" size={size} color={color} />
          ),
        }}
      />
        <Tabs.Screen
            name="leaderboard"
            options={{
            title: 'Classement',
            tabBarIcon: ({ color, size }) => (
                <FontAwesome name="trophy" size={size} color={color} />
            ),
            }}
        />
    </Tabs>
  );
}
