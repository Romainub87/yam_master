import React from 'react';
import { View, Text, useColorScheme } from 'react-native';
import DiceViewer from '@/components/game/DiceViewer';
import { GameData } from '@/models/GameData';
import { Colors } from '@/constants/Colors';

interface OpponentInfoProps {
  gameData: GameData;
}

const OpponentInfos: React.FC<OpponentInfoProps> = ({
  gameData,
}: {
  gameData: GameData;
}) => {
  const colorScheme = useColorScheme();

  if (!gameData.opponentScore) {
    return (
      <View
        className="p-4 rounded-lg"
        style={{
          backgroundColor: Colors[colorScheme!]['yam-background'],
        }}
      >
        <Text className="text-white">Aucune information sur l'adversaire</Text>
      </View>
    );
  }

  return (
    <View
      className="w-full rounded-lg"
      style={{
        backgroundColor: Colors[colorScheme!]['yam-background'],
      }}
    >
      <Text
        className="text-white text-lg font-bold justify-center flex p-3"
        style={{
          backgroundColor: Colors[colorScheme!]['yam-background-2'],
          borderTopLeftRadius: 8,
          borderTopRightRadius: 8,
        }}
      >
        Adversaire
      </Text>
      <View className="flex flex-col gap-3 p-4">
        <Text className="text-gray-300 text-xl">
          Score : {gameData.opponentScore.score}
        </Text>
        {gameData.opponentScore.turn && gameData.dice && (
          <View className="flex gap-3 my-2 flex-col justify-center items-center w-full">
            <View
              style={{
                backgroundColor: Colors[colorScheme!]['yam-default'],
                opacity: 0.6,
                height: 1,
                width: '100%',
              }}
            ></View>
            <Text className="text-gray-300">
              Lancers restants : {gameData.opponentScore.rolls_left}
            </Text>

            <DiceViewer diceValues={gameData.dice} />
          </View>
        )}
      </View>
    </View>
  );
};

export default OpponentInfos;
