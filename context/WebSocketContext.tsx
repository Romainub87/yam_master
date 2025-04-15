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

    useEffect(() => {
        const ws = new WebSocket(url);

        ws.onopen = () => {
            console.log('WebSocket connecté');
            setIsConnected(true);
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
        };

        ws.onerror = (error) => {
            console.error('Erreur WebSocket :', error);
        };

        setSocket(ws);

        return () => {
            ws.close();
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