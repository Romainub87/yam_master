import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ImageBackground,
  useColorScheme,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { useLocalSearchParams } from 'expo-router/build/hooks';
import { useWebSocket } from '@/context/WebSocketContext';
import { GameData } from '@/models/GameData';
import GameGrid from '@/components/game/GameGrid';
import OpponentInfos from '@/components/game/OpponentInfos';
import MyInfos from '@/components/game/MyInfos';
import TurnTimer from '@/components/game/TurnTimer';
import WinLoseModal from '@/components/game/WinLoseModal';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';

export default function GameScreen() {
  const { user } = useAuth();
  const { sendMessage, lastMessage, isConnected } = useWebSocket();
  const [gameData, setGameData] = useState<GameData>({} as GameData);
  const params = useLocalSearchParams();
  const [showModal, setShowModal] = useState({ visible: false, message: '' });
  const colorScheme = useColorScheme();
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 1024;

  useEffect(() => {
    if (user && params.id && isConnected) {
      sendMessage({
        type: 'game.subscribe',
        payload: {
          userId: user.id,
          gameId: parseInt(params.id as string, 10),
        },
      });
      sendMessage({
        type: 'game.reconnect',
        payload: {
          userId: user.id,
          gameId: parseInt(params.id as string, 10),
        },
      });
    }
  }, [user, params.id, isConnected]);

  useEffect(() => {
    if (lastMessage) {
      try {
        if (
          lastMessage.type === 'game.update' ||
          lastMessage.type === 'game.start'
        ) {
          setGameData(lastMessage);
        }
        if (lastMessage.type === 'opponent.update') {
          setGameData((prev) => ({
            ...prev,
            dice: lastMessage.dice,
            opponentScore: lastMessage.opponentScore || null,
          }));
        }
        if (lastMessage.type === 'game.rollDices') {
          setGameData((prev) => ({
            ...prev,
            game: lastMessage.game,
            dice: lastMessage.dice,
            playerScore: lastMessage.playerScore || null,
            combinations: lastMessage.combinations || [],
          }));

          if (
            lastMessage.playerScore.rolls_left === 0 &&
            lastMessage.combinations.length === 0
          ) {
            sendMessage({
              type: 'game.turnChange',
              payload: {
                gameId: lastMessage.game.id,
                userId: user?.id,
              },
            });
          }
        }
        if (
          lastMessage.type === 'game.win' ||
          lastMessage.type === 'game.lose'
        ) {
          setShowModal({
            visible: true,
            message:
              lastMessage.type === 'game.win'
                ? 'Vous avez gagné !'
                : 'Vous avez perdu.',
          });
          setGameData({} as GameData);
        }
        if (
          lastMessage.type === 'game.definitiveQuit' ||
          lastMessage.type === 'player.ff'
        ) {
          setGameData({} as GameData);
        }
      } catch (error) {
        console.error(
          'Erreur lors du traitement du message WebSocket :',
          error
        );
      }
    }
  }, [lastMessage]);

  const handleEndGame = () => {
    setShowModal({ ...showModal, visible: false });
    router.push('/');
  };

  return (
    <ImageBackground
      source={require('@/assets/images/background.jpg')}
      className="flex-1"
      resizeMode="cover"
    >
      <ScrollView>
        <View className="flex flex-col items-center min-h-screen p-8 gap-10">
          <Text
            className="text-4xl font-bold text-center w-full"
            style={{ color: Colors[colorScheme!]['yam-default'] }}
          >
            Partie en cours 🎲
          </Text>
          <View
            className="flex-1 w-full justify-around items-center gap-10"
            style={{
              flexDirection: isLargeScreen ? 'row' : 'column',
              maxWidth: 1230,
            }}
          >
            <GameGrid gameData={gameData} />
            <View
              className="flex flex-1 flex-col w-full items-center"
              style={{
                maxWidth: 550,
                gap: 30,
              }}
            >
              <OpponentInfos gameData={gameData} />
              <TurnTimer gameData={gameData} />
              <MyInfos gameData={gameData} />
            </View>
          </View>

          <WinLoseModal
            visible={showModal.visible}
            message={showModal.message}
            onClose={handleEndGame}
          />
        </View>
      </ScrollView>
    </ImageBackground>
  );
}
