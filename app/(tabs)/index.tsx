import React, { useEffect, useState } from 'react';
import { View, Text, Button } from 'react-native';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const [messages, setMessages] = useState<string[]>([]);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Connexion au WebSocket
    const ws = new WebSocket('ws://localhost:3000');
    setSocket(ws);

    ws.onopen = () => {
      console.log('Connecté au WebSocket');
    };

    ws.onmessage = (event) => {
      const msg = event.data;
      setMessages((prev) => [...prev, msg]);

      console.log('On reçoit un message !: ', msg);
      try {
        const parsedMsg = JSON.parse(msg);
        if (parsedMsg.type === 'game.start') {
          console.log('On reçoit game.start !: ', parsedMsg);
          router.push('/game');
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
          payload: {},
        })
      );
    }
  };

  return (
    <View className="h-full bg-black flex items-center justify-center">
      <Button title="Rejoindre la queue" onPress={joinQueue} />
      {messages.map((msg, index) => (
        <Text key={index}>{msg}</Text>
      ))}
    </View>
  );
}
