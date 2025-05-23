import React, { useEffect, useState } from 'react';
import { View, Text, ImageBackground, useColorScheme } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import CustomButton from '@/components/CustomButton';
import { useRouter } from 'expo-router';
import { useWebSocket } from '@/context/WebSocketContext';
import { Colors } from '@/constants/Colors';
import GameHistory from '@/components/GameHistory';
import RankImage from "@/components/user/RankImage";

export default function HomeScreen() {
  const { user, logout } = useAuth();
  const { sendMessage, lastMessage } = useWebSocket();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const [isSearching, setIsSearching] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState<number | null>(null);
  const [showBotMode, setShowBotMode] = useState(false);
  const [mmr, setMmr] = useState(user?.mmr ?? 0);

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
        if (lastMessage.type === 'player.loseMmr') {
          if (lastMessage.isRanked) {
            if (user?.mmr) {
              user.mmr = user?.mmr - 9;
              setMmr((prev) => (prev ?? 0) - 9);
            }
          } else {
            if (user?.hide_mmr) {
              user.hide_mmr = user?.hide_mmr - 9;
            }
          }
        }
        if (lastMessage.type === 'player.winMmr') {
          if (lastMessage.isRanked) {
            if (user?.mmr) {
              user.mmr = user?.mmr + 9;
              setMmr((prev) => (prev ?? 0) + 9);
            }
          } else {
            if (user?.hide_mmr) {
              user.hide_mmr = user?.hide_mmr + 9;
            }
          }
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

  const joinBotGame = () => {
    sendMessage({
      type: 'game.bot',
      payload: {
        userId: user?.id,
        bot: true,
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
      style={{ flex: 1, width: '100%', height: '100%' }}
      resizeMode="cover"
    >
      <View className="flex flex-col justify-center xl:flex-row xl:justify-center items-center min-h-screen md:ml-[20vw] xl:ml-[12vw] p-8 gap-20">
        {user ? (
          <>
            <View
              className="flex flex-col px-10 py-8 rounded-xl md:min-w-[400px] lg:min-w-[600px] space-y-4"
              style={{
                backgroundColor: Colors[colorScheme!]['yam-background'],
              }}
            >
              <View className="my-6">
                {isSearching ? (
                  <>
                    <View className="items-center space-y-2 mt-4">
                      <Text
                        className="text-lg text-white"
                      >
                        🔍 Recherche de parties en cours...
                      </Text>
                      {timeElapsed !== null && (
                        <Text
                          className="text-sm text-white"
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
                    {!showBotMode && (
                      <>
                        <CustomButton
                          title="Partie rapide"
                          onPress={joinQueue}
                          className="w-full max-w-[420px]"
                        />
                        <CustomButton
                            title={
                              <Text
                                  className="flex flex-row items-center justify-center space-x-2"
                              >
                                <Text className="text-white text-center font-bold text-lg">
                                  Partie classée
                                </Text>
                                  {mmr !== null ? <RankImage mmr={user?.mmr ?? 0} /> : 'Non classé'}{' '}
                              </Text>
                            }
                            onPress={joinRankedQueue}
                            className="w-full max-w-[420px] mt-4"
                        />
                        <CustomButton
                          title={"Jouer contre l'ordinateur"}
                          onPress={() => setShowBotMode(true)}
                          className="w-full max-w-[420px] mt-4"
                        />
                      </>
                    )}
                    {showBotMode && (
                      <View className="w-full flex flex-col items-start">
                        <View className="w-full flex flex-row justify-start">
                          <CustomButton
                              title={
                                <Text className="flex flex-row items-center">
                                  <ImageBackground
                                      source={require('@/assets/ui/return.png')}
                                      style={{ width: 20, height: 20, marginRight: 8 }}
                                      imageStyle={{ resizeMode: 'contain' }}
                                  />
                                  Retour
                                </Text>
                              }
                              onPress={() => setShowBotMode(false)}
                              className="w-fit max-w-[420px] mb-2"
                          />
                        </View>
                        <View className="w-full flex flex-col items-center mt-4">
                          <CustomButton
                            title={'Mode facile'}
                            onPress={joinBotGame}
                            className="w-full max-w-[420px] mt-2"
                          />
                        </View>
                      </View>
                    )}
                  </View>
                )}
              </View>
            </View>
            <View
              className="flex flex-col p-5 rounded-xl md:min-w-[500px] lg:min-w-[700px] space-y-7"
              style={{
                backgroundColor: Colors[colorScheme!]['yam-background'],
              }}
            >
              <GameHistory />
            </View>
          </>
        ) : (
          <Text
            className="text-lg text-white"
          >
            Veuillez vous connecter pour continuer
          </Text>
        )}
      </View>
    </ImageBackground>
  );
}
