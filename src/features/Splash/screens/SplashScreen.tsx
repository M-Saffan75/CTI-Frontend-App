import { ImageBackground, StatusBar, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { lottieCtiLogo, splashByTheme } from '@/assets/images';
import { useTheme } from '@/theme/ThemeContext';

const HOLD = 700;
const FADE_OUT = 600;
const EASING = Easing.bezier(0.4, 0, 0.2, 1);

export default function SplashScreen({ onFinish }) {
  const { colors, themeName } = useTheme();
  const opacity = useSharedValue(1);

  // The Lottie file itself is the entrance animation (pieces assembling into
  // the logo) — once it's done, hold for a beat, then fade the whole screen
  // out to reveal the app.
  const onAnimationFinish = () => {
    opacity.value = withDelay(
      HOLD,
      withTiming(0, { duration: FADE_OUT, easing: EASING }, finished => {
        if (finished && onFinish) runOnJS(onFinish)();
      }),
    );
  };

  const fade = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <ImageBackground
      source={splashByTheme[themeName] ?? splashByTheme.white}
      resizeMode="cover"
      style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.barStyle} />
      <Animated.View style={[styles.logo, fade]}>
        <LottieView
          source={lottieCtiLogo}
          autoPlay
          loop={false}
          onAnimationFinish={onAnimationFinish}
          style={styles.lottie}
        />
      </Animated.View>
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
  lottie: {
    width: '100%',
    height: '100%',
  },
});
