import { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import Icon from '@/components/Icon';
import { checkCircleBold, globeBold } from '@/assets/icons';
import { LANGUAGES, useLanguage } from '@/i18n/LanguageContext';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import { useTranslation } from 'react-i18next';

const OPEN_MS = 220;
const CLOSE_MS = 160;
const EASING = Easing.bezier(0.4, 0, 0.2, 1);

// Opened from the "Language" row in Settings (all three roles)
export default function LanguageModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { colors } = useTheme();
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const mountedRef = useRef(false);
  mountedRef.current = mounted;
  const progress = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      progress.value = withTiming(1, { duration: OPEN_MS, easing: EASING });
    } else if (mountedRef.current) {
      progress.value = withTiming(0, { duration: CLOSE_MS, easing: EASING }, finished => {
        if (finished) runOnJS(setMounted)(false);
      });
    }
  }, [visible, progress]);

  const backdrop = useAnimatedStyle(() => ({ opacity: progress.value }));
  const card = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: 0.9 + progress.value * 0.1 }],
  }));

  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.center}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: colors.backdrop }, backdrop]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        <Animated.View style={[styles.card, { backgroundColor: colors.surface }, card]}>
          <View style={styles.head}>
            <Icon source={globeBold} size={20} color={colors.text} />
            <Text style={[styles.title, { color: colors.text }]}>{t('language.title')}</Text>
          </View>

          {LANGUAGES.map(item => {
            const active = item.code === language;
            return (
              <Pressable
                key={item.code}
                onPress={() => {
                  setLanguage(item.code);
                  onClose();
                }}
                style={[
                  styles.row,
                  { borderColor: active ? colors.primary : colors.border },
                  active && { backgroundColor: colors.surfaceAlt },
                ]}>
                <Text style={[styles.label, { color: active ? colors.primary : colors.text }]}>
                  {item.label}
                </Text>
                {active && <Icon source={checkCircleBold} size={20} color={colors.primary} />}
              </Pressable>
            );
          })}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  card: { width: '100%', maxWidth: 360, borderRadius: 20, padding: 20, gap: 10 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  title: { flexShrink: 1, fontFamily: fonts.bold, fontSize: 18 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 14,
  },
  label: { fontFamily: fonts.medium, fontSize: 15 },
});
