import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { GameData } from '@/models/GameData';
import { useEffect } from 'react';
import { useWebSocket } from "@/context/WebSocketContext";
import { useAuth } from "@/context/AuthContext";

interface TimerProps {
    gameData: GameData;
}

const TurnTimer: React.FC<TimerProps> = ({ gameData }) => {
    const [timeLeft, setTimeLeft] = useState(gameData?.game?.timer);
    const [isCurrentTurn, setIsCurrentTurn] = useState(gameData?.playerScore?.turn);
    const { lastMessage, sendMessage } = useWebSocket();
    const { user } = useAuth();

    useEffect(() => {
        setIsCurrentTurn(gameData?.playerScore?.turn);
        setTimeLeft(gameData?.game?.timer);
    }, [gameData]);

    useEffect(() => {
        if (lastMessage && lastMessage.type === 'game.timerUpdate') {
            setTimeLeft(lastMessage.time);
        }

    }, [lastMessage]);

    useEffect(() => {
        if (gameData && isCurrentTurn && gameData?.game?.status !== 'FINISHED') {
            if (timeLeft > 0) {
                const interval = setInterval(() => {
                    sendMessage({
                        type: 'game.timerUpdate',
                        payload: {
                            gameId: gameData?.game?.id,
                            userId: user?.id,
                            time: timeLeft,
                        },
                    });
                }, 1000);

                return () => clearInterval(interval);
            } else {
                sendMessage({
                    type: 'game.turnChange',
                    payload: {
                        gameId: gameData?.game?.id,
                        userId: user?.id,
                    },
                });
            }
        }
    }, [isCurrentTurn, timeLeft]);

    return (
        <View>
            {isCurrentTurn  ? (
                <Text className="text-white">Temps restant : {timeLeft}s</Text>
            ) : (
                <Text className="text-white">En attente du tour...</Text>
            )}
        </View>
    );
};

export default TurnTimer;