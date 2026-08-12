import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import { passwordScore } from '@/utils/validators';

const LEVELS = [
  { label: '', color: null },
  { label: 'Weak', color: '#FB2C36' },
  { label: 'Fair', color: '#FF820A' },
  { label: 'Good', color: '#1592FD' },
  { label: 'Strong', color: '#00A63E' },
];

export default function PasswordStrength({ value, style = null }) {
  const { colors } = useTheme();
  const score = passwordScore(value);

  if (!value) return null;

  const level = LEVELS[score];

  return (
    <View style={[styles.wrap, style]}>
      <View style={styles.dashes}>
        {[1, 2, 3, 4].map(step => (
          <View
            key={step}
            style={[
              styles.dash,
              { backgroundColor: step <= score ? level.color : colors.border },
            ]}
          />
        ))}
      </View>

      <Text style={[styles.label, { color: level.color ?? colors.textMuted }]}>{level.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
  },
  dashes: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
  },
  dash: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: 12,
    width: 48,
    textAlign: 'right',
  },
});
