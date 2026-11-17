import { StyleSheet, Text, View } from 'react-native';

import Icon from '@/components/Icon';
import { shieldBold } from '@/assets/icons';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import { useTranslation } from 'react-i18next';

// The card the web shows beside the condition, quote and upload-media steps of the sell flow
export default function CtiVerifiedSellCard() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.primary }]}>
      <View style={styles.head}>
        <Icon source={shieldBold} size={20} color={colors.onPrimary} />
        <Text style={[styles.title, { color: colors.onPrimary }]}>{t('customer.ctiVerifiedSell')}</Text>
      </View>
      <Text style={[styles.body, { color: colors.onPrimary }]}>
        {t('customer.getPaidInstantlyAtYour')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 16, marginTop: 16, borderRadius: 16, padding: 16, gap: 8 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { flexShrink: 1, fontFamily: fonts.bold, fontSize: 13, letterSpacing: 0.6 },
  body: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 18 },
});
