import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Polyline } from 'react-native-svg';

import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import { useTranslation } from 'react-i18next';

const HEIGHT = 160;
const PADDING = 16;
const LABEL_WIDTH = 44;
const MAX_LABELS = 6;

interface Props {
  data: { label: string; value: number }[];
  maxLabel?: string;
}

/** A small line chart — no library, just a polyline over a few grid lines. */
export default function EarningsLineChart({ data, maxLabel }: Props) {
  useTranslation();
  const { colors } = useTheme();
  const [width, setWidth] = useState(0);

  const max = Math.max(1, ...data.map(point => point.value));
  const step = data.length > 1 ? (width - PADDING * 2) / (data.length - 1) : 0;

  const toY = (value: number) =>
    HEIGHT - PADDING - (value / max) * (HEIGHT - PADDING * 2);
  const points = data.map((point, index) => ({
    x: data.length > 1 ? PADDING + index * step : width / 2,
    y: toY(point.value),
    ...point,
  }));

  const gridLines = [0, 0.25, 0.5, 0.75, 1];
  // A month has about 30 points: show only a few labels so they never overlap
  const labelEvery = Math.ceil(data.length / MAX_LABELS);

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

          {points.map(point => (
            <Circle
              key={point.label}
              cx={point.x}
              cy={point.y}
              r={data.length > 14 ? 2 : 4}
              fill={colors.primary}
            />
          ))}
        </Svg>
      )}

      {maxLabel ? (
        <Text style={[styles.max, { color: colors.textMuted }]}>
          {maxLabel}
        </Text>
      ) : null}

      <View style={styles.labels}>
        {points.map((point, index) =>
          index % labelEvery === 0 ? (
            <Text
              key={point.label}
              numberOfLines={1}
              style={[
                styles.label,
                { color: colors.textMuted, left: point.x - LABEL_WIDTH / 2 },
              ]}
            >
              {point.label}
            </Text>
          ) : null,
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  max: {
    position: 'absolute',
    top: 0,
    left: 0,
    fontFamily: fonts.regular,
    fontSize: 10,
  },
  labels: { height: 16, marginTop: 6 },
  label: {
    position: 'absolute',
    width: LABEL_WIDTH,
    textAlign: 'center',
    fontFamily: fonts.regular,
    fontSize: 10,
  },
});
