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
    token: string | null;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children, url, token }) => {
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [lastMessage, setLastMessage] = useState<any>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        if (!token) {
            setSocket(null);
            setIsConnected(false);
            return;
        }

        let ws: WebSocket | null = null;
        let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
        let shouldReconnect = true;

        const connectWebSocket = () => {
            if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
                return;
            }

            ws = new WebSocket(`${url}?token=${encodeURIComponent(token)}`);

            ws.onopen = () => {
                setIsConnected(true);
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    setLastMessage(data);
                } catch (error) {
                    console.error('Erreur lors de la réception du message WebSocket :', error);
                }
            };

            ws.onclose = () => {
                setIsConnected(false);
                if (shouldReconnect) {
                    reconnectTimeout = setTimeout(connectWebSocket, 3000);
                }
            };

            ws.onerror = () => {
                setIsConnected(false);
            };

            setSocket(ws);
        };

        connectWebSocket();

        return () => {
            shouldReconnect = false;
            if (reconnectTimeout) {
                clearTimeout(reconnectTimeout);
            }
            if (ws) {
                ws.close();
            }
        };
    }, [url, token]);

    const lastSentMessageRef = React.useRef<string | null>(null);

    const sendMessage = (message: any) => {
        const messageStr = JSON.stringify(message);
        if (socket && isConnected) {
            if (lastSentMessageRef.current === messageStr) {
                return;
            }
            socket.send(messageStr);
            lastSentMessageRef.current = messageStr;
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