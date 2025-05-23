import React from 'react';
import { View, Image, Text } from 'react-native';

type RankImageProps = {
    mmr: number;
};

const getRankImage = (mmr: number): string => {
    if (mmr > 1800) {
        return require('@/assets/ranks/grandmaster.png');
    } else if (mmr >= 1500) {
        return require('@/assets/ranks/master.png');
    } else if (mmr >= 1000) {
        return require('@/assets/ranks/diamond.png');
    } else if (mmr >= 750) {
        return require('@/assets/ranks/platinium.png');
    } else if (mmr >= 500) {
        return require('@/assets/ranks/gold.png');
    } else if (mmr >= 250) {
        return require('@/assets/ranks/silver.png');
    } else {
        return require('@/assets/ranks/iron.png');
    }
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
    const rankImage = getRankImage(mmr);

    return (
        <View className="items-center flex-row">
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