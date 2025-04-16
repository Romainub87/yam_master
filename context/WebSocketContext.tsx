import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

interface WebSocketContextProps {
    sendMessage: (message: any) => void;
    lastMessage: any;
    isConnected: boolean;
}

const WebSocketContext = createContext<WebSocketContextProps | undefined>(undefined);

interface WebSocketProviderProps {
    children: React.ReactNode;
    url: string;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children, url }) => {
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [lastMessage, setLastMessage] = useState<any>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [reconnectAttempts, setReconnectAttempts] = useState(0);

    const connectWebSocket = () => {
        const ws = new WebSocket(url);

        ws.onopen = () => {
            console.log('WebSocket connecté');
            setIsConnected(true);
            setReconnectAttempts(0); // Réinitialiser les tentatives de reconnexion
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                setLastMessage(data);
            } catch (error) {
                console.error('Erreur lors du parsing du message WebSocket :', error);
            }
        };

        ws.onclose = () => {
            console.log('WebSocket déconnecté');
            setIsConnected(false);
            attemptReconnect(); // Tenter une reconnexion
        };

        ws.onerror = (error) => {
            console.error('Erreur WebSocket :', error);
            setIsConnected(false);
            attemptReconnect(); // Tenter une reconnexion
        };

        setSocket(ws);
    };

    const attemptReconnect = () => {
        if (reconnectAttempts < 5) { // Limiter les tentatives de reconnexion
            const delay = Math.min(1000 * 2 ** reconnectAttempts, 30000); // Délai exponentiel (max 30s)
            setTimeout(() => {
                console.log(`Tentative de reconnexion... (${reconnectAttempts + 1})`);
                setReconnectAttempts((prev) => prev + 1);
                connectWebSocket();
            }, delay);
        } else {
            console.warn('Nombre maximum de tentatives de reconnexion atteint.');
        }
    };

    useEffect(() => {
        connectWebSocket();

        return () => {
            socket?.close();
        };
    }, [url]);

    const sendMessage = (message: any) => {
        if (socket && isConnected) {
            socket.send(JSON.stringify(message));
        } else {
            console.warn('WebSocket non connecté');
        }
    };

    const value = useMemo(
        () => ({ sendMessage, lastMessage, isConnected }),
        [lastMessage, isConnected]
    );

    return <WebSocketContext.Provider value={value}>{children}</WebSocketContext.Provider>;
};

export const useWebSocket = (): WebSocketContextProps => {
    const context = useContext(WebSocketContext);
    if (!context) {
        throw new Error('useWebSocket doit être utilisé dans un WebSocketContext');
    }
    return context;
};