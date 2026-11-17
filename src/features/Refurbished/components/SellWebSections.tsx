import { StyleSheet, Text, View } from 'react-native';

import Icon from '@/components/Icon';
import {
  calendarBold,
  checkCircleBold,
  fileBold,
  packageBold,
  shieldBold,
  starBold,
  tagBold,
} from '@/assets/icons';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';

// "How It Works" and "Why Us" exactly as the web shows them on the sell pages
// (sell-devices/[categorySlug]/page.jsx and sell-old-phone/page.jsx)
const HOW_IT_WORKS = [
  {
    icon: tagBold,
    get title() { return i18n.t('customer.n1CheckPrice'); },
    get body() { return i18n.t('customer.selectYourDeviceAndTell'); },
  },
  {
    icon: calendarBold,
    get title() { return i18n.t('customer.n2SchedulePickup'); },
    get body() { return i18n.t('customer.bookAFreePickupFrom'); },
  },
  {
    icon: checkCircleBold,
    get title() { return i18n.t('customer.n3GetPaid'); },
    get body() { return i18n.t('customer.receiveYourPaymentInstantlyAs'); },
  },
];

const WHY_US = [
  { icon: tagBold, get title() { return i18n.t('customer.bestPrices'); }, get body() { return i18n.t('customer.objectiveAiBasedPricing'); } },
  {
    icon: checkCircleBold,
    get title() { return i18n.t('customer.instantPayment'); },
    get body() { return i18n.t('customer.instantMoneyTransferInYour'); },
  },
  { icon: starBold, get title() { return i18n.t('customer.simpleAndConvenient'); }, get body() { return i18n.t('customer.checkPriceSchedulePickupAnd'); } },
  { icon: packageBold, get title() { return i18n.t('customer.freeDoorstepPickup'); }, body: '' },
  {
    icon: shieldBold,
    get title() { return i18n.t('customer.factoryGradeDataWipe'); },
    get body() { return i18n.t('customer.n100SafeAndDataSecurity'); },
  },
  { icon: fileBold, get title() { return i18n.t('customer.validPurchaseInvoice'); }, get body() { return i18n.t('customer.genuineBillOfSale'); } },
];

export default function SellWebSections() {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <>
      <View style={styles.block}>
        <Text style={[styles.heading, { color: colors.text }]}>{t('customer.howItWorks')}</Text>
        <View style={styles.list}>
          {HOW_IT_WORKS.map(step => (
            <View
              key={step.title}
              style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.iconBox, { backgroundColor: colors.primary + '18' }]}>
                <Icon source={step.icon} size={22} color={colors.primary} />
              </View>
              <View style={styles.info}>
                <Text style={[styles.title, { color: colors.text }]}>{step.title}</Text>
                <Text style={[styles.body, { color: colors.textMuted }]}>{step.body}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.block}>
        <Text style={[styles.heading, { color: colors.text }]}>{t('customer.whyUs')}</Text>
        <View style={styles.list}>
          {WHY_US.map(item => (
            <View
              key={item.title}
              style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.iconBox, { backgroundColor: colors.primary + '18' }]}>
                <Icon source={item.icon} size={22} color={colors.primary} />
              </View>
              <View style={styles.info}>
                <Text style={[styles.title, { color: colors.text }]}>{item.title}</Text>
                {item.body ? <Text style={[styles.body, { color: colors.textMuted }]}>{item.body}</Text> : null}
              </View>
            </View>
          ))}
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  block: { marginTop: 24 },
  heading: { fontFamily: fonts.bold, fontSize: 18, paddingHorizontal: 16, marginBottom: 12 },
  list: { paddingHorizontal: 16, gap: 12 },
  card: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, borderWidth: 1, borderRadius: 16, padding: 14 },
  iconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1 },
  title: { fontFamily: fonts.bold, fontSize: 15, marginBottom: 4 },
  body: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 18 },
});
