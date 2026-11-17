import { monthShortName } from '@/utils/dateFormat';
import { statusLabel } from '@/utils/labels';
import { Fragment, useEffect, useMemo, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AlertModal from '@/components/AlertModal';
import Button from '@/components/Button';
import { FadeUp } from '@/animations';
import repairmanApi, {
  EarningsFilter,
} from '@/roles/Repairman/api/repairmanApi';
import useApiData from '@/roles/Repairman/utils/useApiData';
import { useOffersChangedChecker } from '@/roles/Repairman/utils/offerEvents';
import useRefreshOnActive from '@/utils/useRefreshOnActive';
import { formatMoney } from '@/utils/money';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import BookingCard from '../components/BookingCard';
import EarningsLineChart from '../components/EarningsLineChart';
import FilterChips from '../components/FilterChips';
import JobDonutChart from '../components/JobDonutChart';
import JobsCalendar from '../components/JobsCalendar';
import OffersChart, { OffersPoint } from '../components/OffersChart';
import SectionCard from '../components/SectionCard';
import { distributionColor } from '../utils/bookingStatus';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';

const EARNINGS_FILTERS: { label: string; value: EarningsFilter }[] = [
  { get label() { return i18n.t('repairman.thisWeek'); }, value: 'this_week' },
  { get label() { return i18n.t('repairman.lastWeek'); }, value: 'last_week' },
  { get label() { return i18n.t('repairman.thisMonth'); }, value: 'this_month' },
  { get label() { return i18n.t('repairman.lastMonth'); }, value: 'last_month' },
];

const DISTRIBUTION_FILTERS = [
  { get label() { return i18n.t('repairman.today'); }, value: 'today' },
  ...EARNINGS_FILTERS,
];

type OffersView = 'monthly' | 'quarterly' | 'last_year';
const OFFERS_FILTERS: { label: string; value: OffersView }[] = [
  { get label() { return i18n.t('repairman.monthly'); }, value: 'monthly' },
  { get label() { return i18n.t('repairman.quarterly'); }, value: 'quarterly' },
  { get label() { return i18n.t('repairman.lastYear'); }, value: 'last_year' },
];

const QUARTERS = [
  { label: 'Q1', months: ['Jan', 'Feb', 'Mar'] },
  { label: 'Q2', months: ['Apr', 'May', 'Jun'] },
  { label: 'Q3', months: ['Jul', 'Aug', 'Sep'] },
  { label: 'Q4', months: ['Oct', 'Nov', 'Dec'] },
];

const STALE_REFRESH_MS = 60000;

function StatCard({ label, value }: { label: string; value: string | number }) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.statCard,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <Text style={[styles.statLabel, { color: colors.textMuted }]}>
        {label}
      </Text>
      <Text
        style={[styles.statValue, { color: colors.primary }]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>
    </View>
  );
}

function Fact({ label, value }: { label: string; value: string | number }) {
  const { colors } = useTheme();

  return (
    <View style={styles.fact}>
      <Text
        style={[styles.factValue, { color: colors.text }]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>
      <Text style={[styles.factLabel, { color: colors.textMuted }]}>
        {label}
      </Text>
    </View>
  );
}

// The Dashboard content, shown inside DashboardTabScreen below the shared header.
// Same sections as the web dashboard: summary, earnings, job distribution, latest bookings, calendar, offers.
export default function DashboardContent({ navigation }: { navigation?: any }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const focused = useIsFocused();
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState('');

  const now = new Date();
  const [earningsFilter, setEarningsFilter] =
    useState<EarningsFilter>('this_week');
  const [distributionFilter, setDistributionFilter] = useState('last_month');
  const [offersView, setOffersView] = useState<OffersView>('monthly');
  const [calendar, setCalendar] = useState({
    month: now.getMonth(),
    year: now.getFullYear(),
  });

  const offersYear =
    offersView === 'last_year' ? now.getFullYear() - 1 : now.getFullYear();

  const home = useApiData(() => repairmanApi.getHome(), []);
  const earnings = useApiData(
    () => repairmanApi.getEarningsAnalytics(earningsFilter),
    [earningsFilter],
  );
  const distribution = useApiData(
    () => repairmanApi.getJobDistribution(distributionFilter),
    [distributionFilter],
  );
  const offers = useApiData(
    () => repairmanApi.getOffersAnalytics(offersYear),
    [offersYear],
  );
  const jobsCalendar = useApiData(
    () => repairmanApi.getCalendarJobs(calendar.month, calendar.year),
    [calendar.month, calendar.year],
  );

  const reloadAll = () =>
    Promise.all([
      home.reload(true),
      earnings.reload(true),
      distribution.reload(true),
      offers.reload(true),
      jobsCalendar.reload(true),
    ]);

  // Coming back to the tab (or back from the background) reloads quietly when the numbers are old
  const offersChanged = useOffersChangedChecker();
  const markLoaded = useRefreshOnActive(
    focused,
    () => {
      reloadAll().then(markLoaded);
    },
    offersChanged,
    STALE_REFRESH_MS,
  );
  const everythingLoaded =
    !home.loading &&
    !earnings.loading &&
    !distribution.loading &&
    !offers.loading &&
    !jobsCalendar.loading;
  useEffect(() => {
    if (everythingLoaded) markLoaded();
  }, [everythingLoaded, markLoaded]);

  const onRefresh = async () => {
    setRefreshing(true);
    const failed = (await reloadAll()).find(Boolean);
    setRefreshing(false);
    if (failed) setRefreshError(failed.message);
  };

  const summary = home.data?.summary;
  const bookings = home.data?.latestBookings || [];

  const earningsPoints = useMemo(
    () =>
      (earnings.data?.chartData || []).map(p => ({
        label: p.label,
        value: p.earnings,
      })),
    [earnings.data],
  );
  const earningsMax = Math.max(0, ...earningsPoints.map(p => p.value));

  const slices = useMemo(
    () =>
      (distribution.data?.distribution || []).map(item => ({
        label: statusLabel(item.name),
        value: item.count,
        color: distributionColor(item.name),
      })),
    [distribution.data],
  );

  const offersPoints = useMemo<OffersPoint[]>(() => {
    const months = offers.data?.chartData || [];
    if (offersView !== 'quarterly') {
      return months.map(m => ({
        label: monthShortName(m.month),
        pending: m.pending,
        confirmed: m.confirmed,
      }));
    }
    return QUARTERS.map(q => {
      const rows = months.filter(m => q.months.includes(m.month));
      return {
        label: q.label,
        pending: rows.reduce((sum, m) => sum + m.pending, 0),
        confirmed: rows.reduce((sum, m) => sum + m.confirmed, 0),
      };
    });
  }, [offers.data, offersView]);

  return (
    <Fragment>
      <ScrollView
        contentContainerStyle={[
          styles.body,
          { paddingBottom: insets.bottom + 30 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        <FadeUp delay={40} duration={400}>
          <SectionCard
            title={t('repairman.overview')}
            loading={home.loading}
            error={home.error}
            onRetry={() => home.reload()}
          >
            <View style={styles.statsGrid}>
              <StatCard label={t('customer.totalJobs')} value={summary?.totalJobs ?? 0} />
              <StatCard
                label={t('repairman.deliveredJobs')}
                value={summary?.completedJobs ?? 0}
              />
              <StatCard label={t('repairman.activeJobs')} value={summary?.activeJobs ?? 0} />
              <StatCard
                label={t('customer.totalAmount')}
                value={formatMoney(summary?.totalEarnings ?? 0)}
              />
            </View>
          </SectionCard>
        </FadeUp>

        <SectionCard
          title={t('repairman.earningsAnalytics')}
          subtitle={t('repairman.completedAndDeliveredJobs')}
          loading={earnings.loading}
          error={earnings.error}
          onRetry={() => earnings.reload()}
          filter={
            <FilterChips
              options={EARNINGS_FILTERS}
              value={earningsFilter}
              onChange={value => setEarningsFilter(value as EarningsFilter)}
            />
          }
        >
          <EarningsLineChart
            data={earningsPoints}
            maxLabel={formatMoney(earningsMax)}
          />
          <View style={styles.facts}>
            <Fact
              label={t('repairman.earned')}
              value={formatMoney(earnings.data?.summary.totalEarnings ?? 0)}
            />
            <Fact label={t('repairman.jobs')} value={earnings.data?.summary.totalJobs ?? 0} />
            <Fact
              label={t('repairman.average')}
              value={formatMoney(earnings.data?.summary.avgEarning ?? 0)}
            />
            <Fact
              label={t('repairman.bestDay')}
              value={earnings.data?.summary.bestDay || '-'}
            />
          </View>
          {(earnings.data?.summary.totalJobs ?? 0) === 0 && (
            <Text style={[styles.empty, { color: colors.textMuted }]}>
              {t('repairman.noCompletedJobsInThis')}
            </Text>
          )}
        </SectionCard>

        <SectionCard
          title={t('repairman.jobDistribution')}
          subtitle={t('repairman.bookingsByStatus')}
          loading={distribution.loading}
          error={distribution.error}
          onRetry={() => distribution.reload()}
          filter={
            <FilterChips
              options={DISTRIBUTION_FILTERS}
              value={distributionFilter}
              onChange={setDistributionFilter}
            />
          }
        >
          {slices.length === 0 ? (
            <Text style={[styles.empty, { color: colors.textMuted }]}>
              {t('repairman.noJobsInThisPeriod')}
            </Text>
          ) : (
            <>
              <JobDonutChart
                data={slices}
                total={distribution.data?.totalBookings ?? 0}
                label={t('customer.totalJobs')}
              />
              <View style={styles.legend}>
                {slices.map(slice => (
                  <View key={slice.label} style={styles.legendRow}>
                    <View
                      style={[
                        styles.legendDot,
                        { backgroundColor: slice.color },
                      ]}
                    />
                    <Text
                      style={[styles.legendText, { color: colors.textMuted }]}
                    >
                      {slice.label} ({slice.value})
                    </Text>
                  </View>
                ))}
              </View>
            </>
          )}
        </SectionCard>

        <SectionCard
          title={t('repairman.activeBookings')}
          subtitle={t('repairman.yourLatestJobsInProgress')}
          loading={home.loading}
          error={home.error}
          onRetry={() => home.reload()}
        >
          {bookings.length === 0 ? (
            <Text style={[styles.empty, { color: colors.textMuted }]}>
              {t('repairman.noActiveBookingsRightNow')}
            </Text>
          ) : (
            <View style={styles.list}>
              {bookings.map(booking => (
                <BookingCard
                  key={booking._id}
                  booking={booking}
                  onOpen={() =>
                    navigation?.navigate('MyJobDetail', {
                      bookingId: booking._id,
                    })
                  }
                />
              ))}
            </View>
          )}
          <Button
            title={t('repairman.viewAllJobs')}
            variant="soft"
            size="sm"
            style={styles.viewAll}
            onPress={() =>
              navigation?.navigate('JobsTab', { tab: 'MyJobs', at: Date.now() })
            }
          />
        </SectionCard>

        <SectionCard
          title={t('repairman.jobCalendar')}
          subtitle={t('repairman.scheduledAndActiveJobs')}
          loading={false}
          error={jobsCalendar.error}
          onRetry={() => jobsCalendar.reload()}
        >
          {!jobsCalendar.error && (
            <View style={jobsCalendar.loading && styles.dimmed}>
              <JobsCalendar
                month={calendar.month}
                year={calendar.year}
                data={jobsCalendar.data}
                onChangeMonth={(month, year) => setCalendar({ month, year })}
                onOpenJob={bookingId =>
                  navigation?.navigate('MyJobDetail', { bookingId })
                }
              />
            </View>
          )}
        </SectionCard>

        <SectionCard
          title={t('repairman.offersPerformance')}
          subtitle={t('repairman.pendingVsConfirmedOffers')}
          loading={offers.loading}
          error={offers.error}
          onRetry={() => offers.reload()}
          filter={
            <FilterChips
              options={OFFERS_FILTERS}
              value={offersView}
              onChange={value => setOffersView(value as OffersView)}
            />
          }
        >
          <OffersChart data={offersPoints} />
          <View style={styles.facts}>
            <Fact
              label={t('repairman.pending')}
              value={offers.data?.summary.totalPending ?? 0}
            />
            <Fact
              label={t('repairman.confirmed')}
              value={offers.data?.summary.totalConfirmed ?? 0}
            />
            <Fact label={t('customer.total')} value={offers.data?.summary.totalOffers ?? 0} />
            <Fact
              label={t('repairman.conversion')}
              value={`${offers.data?.summary.conversionRate ?? 0}%`}
            />
          </View>
        </SectionCard>
      </ScrollView>

      <AlertModal
        visible={Boolean(refreshError)}
        type="error"
        title={t('customer.couldNotRefresh')}
        message={refreshError}
        onClose={() => setRefreshError('')}
      />
    </Fragment>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 20, paddingTop: 4 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statCard: {
    width: '47.5%',
    flexGrow: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  statLabel: { fontFamily: fonts.regular, fontSize: 13 },
  statValue: { fontFamily: fonts.bold, fontSize: 22 },
  facts: { flexDirection: 'row', gap: 8, marginTop: 14 },
  fact: { flex: 1, alignItems: 'center', gap: 2 },
  factValue: { fontFamily: fonts.bold, fontSize: 14 },
  factLabel: { fontFamily: fonts.regular, fontSize: 11 },
  empty: {
    fontFamily: fonts.regular,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 12,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginTop: 16,
    justifyContent: 'center',
  },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontFamily: fonts.regular, fontSize: 12 },
  list: { gap: 12 },
  viewAll: { marginTop: 14 },
  dimmed: { opacity: 0.5 },
});
