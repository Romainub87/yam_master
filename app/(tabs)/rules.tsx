import React from 'react';
import {
  ScrollView,
  Text,
  ImageBackground,
  View,
  useColorScheme,
} from 'react-native';
import { Colors } from '@/constants/Colors';

export default function RulesScreen() {
  const colorScheme = useColorScheme();

  return (
    <ImageBackground
        source={require('@/assets/images/background.jpg')}
        style={{ flex: 1, width: '100%', height: '100%' }}
        resizeMode="cover"
    >
      <ScrollView className="items-center min-h-screen ml-[158px] p-8">
        <View className="flex flex-col gap-5">
          <Text
            className="text-4xl font-bold text-center w-full mb-6"
            style={{ color: Colors[colorScheme!]['yam-default'] }}
          >
            Règles du jeu Yam Master
          </Text>
          <View
            className="flex flex-col px-10 py-8 rounded-xl md:max-w-[700px] lg:max-w-[1100px] space-y-4"
            style={{
              backgroundColor: Colors[colorScheme!]['yam-background'],
            }}
          >
            <Text
              className="text-base mb-3 leading-8"
              style={{ color: Colors[colorScheme!]['yam-default'] }}
            >
              Le Yam Master est un jeu pour deux joueurs avec 5 dés au tour par
              tour.
            </Text>
            <Text
              className="text-base mb-3 leading-6"
              style={{ color: Colors[colorScheme!]['yam-default'] }}
            >
              À son tour, un joueur peut lancer les dés à trois reprises, afin
              de réaliser une des combinaisons présentes sur le plateau.
            </Text>
            <Text
              className="text-base mb-3 leading-6"
              style={{ color: Colors[colorScheme!]['yam-default'] }}
            >
              Après chaque lancer, il peut écarter autant de dés qu’il le
              souhaite et relancer les autres. Tout dé écarté peut être relancé
              dans les jets suivants.
            </Text>
          </View>
          <View
            className="flex flex-col px-10 py-8 rounded-xl md:max-w-[700px] lg:max-w-[1100px] space-y-4"
            style={{
              backgroundColor: Colors[colorScheme!]['yam-background'],
            }}
          >
            <Text
              className="text-xl font-boldmb-2"
              style={{ color: Colors[colorScheme!]['yam-default'] }}
            >
              Les combinaisons réalisables sont les suivantes :
            </Text>

            {[
              'Brelan : trois dés identiques (ex. : case “2“ : réalisation de trois “2“)',
              'Full : un brelan et une paire',
              'Carré : quatre dés identiques',
              'Yam : cinq dés identiques',
              'Suite : combinaisons 1, 2, 3, 4, 5 ou 2, 3, 4, 5, 6',
              '≤8 : la somme des dés ne doit pas excéder 8',
              'Sec : une des combinaisons ci-dessus, sauf le brelan, dès le premier lancer',
              'Défi : avant le deuxième lancer, le joueur relève un défi. Au cours des deux lancers suivants, il doit impérativement réaliser une des combinaisons ci-dessus (sauf le brelan). Il n’a pas besoin de s’engager sur une combinaison précise.',
            ].map((rule, index) => (
              <Text
                key={index}
                className="text-base mb-2 pl-4"
                style={{ color: Colors[colorScheme!]['yam-default'] }}
              >
                - {rule}
              </Text>
            ))}
          </View>
          <View
            className="flex flex-col px-10 py-8 rounded-xl md:max-w-[700px] lg:max-w-[1100px] space-y-4"
            style={{
              backgroundColor: Colors[colorScheme!]['yam-background'],
            }}
          >
            <Text
              className="text-base mb-3 leading-6"
              style={{ color: Colors[colorScheme!]['yam-default'] }}
            >
              À noter que les dés peuvent former plusieurs combinaisons
              simultanément (ex : un Yam est aussi un brelan, un carré, un full)
              parmi lesquelles le joueur choisit une combinaison.
            </Text>
            <Text
              className="text-base mb-3 leading-6"
              style={{ color: Colors[colorScheme!]['yam-default'] }}
            >
              Dès qu’un joueur réussit une combinaison, il peut (s’il le
              souhaite) poser un pion sur une des cases libres du plateau
              correspondant à sa combinaison.
            </Text>
            <Text
              className="text-base mb-3 leading-6"
              style={{ color: Colors[colorScheme!]['yam-default'] }}
            >
              À tout moment, il est possible d’utiliser le Yam Predator : faire
              un Yam pour retirer n’importe quel pion adverse au lieu d’en poser
              un des siens.
            </Text>
          </View>
        </View>
      </ScrollView>
    </ImageBackground>
  );
}
