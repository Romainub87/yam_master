import React, {useEffect, useState} from 'react';
import { View, Text } from 'react-native';
import DiceRoller from '@/components/game/DiceRoller';

interface MyInfosProps {
    token: string;
    gameData: any;
}

const MyInfos: React.FC<MyInfosProps> = ({ token, gameData }) => {
    const [playerScore, setPlayerScore] = useState<any>(gameData?.playerScore);
    const [diceValues, setDiceValues] = useState<number[]>(Array(5).fill(null));
    const socket = React.useMemo(() => new WebSocket('ws://localhost:3000'), []);

    useEffect(() => {
        setPlayerScore(gameData?.playerScore);
    }, [gameData]);

    useEffect(() => {
        socket.onmessage = (event) => {
            const message = JSON.parse(event.data);
            if (message.type === 'game.rollDices') {
                setDiceValues(message.dice);
                setPlayerScore(message.playerScore);
            }
        };
        return () => socket.close();
    }, [socket]);

    const handleRoll = () => {
        if (socket) {
            socket.send(
                JSON.stringify({
                    type: 'game.rollDices',
                    payload: {
                        token,
                        gameId: gameData.game.id,
                        count: 5
                    },
                })
            );
        }
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