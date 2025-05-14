/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    'yam-default': '#FFFFFF', // white
    'yam-base': '#242E33', // black
    'yam-background': 'rgba(0, 0, 0, 0.2)', // color brown wood
    'yam-background-2': 'rgba(0, 0, 0, 0.2)', // color brown wood
    'yam-primary': '#81b64c', // green
    'yam-info': '#4dc3ea', // blue
    'yam-error': '#fa412d', // red
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    'yam-default': '#242E33', // black
    'yam-base': '#FFFFFF', // white
    'yam-background': 'rgba(0, 0, 0, 0.2)', // color brown wood
    'yam-background-2': 'rgba(0, 0, 0, 0.2)', // color brown wood
    'yam-primary': '#81b64c', // green
    'yam-info': '#4dc3ea', // blue
    'yam-error': '#fa412d', // red
  },
};
