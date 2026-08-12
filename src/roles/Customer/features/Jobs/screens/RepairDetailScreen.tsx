import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Icon from '@/components/Icon';
import Squeeze from '@/components/Squeeze';
import { FadeUp } from '@/animations';
import { arrowLeftBold, menuBold, shoppingCartExtra } from '@/assets/icons';
import { ctiLogo } from '@/assets/images';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import { JOB_DETAIL } from '../data/jobDetail';

const TABS = ['Details', 'Offer'];
const DESCRIPTION_PREVIEW = 150;

export default function RepairDetailScreen({ navigation }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState('Details');
  const [expanded, setExpanded] = useState(false);

  // route.params.jobId will pick the real record once the API exists —
  // for now every job opens this same demo record.
  const job = JOB_DETAIL;

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

        <Text style={[styles.title, { color: colors.text }]}>{job.title}</Text>

        <View style={styles.chips}>
          {job.chips.map(chip => (
            <View key={chip} style={[styles.chip, { borderColor: colors.primary }]}>
              <Text style={[styles.chipText, { color: colors.primary }]}>{chip}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.tabsWrap, { borderColor: colors.border }]}>
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
        </View>

        {tab === 'Offer' ? (
          <ComingSoon label="Offer" />
        ) : (
          <FadeUp duration={500}>
            <Text style={[styles.price, { color: colors.text }]}>{job.priceLabel}</Text>
            <Text style={[styles.muted, { color: colors.textMuted }]}>{job.urgencyNote}</Text>

            <Text style={[styles.sectionTitle, { color: colors.text }]}>Description</Text>
            <Text
              style={[styles.text, { color: colors.textMuted }]}
              numberOfLines={expanded ? undefined : 3}>
              {job.description}
            </Text>
            {job.description.length > DESCRIPTION_PREVIEW && (
              <Pressable onPress={() => setExpanded(!expanded)} hitSlop={6}>
                <Text style={[styles.link, { color: colors.primary }]}>
                  {expanded ? 'Read Less' : 'Read More'}
                </Text>
              </Pressable>
            )}

            <Text style={[styles.sectionTitle, { color: colors.text }]}>Service Required</Text>
            <View style={styles.pills}>
              {job.services.map(service => (
                <View key={service} style={[styles.pill, { borderColor: colors.primary }]}>
                  <Text style={[styles.pillText, { color: colors.primary }]}>{service}</Text>
                </View>
              ))}
            </View>

            <Text style={[styles.sectionTitle, { color: colors.text }]}>Location</Text>
            <Text style={[styles.text, { color: colors.textMuted }]}>{job.locationNote}</Text>
            <Text style={[styles.link, { color: colors.primary }]}>{job.locationLabel}</Text>

            <Text style={[styles.sectionTitle, { color: colors.text }]}>Service Preferene</Text>
            <View style={[styles.pill, styles.singlePill, { borderColor: colors.primary }]}>
              <Text style={[styles.pillText, { color: colors.primary }]}>
                {job.servicePreference}
              </Text>
            </View>

            <Text style={[styles.sectionTitle, { color: colors.text }]}>Services Radiuas</Text>
            <View style={[styles.statsBox, { backgroundColor: colors.surfaceAlt }]}>
              {job.stats.map(stat => (
                <View key={stat.label} style={styles.statItem}>
                  <Text style={[styles.statLabel, { color: colors.textMuted }]}>{stat.label}</Text>
                  <Text style={[styles.statValue, { color: colors.text }]}>{stat.value}</Text>
                </View>
              ))}
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <Text style={[styles.footerText, { color: colors.textMuted }]}>
              Created: {job.createdAt}
            </Text>
          </FadeUp>
        )}
      </ScrollView>
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
          {label} details will show up here once this tab is designed.
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

  title: { fontFamily: fonts.bold, fontSize: 22, lineHeight: 29, marginTop: 16 },

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  chip: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 6 },
  chipText: { fontFamily: fonts.regular, fontSize: 12 },

  tabsWrap: { flexDirection: 'row', gap: 20, borderBottomWidth: 1, marginTop: 18 },
  tab: { paddingBottom: 10, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabText: { fontSize: 14 },

  price: { fontFamily: fonts.bold, fontSize: 22, marginTop: 18 },
  muted: { fontFamily: fonts.regular, fontSize: 13, marginTop: 4 },

  sectionTitle: { fontFamily: fonts.bold, fontSize: 15, marginTop: 22 },
  text: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 20, marginTop: 10 },
  link: { fontFamily: fonts.bold, fontSize: 13, marginTop: 6 },

  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  pill: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 7 },
  pillText: { fontFamily: fonts.regular, fontSize: 13 },
  singlePill: { alignSelf: 'flex-start', marginTop: 10 },

  statsBox: { flexDirection: 'row', borderRadius: 12, padding: 14, marginTop: 10 },
  statItem: { flex: 1, gap: 4 },
  statLabel: { fontFamily: fonts.regular, fontSize: 11 },
  statValue: { fontFamily: fonts.bold, fontSize: 15 },

  divider: { height: 1, marginTop: 24, marginBottom: 12 },
  footerText: { fontFamily: fonts.regular, fontSize: 12 },

  comingSoon: { borderRadius: 12, padding: 24, marginTop: 18, alignItems: 'center' },
  comingSoonText: { fontFamily: fonts.regular, fontSize: 13, textAlign: 'center' },
});
