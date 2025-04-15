import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import {faDiceFive, faDiceFour, faDiceOne, faDiceSix, faDiceThree, faDiceTwo} from '@fortawesome/free-solid-svg-icons';
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";

type GridProps = {
    rows: number;
    columns: number;
    onCellPress: (row: number, col: number) => void;
};

const icones = [
    [
        '1', '3', '⚔️​', '4', '6'
    ],
    [
        '2', '🔲', '🔫​', 'Full', '5'
    ],
    [
        '≤8', 'Full', '🎯​', '⚔️​', '📏'
    ],
    [
        '6', '🔫​', '📏', '≤8', '1'
    ],
    [
        '3', '2', '🔲', '5', '4'
    ],
]

export default function GameGrid({ rows, columns, onCellPress }: GridProps) {
    return (
        <View className="flex flex-col items-center justify-center h-1/2">
            {Array.from({ length: rows }).map((_, rowIndex) => (
                <View key={rowIndex} className="flex flex-row bg-white">
                    {Array.from({ length: columns }).map((_, colIndex) => (
                        <TouchableOpacity
                            key={colIndex}
                            className="w-16 h-16 border border-gray-400 flex items-center justify-center"
                            onPress={() => onCellPress(rowIndex, colIndex)}
                        >
                            {!isNaN(Number(icones[rowIndex][colIndex])) && Number(icones[rowIndex][colIndex]) >= 1 && Number(icones[rowIndex][colIndex]) <= 6 ? (
                                <Text className="text-2xl p-5 text-center">
                                    <FontAwesomeIcon
                                        icon={
                                            Number(icones[rowIndex][colIndex]) === 1
                                                ? faDiceOne
                                                : Number(icones[rowIndex][colIndex]) === 2
                                                    ? faDiceTwo
                                                    : Number(icones[rowIndex][colIndex]) === 3
                                                        ? faDiceThree
                                                        : Number(icones[rowIndex][colIndex]) === 4
                                                            ? faDiceFour
                                                            : Number(icones[rowIndex][colIndex]) === 5
                                                                ? faDiceFive
                                                                : faDiceSix
                                        }
                                    />
                                </Text>

                            ) : (
                                <Text className="text-lg p-5 text-center font-bold">{`${icones[rowIndex][colIndex]}`}</Text>
                            )}
                        </TouchableOpacity>
                    ))}
                </View>
            ))}
        </View>
    );
}