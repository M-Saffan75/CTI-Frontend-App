import React from 'react';
import {
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import LottieView from 'lottie-react-native';

import { ctiLoaderAnimation } from '@/assets/images';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';

export type CtiLoaderSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;

interface CtiLoaderProps {
  /**
   * Predefined size or custom number (width and height in px).
   * - 'xs': 24
   * - 'sm': 36
   * - 'md': 64 (default)
   * - 'lg': 96
   * - 'xl': 128
   */
  size?: CtiLoaderSize;
  /** Optional message displayed below the loader */
  text?: string;
  /** Take full screen flex: 1 with theme background */
  fullScreen?: boolean;
  /** Render as an absolute overlay over screen */
  overlay?: boolean;
  /** Loop the animation. Defaults to true */
  loop?: boolean;
  /** Autoplay the animation. Defaults to true */
  autoPlay?: boolean;
  /** Animation speed multiplier. Defaults to 1 */
  speed?: number;
  /** Custom container style */
  style?: StyleProp<ViewStyle>;
  /** Custom LottieView style */
  lottieStyle?: StyleProp<ViewStyle>;
  /** Custom text style */
  textStyle?: StyleProp<TextStyle>;
}

const SIZE_MAP: Record<string, number> = {
  xs: 24,
  sm: 36,
  md: 64,
  lg: 96,
  xl: 128,
};

export default function CtiLoader({
  size = 'md',
  text,
  fullScreen = false,
  overlay = false,
  loop = true,
  autoPlay = true,
  speed = 1,
  style,
  lottieStyle,
  textStyle,
}: CtiLoaderProps) {
  const { colors } = useTheme();

  const dimension = typeof size === 'number' ? size : SIZE_MAP[size] ?? 64;

  const containerStyle: StyleProp<ViewStyle> = [
    styles.container,
    fullScreen && [styles.fullScreen, { backgroundColor: colors.background }],
    overlay && [styles.overlay, { backgroundColor: colors.background + 'B3' }],
    style,
  ];

  return (
    <View style={containerStyle}>
      <LottieView
        source={ctiLoaderAnimation}
        autoPlay={autoPlay}
        loop={loop}
        speed={speed}
        style={[{ width: dimension, height: dimension }, lottieStyle]}
      />
      {Boolean(text) && (
        <Text
          style={[
            styles.text,
            { color: colors.textMuted, fontFamily: fonts.regular },
            textStyle,
          ]}>
          {text}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullScreen: {
    flex: 1,
    padding: 24,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    elevation: 9999,
  },
  text: {
    marginTop: 10,
    fontSize: 13,
    textAlign: 'center',
  },
});
