import React, { useState } from 'react';
import { View, TextInput, Text } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { Link } from 'expo-router';
import CustomButton from '@/components/CustomButton';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();

  const handleLogin = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const data = await response.json();
        await login(data.token, data.refreshToken);
      } else {
        alert('Identifiants incorrects');
      }
    } catch (error) {
      console.error('Erreur lors de la connexion :', error);
      alert('Une erreur est survenue. Veuillez réessayer.');
    }
  };

  return (
    <View className="flex-1 justify-center items-center bg-gray-900">
      <Text className="text-4xl font-bold text-white mb-6">Connexion</Text>
      <TextInput
        className="w-3/4 md:w-1/6 p-3 mb-4 bg-gray-800 text-white rounded"
        placeholder="Nom d'utilisateur"
        placeholderTextColor="#A0AEC0"
        value={username}
        onChangeText={setUsername}
      />
      <TextInput
        className="w-3/4 md:w-1/6 p-3 mb-4 bg-gray-800 text-white rounded"
        placeholder="Mot de passe"
        placeholderTextColor="#A0AEC0"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <CustomButton title="Se connecter" onPress={handleLogin} />
      <Text className="text-white text-center font-medium mt-4">
        Pas encore de compte ?{' '}
        <Link className="font-bold" href="/register">
          S'inscrire
        </Link>
      </Text>
    </View>
  );
}
