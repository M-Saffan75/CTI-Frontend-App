import { StyleSheet, Text, View } from 'react-native';

import Icon from '@/components/Icon';
import Squeeze from '@/components/Squeeze';
import { calendarBold, timesSquareBold } from '@/assets/icons';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';

interface Props {
  label: string;
  from: string;
  to: string;
  onPress: () => void;
  onClear: () => void;
}

// A tappable box that shows the chosen date range and a clear button.
export default function DateRangeField({ label, from, to, onPress, onClear }: Props) {
  useTranslation();
  const { colors } = useTheme();
  const hasRange = !!from;
  const text = hasRange ? (from === to ? from : i18n.t('sellerMsg.rangeTo', { from, to })) : i18n.t('sellerMsg.selectDates');

  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      <View style={styles.row}>
        <Squeeze onPress={onPress} style={styles.flex1}>
          <View
            style={[
              styles.box,
              {
                backgroundColor: colors.surfaceAlt,
                borderColor: hasRange ? colors.primary : colors.border,
              },
            ]}>
            <Text
              style={[styles.text, { color: hasRange ? colors.text : colors.textMuted }]}>
              {text}
            </Text>
            <Icon source={calendarBold} size={16} color={colors.textMuted} />
          </View>
        </Squeeze>
        {hasRange ? (
          <Squeeze onPress={onClear} scale={0.85}>
            <View style={[styles.clearBtn, { borderColor: colors.border }]}>
              <Icon source={timesSquareBold} size={16} color={colors.error} />
            </View>
          </Squeeze>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { fontFamily: fonts.bold, fontSize: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  flex1: { flex: 1 },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  text: { flexShrink: 1, fontFamily: fonts.regular, fontSize: 13 },
  clearBtn: {
    width: 42,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
