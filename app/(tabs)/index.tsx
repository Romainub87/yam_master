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
      if (msg === 'game.start') {
        console.log('On reçoit game.start !: ', msg);
        router.push('/game');
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
    <View>
      <Button title="Rejoindre la queue" onPress={joinQueue} />
      {messages.map((msg, index) => (
        <Text key={index}>{msg}</Text>
      ))}
    </View>
  );
}
