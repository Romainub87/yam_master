import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import CustomButton from '@/components/CustomButton';
import { useRouter } from 'expo-router';
import { useWebSocket } from '@/context/WebSocketContext';

export default function HomeScreen() {
  const { user, logout } = useAuth();
  const { sendMessage, lastMessage } = useWebSocket();
  const router = useRouter();
  const [isSearching, setIsSearching] = useState(false);
    const [timeElapsed, setTimeElapsed] = useState(null);

  useEffect(() => {
    if (lastMessage) {
      try {
        if (lastMessage.type === 'queue.timer') {
          setTimeElapsed(lastMessage.time);
        }
        if (lastMessage.type === 'queue.added') {
          setIsSearching(true);
        }
        if (lastMessage.type === 'game.start') {
          router.push({ pathname: '/game', params: { id: lastMessage.game.id } });
        }
        if (lastMessage.type === 'game.reconnect') {
          router.push({ pathname: '/game', params: { id: lastMessage.gameId } });
        }
      } catch (error) {
        console.error(
          'Erreur lors du traitement du message WebSocket :',
          error
        );
      }
    }
  }, [lastMessage]);

  const joinQueue = () => {
    sendMessage({
      type: 'queue.join',
      payload: {
        userId: user?.id,
      },
    });
  };

  const leaveQueue = () => {
    sendMessage({
      type: 'queue.leave',
      payload: {
        userId: user?.id,
      },
    });
    setIsSearching(false);
    setTimeElapsed(null);
  };

  return (
      <View className="flex-1 justify-center items-center bg-black">
        {user ? (
            <View className="items-center p-6 rounded-lg shadow-lg">
              <Text className="text-4xl text-white mb-6 font-bold">Bienvenue, {user.username} 👋</Text>
              {isSearching ? (
                  <View className="items-center">
                    <Text className="text-lg text-gray-300 mb-4">🔍 Recherche de parties en cours...</Text>
                    {timeElapsed !== null && (
                        <Text className="text-sm text-gray-300 mb-4">
                          Temps écoulé : {timeElapsed} secondes
                        </Text>
                    )}
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
