import React, {useEffect, useState} from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

type Dice = {
    value: number;
    locked: boolean;
};
export default function DiceRoller({rolls_left, diceValues, onRoll}: {token: string, rolls_left: number, diceValues: number[], onRoll: () => void}) {
    const [dice, setDice] = useState<Dice[]>(diceValues.map((value) => ({ value, locked: false })));

    useEffect(() => {
        setDice(diceValues.map((value, index) => ({ value, locked: dice[index]?.locked || false })));
    }, [diceValues]);

    const rollDice = async () => {
        onRoll();
    };

    const toggleLock = (index: number) => {
        setDice((prevDice) =>
            prevDice.map((die, i) => (i === index ? { ...die, locked: !die.locked } : die))
        );
    };

    return (
        <View className="flex flex-col items-center justify-center">
            <Text className="text-lg mb-5">Tirages restants : {rolls_left}</Text>
            <View className="flex flex-row mb-6">
                {dice.map((die, index) => (
                    <TouchableOpacity
                        key={index}
                        onPress={() => toggleLock(index)}
                        style={{
                            width: 50,
                            height: 50,
                            margin: 5,
                            backgroundColor: die.locked ? 'gray' : 'white',
                            justifyContent: 'center',
                            alignItems: 'center',
                            borderWidth: 1,
                            borderColor: 'black',
                        }}
                    >
                        <Text style={{ fontSize: 20 }}>{die.value}</Text>
                    </TouchableOpacity>
                ))}
            </View>
            <TouchableOpacity
                onPress={rollDice}
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