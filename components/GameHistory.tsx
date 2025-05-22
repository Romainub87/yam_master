import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, FlatList, useColorScheme } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { Colors } from '@/constants/Colors';
import { API_URL } from '@env';

export default function GameHistory() {
    const { user } = useAuth();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const colorScheme = useColorScheme();

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const response = await fetch(API_URL+`/game/history/${user?.id}`);
                const data = await response.json();
                setHistory(data);
            } catch (error) {
                console.error('Erreur lors de la récupération de l\'historique :', error);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchHistory();
        }
    }, [user]);

    if (loading) {
        return <ActivityIndicator size="large" color={Colors[colorScheme!]['yam-default']} />;
    }

    return (
        <View className="p-4 px-2">
            <Text className="text-2xl font-bold mb-4 text-center" style={{ color: Colors[colorScheme!]['yam-default'], fontSize: 28 }}>
                10 dernières parties
            </Text>
            {history.length > 0 ? (
                <View style={{ maxHeight: 500 }}>
                    <FlatList
                        data={history}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={({ item }) => (
                            <View className="p-4 px-2 mb-2 rounded-lg">
                                <Text style={{ color: Colors[colorScheme!]['yam-default'], fontWeight: 'bold', fontSize: 20, elevation: 2 }}>
                                    {item.isWinner ? 'Victoire' : 'Défaite'} contre {item.opponentName} — {new Date(item.created_at).toLocaleDateString()} à {new Date(item.created_at).toLocaleTimeString()}
                                </Text>
                            </View>
                        )}
                    />
                </View>
            ) : (
                <Text style={{ color: Colors[colorScheme!]['yam-default'] }}>Aucune partie trouvée.</Text>
            )}
        </View>
    );
}
