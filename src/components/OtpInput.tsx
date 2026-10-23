import { useRef } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';

export default function OtpInput({ value, onChange, length = 6, error = '', style = null }) {
  const { colors } = useTheme();
  const boxes = useRef([]);

  const isSix = length >= 6;
  const boxWidth = isSix ? 48 : 62;
  const boxHeight = isSix ? 52 : 62;
  const gap = isSix ? 8 : 14;
  const fontSize = isSix ? 18 : 22;

  const setDigit = (index, digit) => {
    const clean = digit.replace(/[^0-9]/g, '');
    const next = value.split('');
    next[index] = clean.slice(-1) || '';
    onChange(next.join('').slice(0, length));

    if (clean && index < length - 1) boxes.current[index + 1]?.focus();
  };

  // Backspace on an empty box should move back to the previous one.
  const onKeyPress = (index, key) => {
    if (key === 'Backspace' && !value[index] && index > 0) boxes.current[index - 1]?.focus();
  };

  return (
    <View>
      <View style={[styles.row, { gap }, style]}>
        {Array.from({ length }).map((_, index) => {
          const filled = Boolean(value[index]);

          return (
            <TextInput
              key={index}
              ref={box => {
                boxes.current[index] = box;
              }}
              value={value[index] ?? ''}
              onChangeText={digit => setDigit(index, digit)}
              onKeyPress={event => onKeyPress(index, event.nativeEvent.key)}
              keyboardType="number-pad"
              maxLength={1}
              style={[
                styles.box,
                {
                  width: boxWidth,
                  height: boxHeight,
                  fontSize,
                  color: colors.text,
                  backgroundColor: colors.background,
                  borderColor: error ? colors.error : filled ? colors.primary : colors.border,
                },
              ]}
            />
          );
        })}
      </View>

      {error ? <Text style={[styles.error, { color: colors.error }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  box: {
    borderRadius: 12,
    borderWidth: 1.5,
    textAlign: 'center',
    fontFamily: fonts.bold,
  },
  error: {
    fontFamily: fonts.regular,
    fontSize: 12,
    marginTop: 10,
    textAlign: 'center',
  },
});
