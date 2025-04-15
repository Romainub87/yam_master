import React, {useEffect, useState} from 'react';
import { View, Alert } from 'react-native';
import GameGrid from '@/components/game/GameGrid';
import {useAuth} from "@/context/AuthContext";
import {useLocalSearchParams} from "expo-router/build/hooks";
import OpponentInfos from "@/components/game/OpponentInfos";
import MyInfos from "@/components/game/MyInfos";
import {GameData} from "@/models/GameData";

export default function GameScreen() {
    const {userToken} = useAuth();
    const [gameData, setGameData] = useState<GameData>({} as GameData);
    const params = useLocalSearchParams();

    useEffect(() => {
        const ws = new WebSocket('ws://localhost:3000');

        ws.onopen = () => {
            console.log('Connecté au WebSocket pour la partie');
            ws.send(
                JSON.stringify({
                    type: 'game.subscribe',
                    payload: {
                        token: userToken,
                        gameId: params.id,
                    },
                })
            );
        };

        ws.onmessage = (event) => {
            try {
                const parsedMsg = JSON.parse(event.data);
                if (
                    parsedMsg.type === 'game.update' ||
                    parsedMsg.type === 'game.start'
                ) {
                    setGameData(parsedMsg);
                } else if (
                    parsedMsg.type === 'opponent.update'
                ) {
                    setGameData((prev) => ({ ...prev, opponentScore: parsedMsg.opponentScore || null }));
                }
            } catch (error) {
                console.error('Erreur lors du parsing du message JSON :', error);
            }
        };

        ws.onclose = () => {
            console.log('WebSocket déconnecté');
        };

        return () => {
            ws.close();
        };
    }, [userToken]);

    const handleCellPress = (row: number, col: number) => {
        Alert.alert(`Cellule cliquée : ${row}, ${col}`);
    };

    return (
        <View className="flex justify-center items-center h-full">
            <OpponentInfos opponentScore={gameData?.opponentScore || null} />
            <GameGrid rows={5} columns={5} onCellPress={handleCellPress} />
            <MyInfos token={userToken!} gameData={gameData} />
        </View>
    );
}