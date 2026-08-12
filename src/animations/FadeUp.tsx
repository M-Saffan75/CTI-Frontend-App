// Reanimated names presets by where they START, so the one that rises up is FadeInDown.
import Animated, { FadeInDown as Preset } from 'react-native-reanimated';

export default function FadeUp({ children, delay = 0, duration = 400, style = null }) {
  return (
    <Animated.View entering={Preset.duration(duration).delay(delay)} style={style}>
      {children}
    </Animated.View>
  );
}
