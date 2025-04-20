import React from 'react';
import { View, Text, Modal, Button } from 'react-native';

interface WinLoseModalProps {
    visible: boolean;
    message: string;
    onClose: () => void;
}

export default function WinLoseModal({ visible, message, onClose }: WinLoseModalProps) {
    return (
        <Modal
            transparent={true}
            animationType="slide"
            visible={visible}
            onRequestClose={onClose}
        >
            <View className="flex-1 justify-center items-center bg-black/50">
                <View className="bg-white p-6 rounded-lg shadow-lg">
                    <Text className="text-lg font-bold text-center mb-4">{message}</Text>
                    <Button title="Fermer" onPress={onClose} />
                </View>
            </View>
        </Modal>
    );
}