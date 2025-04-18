import React from 'react';
import { View, Text } from 'react-native';
import DiceViewer from "@/components/game/DiceViewer";
import { GameData } from "@/models/GameData";

interface OpponentInfoProps {
    gameData: GameData;
}

const OpponentInfos: React.FC<OpponentInfoProps> = ({ gameData }: {gameData: GameData}) => {
    if (!gameData.opponentScore ) {
        return (
            <View className="p-4 bg-gray-800 rounded-lg">
                <Text className="text-white">Aucune information sur l'adversaire</Text>
            </View>
        );
    }


    return (
        <View className="p-4 w-full h-1/6 bg-gray-800 rounded-lg">
            <Text className="text-white text-lg font-bold justify-center flex">Adversaire</Text>
            <Text className="text-gray-300 text-2xl">Score : {gameData.opponentScore.score}</Text>
            {gameData.opponentScore.turn && gameData.dice && (
                <View className="my-2 flex-col justify-center items-center w-full">
                    <Text className="text-gray-300 mb-2">Lancers restants : {gameData.opponentScore.rolls_left}</Text>
                    <DiceViewer diceValues={gameData.dice} />
                </View>
            )}
        </View>
    );
};

export default OpponentInfos;