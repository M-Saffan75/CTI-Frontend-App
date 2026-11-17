import { ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';

import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import { useTranslation } from 'react-i18next';

interface Props {
  options: { label: string; value: string }[];
  value: string;
  onChange: (value: string) => void;
}

export default function FilterChips({ options, value, onChange }: Props) {
  useTranslation();
  const { colors } = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      style={styles.scroll}
    >
      {options.map(option => {
        const active = option.value === value;
        return (
          <TouchableOpacity
            key={option.value}
            onPress={() => !active && onChange(option.value)}
            style={[
              styles.chip,
              {
                backgroundColor: active ? colors.primary : colors.surfaceAlt,
                borderColor: active ? colors.primary : colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.text,
                { color: active ? colors.onPrimary : colors.textMuted },
                active && { fontFamily: fonts.bold },
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { marginTop: 12, flexGrow: 0 },
  row: { gap: 8 },
  chip: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  text: { fontFamily: fonts.medium, fontSize: 12 },
});
