import React, { useEffect } from 'react';
import { View, Image, Text } from 'react-native';
import { Asset } from 'expo-asset';

type RankImageProps = {
    mmr: number;
};

const rankImages = {
    grandmaster: require('@/assets/ranks/grandmaster.png'),
    master: require('@/assets/ranks/master.png'),
    diamond: require('@/assets/ranks/diamond.png'),
    platinium: require('@/assets/ranks/platinium.png'),
    gold: require('@/assets/ranks/gold.png'),
    silver: require('@/assets/ranks/silver.png'),
    iron: require('@/assets/ranks/iron.png'),
};

// Préchargement des images
const preloadImages = () => {
    Object.values(rankImages).forEach((image) => Asset.fromModule(image).downloadAsync());
};

const getRankImage = (mmr: number): any => {
    if (mmr > 1800) return rankImages.grandmaster;
    if (mmr >= 1500) return rankImages.master;
    if (mmr >= 1000) return rankImages.diamond;
    if (mmr >= 750) return rankImages.platinium;
    if (mmr >= 500) return rankImages.gold;
    if (mmr >= 250) return rankImages.silver;
    return rankImages.iron;
};

const getRankLabel = (mmr: number): string => {
    if (mmr >= 2000) return 'Grandmaster IV';
    if (mmr >= 1950) return 'Grandmaster III';
    if (mmr >= 1900) return 'Grandmaster II';
    if (mmr >= 1850) return 'Grandmaster I';
    if (mmr >= 1800) return 'Master IV';
    if (mmr >= 1700) return 'Master III';
    if (mmr >= 1600) return 'Master II';
    if (mmr >= 1500) return 'Master I';
    if (mmr >= 1400) return 'Diamant IV';
    if (mmr >= 1275) return 'Diamant III';
    if (mmr >= 1125) return 'Diamant II';
    if (mmr >= 1000) return 'Diamant I';
    if (mmr >= 925) return 'Platine IV';
    if (mmr >= 850) return 'Platine III';
    if (mmr >= 800) return 'Platine II';
    if (mmr >= 750) return 'Platine I';
    if (mmr >= 650) return 'Or IV';
    if (mmr >= 600) return 'Or III';
    if (mmr >= 550) return 'Or II';
    if (mmr >= 500) return 'Or I';
    if (mmr >= 400) return 'Argent IV';
    if (mmr >= 350) return 'Argent III';
    if (mmr >= 300) return 'Argent II';
    if (mmr >= 250) return 'Argent I';
    if (mmr >= 200) return 'Fer IV';
    if (mmr >= 150) return 'Fer III';
    if (mmr >= 100) return 'Fer II';
    return 'Fer I';
};

export default function RankImage({ mmr }: RankImageProps) {
    useEffect(() => {
        preloadImages();
    }, []);

    const rankImage = getRankImage(mmr);

    return (
        <View className="items-center justify-between w-fit flex-row">
            <Image
                source={rankImage}
                style={{ width: 50, height: 50 }}
                resizeMode="contain"
            />
            <Text className="text-white">
                {getRankLabel(mmr)}
            </Text>
        </View>
    );
}