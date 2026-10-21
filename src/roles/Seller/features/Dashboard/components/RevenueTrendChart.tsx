import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Polyline } from 'react-native-svg';

import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';

const HEIGHT = 140;
const PADDING = 16;

export default function RevenueTrendChart({ data }) {
  const { colors } = useTheme();
  const [width, setWidth] = useState(0);

  const maxVal = Math.max(4, ...data.map(d => d.value));
  const step = data.length > 1 ? (width - PADDING * 2) / (data.length - 1) : 0;

  const toY = value => HEIGHT - PADDING - (value / maxVal) * (HEIGHT - PADDING * 2);
  const points = data.map((point, index) => ({
    x: PADDING + index * step,
    y: toY(point.value),
    ...point,
  }));

  const gridSteps = [0, 0.25, 0.5, 0.75, 1];

  return (
    <View onLayout={event => setWidth(event.nativeEvent.layout.width)}>
      {width > 0 && (
        <Svg width={width} height={HEIGHT}>
          {gridSteps.map(f => {
            const y = PADDING + f * (HEIGHT - PADDING * 2);
            return (
              <Line
                key={f}
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
            points={points.map(p => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke={colors.primary}
            strokeWidth={2.5}
          />

          {points.map((p, index) => (
            <Circle key={index} cx={p.x} cy={p.y} r={4.5} fill={colors.primary} />
          ))}
        </Svg>
      )}

      {/* Tooltip simulation for design fidelity */}
      <View style={[styles.tooltip, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.tooltipDate, { color: colors.textMuted }]}>Tue, July 4</Text>
        <Text style={[styles.tooltipRevenue, { color: colors.primary }]}>Revenue: Rs.0</Text>
      </View>

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
  tooltip: {
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: -80,
    marginBottom: 40,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  tooltipDate: { fontFamily: fonts.medium, fontSize: 11 },
  tooltipRevenue: { fontFamily: fonts.bold, fontSize: 12, marginTop: 2 },
  labels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  label: { fontFamily: fonts.regular, fontSize: 11 },
});
