import React, { useEffect, useState } from 'react';
import { View, Alert } from 'react-native';
import GameGrid from '@/components/game/GameGrid';
import { useAuth } from '@/context/AuthContext';
import { useLocalSearchParams } from 'expo-router/build/hooks';
import OpponentInfos from '@/components/game/OpponentInfos';
import MyInfos from '@/components/game/MyInfos';
import { GameData } from '@/models/GameData';
import { useWebSocket } from '@/context/WebSocketContext';
import TurnTimer from '@/components/game/TurnTimer';

export default function GameScreen() {
    const { userToken } = useAuth();
    const { sendMessage, lastMessage, isConnected } = useWebSocket();
    const [gameData, setGameData] = useState<GameData>({} as GameData);
    const params = useLocalSearchParams();

    useEffect(() => {
        if (userToken && params.id && isConnected) {
            sendMessage({
                type: 'game.subscribe',
                payload: {
                    token: userToken,
                    gameId: params.id,
                },
            });
        }
    }, [userToken, params.id, isConnected]);

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
                        opponentScore: lastMessage.opponentScore || null,
                    }));
                }
            } catch (error) {
                console.error('Erreur lors du traitement du message WebSocket :', error);
            }
        }
    }, [lastMessage]);

    const handleCellPress = (row: number, col: number) => {
        Alert.alert(`Cellule cliquée : ${row}, ${col}`);
    };

    return (
        <View className="flex justify-center items-center h-full bg-black">
            <OpponentInfos opponentScore={gameData?.opponentScore || null} />
            <TurnTimer
                token={userToken!}
                gameId={gameData?.game?.id}
                rollsLeft={gameData?.playerScore?.rolls_left}
                isCurrentTurn={gameData?.playerScore?.turn}
            />
            <GameGrid rows={5} columns={5} onCellPress={handleCellPress} />
            <MyInfos token={userToken!} gameData={gameData} />
        </View>
    );
}