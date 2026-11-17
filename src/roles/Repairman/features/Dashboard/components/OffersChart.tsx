import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import { useTranslation } from 'react-i18next';

export interface OffersPoint {
  label: string;
  pending: number;
  confirmed: number;
}

const BAR_AREA = 120;

// Pending and confirmed offers side by side for each month or quarter
export default function OffersChart({ data }: { data: OffersPoint[] }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const max = Math.max(
    1,
    ...data.flatMap(point => [point.pending, point.confirmed]),
  );

  return (
    <View>
      <View style={styles.bars}>
        {data.map(point => (
          <View key={point.label} style={styles.group}>
            <View style={styles.pair}>
              <View
                style={[
                  styles.bar,
                  {
                    height: (point.pending / max) * BAR_AREA,
                    backgroundColor: colors.primary + '66',
                  },
                ]}
              />
              <View
                style={[
                  styles.bar,
                  {
                    height: (point.confirmed / max) * BAR_AREA,
                    backgroundColor: colors.primary,
                  },
                ]}
              />
            </View>
            <Text style={[styles.label, { color: colors.textMuted }]}>
              {point.label}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View
            style={[styles.swatch, { backgroundColor: colors.primary + '66' }]}
          />
          <Text style={[styles.legendText, { color: colors.textMuted }]}>
            {t('repairman.pendingOffers')}
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.swatch, { backgroundColor: colors.primary }]} />
          <Text style={[styles.legendText, { color: colors.textMuted }]}>
            {t('repairman.confirmedOffers')}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: BAR_AREA + 22,
    gap: 2,
  },
  group: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  pair: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 1,
    height: BAR_AREA,
  },
  bar: {
    width: 6,
    minHeight: 1,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  label: { fontFamily: fonts.regular, fontSize: 9, marginTop: 4 },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 18,
    marginTop: 12,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  swatch: { width: 10, height: 10, borderRadius: 3 },
  legendText: { flexShrink: 1, fontFamily: fonts.regular, fontSize: 12 },
});
