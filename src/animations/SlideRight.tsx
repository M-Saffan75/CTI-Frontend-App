// Slides in from off-screen — a much bigger move than FadeRight's 25px.
import Animated, { SlideInLeft as Preset } from 'react-native-reanimated';

export default function SlideRight({ children, delay = 0, duration = 400, style = null }) {
  return (
    <Animated.View entering={Preset.duration(duration).delay(delay)} style={style}>
      {children}
    </Animated.View>
  );
}
