import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AlertModal from '@/components/AlertModal';
import Button from '@/components/Button';
import Icon from '@/components/Icon';
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PaginationFooter,
} from '@/components/states';
import { searchBold, slidersHBold } from '@/assets/icons';
import repairmanApi, {
  MyBooking,
  MyJobsPage,
} from '@/roles/Repairman/api/repairmanApi';
import {
  subscribeOffersChanged,
  useOffersChangedChecker,
} from '@/roles/Repairman/utils/offerEvents';
import usePagedList from '@/roles/Seller/utils/usePagedList';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import Select from '../../../components/Select';
import MyJobCard from '../components/MyJobCard';
import {
  bookingUrgency,
  JOB_TABS,
  JobsTabKey,
  matchesBookingSearch,
} from '../utils/bookings';
import { PRIORITY_OPTIONS } from '../utils/jobBoard';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';
import { lower } from '@/i18n/locale';

const PAGE_SIZE = 10;

function Tile({ label, value }: { label: string; value: number }) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.tile,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <Text style={[styles.tileValue, { color: colors.primary }]}>{value}</Text>
      <Text style={[styles.tileLabel, { color: colors.textMuted }]}>
        {label}
      </Text>
    </View>
  );
}

export default function MyJobsContent({ navigation }: { navigation: any }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const focused = useIsFocused();

  const [tab, setTab] = useState<JobsTabKey>('active');
  const [search, setSearch] = useState('');
  const [priority, setPriority] = useState<
    (typeof PRIORITY_OPTIONS)[number] | null
  >(null);

  // Every page comes unfiltered, because the backend counts per status only over what it returns.
  // The status groups, search and priority are applied in the app, like the web does.
  const fetchPage = useCallback(async (page: number) => {
    const data = await repairmanApi.getMyJobs({ page, limit: PAGE_SIZE });
    return {
      items: data.jobs,
      totalPages: data.pagination.total,
      totalItems: data.pagination.totalJobs,
      extra: data.summary,
    };
  }, []);

  const jobsChanged = useOffersChangedChecker();
  const list = usePagedList<MyBooking, MyJobsPage['summary']>(
    fetchPage,
    focused,
    true,
    jobsChanged,
  );

  // A status was updated or an offer was confirmed while this list is open: reload quietly
  const silentReloadRef = useRef(list.silentReload);
  silentReloadRef.current = list.silentReload;
  const focusedRef = useRef(focused);
  focusedRef.current = focused;
  useEffect(
    () =>
      subscribeOffersChanged(() => {
        if (focusedRef.current && jobsChanged()) silentReloadRef.current();
      }),
    [jobsChanged],
  );

  const summary = list.extra;
  const counts = useMemo(() => {
    const active = summary?.activeBookings ?? 0;
    const completed = summary?.completedBookings ?? 0;
    const cancelled = summary?.cancelledBookings ?? 0;
    const disputed = summary?.disputedBookings ?? 0;
    return {
      active,
      completed,
      cancelled,
      disputed,
      closed: Math.max(
        0,
        (summary?.totalJobs ?? 0) - active - completed - cancelled - disputed,
      ),
    } as Record<JobsTabKey, number>;
  }, [summary]);

  const statuses = JOB_TABS.find(item => item.key === tab)?.statuses || [];
  const visible = useMemo(
    () =>
      list.items.filter(booking => {
        if (!statuses.includes(booking.bookingDetails?.status)) return false;
        if (priority && bookingUrgency(booking) !== priority.value)
          return false;
        return matchesBookingSearch(booking, search);
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [list.items, tab, priority, search],
  );

  const hasFilters = Boolean(search.trim() || priority);
  const clearFilters = () => {
    setSearch('');
    setPriority(null);
  };

  const header = (
    <View>
      <Text style={[styles.title, { color: colors.text }]}>{t('repairman.myJobs')}</Text>
      <Text style={[styles.subtitle, { color: colors.textMuted }]}>
        {t('repairman.manageYourRepairBookingsAnd')}
      </Text>

      <View style={styles.tiles}>
        <Tile label={t('customer.totalJobs')} value={summary?.totalJobs ?? 0} />
        <Tile label={t('repairman.jobPostings')} value={summary?.jobPostingBookings ?? 0} />
        <Tile
          label={t('repairman.directMessages')}
          value={summary?.directMessageBookings ?? 0}
        />
        <Tile label={t('repairman.active')} value={summary?.activeBookings ?? 0} />
      </View>

      <View style={styles.filters}>
        <View style={[styles.search, { borderColor: colors.border }]}>
          <Icon source={searchBold} size={18} color={colors.textMuted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={t('repairman.searchByDeviceCustomerService')}
            placeholderTextColor={colors.textMuted}
            style={[styles.searchInput, { color: colors.text }]}
          />
        </View>
        <Select
          icon={slidersHBold}
          placeholder={t('repairman.allPriorities')}
          value={priority?.label || null}
          options={PRIORITY_OPTIONS.map(option => option.label)}
          onChange={label =>
            setPriority(
              PRIORITY_OPTIONS.find(option => option.label === label) || null,
            )
          }
        />
        {hasFilters ? (
          <Button
            title={t('repairman.clearFilters2')}
            variant="soft"
            size="sm"
            onPress={clearFilters}
            style={styles.clear}
          />
        ) : null}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabs}
      >
        {JOB_TABS.map(item => {
          const active = item.key === tab;
          return (
            <TouchableOpacity
              key={item.key}
              onPress={() => setTab(item.key)}
              style={[
                styles.tab,
                {
                  backgroundColor: active ? colors.primary : colors.surfaceAlt,
                  borderColor: active ? colors.primary : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: active ? colors.onPrimary : colors.textMuted },
                ]}
              >
                {item.label}
                {counts[item.key] > 0 ? `  ${counts[item.key]}` : ''}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  const emptyTabText =
    lower(JOB_TABS.find(item => item.key === tab)?.label || '');

  return (
    <View style={styles.flex}>
      <FlatList
        data={visible}
        keyExtractor={booking => booking._id}
        renderItem={({ item }) => (
          <MyJobCard
            booking={item}
            onOpen={() =>
              navigation.navigate('MyJobDetail', { bookingId: item._id })
            }
          />
        )}
        ListHeaderComponent={header}
        ListEmptyComponent={
          list.loading ? (
            <LoadingState fullScreen={false} text={t('repairman.loadingYourJobs')} />
          ) : list.error ? (
            <ErrorState
              error={list.error}
              onRetry={list.retry}
              fullScreen={false}
            />
          ) : (
            <EmptyState
              fullScreen={false}
              title={i18n.t('repairmanMsg.noJobsTab', { tab: emptyTabText })}
              message={
                hasFilters
                  ? t('repairman.tryAdjustingYourFilters')
                  : tab === 'active'
                  ? t('repairman.jobsYouWinOnThe')
                  : t('repairman.nothingHereYet')
              }
              action={
                hasFilters
                  ? { label: t('repairman.clearFilters'), onPress: clearFilters }
                  : undefined
              }
            />
          )
        }
        ListFooterComponent={
          list.items.length > 0 ? (
            <PaginationFooter
              loading={list.loadingMore}
              hasMore={list.hasMore}
              endText={t('repairman.youHaveSeenAllJobs')}
            />
          ) : null
        }
        contentContainerStyle={[
          styles.body,
          { paddingBottom: insets.bottom + 30 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onEndReached={list.onEndReached}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl
            refreshing={list.refreshing}
            onRefresh={list.onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      />

      <AlertModal
        visible={Boolean(list.loadError)}
        type="error"
        title={t('repairman.couldNotLoad')}
        message={list.loadError || ''}
        onClose={list.clearLoadError}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  body: { paddingHorizontal: 20, paddingTop: 16 },
  title: { fontFamily: fonts.bold, fontSize: 24 },
  subtitle: { fontFamily: fonts.regular, fontSize: 13, marginTop: 4 },
  tiles: { flexDirection: 'row', gap: 8, marginTop: 16 },
  tile: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 10,
    alignItems: 'center',
    gap: 2,
  },
  tileValue: { fontFamily: fonts.bold, fontSize: 18 },
  tileLabel: { fontFamily: fonts.regular, fontSize: 10, textAlign: 'center' },
  filters: { marginTop: 16, gap: 10 },
  clear: { alignSelf: 'flex-start', minWidth: 130 },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  searchInput: { flex: 1, fontFamily: fonts.regular, fontSize: 13, padding: 0 },
  tabs: { gap: 8, marginTop: 16 },
  tab: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  tabText: { fontFamily: fonts.medium, fontSize: 12 },
});
