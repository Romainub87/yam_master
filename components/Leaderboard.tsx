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
                const response = await fetch(API_URL+'/player/leaderboard');
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
            <View className="flex-1 justify-center items-center bg-gray-900">
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
            <Text className="text-2xl font-bold text-white text-center items-center flex justify-center space-x-2 my-5">
                <FontAwesome name="trophy" size={40} />
                <Text>Classement général</Text>
            </Text>
            <View className="flex-1 justify-center p-4">
                <FlatList
                    data={users}
                    keyExtractor={(item) => item.username}
                    renderItem={({ item, index }) => (
                        <View className="flex-row justify-between items-center px-24 w-max min-w-[25vw] mx-auto">
                            <View
                                style={{ backgroundColor: 'rgba(0, 255, 0, 0.2)' }}
                                className={`flex-1 flex-row justify-between items-center  px-10 py-2 ${
                                    index === 0 ? 'rounded-t-xl' : ''
                                } ${index === users.length - 1 ? 'rounded-b-xl' : ''}`}
                            >
                                <Text className="text-lg text-white text-start">{item.username}</Text>
                                <RankImage mmr={item.mmr ?? 0} />
                            </View>
                        </View>
                    )}
                />
            </View>
        </ImageBackground>
    );
}