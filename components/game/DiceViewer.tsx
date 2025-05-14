import React, { useEffect, useState } from 'react';
import { View, Text, ImageBackground } from 'react-native';
import { Dice } from '@/models/Dice';
import { useWebSocket } from '@/context/WebSocketContext';

export default function DiceViewer({ diceValues }: { diceValues: Dice[] }) {
  const { lastMessage } = useWebSocket();
  const [updatedDiceValues, setDiceValues] = useState<Dice[]>(diceValues);

  useEffect(() => {
    setDiceValues(diceValues);
  }, [diceValues]);

  useEffect(() => {
    if (lastMessage) {
      if (lastMessage.type === 'opponent.toggleLock') {
        setDiceValues(lastMessage.dice);
      }
    }
  }, [lastMessage]);

  return (
    <View className="justify-center flex flex-row">
      {updatedDiceValues.map((dice, index) => (
        <ImageBackground
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
          <View
            key={index}
            className="flex justify-center items-center w-full h-full"
          >
            <Text style={{ fontSize: 20, color: 'white', textAlign: 'center' }}>
              {dice.value}
            </Text>
          </View>
        </ImageBackground>
      ))}
    </View>
  );
}
