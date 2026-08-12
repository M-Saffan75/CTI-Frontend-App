import { useEffect } from 'react';
import { ImageBackground, StatusBar, StyleSheet } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { ctiLogo, splashByTheme } from '@/assets/images';
import { useTheme } from '@/theme/ThemeContext';

const FADE_IN = 450;
const HOLD = 2000;
const FADE_OUT = 2000;
const EASING = Easing.bezier(0.4, 0, 0.2, 1);

export default function SplashScreen({ onFinish }) {
  const { colors, themeName } = useTheme();
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withSequence(
      withTiming(1, { duration: FADE_IN, easing: EASING }),
      withDelay(
        HOLD,
        withTiming(0, { duration: FADE_OUT, easing: EASING }, finished => {
          if (finished && onFinish) runOnJS(onFinish)();
        }),
      ),
    );
  }, []);

  const fade = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <ImageBackground
      source={splashByTheme[themeName] ?? splashByTheme.white}
      resizeMode="cover"
      style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.barStyle} />
      <Animated.Image source={ctiLogo} resizeMode="contain" style={[styles.logo, fade]} />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: '56%',
    height: 140,
  },
});
