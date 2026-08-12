import { useEffect, useRef, useState } from 'react';
import { Dimensions, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import Icon from '@/components/Icon';
import {
  blackMoonIcon,
  chevronDownBold,
  forestIcon,
  lightSunIcon,
  oceanWaveIcon,
  sandIcon,
} from '@/assets/icons';
import { useTheme } from '@/theme/ThemeContext';
import { themeNames } from '@/theme/colors';
import { fonts } from '@/theme/fonts';

const MENU_WIDTH = 170;
const OPEN_MS = 220;
const CLOSE_MS = 160;
const EASING = Easing.bezier(0.4, 0, 0.2, 1);

const THEME_ICONS = {
  white: lightSunIcon,
  black: blackMoonIcon,
  sand: sandIcon,
  ocean: oceanWaveIcon,
  forest: forestIcon,
};

export default function ThemePicker({ style = null }) {
  const { colors, themeName, setThemeName } = useTheme();

  // `mounted` keeps the Modal on screen long enough to play the closing
  // animation — without it the menu just blinks out.
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState({ top: 0, right: 0 });
  const [origin, setOrigin] = useState({ x: 0, y: 0 });
  const trigger = useRef(null);
  const progress = useSharedValue(0);

  const openMenu = () => {
    trigger.current?.measureInWindow((x, y, width, height) => {
      setPosition({
        top: y + height + 8,
        right: Dimensions.get('window').width - (x + width),
      });
      setOrigin({ x: x + width / 2, y: y + height / 2 });
      setMounted(true);
    });
  };

  const closeMenu = (onClosed = null) => {
    progress.value = withTiming(0, { duration: CLOSE_MS, easing: EASING }, finished => {
      if (!finished) return;
      runOnJS(setMounted)(false);
      if (onClosed) runOnJS(onClosed)();
    });
  };

  useEffect(() => {
    if (mounted) progress.value = withTiming(1, { duration: OPEN_MS, easing: EASING });
  }, [mounted]);

  // Grows out of its top-right corner, which is where the palette icon sits.
  const menuStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: 0.85 + progress.value * 0.15 }],
  }));

  return (
    <View style={style}>
      <Pressable ref={trigger} onPress={openMenu} hitSlop={8} style={styles.trigger}>
        <Icon source={THEME_ICONS[themeName]} size={18} color={colors.text} />
        <Text style={[styles.triggerText, { color: colors.text }]}>Theme</Text>
        <Icon source={chevronDownBold} size={14} color={colors.textMuted} />
      </Pressable>

      <Modal visible={mounted} transparent animationType="none" onRequestClose={closeMenu}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => closeMenu()} />

        <Animated.View style={[styles.menuPosition, position, menuStyle]}>
          <View style={[styles.menu, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {themeNames.map(name => {
              const isActive = name === themeName;

              return (
                <Pressable
                  key={name}
                  onPress={() => closeMenu(() => setThemeName(name, origin))}
                  style={[styles.row, isActive && { backgroundColor: colors.surfaceAlt }]}>
                  <Icon
                    source={THEME_ICONS[name]}
                    size={20}
                    color={isActive ? colors.primary : colors.textMuted}
                  />
                  <Text
                    style={[styles.label, { color: isActive ? colors.primary : colors.text }]}>
                    {name}
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
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 4,
  },
  triggerText: {
    fontFamily: fonts.medium,
    fontSize: 14,
  },
  menuPosition: {
    position: 'absolute',
    width: MENU_WIDTH,
    transformOrigin: 'top right',
  },
  menu: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 6,
    gap: 2,
    // No Android `elevation` here on purpose. Its shadow is drawn on a separate
    // layer that doesn't follow the view's scale/opacity, so it lingers as a
    // detached rectangle while the menu is closing.
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
  label: {
    fontFamily: fonts.medium,
    fontSize: 14,
    textTransform: 'capitalize',
  },
});
