import React, { useEffect, useState } from 'react';
import { View , Text , Modal , Button } from 'react-native';
import DiceRoller from '@/components/game/DiceRoller';
import { useWebSocket } from '@/context/WebSocketContext';
import {router} from "expo-router";
import ForfeitButton from "@/components/game/ForfeitButton";
import { useAuth } from "@/context/AuthContext";

interface MyInfosProps {
    gameData: any;
}

const MyInfos: React.FC<MyInfosProps> = ({ gameData }) => {
    const { sendMessage, lastMessage } = useWebSocket();
    const { user } = useAuth();
    const [playerScore, setPlayerScore] = useState<any>(gameData?.playerScore);
    const [isOpponentQuit, setIsOpponentQuit] = useState(false);
    const [isOpponentFF, setIsOpponentFF] = useState(false);
    const [timer, setTimer] = useState<number | null>(null);
    const [showChallengeButton, setShowChallengeButton] = useState(true);

    const handleDefinitiveQuitGame = () => {
        sendMessage({
            type: 'game.definitiveQuit',
            payload: {
                gameId: gameData.game.id,
            },
        });
    }

    const handleChallenge = () => {
        sendMessage({
            type: 'game.challenge',
            payload: {
                gameId: gameData.game.id,
                userId: user?.id,
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
            if (lastMessage.type === 'game.challenge') {
                setShowChallengeButton(lastMessage.show);
            }
        }
    }, [lastMessage]);

    useEffect(() => {
        setPlayerScore(gameData?.playerScore);
        const hasFreeCells = gameData?.game?.grid_state?.some((row: any[]) => row.some((cell: { combination: string; user: any; }) => cell.combination === 'DEFI' && !cell.user));
        setShowChallengeButton(hasFreeCells);
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
        <View className="p-4 bg-gray-800 h-1/4 flex justify-between w-full">
            {playerScore ? (
                <>
                    <Text className="text-gray-300 text-2xl">Score : {playerScore.score}</Text>
                    {playerScore.turn && (
                        <>
                            <View className="my-2 flex-col justify-center items-center w-full">
                                <Text className="text-gray-300 mb-4">Lancers restants : {playerScore.rolls_left}</Text>
                                <DiceRoller rolls_left={playerScore.rolls_left} diceValues={gameData?.dice || gameData?.game?.dice_state} gameId={gameData?.game?.id} />
                            </View>
                        </>
                    )}
                    <View className="my-2 flex-row justify-between w-full">
                        <ForfeitButton gameId={gameData?.game?.id} />
                        <Button title="Lancer défi" onPress={() => {handleChallenge() }} disabled={!showChallengeButton || !playerScore.turn || playerScore.rolls_left < 2 || playerScore.rolls_left === 3 } />
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