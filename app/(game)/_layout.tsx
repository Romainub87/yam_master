import { Stack } from 'expo-router';
import React from 'react';

export default function GameLayout() {


    return (
        <Stack>
            <Stack.Screen name="game" options={{ headerShown: false }} />
        </Stack>
    );
}