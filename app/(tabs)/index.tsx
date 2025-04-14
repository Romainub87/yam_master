import React, { useEffect, useState } from 'react';
import { View, Text, Button } from 'react-native';

export default function HomeScreen() {
    const [messages, setMessages] = useState<string[]>([]);
    const [socket, setSocket] = useState<WebSocket | null>(null);

    useEffect(() => {
        // Connexion au WebSocket
        const ws = new WebSocket('ws://localhost:3000');
        setSocket(ws);

        ws.onopen = () => {
            console.log('Connecté au WebSocket');
        };

        ws.onmessage = (event) => {
            setMessages((prev) => [...prev, event.data]);
        };

        ws.onclose = () => {
            console.log('WebSocket déconnecté');
        };

        return () => {
            ws.close();
        };
    }, []);

    const sendMessage = () => {
        if (socket) {
            socket.send('Hello depuis le client !');
        }
    };

    return (
        <View>
            <Button title="Envoyer un message" onPress={sendMessage} />
            {messages.map((msg, index) => (
                <Text key={index}>{msg}</Text>
            ))}
        </View>
    );
}