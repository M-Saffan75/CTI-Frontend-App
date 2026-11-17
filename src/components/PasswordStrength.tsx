import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import { passwordScore } from '@/utils/validators';
import { useTranslation } from 'react-i18next';

const LEVELS = [
  { key: null, color: null },
  { key: 'weak', color: '#FB2C36' },
  { key: 'fair', color: '#FF820A' },
  { key: 'good', color: '#1592FD' },
  { key: 'strong', color: '#00A63E' },
] as const;

export default function PasswordStrength({ value, style = null }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
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

      <Text style={[styles.label, { color: level.color ?? colors.textMuted }]}>{level.key ? t(`common.passwordStrength.${level.key}`) : ''}</Text>
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
