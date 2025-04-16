import { useEffect } from 'react';
import { useWebSocket } from '@/context/WebSocketContext';
import { useAuth } from '@/context/AuthContext';

const useDetectWindowClose = (gameId: string) => {
    const { sendMessage } = useWebSocket();
    const { user } = useAuth();

    useEffect(() => {
        const handleBeforeUnload = () => {
            sendMessage({
                type: 'game.quit',
                payload: {
                    userId: user!.id,
                    gameId: gameId,
                },
            });
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [sendMessage, user, gameId]);
};

export default useDetectWindowClose;