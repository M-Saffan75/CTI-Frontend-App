import { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Icon from '@/components/Icon';
import Button from '@/components/Button';
import Squeeze from '@/components/Squeeze';
import { FadeUp } from '@/animations';
import { clockBold, commentDotsBold, mobileBold, penBold, settingsBold, stopwatchBold, shieldIcon } from '@/assets/icons';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import JobsFilterBar from '../components/JobsFilterBar';
import { MY_JOBS, MY_JOB_STATUSES } from '../data/jobs';

function MyJobCard({ job, navigation }) {
  const { colors } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.metaRow}>
        <View style={styles.priorityRow}>
          <Icon source={clockBold} size={12} color={colors.error} />
          <Text style={[styles.priorityText, { color: colors.error }]}>{job.priority}</Text>
        </View>
        <View style={[styles.servicePill, { backgroundColor: colors.primary + '18' }]}>
          <Text style={[styles.servicePillText, { color: colors.primary }]}>{job.serviceType}</Text>
        </View>
      </View>

      <View style={styles.titleRow}>
        <View style={[styles.deviceIcon, { borderColor: colors.border }]}>
          <Icon source={mobileBold} size={16} color={colors.primary} />
        </View>
        <Text style={[styles.deviceName, { color: colors.text }]}>{job.device}</Text>
      </View>

      <View style={styles.metaRow2}>
        <Text style={[styles.priceText, { color: colors.text }]}>TRY {job.price.toFixed(1)}</Text>
        <View style={styles.metaItem}>
          <Icon source={stopwatchBold} size={12} color={colors.textMuted} />
          <Text style={[styles.metaText, { color: colors.textMuted }]}>Est {job.estDays} days</Text>
        </View>
        <View style={styles.metaItem}>
          <Icon source={shieldIcon} size={12} color={colors.textMuted} />
          <Text style={[styles.metaText, { color: colors.textMuted }]}>Warranty: {job.warrantyDays} Days</Text>
        </View>
      </View>

      <Text style={[styles.description, { color: colors.textMuted }]}>{job.description}</Text>

      <View style={[styles.partTag, { borderColor: colors.border }]}>
        <Icon source={settingsBold} size={14} color={colors.text} />
        <Text style={[styles.partTagText, { color: colors.text }]}>{job.part.name}</Text>
      </View>
      <Text style={[styles.partsQuality, { color: colors.textMuted }]}>Parts quality: {job.partsQuality}</Text>

      <Button
        title="View & Update Status"
        icon={penBold}
        iconPosition="left"
        onPress={() => navigation.navigate('MyJobDetail', { jobId: job.id })}
        style={styles.spaced}
      />
      <Button
        title="Message Client"
        variant="outline"
        icon={commentDotsBold}
        iconPosition="left"
        onPress={() => navigation.navigate('ChatList')}
        style={styles.spaced}
      />
    </View>
  );
}

export default function MyJobsContent({ navigation }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [search, setSearch] = useState('');
  const [priority, setPriority] = useState(null);
  const [status, setStatus] = useState('Active');

  const clearFilters = () => {
    setSearch('');
    setPriority(null);
  };

  const filtered = MY_JOBS.filter(
    job =>
      job.status === status &&
      (!priority || job.priority === priority) &&
      (!search || job.device.toLowerCase().includes(search.toLowerCase())),
  );

  return (
      <ScrollView
        contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 30 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <Text style={[styles.title, { color: colors.text }]}>My Jobs</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          Manage your repair jobs and track progress with ease
        </Text>

        <JobsFilterBar
          search={search}
          onSearch={setSearch}
          priority={priority}
          onPriority={setPriority}
          onClear={clearFilters}
          showCity={false}
          searchPlaceholder="Search by device"
        />

        {MY_JOBS[0] && (
          <View style={styles.customerRow}>
            <Image source={{ uri: MY_JOBS[0].customer.avatar }} style={styles.avatar} />
            <Text style={[styles.customerName, { color: colors.text }]}>{MY_JOBS[0].customer.name}</Text>
            <View style={[styles.messagePill, { backgroundColor: colors.error + '18' }]}>
              <Text style={[styles.messagePillText, { color: colors.error }]}>{MY_JOBS[0].messageStatus}</Text>
            </View>
          </View>
        )}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statusTabs}>
          {MY_JOB_STATUSES.map(item => {
            const active = item === status;
            const count = MY_JOBS.filter(job => job.status === item).length;
            return (
              <Squeeze key={item} onPress={() => setStatus(item)}>
                <View style={[styles.statusTab, active && { borderBottomColor: colors.primary }]}>
                  <Text
                    style={[
                      styles.statusTabText,
                      { color: active ? colors.primary : colors.textMuted, fontFamily: active ? fonts.bold : fonts.regular },
                    ]}>
                    {item}
                    {count ? ` ${count}` : ''}
                  </Text>
                </View>
              </Squeeze>
            );
          })}
        </ScrollView>

        {filtered.length === 0 ? (
          <Text style={[styles.empty, { color: colors.textMuted }]}>No {status.toLowerCase()} jobs.</Text>
        ) : (
          <View style={styles.list}>
            {filtered.map((job, index) => (
              <FadeUp key={job.id} delay={60 + index * 50} duration={450}>
                <MyJobCard job={job} navigation={navigation} />
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

  customerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 18 },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  customerName: { fontFamily: fonts.bold, fontSize: 16, flex: 1 },
  messagePill: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  messagePillText: { fontFamily: fonts.medium, fontSize: 11 },

  statusTabs: { marginTop: 14, flexGrow: 0 },
  statusTab: { paddingHorizontal: 12, paddingBottom: 10, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  statusTabText: { fontSize: 13 },

  list: { marginTop: 16, gap: 14 },
  card: { borderRadius: 14, borderWidth: 1, padding: 14 },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  priorityRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  priorityText: { fontFamily: fonts.bold, fontSize: 12 },
  servicePill: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  servicePillText: { fontFamily: fonts.bold, fontSize: 11 },

  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  deviceIcon: { width: 30, height: 30, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  deviceName: { fontFamily: fonts.bold, fontSize: 16 },

  metaRow2: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginTop: 8 },
  priceText: { fontFamily: fonts.bold, fontSize: 14 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontFamily: fonts.regular, fontSize: 12 },

  description: { fontFamily: fonts.regular, fontSize: 12, marginTop: 8 },

  partTag: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, marginTop: 10 },
  partTagText: { fontFamily: fonts.regular, fontSize: 12 },
  partsQuality: { fontFamily: fonts.regular, fontSize: 12, marginTop: 8 },

  spaced: { marginTop: 10 },
});
