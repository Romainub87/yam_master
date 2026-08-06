import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, ImageBackground } from 'react-native';
import FontAwesome from "@expo/vector-icons/FontAwesome";
import RankImage from '@/components/user/RankImage';
import { API_URL } from '@env';

type User = {
    id: number;
    username: string;
    mmr: number;
};

export default function Leaderboard() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await fetch(API_URL + 'player/leaderboard');
                const data: User[] = await response.json();
                setUsers(data.sort((a, b) => b.mmr - a.mmr));
            } catch (error) {
                console.error('Erreur lors de la récupération des utilisateurs :', error);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-gray-900 px-2">
                <ActivityIndicator size="large" color="#00FF00" />
            </View>
        );
    }

    return (
        <ImageBackground
            source={require('@/assets/images/background.jpg')}
            style={{ flex: 1, width: '100%', height: '100%' }}
            resizeMode="cover"
        >
            <Text className="text-xl md:text-2xl font-bold text-white text-center flex flex-row items-center justify-center space-x-2 my-5">
                <FontAwesome name="trophy" size={32} />
                <Text>Classement général</Text>
            </Text>
            <View className="flex-1 justify-center p-2 md:p-4">
                <FlatList
                    data={users}
                    keyExtractor={(item) => item.username}
                    renderItem={({ item, index }) => (
                        <View className="flex-row justify-center items-center w-full mb-2">
                            <View
                                style={{ backgroundColor: 'rgba(0, 255, 0, 0.2)' }}
                                className={`flex-1 flex-row justify-between items-center px-4 py-2 md:px-10 ${
                                    index === 0 ? 'rounded-t-xl' : ''
                                } ${index === users.length - 1 ? 'rounded-b-xl' : ''}`}
                            >
                                <Text className="text-base md:text-lg text-white text-start truncate max-w-[40vw]">{item.username}</Text>
                                <RankImage mmr={item.mmr ?? 0} />
                            </View>
                        </View>
                    )}
                />
            </View>
        </ImageBackground>
    );
}