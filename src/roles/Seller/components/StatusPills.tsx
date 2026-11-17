import { ScrollView, StyleSheet, Text, View } from 'react-native';

import Squeeze from '@/components/Squeeze';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import { useTranslation } from 'react-i18next';

export interface PillOption {
  id: string;
  label: string;
  count?: number;
}

interface Props {
  options: PillOption[];
  selected: string;
  onSelect: (id: string) => void;
}

// Horizontal filter pills with an optional count, like the tabs on the web pages.
export default function StatusPills({ options, selected, onSelect }: Props) {
  useTranslation();
  const { colors } = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      keyboardShouldPersistTaps="handled">
      {options.map(option => {
        const active = option.id === selected;
        return (
          <Squeeze key={option.id || 'all'} onPress={() => onSelect(option.id)}>
            <View
              style={[
                styles.pill,
                {
                  backgroundColor: active ? colors.primary : colors.surfaceAlt,
                  borderColor: active ? colors.primary : colors.border,
                },
              ]}>
              <Text style={[styles.text, { color: active ? colors.onPrimary : colors.text }]}>
                {option.label}
                {option.count !== undefined ? `  (${option.count})` : ''}
              </Text>
            </View>
          </Squeeze>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 8, paddingRight: 8 },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { fontFamily: fonts.medium, fontSize: 12, textAlign: 'center' },
});
