import React, { useEffect, useState } from 'react';
import { View, Text, Button } from 'react-native';
import { useWebSocket } from '@/context/WebSocketContext';
import {useAuth} from "@/context/AuthContext";

interface TimerProps {
    token: string;
    gameId: number;
    rollsLeft: number;
    isCurrentTurn: boolean;
}

const TurnTimer: React.FC<TimerProps> = ({ token, gameId, rollsLeft, isCurrentTurn }) => {
    const { sendMessage } = useWebSocket();
    const { user } = useAuth();
    const [timeLeft, setTimeLeft] = useState(20);

    useEffect(() => {
        if (!isCurrentTurn || rollsLeft === 0) {
            setTimeLeft(20);
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    sendMessage({
                        type: 'game.turnChange',
                        payload: {
                            userId: user?.id,
                            gameId: gameId,
                        },
                    });
                    return 20;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [isCurrentTurn, rollsLeft]);

    return (
        <View>
            {isCurrentTurn && rollsLeft > 0 ? (
                <Text className="text-white">Temps restant : {timeLeft}s</Text>
            ) : (
                <Text className="text-white">En attente du tour...</Text>
            )}
        </View>
    );
};

export default TurnTimer;