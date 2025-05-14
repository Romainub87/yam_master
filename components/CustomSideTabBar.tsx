import { View, TouchableOpacity, Text, useColorScheme } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import FontAwesome from '@expo/vector-icons/FontAwesome';

export default function CustomSideTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const colorScheme = useColorScheme();
  const { logout } = useAuth();

  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        backgroundColor: Colors[colorScheme!]['yam-background'],
        paddingVertical: 20,
        paddingHorizontal: 15,
        justifyContent: 'space-between',
      }}
    >
      {/* Onglets de navigation */}
      <View>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const Icon = options.tabBarIcon;
          const label = options.title || route.name;

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 5,
                marginVertical: 10,
                paddingLeft: 5,
                opacity: isFocused ? 1 : 0.5,
              }}
            >
              {Icon
                ? Icon({ focused: isFocused, color: 'white', size: 24 })
                : null}
              <Text
                style={{
                  color: 'white',
                  marginLeft: 12,
                  fontSize: 16,
                  fontWeight: isFocused ? 'bold' : 'normal',
                }}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Bouton Déconnexion */}
      <TouchableOpacity
        onPress={logout}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginVertical: 15,
        }}
      >
        <FontAwesome name="sign-out" size={24} color="white" />
        <Text
          style={{
            color: 'white',
            marginLeft: 12,
            fontSize: 16,
            marginRight: 2,
          }}
        >
          Déconnexion
        </Text>
      </TouchableOpacity>
    </View>
  );
}
