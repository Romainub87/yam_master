import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import CustomButton from "@/components/CustomButton";
import { useRouter } from "expo-router";
import { useWebSocket } from '@/context/WebSocketContext';

export default function HomeScreen() {
  const { user, userToken, logout } = useAuth();
  const { sendMessage, lastMessage } = useWebSocket();
  const router = useRouter();
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (lastMessage) {
      try {
        if (lastMessage.type === 'queue.added') {
          setIsSearching(true);
        } else if (lastMessage.type === 'game.start') {
          router.push({ pathname: '/game', params: { id: lastMessage.game.id } });
        }
      } catch (error) {
        console.error('Erreur lors du traitement du message WebSocket :', error);
      }
    }
  }, [lastMessage]);

  const joinQueue = () => {
    sendMessage({
      type: 'queue.join',
      payload: {
        user: user,
        token: userToken,
      },
    });
  };

  const leaveQueue = () => {
    sendMessage({
      type: 'queue.leave',
      payload: {
        token: userToken,
      },
    });
    setIsSearching(false);
  };

  return (
      <View className="flex-1 justify-center items-center dark:bg-black">
        {user ? (
            <View className="items-center p-6 rounded-lg shadow-lg">
              <Text className="text-4xl text-white mb-6 font-bold">Bienvenue, {user.username} 👋</Text>
              {isSearching ? (
                  <View className="items-center">
                    <Text className="text-lg text-gray-300 mb-4">🔍 Recherche de parties en cours...</Text>
                    <CustomButton title="Annuler" onPress={() => leaveQueue()} />
                  </View>
              ) : (
                  <CustomButton title="Jouer" onPress={() => joinQueue()} />
              )}
              <CustomButton title="Se déconnecter" onPress={logout} />
            </View>
        ) : (
            <Text className="text-lg text-gray-300">Veuillez vous connecter pour continuer</Text>
        )}
      </View>
  );
}