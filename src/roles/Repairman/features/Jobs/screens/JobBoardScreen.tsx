import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Icon from '@/components/Icon';
import Button from '@/components/Button';
import { FadeUp } from '@/animations';
import { clockBold, mapPinBold, mobileBold } from '@/assets/icons';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import JobsFilterBar from '../components/JobsFilterBar';
import { JOB_BOARD } from '../data/jobs';

function JobBoardCard({ job, navigation }) {
  const { colors } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.metaRow}>
        <View style={[styles.priorityPill, { backgroundColor: colors.error + '18' }]}>
          <Icon source={clockBold} size={12} color={colors.error} />
          <Text style={[styles.priorityText, { color: colors.error }]}>{job.priority}</Text>
        </View>
        <Text style={[styles.expiresText, { color: colors.primary }]}>{job.expiresIn}</Text>
      </View>

      <View style={styles.titleRow}>
        <View style={[styles.deviceIcon, { borderColor: colors.border }]}>
          <Icon source={mobileBold} size={16} color={colors.primary} />
        </View>
        <Text style={[styles.deviceName, { color: colors.text }]}>{job.device}</Text>
      </View>

      <Text style={[styles.priceText, { color: colors.textMuted }]}>
        TRY {job.priceMin}-{job.priceMax}{' '}
        <Text style={{ color: colors.primary }}>Posted {job.postedDaysAgo} days ago</Text>
      </Text>

      <Text style={[styles.description, { color: colors.textMuted }]} numberOfLines={4}>
        {job.description}
      </Text>

      <View style={[styles.tag, { borderColor: colors.border }]}>
        <Text style={[styles.tagText, { color: colors.text }]}>{job.tag}</Text>
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <Text style={[styles.locationLabel, { color: colors.text }]}>Location</Text>
      <View style={styles.locationRow}>
        <Icon source={mapPinBold} size={14} color={colors.textMuted} />
        <Text style={[styles.locationText, { color: colors.textMuted }]} numberOfLines={1}>
          {job.location}
        </Text>
        <Button
          title="View Detail"
          size="sm"
          fullWidth={false}
          onPress={() => navigation.navigate('JobBoardDetail', { jobId: job.id })}
        />
      </View>
    </View>
  );
}

export default function JobBoardContent({ navigation }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [search, setSearch] = useState('');
  const [city, setCity] = useState(null);
  const [priority, setPriority] = useState(null);
  const [page, setPage] = useState(1);
  const totalPages = 1;

  const clearFilters = () => {
    setSearch('');
    setCity(null);
    setPriority(null);
  };

  const filtered = JOB_BOARD.filter(
    job =>
      (!priority || job.priority === priority) &&
      (!search || job.device.toLowerCase().includes(search.toLowerCase())),
  );

  return (
      <ScrollView
        contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 30 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <Text style={[styles.title, { color: colors.text }]}>Jobs Board</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          Browse open repair requests and send your offer
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

        <View style={styles.list}>
          {filtered.map((job, index) => (
            <FadeUp key={job.id} delay={60 + index * 50} duration={450} style={styles.cardWrap}>
              <JobBoardCard job={job} navigation={navigation} />
            </FadeUp>
          ))}
        </View>

        <View style={styles.pagination}>
          <Button title="Prev" variant="soft" size="sm" disabled={page === 1} onPress={() => setPage(p => p - 1)} fullWidth={false} />
          <View style={[styles.pageNumber, { backgroundColor: colors.primary }]}>
            <Text style={styles.pageNumberText}>{page}</Text>
          </View>
          <Button title="Next" variant="soft" size="sm" disabled={page === totalPages} onPress={() => setPage(p => p + 1)} fullWidth={false} />
        </View>
      </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 20, paddingTop: 16 },
  title: { fontFamily: fonts.bold, fontSize: 24 },
  subtitle: { fontFamily: fonts.regular, fontSize: 13, marginTop: 4 },

  list: { marginTop: 16, gap: 14 },
  cardWrap: {},
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
  locationLabel: { fontFamily: fonts.bold, fontSize: 13, marginBottom: 6 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  locationText: { flex: 1, fontFamily: fonts.regular, fontSize: 12 },

  pagination: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 20 },
  pageNumber: { width: 34, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  pageNumberText: { fontFamily: fonts.bold, fontSize: 13, color: '#FFFFFF' },
});
