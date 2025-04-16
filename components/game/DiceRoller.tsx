import React, {useEffect, useState} from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Dice } from "@/models/Dice";
import { useWebSocket } from '@/context/WebSocketContext';
import { useAuth } from '@/context/AuthContext';

export default function DiceRoller({rolls_left, diceValues, gameId}: { rolls_left: number, diceValues: Dice[], gameId: number }) {
    const [dices, setDices] = useState<Dice[]>(diceValues);
    const { sendMessage } = useWebSocket();
    const { user } = useAuth();

    useEffect(() => {
        setDices(diceValues);
    }, [diceValues]);

    const handleRoll = () => {
        sendMessage({
            type: 'game.rollDices',
            payload: {
                userId: user?.id,
                gameId: gameId,
                dices: dices,
            },
        });
    };

    const toggleLock = (index: number) => {
        setDices((prevDice) =>
            prevDice.map((dice, i) => (i === index ? { ...dice, locked: !dice.locked } : dice))
        );
    };

    return (
        <View className="flex flex-col items-center justify-center">
            <View className="flex flex-row mb-6">
                {dices.map((dice, index) => (
                    <TouchableOpacity
                        key={index}
                        onPress={() => toggleLock(index)}
                        style={{
                            width: 50,
                            height: 50,
                            margin: 5,
                            backgroundColor: dice.locked ? 'gray' : 'white',
                            justifyContent: 'center',
                            alignItems: 'center',
                            borderWidth: 1,
                            borderColor: 'black',
                        }}
                    >
                        <Text style={{ fontSize: 20 }}>{dice.value}</Text>
                    </TouchableOpacity>
                ))}
            </View>
            <TouchableOpacity
                onPress={() => handleRoll()}
                style={{
                    padding: 10,
                    backgroundColor: rolls_left > 0 ? 'blue' : 'gray',
                    borderRadius: 5,
                }}
                disabled={rolls_left <= 0}
            >
                <Text style={{ color: 'white', fontSize: 16 }}>Lancer les dés</Text>
            </TouchableOpacity>
        </View>
    );
}