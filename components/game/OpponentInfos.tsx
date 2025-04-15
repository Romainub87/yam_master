import React from 'react';
import { View, Text } from 'react-native';

interface OpponentInfoProps {
    opponentScore: {
        user_id: number;
        score: number;
        rolls_left: number;
        turn: boolean;
    } | null;
}

const OpponentInfo: React.FC<OpponentInfoProps> = ({ opponentScore }) => {
    if (!opponentScore) {
        return (
            <View className="p-4 bg-gray-800 rounded-lg">
                <Text className="text-white">Aucune information sur l'adversaire</Text>
            </View>
        );
    }

    return (
        <View className="p-4 bg-gray-800 rounded-lg">
            <Text className="text-white text-lg font-bold">Adversaire</Text>
            <Text className="text-gray-300">Score : {opponentScore.score}</Text>
            <Text className="text-gray-300">Lancers restants : {opponentScore.rolls_left}</Text>
            <Text className="text-gray-300">
                {opponentScore.turn ? 'Tour actuel : Oui' : 'Tour actuel : Non'}
            </Text>
        </View>
    );
};

export default OpponentInfo;