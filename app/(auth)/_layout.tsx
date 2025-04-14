import { Redirect, Stack } from 'expo-router';
import React from 'react';
import { useAuth } from '@/context/AuthContext';

export default function AuthLayout() {
    const { user } = useAuth();

    if (user) {
        // Redirige vers la route principale si l'utilisateur est connecté
        return <Redirect href="/" />;
    }

    return (
        <Stack>
            <Stack.Screen name="login" options={{ headerShown: false }} />
            <Stack.Screen name="register" options={{ headerShown: false }} />
        </Stack>
    );
}