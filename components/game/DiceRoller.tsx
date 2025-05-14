import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  useColorScheme,
  ImageBackground,
} from 'react-native';
import { Dice } from '@/models/Dice';
import { useWebSocket } from '@/context/WebSocketContext';
import { useAuth } from '@/context/AuthContext';
import { Colors } from '@/constants/Colors';
import CustomButton from '../CustomButton';

export default function DiceRoller({
  rolls_left,
  diceValues,
  gameId,
}: {
  rolls_left: number;
  diceValues: Dice[];
  gameId: number;
}) {
  const [dices, setDices] = useState<Dice[]>(diceValues);
  const { sendMessage, lastMessage } = useWebSocket();
  const { user } = useAuth();
  const colorScheme = useColorScheme();

  useEffect(() => {
    setDices(diceValues);
  }, [diceValues]);

  useEffect(() => {
    if (lastMessage) {
      if (lastMessage.type === 'game.toggleLock') {
        setDices(lastMessage.dice);
      }
    }
  }, [lastMessage]);

  const handleRoll = () => {
    sendMessage({
      type: 'game.rollDices',
      payload: {
        userId: user?.id,
        gameId: gameId,
        dices: dices,
      },
    });
  };

  const toggleLock = (index: number) => {
    sendMessage({
      type: 'game.toggleLock',
      payload: {
        userId: user?.id,
        gameId: gameId,
        dicePos: index,
        dices: dices,
      },
    });
  };

  return (
    <View className="flex flex-col items-center justify-center">
      <View className="flex flex-row mb-6">
        {dices &&
          dices.map((dice, index) => (
            <ImageBackground
              key={index}
              source={require('@/assets/images/black_case.png')}
              className="flex-1"
              resizeMode="cover"
              style={{
                display: 'flex',
                width: 50,
                height: 50,
                margin: 5,
                justifyContent: 'center',
                alignItems: 'center',
                opacity: dice.locked ? 0.5 : 1,
              }}
            >
              <TouchableOpacity
                onPress={() => toggleLock(index)}
                className="flex justify-center items-center w-full h-full"
              >
                <Text
                  style={{ fontSize: 20, color: 'white', textAlign: 'center' }}
                >
                  {dice.value}
                </Text>
              </TouchableOpacity>
            </ImageBackground>
          ))}
      </View>

      <View
        style={{
          opacity: rolls_left > 0 ? 1 : 0.5,
        }}
      >
        <CustomButton
          onPress={() => handleRoll()}
          title="Lancer les dés"
          className="font-[10px]"
          style={{
            padding: 10,
            backgroundColor: Colors[colorScheme!]['yam-primary'],
            borderRadius: 5,
          }}
          disabled={rolls_left <= 0}
        ></CustomButton>
      </View>
    </View>
  );
}
