import { useEffect } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { ctiHomeBubbles } from '@/assets/images';

const RING = 200;

// The three bubbles turn slowly behind the hero picture (15 s a turn) and the picture floats up and down, like the website
export default function HeroBubbles({ uri }: { uri: string }) {
  const turn = useSharedValue(0);
  const float = useSharedValue(0);

  useEffect(() => {
    turn.value = withRepeat(withTiming(360, { duration: 15000, easing: Easing.linear }), -1, false);
    float.value = withRepeat(
      withSequence(
        withTiming(-10, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
    return () => {
      cancelAnimation(turn);
      cancelAnimation(float);
    };
  }, [turn, float]);

  const ring = useAnimatedStyle(() => ({ transform: [{ rotate: `${turn.value}deg` }] }));
  const picture = useAnimatedStyle(() => ({ transform: [{ translateY: float.value }] }));

  return (
    <View style={styles.fill} pointerEvents="none">
      <View style={styles.ringWrap}>
        <Animated.View style={[styles.ring, ring]}>
          <Image source={ctiHomeBubbles[0]} style={[styles.b1]} />
          <Image source={ctiHomeBubbles[1]} style={[styles.b2]} />
          <Image source={ctiHomeBubbles[2]} style={[styles.b3]} />
        </Animated.View>
      </View>
      <Animated.View style={[styles.fill, picture]}>
        <Image source={{ uri }} style={styles.picture} resizeMode="contain" />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { ...StyleSheet.absoluteFill },
  ringWrap: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 24 },
  ring: { width: RING, height: RING },
  b1: { position: 'absolute', top: -6, left: RING / 2 - 22, width: 44, height: 44 },
  b2: { position: 'absolute', top: RING / 2 - 27, left: -6, width: 54, height: 54 },
  b3: { position: 'absolute', bottom: 4, right: 8, width: 62, height: 62 },
  picture: { width: '100%', height: '100%' },
});
