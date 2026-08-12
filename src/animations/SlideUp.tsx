// Slides in from off-screen — a much bigger move than FadeUp's 25px.
import Animated, { SlideInDown as Preset } from 'react-native-reanimated';

export default function SlideUp({ children, delay = 0, duration = 400, style = null }) {
  return (
    <Animated.View entering={Preset.duration(duration).delay(delay)} style={style}>
      {children}
    </Animated.View>
  );
}
