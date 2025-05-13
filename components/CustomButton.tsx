import { Colors } from '@/constants/Colors';
import React from 'react';
import { Text, Pressable, useColorScheme } from 'react-native';

export default function CustomButton({
  title,
  onPress,
}: {
  title: string;
  onPress: () => void;
}) {
  const colorScheme = useColorScheme();
  return (
    <Pressable
      onPress={onPress}
      className="py-3 px-6 rounded-md my-2 shadow-[0_0.3rem] shadow-[#45753c] bg-[#81b64c] hover:bg-[#a3d160]"
    >
      <Text className="text-white text-center font-bold text-lg">{title}</Text>
    </Pressable>
  );
}
