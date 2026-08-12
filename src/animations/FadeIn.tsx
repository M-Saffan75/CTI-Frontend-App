import Animated, { FadeIn as Preset } from 'react-native-reanimated';

export default function FadeIn({ children, delay = 0, duration = 400, style = null }) {
  return (
    <Animated.View entering={Preset.duration(duration).delay(delay)} style={style}>
      {children}
    </Animated.View>
  );
}
