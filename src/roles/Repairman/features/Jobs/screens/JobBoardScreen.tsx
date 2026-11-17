import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AlertModal from '@/components/AlertModal';
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PaginationFooter,
} from '@/components/states';
import repairmanApi, { BoardJob } from '@/roles/Repairman/api/repairmanApi';
import { useOffersChangedChecker } from '@/roles/Repairman/utils/offerEvents';
import usePagedList from '@/roles/Seller/utils/usePagedList';
import { fetchCitiesApi, Place } from '@/services/locationApi';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import JobBoardCard from '../components/JobBoardCard';
import JobBoardFilters from '../components/JobBoardFilters';
import { PRIORITY_OPTIONS } from '../utils/jobBoard';
import { useTranslation } from 'react-i18next';

const PAGE_SIZE = 10;
const SEARCH_DELAY_MS = 450;

export default function JobBoardContent({ navigation }: { navigation: any }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const focused = useIsFocused();

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [state, setState] = useState<Place | null>(null);
  const [city, setCity] = useState<Place | null>(null);
  const [priority, setPriority] = useState<
    (typeof PRIORITY_OPTIONS)[number] | null
  >(null);
  const [cities, setCities] = useState<Place[]>([]);
  const [citiesLoading, setCitiesLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(
      () => setDebouncedSearch(search.trim()),
      SEARCH_DELAY_MS,
    );
    return () => clearTimeout(timer);
  }, [search]);

  // Cities of the chosen state, from the backend public endpoint
  useEffect(() => {
    if (!state) {
      setCities([]);
      return;
    }
    let alive = true;
    setCitiesLoading(true);
    fetchCitiesApi(state._id)
      .then(list => alive && setCities(list))
      .catch(() => alive && setCities([]))
      .finally(() => alive && setCitiesLoading(false));
    return () => {
      alive = false;
    };
  }, [state]);

  const fetchPage = useCallback(
    async (page: number) => {
      const data = await repairmanApi.getJobs({
        page,
        limit: PAGE_SIZE,
        search: debouncedSearch || undefined,
        priority: priority?.value,
        state: state?._id,
        city: city?._id,
      });
      return {
        items: data.jobs,
        totalPages: data.pagination.totalPages,
        totalItems: data.pagination.totalJobs,
        extra: data.states,
      };
    },
    [debouncedSearch, priority, state, city],
  );

  // A proposal sent from the job screen removes that job from this list when the board is shown again
  const offersChanged = useOffersChangedChecker();
  const list = usePagedList<BoardJob, { _id: string; name: string }[]>(
    fetchPage,
    focused,
    true,
    offersChanged,
  );

  const stateOptions = useMemo(
    () => (list.extra || []).map(s => s.name),
    [list.extra],
  );
  const hasFilters = Boolean(debouncedSearch || priority || state || city);

  const clearFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setPriority(null);
    setState(null);
    setCity(null);
  };

  const header = (
    <View>
      <Text style={[styles.title, { color: colors.text }]}>{t('repairman.jobsBoard')}</Text>
      <Text style={[styles.subtitle, { color: colors.textMuted }]}>
        {t('repairman.browseOpenRepairRequestsAnd')}
      </Text>
      <JobBoardFilters
        search={search}
        onSearch={setSearch}
        stateName={state?.name || null}
        stateOptions={stateOptions}
        onState={name => {
          const found = (list.extra || []).find(s => s.name === name) || null;
          setState(found);
          setCity(null);
        }}
        cityName={city?.name || null}
        cityOptions={cities.map(c => c.name)}
        citiesLoading={citiesLoading}
        onCity={name => setCity(cities.find(c => c.name === name) || null)}
        priorityLabel={priority?.label || null}
        onPriority={label =>
          setPriority(PRIORITY_OPTIONS.find(o => o.label === label) || null)
        }
        onClear={clearFilters}
        hasFilters={hasFilters}
      />
    </View>
  );

  return (
    <View style={styles.flex}>
      <FlatList
        data={list.items}
        keyExtractor={job => job._id}
        renderItem={({ item }) => (
          <JobBoardCard
            job={item}
            onOpen={() =>
              navigation.navigate('JobBoardDetail', { jobId: item._id })
            }
          />
        )}
        ListHeaderComponent={header}
        ListEmptyComponent={
          list.loading ? (
            <LoadingState fullScreen={false} text={t('repairman.loadingJobs')} />
          ) : list.error ? (
            <ErrorState
              error={list.error}
              onRetry={list.retry}
              fullScreen={false}
            />
          ) : (
            <EmptyState
              fullScreen={false}
              title={t('repairman.noJobsFound')}
              message={
                hasFilters
                  ? t('repairman.noJobMatchesTheseFilters')
                  : t('repairman.noOpenJobsInYour')
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
});
