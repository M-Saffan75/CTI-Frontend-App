import { useEffect } from 'react';
import { Dimensions, Image, StyleSheet, View } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const DURATION = 900;
// A hard ease-out covers most of the screen instantly then crawls, which reads
// as the change happening at the bottom. A hard ease-in leaves the first
// moments looking frozen. This sits between the two.
const EASING = Easing.bezier(0.4, 0, 0.2, 1);

/**
 * The Telegram theme switch. Two frozen screenshots sit on top of the app:
 * the old theme fills the screen, and the new one is revealed through a circle
 * that grows out of wherever the user tapped.
 */
export default function ThemeReveal({ oldUri, newUri, x, y, onCovered, onDone }) {
  const progress = useSharedValue(0);

  // The circle has to reach the corner furthest from the tap.
  const radius = Math.max(
    Math.hypot(x, y),
    Math.hypot(SCREEN_W - x, y),
    Math.hypot(x, SCREEN_H - y),
    Math.hypot(SCREEN_W - x, SCREEN_H - y),
  );

  useEffect(() => {
    if (!newUri) return;
    progress.value = 0;
    progress.value = withTiming(1, { duration: DURATION, easing: EASING }, finished => {
      if (finished) runOnJS(onDone)();
    });
  }, [newUri]);

  const circle = useAnimatedStyle(() => ({ transform: [{ scale: progress.value }] }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Only once this has actually painted is it safe to switch the theme
          underneath — otherwise the new theme flashes through for a frame. */}
      <Image
        source={{ uri: oldUri }}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
        fadeDuration={0}
        onLoad={onCovered}
      />

      {newUri && (
        <MaskedView
          style={StyleSheet.absoluteFill}
          maskElement={
            <View style={styles.maskArea}>
              {/* The circle's content never changes, only its transform — so
                  let the GPU hold it as a texture instead of redrawing it
                  every frame. */}
              <Animated.View
                renderToHardwareTextureAndroid
                shouldRasterizeIOS
                style={[
                  styles.circle,
                  {
                    left: x - radius,
                    top: y - radius,
                    width: radius * 2,
                    height: radius * 2,
                    borderRadius: radius,
                  },
                  circle,
                ]}
              />
            </View>
          }>
          <Image
            source={{ uri: newUri }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
            fadeDuration={0}
          />
        </MaskedView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  maskArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  circle: {
    position: 'absolute',
    backgroundColor: '#000000',
  },
});
