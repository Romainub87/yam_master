import React, {useEffect, useState} from 'react';
import { View, Text } from 'react-native';
import { Dice } from "@/models/Dice";
import {useWebSocket} from "@/context/WebSocketContext";

export default function DiceViewer({ diceValues }: { diceValues: Dice[] }) {
    const { lastMessage } = useWebSocket();
    const [updatedDiceValues, setDiceValues] = useState<Dice[]>(diceValues);

    useEffect(() => {
        setDiceValues(diceValues);
    }, [diceValues]);

    useEffect(() => {
        if (lastMessage) {
            if (lastMessage.type === 'opponent.toggleLock') {
                setDiceValues(lastMessage.dice);
            }
        }
    }, [lastMessage]);

    return (
        <View style={{ flexDirection: 'row', marginBottom: 24 }}>
            {updatedDiceValues.map((dice, index) => (
                <View
                    key={index}
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
                </View>
            ))}
        </View>
    );
}