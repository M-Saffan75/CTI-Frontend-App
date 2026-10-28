import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Icon from '@/components/Icon';
import Squeeze from '@/components/Squeeze';
import CtiLoader from '@/components/CtiLoader';
import { FadeUp } from '@/animations';
import { arrowLeftBold, menuBold, packageBold, shoppingCartExtra, trashBold } from '@/assets/icons';
import { ctiLogo } from '@/assets/images';
import { useTheme } from '@/theme/ThemeContext';
import { palette } from '@/theme/colors';
import { fonts } from '@/theme/fonts';
import customerJobApi, { MobileJobDetail } from '../services/customerJobApi';
import { useCart } from '@/roles/Customer/context/CartContext';

const TABS = ['Details', 'Repairman Info', 'Booking Details', 'Disputes'];

export default function DisputeDetailScreen({ navigation, route }: any) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { cartCount } = useCart();
  const [tab, setTab] = useState('Details');

  const passedJob = route?.params?.job;
  const jobId = route?.params?.jobId || passedJob?.id;

  const [job, setJob] = useState<MobileJobDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!jobId) {
      setLoading(false);
      return;
    }
    let isMounted = true;
    setLoading(true);

    customerJobApi.getMyJobDetail(jobId)
      .then(data => {
        if (isMounted) setJob(data);
      })
      .catch(() => {
        if (isMounted) setJob(null);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [jobId]);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Image source={ctiLogo} resizeMode="contain" style={styles.logo} />
        <View style={styles.headerIcons}>
          <Squeeze onPress={() => navigation.navigate('Cart')} scale={0.85}>
            <View>
              <Icon source={shoppingCartExtra} size={24} color={colors.text} />
              {cartCount > 0 && (
                <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.badgeText}>{cartCount}</Text>
                </View>
              )}
            </View>
          </Squeeze>
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

        {loading ? (
          <View style={{ paddingVertical: 80, alignItems: 'center' }}>
            <CtiLoader size="lg" text="Loading dispute details..." />
          </View>
        ) : !job ? (
          <View style={{ paddingVertical: 80, alignItems: 'center', paddingHorizontal: 24 }}>
            <Icon source={packageBold} size={48} color={colors.textMuted} />
            <Text style={[styles.title, { color: colors.text, textAlign: 'center', marginTop: 12 }]}>
              Dispute Details Not Found
            </Text>
            <Text style={{ fontFamily: fonts.regular, fontSize: 14, color: colors.textMuted, marginTop: 8, textAlign: 'center' }}>
              The requested dispute details could not be found or loaded.
            </Text>
            <Squeeze onPress={() => navigation.goBack()} style={{ marginTop: 24, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: colors.primary, borderRadius: 12 }}>
              <Text style={{ color: '#fff', fontFamily: fonts.bold }}>Go Back</Text>
            </Squeeze>
          </View>
        ) : (
          <>
            <View style={styles.titleRow}>
              <Text style={[styles.title, { color: colors.text }]}>{job.title}</Text>
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
                <Text style={[styles.price, { color: colors.text }]}>{job.priceLabel}</Text>
                <View style={styles.statusRow}>
                  <View style={[styles.statusDot, { backgroundColor: colors.warning || '#f59e0b' }]} />
                  <Text style={[styles.statusText, { color: colors.warning || '#f59e0b' }]}>
                    Dispute / Under Review
                  </Text>
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

                <Text style={[styles.sectionTitle, { color: colors.text }]}>Pricing Breakdown</Text>
                <Row label="Estimated Price" value={job.priceLabel} bold />
                <View style={[styles.divider, { backgroundColor: colors.border }]} />

                <Text style={[styles.sectionTitle, { color: colors.text }]}>Location & Preference</Text>
                <Row label="Location" value={job.locationLabel} />
                <Row label="Service Type" value={job.servicePreference} />

                <View style={[styles.infoBox, { backgroundColor: palette.mintBg }]}>
                  <Text style={[styles.infoTitle, { color: colors.text }]}>Dispute Status</Text>
                  <Text style={[styles.infoText, { color: colors.textMuted }]}>
                    Support team is reviewing the chat history and booking records to resolve this matter.
                  </Text>
                </View>

                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <Text style={[styles.footerText, { color: colors.textMuted }]}>
                  Created: {job.createdAt}
                </Text>
              </FadeUp>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function Row({ label, value, bold = false }: { label: string; value: string; bold?: boolean }) {
  const { colors } = useTheme();

  return (
    <View style={styles.row}>
      <Text
        style={[
          styles.rowLabel,
          { color: colors.textMuted, fontFamily: bold ? fonts.bold : fonts.regular },
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

function ComingSoon({ label }: { label: string }) {
  const { colors } = useTheme();

  return (
    <FadeUp duration={400}>
      <View style={[styles.comingSoon, { backgroundColor: colors.surfaceAlt }]}>
        <Text style={[styles.comingSoonText, { color: colors.textMuted }]}>
          {label} details will show up here once available.
        </Text>
      </View>
    </FadeUp>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: { width: 110, height: 59 },
  headerIcons: { flexDirection: 'row', gap: 12 },
  badge: {
    position: 'absolute',
    top: -4,
    right: -6,
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  badgeText: { color: '#fff', fontSize: 10, fontFamily: fonts.bold },

  body: { paddingHorizontal: 20, paddingTop: 6 },
  backWrap: { alignSelf: 'flex-start' },
  back: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    gap: 12,
  },
  title: { flex: 1, fontFamily: fonts.bold, fontSize: 18 },

  tabsWrap: { borderBottomWidth: 1, marginTop: 14, marginBottom: 16 },
  tabsScroll: { flexDirection: 'row' },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: { fontSize: 13 },

  price: { fontFamily: fonts.bold, fontSize: 16 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontFamily: fonts.bold, fontSize: 12 },

  sectionTitle: { fontFamily: fonts.bold, fontSize: 14, marginTop: 18 },
  text: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19, marginTop: 6 },

  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  pill: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  pillText: { fontFamily: fonts.regular, fontSize: 12 },

  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  rowLabel: { fontSize: 13 },
  rowValue: { fontSize: 13 },

  divider: { height: 1, marginVertical: 14 },

  infoBox: { borderRadius: 12, padding: 14, gap: 4, marginTop: 12 },
  infoTitle: { fontFamily: fonts.bold, fontSize: 13 },
  infoText: { fontFamily: fonts.regular, fontSize: 12 },

  footerText: { fontFamily: fonts.regular, fontSize: 12 },

  comingSoon: { borderRadius: 12, padding: 24, alignItems: 'center', marginTop: 16 },
  comingSoonText: { fontFamily: fonts.regular, fontSize: 13, textAlign: 'center' },
});
