// Reanimated names presets by where they START, so the one that moves left is FadeInRight.
import Animated, { FadeInRight as Preset } from 'react-native-reanimated';

export default function FadeLeft({ children, delay = 0, duration = 400, style = null }) {
  return (
    <Animated.View entering={Preset.duration(duration).delay(delay)} style={style}>
      {children}
    </Animated.View>
  );
}
