import { Pressable, StyleSheet, Text, View } from 'react-native';

import Icon from '@/components/Icon';
import { checkCircleBold } from '@/assets/icons';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';

export default function Checkbox({ checked, onChange, label = null, style = null }) {
  const { colors } = useTheme();

  return (
    <Pressable onPress={() => onChange(!checked)} hitSlop={8} style={[styles.wrap, style]}>
      <View
        style={[
          styles.box,
          {
            borderColor: checked ? colors.primary : colors.textMuted,
            backgroundColor: checked ? colors.primary : 'transparent',
          },
        ]}>
        {checked && <Icon source={checkCircleBold} size={14} color={colors.onPrimary} />}
      </View>

      {label && <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  box: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: fonts.regular,
    fontSize: 14,
  },
});
