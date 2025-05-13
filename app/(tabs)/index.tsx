import React, { useEffect, useState } from 'react';
import { View, Text, ImageBackground, useColorScheme } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import CustomButton from '@/components/CustomButton';
import { useRouter } from 'expo-router';
import { useWebSocket } from '@/context/WebSocketContext';
import { Colors } from '@/constants/Colors';

export default function HomeScreen() {
  const { user, logout } = useAuth();
  const { sendMessage, lastMessage } = useWebSocket();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const [isSearching, setIsSearching] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState<number | null>(null);

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
          router.push({
            pathname: '/game',
            params: { id: lastMessage.game.id },
          });
        }
        if (lastMessage.type === 'game.reconnect') {
          router.push({
            pathname: '/game',
            params: { id: lastMessage.gameId },
          });
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
    <ImageBackground
      source={require('@/assets/images/background.jpg')}
      className="flex-1"
      resizeMode="cover"
    >
      <View className="flex justify-center items-center min-h-screen w-full">
        {user ? (
          <View
            className="flex flex-col p-10 rounded-xl lg:w-1/3 space-y-4"
            style={{
              backgroundColor: Colors[colorScheme!]['yam-background'],
            }}
          >
            <Text
              className="text-4xl font-bold text-center"
              style={{ color: Colors[colorScheme!]['yam-default'] }}
            >
              Bienvenue, {user.username} 👋
            </Text>

            <View className="mt-2 space-y-2">
              <Text
                className="text-base"
                style={{ color: Colors[colorScheme!]['yam-default'] }}
              >
                🏆 MMR : {user.mmr !== null ? user.mmr : 'Non classé'}
              </Text>
            </View>

            <View className="my-6">
              {isSearching ? (
                <View className="items-center space-y-2">
                  <Text
                    className="text-lg"
                    style={{ color: Colors[colorScheme!]['yam-default'] }}
                  >
                    🔍 Recherche de parties en cours...
                  </Text>
                  {timeElapsed !== null && (
                    <Text
                      className="text-sm"
                      style={{ color: Colors[colorScheme!]['yam-default'] }}
                    >
                      Temps écoulé : {timeElapsed} secondes
                    </Text>
                  )}
                  <CustomButton title="Annuler" onPress={leaveQueue} />
                </View>
              ) : (
                <CustomButton title="Jouer" onPress={joinQueue} />
              )}
            </View>

            <CustomButton title="Se déconnecter" onPress={logout} />
          </View>
        ) : (
          <Text
            className="text-lg"
            style={{ color: Colors[colorScheme!]['yam-default'] }}
          >
            Veuillez vous connecter pour continuer
          </Text>
        )}
      </View>
    </ImageBackground>
  );
}
