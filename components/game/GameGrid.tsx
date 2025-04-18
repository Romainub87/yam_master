import React, {useEffect, useState} from 'react';
import { View , Text , TouchableOpacity  } from 'react-native';
import {faDiceFive, faDiceFour, faDiceOne, faDiceSix, faDiceThree, faDiceTwo} from '@fortawesome/free-solid-svg-icons';
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {GameData} from "@/models/GameData";
import {Choice} from "@/models/Choice";
import {Combination} from "@/models/Combinations";
import { useWebSocket } from "@/context/WebSocketContext";
import { useAuth } from "@/context/AuthContext";

type GridProps = {
    gameData: GameData | null;
};

export default function GameGrid({ gameData }: GridProps) {
    const { user } = useAuth();
    const [gridData, setGridData] = useState<Choice[][]>(gameData?.game?.grid_state || []);
    const [combinations, setCombinations] = useState<string[]>(gameData?.combinations || []);
    const { sendMessage, lastMessage } = useWebSocket();

    useEffect(() => {
        setGridData(gameData?.game?.grid_state || []);
        setCombinations(gameData?.combinations || []);
    }, [gameData]);

    useEffect(() => {
        if (lastMessage && lastMessage.type === 'game.scoreCombination') {
            setGridData(lastMessage.game.grid_state);
            sendMessage({
                type: 'game.turnChange',
                payload: {
                    gameId: gameData?.game?.id,
                    userId: user?.id,
                },
            });
        }
    }, [lastMessage]);

    const handleScoreCombination = (rowIndex: number , colIndex: number , combination: Combination | null) => {
        sendMessage({
            type: 'game.scoreCombination',
            payload: {
                combination: combination,
                gameId: gameData?.game.id,
                userId: user?.id,
                row: rowIndex,
                col: colIndex,
            },
        })
    }

    return (
        <View className="flex flex-col items-center justify-center h-1/2">
            {gridData.map((row, rowIndex) => (
                <View key={rowIndex} className="flex flex-row">
                    {row.map((cell, colIndex) => (
                        <TouchableOpacity
                            key={colIndex}
                            onPress={() => {handleScoreCombination(rowIndex, colIndex, cell.combination);}}
                            className={`w-16 h-16 border flex items-center justify-center`}
                            style={{
                                backgroundColor: cell.user
                                    ? (cell?.user === user?.id ? 'blue' : 'red')
                                    : (Array.isArray(combinations) && cell.combination && combinations.includes(cell.combination) ? 'green' : 'white'),
                            }}
                            disabled={!!cell.user || !Array.isArray(combinations) || !cell.combination || !combinations.includes(cell.combination)}
                        >
                            {cell && cell.combination?.includes('WITH') ? (
                                <Text className="text-2xl p-5 text-center">
                                    <FontAwesomeIcon
                                        icon={
                                            cell.combination === Combination.WITH1
                                                ? faDiceOne
                                                : cell.combination === Combination.WITH2
                                                    ? faDiceTwo
                                                    : cell.combination === Combination.WITH3
                                                        ? faDiceThree
                                                        : cell.combination === Combination.WITH4
                                                            ? faDiceFour
                                                            : cell.combination === Combination.WITH5
                                                                ? faDiceFive
                                                                : faDiceSix
                                        }
                                    />
                                </Text>
                            ) : (
                                <Text className="text-lg p-5 text-center font-bold">
                                    {cell?.combination === Combination.FULL ? 'FULL' :
                                        cell?.combination === Combination.SEC ? '🔫' :
                                            cell?.combination === Combination.DEFI ? '⚔️' :
                                                cell?.combination === Combination.YAM ? '🎯' :
                                                    cell?.combination === Combination.CARRE ? '[ ]' :
                                                        cell?.combination === Combination.LESS8 ? '≤8' :
                                                            cell?.combination === Combination.SUITE ? '📏' :
                                                                cell?.combination || ''}
                                </Text>
                            )}
                        </TouchableOpacity>
                    ))}
                </View>
            ))}
        </View>
    );
}