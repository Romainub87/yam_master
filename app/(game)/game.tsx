import React from 'react';
import { View, Alert } from 'react-native';
import GameGrid from '@/components/game/GameGrid';
import DiceRoller from "@/components/game/DiceRoller";
import {useAuth} from "@/context/AuthContext";

export default function GameScreen() {
    const {userToken} = useAuth();
    const handleCellPress = (row: number, col: number) => {
        Alert.alert(`Cellule cliquée : ${row}, ${col}`);
    };

    return (
        <View className="flex justify-center items-center h-full">
            <GameGrid rows={5} columns={5} onCellPress={handleCellPress} />
            <DiceRoller token={userToken!} />
        </View>
    );
}