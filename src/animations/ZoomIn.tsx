import Animated, { ZoomIn as Preset } from 'react-native-reanimated';

export default function ZoomIn({ children, delay = 0, duration = 400, style = null }) {
  return (
    <Animated.View entering={Preset.duration(duration).delay(delay)} style={style}>
      {children}
    </Animated.View>
  );
}
