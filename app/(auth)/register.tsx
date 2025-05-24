import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  ImageBackground,
  useColorScheme,
} from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { Link, useRouter } from 'expo-router';
import CustomButton from '@/components/CustomButton';
import { Colors } from '@/constants/Colors';
import { API_URL } from '@env';

export default function RegisterScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();

  const handleRegister = async () => {
    if (username && password) {
      try {
        const response = await fetch(
          API_URL+'auth/register',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
          }
        );

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Une erreur est survenue');
        }

        const { token, refreshToken } = await response.json();
        await login(token, refreshToken);
        router.push('/');
      } catch (err: any) {
        setError(
          err.message || "Une erreur est survenue lors de l'inscription."
        );
      }
    } else {
      setError('Veuillez remplir tous les champs.');
    }
  };

  return (
    <ImageBackground
        source={require('@/assets/images/background.jpg')}
        style={{ flex: 1, width: '100%', height: '100%' }}
        resizeMode="cover"
    >
      <View className="flex justify-center items-center min-h-screen w-full">
        <View
          className="flex flex-col p-10 rounded-xl lg:w-1/3 text-white"
          style={{
            backgroundColor: Colors[colorScheme!]['yam-background'],
          }}
        >
          <Text
            className="text-center text-4xl font-bold mb-8 text-white"
          >
            Inscription
          </Text>
          {error ? (
            <Text className="text-red-500 text-center mb-4">{error}</Text>
          ) : null}
          <TextInput
            className="w-full p-3 mb-4 rounded focus:outline-none text-white"
            placeholder="Nom d'utilisateur"
            placeholderTextColor="#A0AEC0"
            value={username}
            onChangeText={setUsername}
            style={{
              backgroundColor: Colors[colorScheme!]['yam-background-2'],
            }}
          />
          <TextInput
            className="w-full p-3 mb-4 rounded focus:outline-none text-white"
            placeholder="Mot de passe"
            placeholderTextColor="#A0AEC0"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={{
              backgroundColor: Colors[colorScheme!]['yam-background-2'],
            }}
          />
          <CustomButton title="S'inscrire" onPress={handleRegister} />
          <Text className="text-white text-center font-medium mt-4">
            Déjà un compte ?{' '}
            <Link className="font-bold" href="/login">
              Se connecter
            </Link>
          </Text>
        </View>
      </View>
    </ImageBackground>
  );
}
