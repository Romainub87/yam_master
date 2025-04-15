import React, { useEffect, useState } from 'react';
import { View, Text, Button } from 'react-native';
import { useWebSocket } from '@/context/WebSocketContext';

interface TimerProps {
    token: string;
    gameId: string;
    rollsLeft: number;
    isCurrentTurn: boolean;
}

const TurnTimer: React.FC<TimerProps> = ({ token, gameId, rollsLeft, isCurrentTurn }) => {
    const { sendMessage } = useWebSocket();
    const [timeLeft, setTimeLeft] = useState(20);

    useEffect(() => {
        if (!isCurrentTurn || rollsLeft === 0) {
            setTimeLeft(20); // Réinitialiser le timer si ce n'est pas le tour du joueur
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    sendMessage({
                        type: 'game.turnChange',
                        payload: {
                            token,
                            gameId,
                        },
                    });
                    return 20;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer); // Nettoyer le timer à chaque changement
    }, [isCurrentTurn, rollsLeft]);

    return (
        <View>
            {isCurrentTurn && rollsLeft > 0 ? (
                <Text className="text-black">Temps restant : {timeLeft}s</Text>
            ) : (
                <Text className="text-black">En attente du tour...</Text>
            )}
        </View>
    );
};

export default TurnTimer;