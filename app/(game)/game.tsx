import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import GameGrid from '@/components/game/GameGrid';
import { useAuth } from '@/context/AuthContext';
import { useLocalSearchParams } from 'expo-router/build/hooks';
import OpponentInfos from '@/components/game/OpponentInfos';
import MyInfos from '@/components/game/MyInfos';
import { GameData } from '@/models/GameData';
import { useWebSocket } from '@/context/WebSocketContext';
import TurnTimer from '@/components/game/TurnTimer';

export default function GameScreen() {
    const {user } = useAuth();
    const { sendMessage, lastMessage, isConnected } = useWebSocket();
    const [gameData, setGameData] = useState<GameData>({} as GameData);
    const params = useLocalSearchParams();

    useEffect(() => {
        if (user && params.id && isConnected) {
            sendMessage({
                type: 'game.subscribe',
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
                    setGameData(
                        (prev) => ({
                            ...prev,
                            game: lastMessage.game,
                            dice: lastMessage.dice,
                            playerScore: lastMessage.playerScore || null,
                            combinations: lastMessage.combinations || [],
                        })
                    )
                }
            } catch (error) {
                console.error('Erreur lors du traitement du message WebSocket :', error);
            }
        }
    }, [lastMessage]);

    return (
        <View className="flex justify-center items-center h-full bg-black">
            <OpponentInfos gameData={gameData} />
            <TurnTimer gameData={gameData}/>
            <GameGrid gameData={gameData} />
            <MyInfos gameData={gameData} />
        </View>
    );
}