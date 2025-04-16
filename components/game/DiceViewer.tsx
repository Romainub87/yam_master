import React from 'react';
import { View, Text } from 'react-native';
import { Dice } from "@/models/Dice";

export default function DiceViewer({ diceValues }: { diceValues: Dice[] }) {
    return (
        <View style={{ flexDirection: 'row', marginBottom: 24 }}>
            {diceValues.map((dice, index) => (
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