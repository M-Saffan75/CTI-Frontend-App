// Slides in from off-screen — a much bigger move than FadeDown's 25px.
import Animated, { SlideInUp as Preset } from 'react-native-reanimated';

export default function SlideDown({ children, delay = 0, duration = 400, style = null }) {
  return (
    <Animated.View entering={Preset.duration(duration).delay(delay)} style={style}>
      {children}
    </Animated.View>
  );
}
