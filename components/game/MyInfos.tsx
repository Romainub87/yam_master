import React, { useEffect, useState } from 'react';
import { View, Text, Modal, Button, useColorScheme } from 'react-native';
import DiceRoller from '@/components/game/DiceRoller';
import { useWebSocket } from '@/context/WebSocketContext';
import { useAuth } from '@/context/AuthContext';
import ForfeitButton from '@/components/game/ForfeitButton';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import CustomButton from '../CustomButton';

interface MyInfosProps {
  gameData: any;
}

const MyInfos: React.FC<MyInfosProps> = ({ gameData }) => {
  const colorScheme = useColorScheme();
  const { sendMessage, lastMessage } = useWebSocket();
  const { user } = useAuth();
  const [playerScore, setPlayerScore] = useState<any>(gameData?.playerScore);
  const [isOpponentQuit, setIsOpponentQuit] = useState(false);
  const [isOpponentFF, setIsOpponentFF] = useState(false);
  const [timer, setTimer] = useState<number | null>(null);
  const [showChallengeButton, setShowChallengeButton] = useState(true);

  const handleDefinitiveQuitGame = () => {
    sendMessage({
      type: 'game.definitiveQuit',
      payload: {
        gameId: gameData.game.id,
      },
    });
  };

  const handleChallenge = () => {
    sendMessage({
      type: 'game.challenge',
      payload: {
        gameId: gameData.game.id,
        userId: user?.id,
      },
    });
  };

  useEffect(() => {
    if (lastMessage) {
      if (lastMessage.type === 'player.quitGame') {
        setIsOpponentQuit(true);
        setTimer(30);
      }
      if (lastMessage.type === 'game.definitiveQuit') {
        router.push('/');
        setIsOpponentQuit(false);
        setIsOpponentFF(false);
      }
      if (lastMessage.type === 'opponent.reconnect') {
        setIsOpponentQuit(false);
      }
      if (lastMessage.type === 'player.ff') {
        router.push('/');
      }
      if (lastMessage.type === 'opponent.ff') {
        setIsOpponentFF(true);
        setTimer(5);
      }
      if (lastMessage.type === 'game.challenge') {
        setShowChallengeButton(lastMessage.show);
      }
    }
  }, [lastMessage]);

  useEffect(() => {
    setPlayerScore(gameData?.playerScore);
    const hasFreeCells = gameData?.game?.grid_state?.some((row: any[]) =>
      row.some(
        (cell: { combination: string; user: any }) =>
          cell.combination === 'DEFI' && !cell.user
      )
    );
    setShowChallengeButton(hasFreeCells);
  }, [gameData]);

  useEffect(() => {
    if ((isOpponentQuit || isOpponentFF) && timer !== null) {
      const interval = setInterval(() => {
        setTimer((prev) => (prev !== null && prev > 0 ? prev - 1 : null));
      }, 1000);

      if (timer === 0) {
        handleDefinitiveQuitGame();
      }

      return () => clearInterval(interval);
    }
  }, [isOpponentQuit, isOpponentFF, timer]);

  return (
    <View
      className="w-full rounded-lg"
      style={{
        backgroundColor: Colors[colorScheme!]['yam-background'],
      }}
    >
      <Text
        className="text-white text-lg font-bold justify-center flex p-3"
        style={{ backgroundColor: Colors[colorScheme!]['yam-background-2'] }}
      >
        Moi
      </Text>
      <View className="flex flex-col gap-3 p-4">
        {playerScore ? (
          <>
            <Text className="text-gray-300 text-xl">
              Score : {playerScore.score}
            </Text>
            <View
              style={{
                backgroundColor: Colors[colorScheme!]['yam-default'],
                opacity: 0.6,
                height: 1,
                width: '100%',
              }}
            />
            {playerScore.turn && (
              <View className="flex gap-3 my-2 flex-col justify-center items-center w-full">
                <Text className="text-gray-300">
                  Lancers restants : {playerScore.rolls_left}
                </Text>
                <DiceRoller
                  rolls_left={playerScore.rolls_left}
                  diceValues={gameData?.dice || gameData?.game?.dice_state}
                  gameId={gameData?.game?.id}
                />
              </View>
            )}
            <View className="my-2 flex-row justify-between w-full">
              <ForfeitButton gameId={gameData?.game?.id} />
              <View
                style={{
                  opacity:
                    !showChallengeButton ||
                    !playerScore.turn ||
                    playerScore.rolls_left < 2 ||
                    playerScore.rolls_left === 3 > 0
                      ? 0.5
                      : 1,
                }}
              >
                <CustomButton
                  title="Lancer défi"
                  onPress={handleChallenge}
                  disabled={
                    !showChallengeButton ||
                    !playerScore.turn ||
                    playerScore.rolls_left < 2 ||
                    playerScore.rolls_left === 3
                  }
                  className="bg-[#4dc3ea] shadow-[#1182da] hover:bg-[#6fdefe] text-base py-2 px-4 cursor-pointer"
                />
              </View>
            </View>
          </>
        ) : (
          <Text className="text-gray-300">Aucune donnée disponible</Text>
        )}
      </View>

      {(isOpponentQuit || isOpponentFF) && (
        <Modal transparent={true} animationType="slide">
          <View className="flex-1 justify-center items-center bg-black/50">
            <View className="bg-white p-6 rounded-lg">
              <Text className="text-black">
                {isOpponentQuit
                  ? 'Votre adversaire a quitté la partie.'
                  : 'Votre adversaire a abandonné la partie.'}
              </Text>
              {timer !== null && (
                <Text className="text-black">
                  Vous serez déconnecté dans {timer} secondes.
                </Text>
              )}
            </View>
          </View>
          <View className="absolute inset-0 blur-md" />
        </Modal>
      )}
    </View>
  );
};

export default MyInfos;
