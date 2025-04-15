import React , { useEffect , useState } from 'react';
import { View, Text } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import CustomButton from "@/components/CustomButton";
import { useRouter } from "expo-router";

export default function HomeScreen() {
  const { user, userToken, logout } = useAuth();
  const router = useRouter();
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:3000');
    setSocket(ws);

    ws.onopen = () => {
      console.log('Connecté au WebSocket');
    };

    ws.onmessage = (event) => {
      const msg = event.data;

      try {
        const parsedMsg = JSON.parse(msg);
        if (parsedMsg.type === 'queue.added') {
          setIsSearching(true);
        } else if (parsedMsg.type === 'game.start') {
          router.push(`/game?id=${parsedMsg.game.id}`);
        }
      } catch (error) {
        console.error('Erreur lors du parsing du message JSON: ', error);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket déconnecté');
    };

    return () => {
      ws.close();
    };
  }, []);

  const joinQueue = () => {
    if (socket) {
      socket.send(
          JSON.stringify({
            type: 'queue.join',
            payload: {
                token: userToken,
            },
          })
      );
    }
  };

  const leaveQueue = () => {
    if (socket) {
      socket.send(
          JSON.stringify({
            type: 'queue.leave',
            payload: {
                token: userToken,
            },
          })
      );
      setIsSearching(false);
    }
  };

  return (
      <View className="flex-1 justify-center items-center dark:bg-black">
        {user ? (
            <View className="items-center p-6 rounded-lg shadow-lg">
              <Text className="text-4xl text-white mb-6 font-bold">Bienvenue, {user.username} 👋</Text>
              {isSearching ? (
                  <View className="items-center">
                    <Text className="text-lg text-gray-300 mb-4">🔍 Recherche de parties en cours...</Text>
                    <CustomButton title="Annuler" onPress={() => leaveQueue()} />
                  </View>
              ) : (
                  <CustomButton title="Jouer" onPress={() => joinQueue()} />
              )}
              <CustomButton title="Se déconnecter" onPress={logout} />
            </View>
        ) : (
            <Text className="text-lg text-gray-300">Veuillez vous connecter pour continuer</Text>
        )}
      </View>
  );
}