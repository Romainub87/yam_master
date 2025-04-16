import React , { useEffect } from 'react';
import { View, Text } from 'react-native';
import DiceRoller from "@/components/game/DiceRoller";
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
        <View className="p-4 bg-gray-800 rounded-lg">
            <Text className="text-white text-lg font-bold">Adversaire</Text>
            <Text className="text-gray-300">Score : {gameData.opponentScore.score}</Text>
            <Text className="text-gray-300">Lancers restants : {gameData.opponentScore.rolls_left}</Text>
            <Text className="text-gray-300">
                {gameData.opponentScore.turn ? 'Tour actuel : Oui' : 'Tour actuel : Non'}
            </Text>
            {gameData.opponentScore.turn && gameData.dice && (
                <DiceViewer diceValues={gameData.dice} />
            )}
        </View>
    );
};

export default OpponentInfos;