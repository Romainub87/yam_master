import { Colors } from '@/constants/Colors';
import React from 'react';
import { Text, Pressable, useColorScheme } from 'react-native';

export default function CustomButton({
  title,
  className,
  onPress,
}: {
  title: string;
  className?: string;
  onPress: () => void;
}) {
  const colorScheme = useColorScheme();
  return (
    <Pressable
      onPress={onPress}
      className={`${className} py-3 px-6 rounded-md my-2 shadow-[0_0.3rem] shadow-[#45753c] bg-[#81b64c] hover:bg-[#a3d160]`}
    >
      <Text className="text-white text-center font-bold text-lg">{title}</Text>
    </Pressable>
  );
}
