import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Icon from '@/components/Icon';
import { FadeUp } from '@/animations';
import { calendarBold, checkCircleIcon, clockBold, mobileBold } from '@/assets/icons';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import JobsFilterBar from '../components/JobsFilterBar';
import { MY_OFFERS } from '../data/jobs';

function OfferCard({ offer }) {
  const { colors } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.metaRow}>
        <View style={[styles.priorityPill, { backgroundColor: colors.error + '18' }]}>
          <Icon source={clockBold} size={12} color={colors.error} />
          <Text style={[styles.priorityText, { color: colors.error }]}>{offer.priority}</Text>
        </View>
        <Text style={[styles.expiresText, { color: colors.primary }]}>{offer.expiresIn}</Text>
      </View>

      <View style={styles.titleRow}>
        <View style={[styles.deviceIcon, { borderColor: colors.border }]}>
          <Icon source={mobileBold} size={16} color={colors.primary} />
        </View>
        <Text style={[styles.deviceName, { color: colors.text }]}>{offer.device}</Text>
      </View>

      <Text style={[styles.priceText, { color: colors.textMuted }]}>
        TRY {offer.priceMin}-{offer.priceMax}{' '}
        <Text style={{ color: colors.primary }}>Posted {offer.postedDaysAgo} days ago</Text>
      </Text>

      <Text style={[styles.description, { color: colors.textMuted }]} numberOfLines={4}>
        {offer.description}
      </Text>

      <View style={[styles.tag, { borderColor: colors.border }]}>
        <Text style={[styles.tagText, { color: colors.text }]}>{offer.tag}</Text>
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <View style={styles.footer}>
        <View style={styles.submittedRow}>
          <Icon source={calendarBold} size={13} color={colors.textMuted} />
          <Text style={[styles.submittedText, { color: colors.textMuted }]}>Submitted: {offer.submittedDate}</Text>
        </View>
        {offer.viewed && (
          <View style={styles.viewedRow}>
            <Icon source={checkCircleIcon} size={13} color={colors.success} />
            <Text style={[styles.viewedText, { color: colors.success }]}>Viewed</Text>
          </View>
        )}
      </View>
    </View>
  );
}

export default function MyOffersContent() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [search, setSearch] = useState('');
  const [city, setCity] = useState(null);
  const [priority, setPriority] = useState(null);

  const clearFilters = () => {
    setSearch('');
    setCity(null);
    setPriority(null);
  };

  const filtered = MY_OFFERS.filter(
    offer =>
      (!priority || offer.priority === priority) &&
      (!search || offer.device.toLowerCase().includes(search.toLowerCase())),
  );

  return (
      <ScrollView
        contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 30 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <Text style={[styles.title, { color: colors.text }]}>My Offers</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          Track the proposals you've sent to customers
        </Text>

        <JobsFilterBar
          search={search}
          onSearch={setSearch}
          city={city}
          onCity={setCity}
          priority={priority}
          onPriority={setPriority}
          onClear={clearFilters}
        />

        {filtered.length === 0 ? (
          <Text style={[styles.empty, { color: colors.textMuted }]}>No offers found.</Text>
        ) : (
          <View style={styles.list}>
            {filtered.map((offer, index) => (
              <FadeUp key={offer.id} delay={60 + index * 50} duration={450}>
                <OfferCard offer={offer} />
              </FadeUp>
            ))}
          </View>
        )}
      </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  body: { paddingHorizontal: 20, paddingTop: 16 },
  title: { fontFamily: fonts.bold, fontSize: 24 },
  subtitle: { fontFamily: fonts.regular, fontSize: 13, marginTop: 4 },
  empty: { fontFamily: fonts.regular, fontSize: 14, textAlign: 'center', marginTop: 30 },

  list: { marginTop: 16, gap: 14 },
  card: { borderRadius: 14, borderWidth: 1, padding: 14 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  priorityPill: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  priorityText: { fontFamily: fonts.bold, fontSize: 11 },
  expiresText: { fontFamily: fonts.medium, fontSize: 11 },

  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  deviceIcon: { width: 30, height: 30, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  deviceName: { fontFamily: fonts.bold, fontSize: 15 },

  priceText: { fontFamily: fonts.regular, fontSize: 12, marginTop: 8 },
  description: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 18, marginTop: 8 },

  tag: { alignSelf: 'flex-start', borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, marginTop: 12 },
  tagText: { fontFamily: fonts.regular, fontSize: 12 },

  divider: { height: 1, marginTop: 14, marginBottom: 10 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  submittedRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  submittedText: { fontFamily: fonts.regular, fontSize: 12 },
  viewedRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  viewedText: { fontFamily: fonts.bold, fontSize: 12 },
});
