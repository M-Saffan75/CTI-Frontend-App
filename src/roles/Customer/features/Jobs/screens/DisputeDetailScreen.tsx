import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Icon from '@/components/Icon';
import Squeeze from '@/components/Squeeze';
import { FadeUp } from '@/animations';
import { arrowLeftBold, menuBold, shoppingCartExtra, trashBold } from '@/assets/icons';
import { ctiLogo } from '@/assets/images';
import { useTheme } from '@/theme/ThemeContext';
import { palette } from '@/theme/colors';
import { fonts } from '@/theme/fonts';
import { DISPUTE_DETAIL } from '../data/jobDetail';

const TABS = ['Details', 'Repairman INfo', 'Booking Digitals', 'Disputes'];

export default function DisputeDetailScreen({ navigation }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState('Details');

  // route.params.jobId will pick the real record once the API exists —
  // for now every disputed job opens this same demo record.
  const job = DISPUTE_DETAIL;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Image source={ctiLogo} resizeMode="contain" style={styles.logo} />
        <View style={styles.headerIcons}>
          <Icon source={shoppingCartExtra} size={24} color={colors.text} />
          <Squeeze onPress={() => navigation.navigate('Settings')} scale={0.85}>
            <Icon source={menuBold} size={24} color={colors.text} />
          </Squeeze>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 30 }]}
        showsVerticalScrollIndicator={false}>
        <Squeeze onPress={() => navigation.goBack()} scale={0.9} style={styles.backWrap}>
          <View style={[styles.back, { backgroundColor: colors.primary }]}>
            <Icon source={arrowLeftBold} size={20} color={colors.onPrimary} />
          </View>
        </Squeeze>

        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: colors.text }]}>{job.title}</Text>
          <Icon source={trashBold} size={22} color={colors.error} />
        </View>

        <View style={[styles.tabsWrap, { borderColor: colors.border }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
            {TABS.map(name => {
              const active = name === tab;
              return (
                <Pressable
                  key={name}
                  onPress={() => setTab(name)}
                  style={[styles.tab, active && { borderBottomColor: colors.primary }]}>
                  <Text
                    style={[
                      styles.tabText,
                      {
                        color: active ? colors.primary : colors.textMuted,
                        fontFamily: active ? fonts.bold : fonts.regular,
                      },
                    ]}>
                    {name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {tab !== 'Details' ? (
          <ComingSoon label={tab} />
        ) : (
          <FadeUp duration={500}>
            <Text style={[styles.price, { color: colors.text }]}>{job.price}</Text>
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: colors.success }]} />
              <Text style={[styles.statusText, { color: colors.success }]}>{job.status}</Text>
            </View>

            <Text style={[styles.sectionTitle, { color: colors.text }]}>Services Description</Text>
            <Text style={[styles.text, { color: colors.textMuted }]}>{job.description}</Text>

            <Text style={[styles.sectionTitle, { color: colors.text }]}>Services</Text>
            <View style={styles.pills}>
              {job.services.map(service => (
                <View key={service} style={[styles.pill, { borderColor: colors.primary }]}>
                  <Text style={[styles.pillText, { color: colors.primary }]}>{service}</Text>
                </View>
              ))}
            </View>

            <Text style={[styles.sectionTitle, { color: colors.text }]}>Pricing Backdown</Text>
            {job.pricing.map(row => (
              <Row key={row.label} label={row.label} value={row.value} />
            ))}
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <Row label="Total  Amount" value={job.totalAmount} bold />

            <Text style={[styles.sectionTitle, { color: colors.text }]}>Serices Details</Text>
            {job.serviceDetails.map(row => (
              <Row key={row.label} label={row.label} value={row.value} />
            ))}

            <View style={[styles.infoBox, { backgroundColor: palette.mintBg }]}>
              <Text style={[styles.infoTitle, { color: colors.text }]}>Warranty Information</Text>
              <Text style={[styles.infoText, { color: colors.textMuted }]}>
                Duration: {job.warranty.duration}
              </Text>
              <Text style={[styles.infoText, { color: colors.textMuted }]}>
                details: {job.warranty.details}
              </Text>
            </View>

            <View style={[styles.infoBox, { backgroundColor: palette.butterBg }]}>
              <Text style={[styles.infoTitle, { color: colors.text }]}>Repairman Notes</Text>
              <Text style={[styles.infoText, { color: colors.textMuted }]}>
                {job.repairmanNotes}
              </Text>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <Text style={[styles.footerText, { color: colors.textMuted }]}>
              Quotation Sent: {job.quotationSent}
            </Text>
            <Text style={[styles.footerText, { color: colors.textMuted }]}>
              Accepted: {job.accepted}
            </Text>
          </FadeUp>
        )}
      </ScrollView>
    </View>
  );
}

function Row({ label, value, bold = false }) {
  const { colors } = useTheme();

  return (
    <View style={styles.row}>
      <Text
        style={[
          styles.rowLabel,
          { color: bold ? colors.text : colors.textMuted, fontFamily: bold ? fonts.bold : fonts.regular },
        ]}>
        {label}
      </Text>
      <Text
        style={[
          styles.rowValue,
          { color: colors.text, fontFamily: bold ? fonts.bold : fonts.regular },
        ]}>
        {value}
      </Text>
    </View>
  );
}

// Shown for tabs that don't have a design yet.
function ComingSoon({ label }) {
  const { colors } = useTheme();

  return (
    <FadeUp duration={400}>
      <View style={[styles.comingSoon, { backgroundColor: colors.surfaceAlt }]}>
        <Text style={[styles.comingSoonText, { color: colors.textMuted }]}>
          {label} will show up here once this tab is designed.
        </Text>
      </View>
    </FadeUp>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  logo: { width: 110, height: 59 },
  headerIcons: { flexDirection: 'row', alignItems: 'center', gap: 18 },

  body: { paddingHorizontal: 20 },
  backWrap: { alignSelf: 'flex-start' },
  back: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },

  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginTop: 16 },
  title: { flex: 1, fontFamily: fonts.bold, fontSize: 22, lineHeight: 29 },

  tabsWrap: { borderBottomWidth: 1, marginTop: 18 },
  tabsScroll: { flexGrow: 0 },
  tab: { paddingHorizontal: 14, paddingBottom: 10, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabText: { fontSize: 14 },

  price: { fontFamily: fonts.bold, fontSize: 22, marginTop: 18 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontFamily: fonts.bold, fontSize: 13 },

  sectionTitle: { fontFamily: fonts.bold, fontSize: 15, marginTop: 22 },
  text: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 20, marginTop: 10 },

  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  pill: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 7 },
  pillText: { fontFamily: fonts.regular, fontSize: 13 },

  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  rowLabel: { fontSize: 13 },
  rowValue: { fontSize: 13 },

  divider: { height: 1, marginTop: 14, marginBottom: 2 },

  infoBox: { borderRadius: 12, padding: 16, marginTop: 18, gap: 4 },
  infoTitle: { fontFamily: fonts.bold, fontSize: 15 },
  infoText: { fontFamily: fonts.regular, fontSize: 13 },

  footerText: { fontFamily: fonts.regular, fontSize: 12, marginTop: 4 },

  comingSoon: { borderRadius: 12, padding: 24, marginTop: 18, alignItems: 'center' },
  comingSoonText: { fontFamily: fonts.regular, fontSize: 13, textAlign: 'center' },
});
