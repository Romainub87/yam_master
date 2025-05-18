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
        ranked: false,
      },
    });
  };

    const joinRankedQueue = () => {
        sendMessage({
        type: 'queue.join',
        payload: {
            userId: user?.id,
            ranked: true,
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
      <View className="flex flex-col items-center min-h-screen ml-[158px] p-8 gap-20">
        {user ? (
          <>
            <Text
              className="text-4xl font-bold text-start w-full"
              style={{ color: Colors[colorScheme!]['yam-default'] }}
            >
              Bienvenue, {user.username} 👋
            </Text>
            <View
              className="flex flex-col px-10 py-8 rounded-xl md:min-w-[400px] lg:min-w-[600px] space-y-4"
              style={{
                backgroundColor: Colors[colorScheme!]['yam-background'],
              }}
            >
              <View className="space-y-6">
                <Text
                  className="text-base"
                  style={{
                    color: Colors[colorScheme!]['yam-default'],
                    fontSize: 22,
                    fontWeight: 700,
                  }}
                >
                  🏆 MMR : {user.mmr !== null ? user.mmr : 'Non classé'}
                </Text>
              </View>

              <View className="my-6">
                {isSearching ? (
                  <>
                    <View className="items-center space-y-2 mt-4">
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
                    </View>
                    <View className="w-full flex items-center mt-5">
                      <CustomButton
                        title="Annuler"
                        onPress={leaveQueue}
                        className="w-full max-w-[250px]"
                      />
                    </View>
                  </>
                ) : (
                  <View className="w-full flex items-center">
                    <CustomButton
                      title="Jouer"
                      onPress={joinQueue}
                      className="w-full max-w-[420px]"
                    />
                    <CustomButton
                        title={"Jouer en classé"}
                        onPress={joinRankedQueue}
                        className="w-full max-w-[420px] mt-4"
                        />
                  </View>
                )}
              </View>
            </View>
            <View
              className="flex flex-col p-10 rounded-xl md:min-w-[500px] lg:min-w-[700px] space-y-7"
              style={{
                backgroundColor: Colors[colorScheme!]['yam-background'],
              }}
            >
              <Text
                className="text-base"
                style={{
                  color: Colors[colorScheme!]['yam-default'],
                  fontSize: 22,
                  fontWeight: 700,
                }}
              >
                Historique des parties
              </Text>
              <View
                style={{
                  backgroundColor: Colors[colorScheme!]['yam-default'],
                  opacity: 0.6,
                  height: 1,
                }}
              ></View>
            </View>
          </>
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
