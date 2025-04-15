import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';

type Dice = {
    value: number;
    locked: boolean;
};

const fetchDiceRolls = async (count: number, userToken: string): Promise<number[]> => {
    try {
        const response = await fetch(`http://localhost:3000/api/game/roll-dice?count=${count}`, {
            headers: {
                Authorization: `Bearer ${userToken}`,
            },
        });
        if (!response.ok) {
            throw new Error('Erreur lors de la récupération des résultats des dés');
        }
        const data = await response.json();
        return data.dice;
    } catch (error) {
        console.error(error);
        return [];
    }
};

export default function DiceRoller({token}: {token: string}) {
    const [dice, setDice] = useState<Dice[]>(Array(5).fill({ value: 1, locked: false }));
    const [rollsLeft, setRollsLeft] = useState(3);

    const rollDice = async () => {
        if (rollsLeft <= 0) {
            Alert.alert('Aucun tirage restant');
            return;
        }

        const newDice = await fetchDiceRolls(5, token);
        setDice((prevDice) =>
            prevDice.map((die, index) =>
                die.locked ? die : { value: newDice[index], locked: false }
            )
        );
        setRollsLeft((prev) => prev - 1);
    };

    const toggleLock = (index: number) => {
        setDice((prevDice) =>
            prevDice.map((die, i) => (i === index ? { ...die, locked: !die.locked } : die))
        );
    };

    return (
        <View className="flex flex-col items-center justify-center">
            <Text className="text-lg mb-5">Tirages restants : {rollsLeft}</Text>
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
                    backgroundColor: rollsLeft > 0 ? 'blue' : 'gray',
                    borderRadius: 5,
                }}
                disabled={rollsLeft <= 0}
            >
                <Text style={{ color: 'white', fontSize: 16 }}>Lancer les dés</Text>
            </TouchableOpacity>
        </View>
    );
}