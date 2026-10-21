import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';

export default function AdvertisingBarChart({ data }) {
  const { colors } = useTheme();
  const maxVal = Math.max(1, ...data.map(d => d.value));

  return (
    <View style={styles.chartContainer}>
      <View style={styles.barsRow}>
        {data.map(item => {
          const heightPercent = Math.max(12, (item.value / maxVal) * 100);

          return (
            <View key={item.day} style={styles.barCol}>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    {
                      height: `${heightPercent}%`,
                      backgroundColor: colors.primary,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.dayLabel, { color: colors.textMuted }]}>{item.day}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chartContainer: {
    paddingVertical: 12,
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 120,
    paddingHorizontal: 8,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
    gap: 8,
  },
  barTrack: {
    width: 28,
    height: '80%',
    justifyContent: 'flex-end',
  },
  barFill: {
    width: '100%',
    borderRadius: 8,
  },
  dayLabel: {
    fontFamily: fonts.medium,
    fontSize: 12,
  },
});
