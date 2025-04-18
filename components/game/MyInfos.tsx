import React, { useEffect, useState } from 'react';
import { View, Text, Modal } from 'react-native';
import DiceRoller from '@/components/game/DiceRoller';
import { useWebSocket } from '@/context/WebSocketContext';
import { useAuth } from '@/context/AuthContext';
import {router} from "expo-router";
import ForfeitButton from "@/components/game/ForfeitButton";
import { Dice } from "@/models/Dice";

interface MyInfosProps {
    gameData: any;
}

const MyInfos: React.FC<MyInfosProps> = ({gameData }) => {
    const { user } = useAuth();
    const { sendMessage, lastMessage } = useWebSocket();
    const [playerScore, setPlayerScore] = useState<any>(gameData?.playerScore);
    const [isOpponentQuit, setIsOpponentQuit] = useState(false);
    const [isOpponentFF, setIsOpponentFF] = useState(false);
    const [timer, setTimer] = useState<number | null>(null);

    const handleDefinitiveQuitGame = () => {
        sendMessage({
            type: 'game.definitiveQuit',
            payload: {
                userId: user!.id,
                gameId: gameData.game.id,
            },
        });
    }

    useEffect(() => {
        if (lastMessage) {
            if (lastMessage.type === 'player.quitGame') {
                setIsOpponentQuit(true);
                setTimer(30);
            }
            if (lastMessage.type === 'game.definitiveQuit') {
                router.push('/');
                setIsOpponentQuit(false);
                setIsOpponentFF(false);
            }
            if (lastMessage.type === 'opponent.reconnect') {
                setIsOpponentQuit(false);
            }
            if (lastMessage.type === 'player.ff') {
                router.push('/');
            }
            if (lastMessage.type === 'opponent.ff') {
                setIsOpponentFF(true);
                setTimer(5);
            }
        }
    }, [lastMessage]);

    useEffect(() => {
        setPlayerScore(gameData?.playerScore);
    }, [gameData]);

    useEffect(() => {
        if ((isOpponentQuit || isOpponentFF) && timer !== null) {
            const interval = setInterval(() => {
                setTimer((prev) => (prev !== null && prev > 0 ? prev - 1 : null));
            }, 1000);

            if (timer === 0) {
                handleDefinitiveQuitGame();
            }

            return () => clearInterval(interval);
        }
    }, [isOpponentQuit, isOpponentFF, timer]);



    return (
        <View className="p-4 bg-gray-800 w-full">
            <Text className="text-white text-lg font-bold">Mes Infos</Text>
            {playerScore ? (
                <>
                    <Text className="text-gray-300">Score : {playerScore.score}</Text>
                    {playerScore.turn && (
                        <>
                            <Text className="text-gray-300">Lancers restants : {playerScore.rolls_left}</Text>
                            <Text className="text-gray-300">Tour actuel : Oui</Text>
                            <DiceRoller rolls_left={playerScore.rolls_left} diceValues={gameData.dice} gameId={gameData?.game?.id} />
                        </>
                    )}
                    <View className="my-2 flex-row justify-between w-full">
                        <ForfeitButton gameId={gameData?.game?.id} />
                    </View>
                </>
            ) : (
                <Text className="text-gray-300">Aucune donnée disponible</Text>
            )}
            {isOpponentQuit && (
                <Modal
                    transparent={true}
                    animationType="slide"
                >
                    <View className="flex-1 justify-center items-center bg-black/50">
                        <View className="bg-white p-6 rounded-lg">
                            <Text className="text-black">Votre adversaire a quitté la partie.</Text>
                            {timer !== null && (
                                <Text className="text-black">Vous serez déconnecté dans {timer} secondes.</Text>
                            )}
                        </View>
                    </View>
                    <View className="absolute inset-0 blur-md" />
                </Modal>
            )}
            {isOpponentFF && (
                <Modal
                    transparent={true}
                    animationType="slide"
                >
                    <View className="flex-1 justify-center items-center bg-black/50">
                        <View className="bg-white p-6 rounded-lg">
                            <Text className="text-black">Votre adversaire a abandonné la partie.</Text>
                            {timer !== null && (
                                <Text className="text-black">Vous serez déconnecté dans {timer} secondes.</Text>
                            )}
                        </View>
                    </View>
                    <View className="absolute inset-0 blur-md" />
                </Modal>
            )}
        </View>
    );
};

export default MyInfos;