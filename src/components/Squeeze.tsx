import { Pressable } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

const SPRING = { damping: 15, stiffness: 400 };

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Press feedback for anything that isn't a <Button> — gradient cards, pills,
 * back arrows. Button uses this too, so the squeeze is defined in one place.
 */
export default function Squeeze({
  children,
  onPress = null,
  disabled = false,
  scale = 0.96,
  style = null,
  ...rest
}: any) {
  const value = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: value.value }] }));

  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={disabled}
      onPressIn={() => {
        value.value = withSpring(scale, SPRING);
      }}
      onPressOut={() => {
        value.value = withSpring(1, SPRING);
      }}
      style={[style, animated]}
      {...rest}>
      {children}
    </AnimatedPressable>
  );
}
