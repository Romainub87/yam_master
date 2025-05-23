import React, { useState } from 'react';
import { Button, Modal, View, Text } from 'react-native';
import { useWebSocket } from '@/context/WebSocketContext';
import { useAuth } from '@/context/AuthContext';
import CustomButton from '../CustomButton';

type ForfeitButtonProps = {
  gameId: string;
};

export default function ForfeitButton({ gameId }: ForfeitButtonProps) {
  const { sendMessage } = useWebSocket();
  const { user } = useAuth();
  const [isModalVisible, setModalVisible] = useState(false);

  const confirmForfeit = () => {
    sendMessage({
      type: 'game.ff',
      payload: {
        gameId: gameId,
        userId: user!.id,
      },
    });
    setModalVisible(false);
  };

  return (
    <>
      <CustomButton
        title="Forfait"
        onPress={() => setModalVisible(true)}
        className="bg-[#fa412d] shadow-[#be001d] hover:bg-[#ff5c41] text-base py-2 px-4"
      />
      <Modal visible={isModalVisible} transparent={true} animationType="slide">
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className="bg-white p-6 rounded-lg">
            <Text className="text-black">
              Êtes-vous sûr de vouloir abandonner la partie ?
            </Text>
            <View className="flex-row justify-between mt-4">
              <Button title="Annuler" onPress={() => setModalVisible(false)} />
              <Button title="Confirmer" onPress={confirmForfeit} color="red" />
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}
