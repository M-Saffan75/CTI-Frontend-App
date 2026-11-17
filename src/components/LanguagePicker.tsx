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
import { chevronDownBold, globeBold } from '@/assets/icons';
import { LANGUAGES, useLanguage } from '@/i18n/LanguageContext';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';

const MENU_WIDTH = 170;
const OPEN_MS = 220;
const CLOSE_MS = 160;
const EASING = Easing.bezier(0.4, 0, 0.2, 1);

// Same dropdown as ThemePicker (same size, animation and colours), opening from the left edge
export default function LanguagePicker({ style = null }) {
  const { colors } = useTheme();
  const { language, setLanguage } = useLanguage();

  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const trigger = useRef<View>(null);
  const progress = useSharedValue(0);

  const current = LANGUAGES.find(l => l.code === language) || LANGUAGES[0];

  const openMenu = () => {
    trigger.current?.measureInWindow((x, y, _width, height) => {
      setPosition({ top: y + height + 8, left: x });
      setMounted(true);
    });
  };

  const closeMenu = (onClosed: (() => void) | null = null) => {
    progress.value = withTiming(0, { duration: CLOSE_MS, easing: EASING }, finished => {
      if (!finished) return;
      runOnJS(setMounted)(false);
      if (onClosed) runOnJS(onClosed)();
    });
  };

  useEffect(() => {
    if (mounted) progress.value = withTiming(1, { duration: OPEN_MS, easing: EASING });
  }, [mounted, progress]);

  const menuStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: 0.85 + progress.value * 0.15 }],
  }));

  return (
    <View style={style}>
      <Pressable ref={trigger} onPress={openMenu} hitSlop={8} style={styles.trigger}>
        <Icon source={globeBold} size={18} color={colors.text} />
        <Text style={[styles.triggerText, { color: colors.text }]}>{current.label}</Text>
        <Icon source={chevronDownBold} size={14} color={colors.textMuted} />
      </Pressable>

      <Modal visible={mounted} transparent animationType="none" onRequestClose={() => closeMenu()}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => closeMenu()} />

        <Animated.View style={[styles.menuPosition, position, menuStyle]}>
          <View style={[styles.menu, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {LANGUAGES.map(item => {
              const isActive = item.code === language;
              return (
                <Pressable
                  key={item.code}
                  onPress={() => closeMenu(() => setLanguage(item.code))}
                  style={[styles.row, isActive && { backgroundColor: colors.surfaceAlt }]}>
                  <Icon
                    source={globeBold}
                    size={20}
                    color={isActive ? colors.primary : colors.textMuted}
                  />
                  <Text style={[styles.label, { color: isActive ? colors.primary : colors.text }]}>
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  trigger: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 4 },
  triggerText: { fontFamily: fonts.medium, fontSize: 14 },
  menuPosition: {
    position: 'absolute',
    width: MENU_WIDTH,
    transformOrigin: 'top left',
  },
  menu: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 6,
    gap: 2,
    shadowColor: '#000000',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  label: { fontFamily: fonts.medium, fontSize: 14 },
});
