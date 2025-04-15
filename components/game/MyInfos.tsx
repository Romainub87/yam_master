import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import DiceRoller from '@/components/game/DiceRoller';
import { useWebSocket } from '@/context/WebSocketContext';

interface MyInfosProps {
    token: string;
    gameData: any;
}

const MyInfos: React.FC<MyInfosProps> = ({ token, gameData }) => {
    const { sendMessage, lastMessage } = useWebSocket();
    const [playerScore, setPlayerScore] = useState<any>(gameData?.playerScore);
    const [diceValues, setDiceValues] = useState<number[]>(Array(5).fill(null));

    useEffect(() => {
        setPlayerScore(gameData?.playerScore);
    }, [gameData]);

    useEffect(() => {
        if (lastMessage && lastMessage.type === 'game.rollDices') {
            setDiceValues(lastMessage.dice);
            setPlayerScore(lastMessage.playerScore);
        }
    }, [lastMessage]);

    const handleRoll = () => {
        console.log(gameData);
        sendMessage({
            type: 'game.rollDices',
            payload: {
                token,
                gameId: gameData.game.id,
                count: 5,
            },
        });
    };

    return (
        <View className="p-4 bg-gray-800 rounded-lg">
            <Text className="text-white text-lg font-bold">Mes Infos</Text>
            {playerScore ? (
                <>
                    <Text className="text-gray-300">Score : {playerScore.score}</Text>
                    <Text className="text-gray-300">Lancers restants : {playerScore.rolls_left}</Text>
                    <Text className="text-gray-300">
                        {playerScore.turn ? 'Tour actuel : Oui' : 'Tour actuel : Non'}
                    </Text>
                    <DiceRoller token={token} rolls_left={playerScore.rolls_left} diceValues={diceValues} onRoll={handleRoll} />
                </>
            ) : (
                <Text className="text-gray-300">Aucune donnée disponible</Text>
            )}
        </View>
    );
};

export default MyInfos;