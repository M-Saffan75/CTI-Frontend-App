import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import Button from '@/components/Button';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';

const OPEN_MS = 220;
const CLOSE_MS = 160;
const EASING = Easing.bezier(0.4, 0, 0.2, 1);

/**
 * A yes/no dialog. The backdrop fade and the card zoom are separate animations
 * on purpose — React Native's own Modal animation ties them together, which is
 * what makes the built-in one look cheap.
 */
export default function ConfirmModal({
  visible,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  danger = false,
  onConfirm,
  onCancel,
}) {
  const { colors } = useTheme();
  const [mounted, setMounted] = useState(false);
  const progress = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      progress.value = withTiming(1, { duration: OPEN_MS, easing: EASING });
    } else if (mounted) {
      progress.value = withTiming(0, { duration: CLOSE_MS, easing: EASING }, finished => {
        if (finished) runOnJS(setMounted)(false);
      });
    }
  }, [visible]);

  const backdrop = useAnimatedStyle(() => ({ opacity: progress.value }));

  const card = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: 0.9 + progress.value * 0.1 }],
  }));

  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={onCancel}>
      <View style={styles.center}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: colors.backdrop }, backdrop]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} />
        </Animated.View>

        <Animated.View
          style={[styles.card, { backgroundColor: colors.surface }, card]}>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          {message && <Text style={[styles.message, { color: colors.textMuted }]}>{message}</Text>}

          <View style={styles.actions}>
            <Button
              title={cancelText}
              variant="soft"
              size="sm"
              onPress={onCancel}
              style={styles.action}
            />
            <Button
              title={confirmText}
              size="sm"
              onPress={onConfirm}
              color={danger ? colors.error : null}
              style={styles.action}
            />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  card: {
    width: '100%',
    borderRadius: 16,
    padding: 22,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 18,
    textAlign: 'center',
  },
  message: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 22,
  },
  action: {
    flex: 1,
  },
});
