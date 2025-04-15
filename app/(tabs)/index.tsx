import React from 'react';
import { View, Text, Button } from 'react-native';
import { useAuth } from '@/context/AuthContext';

export default function HomeScreen() {
  const { user, logout } = useAuth();

    return (
        <View className="flex-1 justify-center items-center bg-gray-900">
            {user ? (
                <View className="items-center">
                    <Text className="text-2xl font-bold text-white mb-4">Bienvenue, {user.username}</Text>
                    <Button title="Se déconnecter" onPress={logout} color="#4A90E2" />
                </View>
            ) : (
                <Text className="text-lg text-gray-300">Veuillez vous connecter</Text>
            )}
        </View>
    );
}