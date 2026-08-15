import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Polyline } from 'react-native-svg';

import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';

const HEIGHT = 160;
const PADDING = 16;

/** A small line chart — no library, just a polyline over a few grid lines. */
export default function EarningsLineChart({ data }) {
  const { colors } = useTheme();
  const [width, setWidth] = useState(0);

  const max = Math.max(1, ...data.map(point => point.value));
  const step = data.length > 1 ? (width - PADDING * 2) / (data.length - 1) : 0;

  const toY = value => HEIGHT - PADDING - (value / max) * (HEIGHT - PADDING * 2);
  const points = data.map((point, index) => ({
    x: PADDING + index * step,
    y: toY(point.value),
    ...point,
  }));

  const gridLines = [0, 0.25, 0.5, 0.75, 1];

  return (
    <View onLayout={event => setWidth(event.nativeEvent.layout.width)}>
      {width > 0 && (
        <Svg width={width} height={HEIGHT}>
          {gridLines.map(fraction => {
            const y = PADDING + fraction * (HEIGHT - PADDING * 2);
            return (
              <Line
                key={fraction}
                x1={PADDING}
                x2={width - PADDING}
                y1={y}
                y2={y}
                stroke={colors.border}
                strokeWidth={1}
              />
            );
          })}

          <Polyline
            points={points.map(point => `${point.x},${point.y}`).join(' ')}
            fill="none"
            stroke={colors.primary}
            strokeWidth={2}
          />

          {points.map((point, index) => (
            <Circle key={index} cx={point.x} cy={point.y} r={4} fill={colors.primary} />
          ))}
        </Svg>
      )}

      <View style={styles.labels}>
        {data.map(point => (
          <Text key={point.label} style={[styles.label, { color: colors.textMuted }]}>
            {point.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  labels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  label: { fontFamily: fonts.regular, fontSize: 10 },
});
