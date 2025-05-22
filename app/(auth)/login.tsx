import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  ImageBackground,
  useColorScheme,
} from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { Link } from 'expo-router';
import CustomButton from '@/components/CustomButton';
import { Colors } from '@/constants/Colors';
import { API_URL } from '@env';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const colorScheme = useColorScheme();

  const handleLogin = async () => {
    try {
      const response = await fetch(API_URL+'/auth/login', {
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
    <ImageBackground
        source={require('@/assets/images/background.jpg')}
        style={{ flex: 1, width: '100%', height: '100%' }}
        resizeMode="cover"
    >
      <View className="flex justify-center items-center min-h-screen w-full border-2">
        <View
          className="flex flex-col p-10 rounded-xl lg:w-1/3"
          style={{
            backgroundColor: Colors[colorScheme!]['yam-background'],
          }}
        >
          <Text
            className="text-center text-4xl font-bold mb-16"
            style={{
              color: Colors[colorScheme!]['yam-default'],
            }}
          >
            Connexion
          </Text>
          <TextInput
            className="w-full p-3 mb-4 rounded focus:outline-none"
            placeholder="Nom d'utilisateur"
            placeholderTextColor="#A0AEC0"
            value={username}
            onChangeText={setUsername}
            style={{
              backgroundColor: Colors[colorScheme!]['yam-background-2'],
              color: Colors[colorScheme!]['yam-default'],
            }}
          />
          <TextInput
            className="w-full p-3 mb-4 rounded focus:outline-none"
            placeholder="Mot de passe"
            placeholderTextColor="#A0AEC0"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={{
              backgroundColor: Colors[colorScheme!]['yam-background-2'],
              color: Colors[colorScheme!]['yam-default'],
            }}
          />
          <CustomButton title="Se connecter" onPress={handleLogin} />
          <Text className="text-white text-center font-medium mt-4">
            Pas encore de compte ?{' '}
            <Link className="font-bold" href="/register">
              S'inscrire
            </Link>
          </Text>
        </View>
      </View>
    </ImageBackground>
  );
}
