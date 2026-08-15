import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';

const SIZE = 200;
const STROKE = 26;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** A multi-colour donut built from stacked circles — the standard pure-SVG trick. */
export default function JobDonutChart({ data, total, label }) {
  const { colors } = useTheme();

  const sum = data.reduce((acc, slice) => acc + slice.value, 0);
  let offset = 0;

  return (
    <View style={styles.wrap}>
      <Svg width={SIZE} height={SIZE}>
        <G rotation={-90} origin={`${SIZE / 2}, ${SIZE / 2}`}>
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            stroke={colors.border}
            strokeWidth={STROKE}
            fill="none"
          />
          {data.map(slice => {
            const length = sum ? (slice.value / sum) * CIRCUMFERENCE : 0;
            const dashOffset = -offset;
            offset += length;

            return (
              <Circle
                key={slice.label}
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={RADIUS}
                stroke={slice.color}
                strokeWidth={STROKE}
                strokeDasharray={`${length} ${CIRCUMFERENCE - length}`}
                strokeDashoffset={dashOffset}
                strokeLinecap="butt"
                fill="none"
              />
            );
          })}
        </G>
      </Svg>

      <View style={styles.center}>
        <Text style={[styles.total, { color: colors.text }]}>{total}</Text>
        <Text style={[styles.totalLabel, { color: colors.textMuted }]}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: SIZE, height: SIZE, alignSelf: 'center', alignItems: 'center', justifyContent: 'center' },
  center: { position: 'absolute', alignItems: 'center' },
  total: { fontFamily: fonts.bold, fontSize: 26 },
  totalLabel: { fontFamily: fonts.regular, fontSize: 13, marginTop: 2 },
});
