import React from 'react';
import { Text, Pressable } from 'react-native';

export default function CustomButton({ title, onPress }: { title: string; onPress: () => void }) {
    return (
        <Pressable
            onPress={onPress}
            className="bg-blue-600 py-3 px-6 rounded-md my-2 hover:bg-blue-700 focus:outline-none focus:shadow-outline-blue-500 focus:shadow-outline-blue-500"
        >
            <Text className="text-white text-center font-bold text-lg">{title}</Text>
        </Pressable>
    );
}