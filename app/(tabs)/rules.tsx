import { ScrollView, Text } from 'react-native';

export default function RulesScreen() {
    return (
        <ScrollView className="dark:bg-black bg-white p-5">
            <Text className="text-4xl font-bold mb-4 text-white text-center">Règles du jeu Yam Master</Text>
            <Text className="text-base mb-3 leading-8 text-white">
                Le Yam Master est un jeu pour deux joueurs avec 5 dés au tour par tour.
            </Text>
            <Text className="text-base mb-3 leading-6 text-white">
                À son tour, un joueur peut lancer les dés à trois reprises, afin de réaliser une des combinaisons présentes sur le plateau.
            </Text>
            <Text className="text-base mb-3 leading-6 text-white">
                Après chaque lancer, il peut écarter autant de dés qu’il le souhaite et relancer les autres. Tout dé écarté peut être relancé dans les jets suivants.
            </Text>
            <Text className="text-xl font-bold mt-4 mb-2 text-white">Les combinaisons réalisables sont les suivantes :</Text>
            <Text className="text-base mb-2 pl-4 text-white">- Brelan : trois dés identiques (ex. : case “2“ : réalisation de trois “2“)</Text>
            <Text className="text-base mb-2 pl-4 text-white">- Full : un brelan et une paire</Text>
            <Text className="text-base mb-2 pl-4 text-white">- Carré : quatre dés identiques</Text>
            <Text className="text-base mb-2 pl-4 text-white">- Yam : cinq dés identiques</Text>
            <Text className="text-base mb-2 pl-4 text-white">- Suite : combinaisons 1, 2, 3, 4, 5 ou 2, 3, 4, 5, 6</Text>
            <Text className="text-base mb-2 pl-4 text-white">- ≤8 : la somme des dés ne doit pas excéder 8</Text>
            <Text className="text-base mb-2 pl-4 text-white">
                - Sec : une des combinaisons ci-dessus, sauf le brelan, dès le premier lancer
            </Text>
            <Text className="text-base mb-6 pl-4 text-white">
                - Défi : avant le deuxième lancer, le joueur relève un défi. Au cours des deux lancers suivants, il doit impérativement réaliser une des combinaisons ci-dessus (sauf le brelan). Il n’a pas besoin de s’engager sur une combinaison précise.
            </Text>
            <Text className="text-base mb-3 leading-6 text-white">
                À noter que les dés peuvent former plusieurs combinaisons simultanément (ex : un Yam est aussi un brelan, un carré, un full) parmi lesquelles le joueur choisit une combinaison.
            </Text>
            <Text className="text-base mb-3 leading-6 text-white">
                Dès qu’un joueur réussit une combinaison, il peut (s’il le souhaite) poser un pion sur une des cases libres du plateau correspondant à sa combinaison.
            </Text>
            <Text className="text-base mb-3 leading-6 text-white">
                À tout moment, il est possible d’utiliser le Yam Predator : faire un Yam pour retirer n’importe quel pion adverse au lieu d’en poser un des siens.
            </Text>
        </ScrollView>
    );
}