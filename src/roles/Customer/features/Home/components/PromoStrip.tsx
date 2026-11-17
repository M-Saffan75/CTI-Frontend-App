import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import { useTranslation } from 'react-i18next';

// The same five lines as the web header's promo marquee (messages/en.json Home.PromoMarquee)
const ITEMS = [
  'customerMsg.promo.shipping',
  'customerMsg.promo.warranty',
  'customerMsg.promo.quality',
  'customerMsg.promo.support',
  'customerMsg.promo.payments',
];

export default function PromoStrip() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <View style={[styles.bar, { backgroundColor: colors.primary }]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {ITEMS.map(text => (
          <Text key={text} style={styles.text}>
            {t(text)}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { paddingVertical: 8 },
  row: { paddingHorizontal: 16, gap: 28, alignItems: 'center' },
  text: { color: '#FFFFFF', fontFamily: fonts.medium, fontSize: 12 },
});
