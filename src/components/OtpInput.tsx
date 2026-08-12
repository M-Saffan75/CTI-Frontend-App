import { useRef } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';

export default function OtpInput({ value, onChange, length = 4, error = '', style = null }) {
  const { colors } = useTheme();
  const boxes = useRef([]);

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
    <View style={[styles.row, style]}>
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
                color: colors.text,
                backgroundColor: colors.background,
                borderColor: error ? colors.error : filled ? colors.primary : colors.border,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 14,
  },
  box: {
    width: 62,
    height: 62,
    borderRadius: 12,
    borderWidth: 1.5,
    textAlign: 'center',
    fontFamily: fonts.bold,
    fontSize: 22,
  },
});
