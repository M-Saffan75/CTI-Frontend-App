import { StyleSheet, Text, View } from 'react-native';

import Icon from '@/components/Icon';
import { returnOfInvestmentIcon, shieldBold } from '@/assets/icons';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import i18n from '@/i18n';
import { useTranslation } from 'react-i18next';

// Same two cards the web shows under every product (PlatformGuarantees.jsx), same text
const CARDS = [
  {
    key: 'guarantee',
    icon: shieldBold,
    get title() { return i18n.t('customer.platformGuaranteeAndBuyerProtection'); },
    get body() { return i18n.t('customer.weStandBehindEveryTransaction'); },
  },
  {
    key: 'returns',
    icon: returnOfInvestmentIcon,
    get title() { return i18n.t('customer.easyReturnsAndRefundPolicy'); },
    get body() { return i18n.t('customer.notSatisfiedWithYourPurchase'); },
  },
];

export default function PlatformGuarantees({ padded = true }: { padded?: boolean }) {
  useTranslation();
  const { colors } = useTheme();
  return (
    <View style={[styles.wrap, !padded && styles.flush]}>
      {CARDS.map(card => (
        <View
          key={card.key}
          style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.iconWrap, { backgroundColor: colors.primary + '18' }]}>
            <Icon source={card.icon} size={22} color={colors.primary} />
          </View>
          <View style={styles.textCol}>
            <Text style={[styles.title, { color: colors.text }]}>{card.title}</Text>
            <Text style={[styles.body, { color: colors.textMuted }]}>{card.body}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 16, gap: 12, marginTop: 16 },
  flush: { paddingHorizontal: 0 },
  card: { flexDirection: 'row', gap: 12, borderWidth: 1, borderRadius: 16, padding: 14 },
  iconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  textCol: { flex: 1 },
  title: { fontFamily: fonts.bold, fontSize: 14, marginBottom: 6 },
  body: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 18 },
});
