import React, { useState } from 'react';
import { View , TextInput , Text , Button } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { Link , useRouter } from 'expo-router';

export default function RegisterScreen() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const router = useRouter();

    const handleRegister = async () => {
        if (username && password) {
            try {
                const response = await fetch('http://localhost:3000/api/auth/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ username, password }),
                });

                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.error || 'Une erreur est survenue');
                }

                const { token } = await response.json();
                await login(token);
                router.push('/');
            } catch (err: any) {
                setError(err.message || 'Une erreur est survenue lors de l\'inscription.');
            }
        } else {
            setError('Veuillez remplir tous les champs.');
        }
    };

    return (
        <View className="flex-1 justify-center items-center bg-gray-900">
            <Text className="text-2xl font-bold text-center mb-6 text-white">Inscription</Text>
            {error ? <Text className="text-red-500 text-center mb-4">{error}</Text> : null}
            <TextInput
                className="w-3/4 md:w-1/6 p-3 mb-4 bg-gray-800 text-white rounded"
                placeholder="Nom d'utilisateur"
                placeholderTextColor="#A0AEC0"
                value={username}
                onChangeText={setUsername}
            />
            <TextInput
                className="w-3/4 md:w-1/6 p-3 mb-6 bg-gray-800 text-white rounded"
                placeholder="Mot de passe"
                placeholderTextColor="#A0AEC0"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />
            <Button title="S'inscrire" onPress={handleRegister} color="#4A90E2" />
            <Text className="text-white text-center font-medium mt-4">Déjà un compte ? <Link href="/login">Se connecter</Link></Text>
        </View>
    );
}