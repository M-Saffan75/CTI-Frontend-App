import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Icon from '@/components/Icon';
import Squeeze from '@/components/Squeeze';
import AlertModal from '@/components/AlertModal';
import { EmptyState, ErrorState, LoadingState } from '@/components/states';
import { FadeUp } from '@/animations';
import {
  checkCircleBold,
  clockBold,
  commentDotsBold,
} from '@/assets/icons';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import AuthService from '@/services/authService';
import AdvertisingBarChart from '../components/AdvertisingBarChart';
import RevenueTrendChart from '../components/RevenueTrendChart';
import {
  fetchSellerDashboardOverviewApi,
  SellerDashboardOverview,
} from '@/roles/Seller/services/sellerApi';
import {
  formatLongDate,
  formatMoney,
  formatShortDate,
  getGreeting,
} from '@/roles/Seller/utils/sellerUtils';
import { useOrdersChangedChecker } from '@/roles/Seller/utils/orderEvents';
import useRefreshOnActive from '@/utils/useRefreshOnActive';
import { currencySymbol } from '@/utils/money';
import { getLocaleTag } from '@/i18n/locale';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';

interface ActionItem {
  id: string;
  title: string;
  subtitle: string;
  count: number;
  onPress: () => void;
}

export default function DashboardScreen({ onSelectTab, navigation, isActive = true }: any) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [overview, setOverview] = useState<SellerDashboardOverview | null>(null);
  const [sellerName, setSellerName] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const mounted = useRef(true);

  const ordersChanged = useOrdersChangedChecker();
  const markLoaded = useRefreshOnActive(isActive, () => loadOverview(false, true), ordersChanged);

  const loadOverview = useCallback(
    async (isRefresh = false, silent = false) => {
      if (!silent) {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        setError(null);
      }

      try {
        const result = await fetchSellerDashboardOverviewApi();
        if (!mounted.current) return;
        setOverview(result);
        markLoaded();
      } catch (err: any) {
        if (!mounted.current || silent) return;
        const message = err?.message || i18n.t('sellerAuto.couldNotLoadYourDashboard');
        if (isRefresh) setRefreshError(message);
        else setError(message);
      } finally {
        if (mounted.current && !silent) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [markLoaded],
  );

  useEffect(() => {
    mounted.current = true;
    loadOverview();
    AuthService.getStoredUser().then(user => {
      if (mounted.current && user?.name) setSellerName(user.name.split(' ')[0]);
    });
    return () => {
      mounted.current = false;
    };
  }, [loadOverview]);

  const actionItems = useMemo<ActionItem[]>(() => {
    if (!overview) return [];
    const a = overview.actions;
    return [
      {
        id: 'pendingOrders',
        title: t('seller.dashboard.pendingOrders'),
        subtitle: t('seller.dashboard.needProcessing'),
        count: a.pendingOrders,
        onPress: () => onSelectTab?.('OrderManagement'),
      },
      {
        id: 'pendingDocuments',
        title: t('seller.dashboard.pendingDocuments'),
        subtitle: t('seller.dashboard.documentsHint'),
        count: a.pendingDocuments,
        onPress: () => navigation?.navigate('Profile'),
      },
      {
        id: 'orderQuestions',
        title: t('seller.dashboard.orderQuestions'),
        subtitle: t('seller.dashboard.openOrderQueries'),
        count: a.orderQuestions,
        onPress: () => onSelectTab?.('Enquiries', { enquiryType: 'order', enquiryStatus: 'open' }),
      },
      {
        id: 'productQuestions',
        title: t('seller.dashboard.productQuestions'),
        subtitle: t('seller.dashboard.openProductQueries'),
        count: a.productQuestions,
        onPress: () => onSelectTab?.('Enquiries', { enquiryType: 'customer', enquiryStatus: 'open' }),
      },
      {
        id: 'pendingRefunds',
        title: t('seller.dashboard.returnRequests'),
        subtitle: t('seller.dashboard.awaitingResponse'),
        count: a.pendingRefunds,
        onPress: () => navigation?.navigate('ReturnRequests'),
      },
    ].filter(item => item.count > 0);
  }, [overview, onSelectTab, navigation, t]);

  const revenueTrend = useMemo(
    () =>
      (overview?.sales.chartData || []).map(d => ({
        label: formatShortDate(d.date),
        value: d.revenue,
        tooltipDate: formatLongDate(d.date),
        tooltipValue: formatMoney(d.revenue),
      })),
    [overview],
  );

  const adBars = useMemo(
    () =>
      (overview?.advertising.chartData || []).map(d => ({
        day: new Date(d.date).toLocaleDateString(getLocaleTag(), { weekday: 'short' }),
        value: d.impressions,
      })),
    [overview],
  );

  if (loading && !overview) {
    return <LoadingState fullScreen text={t('sellerAuto.loadingDashboard')} />;
  }

  if (error && !overview) {
    return <ErrorState fullScreen error={error} onRetry={() => loadOverview()} />;
  }

  if (!overview) return null;

  const growth = overview.sales.growthPercent;
  const growthText = `${growth > 0 ? '+' : ''}${growth}% vs previous week`;
  const totalActions = overview.actions.total;
  const today = new Date();
  const todayText = today.toLocaleDateString(getLocaleTag(), {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <>
      <ScrollView
        contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadOverview(true)}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }>
        <FadeUp delay={40} duration={400}>
          <LinearGradient
            colors={['#421206', '#220802', '#140401']}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={styles.heroCard}>
            <View style={styles.badgeRow}>
              <View style={styles.greetingBadge}>
                <View style={styles.dot} />
                <Text style={styles.greetingText}>{getGreeting(today)}</Text>
              </View>
            </View>

            <Text style={styles.dateText}>{todayText}</Text>
            <Text style={styles.welcomeTitle}>
              {sellerName ? i18n.t('sellerMsg.welcome', { name: sellerName }) : i18n.t('sellerMsg.welcomeNoName')}
            </Text>
            <Text style={styles.welcomeSubtitle}>
              {t('sellerAuto.hereIsWhatIsHappening')}
            </Text>

            <View style={styles.heroBtnRow}>
              {totalActions > 0 && (
                <Squeeze onPress={actionItems[0]?.onPress} style={styles.flex1}>
                  <View style={styles.actionNeededBtn}>
                    <Text
                      style={styles.actionNeededBtnText}
                      numberOfLines={1}
                      adjustsFontSizeToFit={true}>
                      {i18n.t(totalActions === 1 ? 'sellerMsg.actionsNeededOne' : 'sellerMsg.actionsNeededMany', { count: totalActions })}
                    </Text>
                  </View>
                </Squeeze>
              )}

              <Squeeze
                onPress={refreshing ? undefined : () => loadOverview(true)}
                style={styles.flex1}>
                <View style={styles.refreshBtn}>
                  <Text
                    style={styles.refreshBtnText}
                    numberOfLines={1}
                    adjustsFontSizeToFit={true}>
                    {refreshing ? t('sellerAuto.refreshing') : t('sellerAuto.refresh')}
                  </Text>
                </View>
              </Squeeze>
            </View>
          </LinearGradient>
        </FadeUp>

        <FadeUp delay={80} duration={400}>
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.iconBox, { backgroundColor: colors.surfaceAlt }]}>
                <Text style={[styles.iconSymbol, { color: colors.primary }]}>{currencySymbol()}</Text>
              </View>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>{t('sellerAuto.todaySRevenue')}</Text>
              <Text style={[styles.statValue, { color: colors.text }]} numberOfLines={1} adjustsFontSizeToFit>
                {formatMoney(overview.sales.today)}
              </Text>
              <View style={styles.statSubRow}>
                <Icon source={clockBold} size={13} color={colors.primary} />
                <Text style={[styles.statSubtext, { color: colors.primary }]}>
                  {t('sellerAuto.deliveredOrdersOnly')}
                </Text>
              </View>
            </View>

            <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.iconBox, { backgroundColor: colors.surfaceAlt }]}>
                <Text style={[styles.iconSymbol, { color: colors.success ?? colors.primary }]}>📊</Text>
              </View>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>{t('sellerAuto.last7Days')}</Text>
              <Text style={[styles.statValue, { color: colors.text }]} numberOfLines={1} adjustsFontSizeToFit>
                {formatMoney(overview.sales.last7Days)}
              </Text>
              <View style={styles.statSubRow}>
                <Icon source={checkCircleBold} size={13} color={colors.success ?? colors.primary} />
                <Text style={[styles.statSubtext, { color: colors.success ?? colors.primary }]}>
                  {growthText}
                </Text>
              </View>
            </View>
          </View>
        </FadeUp>

        <FadeUp delay={120} duration={400}>
          <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('sellerAuto.revenueTrend')}</Text>
                <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
                  {t('sellerAuto.last7DaysDeliveredOrder')}
                </Text>
              </View>
              <View style={[styles.pillBadge, { backgroundColor: colors.surfaceAlt }]}>
                <Text style={[styles.pillText, { color: colors.primary }]}>{t('sellerAuto.n7Days')}</Text>
              </View>
            </View>

            <RevenueTrendChart data={revenueTrend} />
          </View>
        </FadeUp>

        <FadeUp delay={160} duration={400}>
          <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.flex1}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('sellerAuto.advertisingPerformance')}</Text>
                <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
                  {i18n.t(overview.advertising.activeCampaigns === 1 ? 'sellerMsg.adsSubOne' : 'sellerMsg.adsSubMany', { count: overview.advertising.activeCampaigns })}
                </Text>
              </View>
              <Squeeze onPress={() => onSelectTab?.('Ads')}>
                <View style={[styles.pillBadge, { backgroundColor: colors.surfaceAlt }]}>
                  <Text style={[styles.pillText, { color: colors.primary }]}>{t('sellerAuto.n7Days2')}</Text>
                </View>
              </Squeeze>
            </View>

            {overview.advertising.last7Impressions > 0 ? (
              <AdvertisingBarChart data={adBars} />
            ) : (
              <EmptyState title={t('sellerAuto.noAdActivity')} message={t('sellerAuto.noImpressionsInTheLast')} />
            )}
          </View>
        </FadeUp>

        <FadeUp delay={200} duration={400}>
          <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.actionHeader}>
              <View style={[styles.flashIconBox, { backgroundColor: colors.surfaceAlt }]}>
                <Text style={styles.flashEmoji}>⚡</Text>
              </View>
              <View style={styles.flex1}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('sellerAuto.actionRequired')}</Text>
                <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
                  {t('sellerAuto.taskNeedingAttention')}
                </Text>
              </View>
              {totalActions > 0 && (
                <View style={[styles.countBadge, { backgroundColor: colors.error ?? '#EF4444' }]}>
                  <Text style={styles.countText}>{totalActions}</Text>
                </View>
              )}
            </View>

            {actionItems.length === 0 ? (
              <EmptyState title={t('sellerAuto.allCaughtUp')} message={t('sellerAuto.nothingNeedsYourAttentionRight')} />
            ) : (
              <View style={styles.actionList}>
                {actionItems.map(action => (
                  <Squeeze key={action.id} onPress={action.onPress}>
                    <View style={[styles.actionItem, { borderColor: colors.border }]}>
                      <View style={[styles.actionIconBox, { backgroundColor: colors.surfaceAlt }]}>
                        <Icon source={commentDotsBold} size={16} color={colors.primary} />
                      </View>
                      <View style={styles.flex1}>
                        <Text style={[styles.actionTitle, { color: colors.text }]}>{action.title}</Text>
                        <Text style={[styles.actionSub, { color: colors.textMuted }]}>{action.subtitle}</Text>
                      </View>
                      <View style={[styles.actionItemBadge, { backgroundColor: colors.surfaceAlt }]}>
                        <Text style={[styles.actionBadgeText, { color: colors.primary }]}>{action.count}</Text>
                      </View>
                    </View>
                  </Squeeze>
                ))}
              </View>
            )}
          </View>
        </FadeUp>
      </ScrollView>

      <AlertModal
        visible={!!refreshError}
        type="error"
        title={t('sellerAuto.refreshFailed')}
        message={refreshError || ''}
        onClose={() => setRefreshError(null)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  flashEmoji: { fontSize: 16 },
  container: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 16,
  },
  heroCard: {
    borderRadius: 20,
    padding: 18,
    overflow: 'hidden',
  },
  badgeRow: { flexDirection: 'row', marginBottom: 10 },
  greetingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
  },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#FF7A00' },
  greetingText: { fontFamily: fonts.medium, fontSize: 12, color: '#FFFFFF' },
  dateText: { fontFamily: fonts.regular, fontSize: 13, color: '#CBD5E1', marginBottom: 6 },
  welcomeTitle: { fontFamily: fonts.bold, fontSize: 24, color: '#FFFFFF', marginBottom: 6 },
  welcomeSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: '#E2E8F0',
    marginBottom: 18,
  },
  heroBtnRow: { flexDirection: 'row', gap: 12 },
  actionNeededBtn: {
    height: 42,
    backgroundColor: '#FF7A00',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  actionNeededBtnText: {
    fontFamily: fonts.bold,
    fontSize: 12.5,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  refreshBtn: {
    height: 42,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  refreshBtnText: {
    fontFamily: fonts.bold,
    fontSize: 12.5,
    color: '#0F172A',
    textAlign: 'center',
  },

  statsGrid: { flexDirection: 'row', gap: 12 },
  statCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 6,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconSymbol: { fontSize: 18, fontFamily: fonts.bold },
  statLabel: { fontFamily: fonts.medium, fontSize: 13 },
  statValue: { fontFamily: fonts.bold, fontSize: 20 },
  statSubRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  statSubtext: { flexShrink: 1, fontFamily: fonts.medium, fontSize: 11 },

  sectionCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  sectionTitle: { fontFamily: fonts.bold, fontSize: 17 },
  sectionSubtitle: { fontFamily: fonts.regular, fontSize: 12, marginTop: 2 },
  pillBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
  },
  pillText: { fontFamily: fonts.medium, fontSize: 11 },

  actionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  flashIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: { color: '#fff', fontSize: 11, fontFamily: fonts.bold },
  actionList: { gap: 10 },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  actionIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTitle: { fontFamily: fonts.medium, fontSize: 14 },
  actionSub: { fontFamily: fonts.regular, fontSize: 12, marginTop: 2 },
  actionItemBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBadgeText: { fontSize: 11, fontFamily: fonts.bold },
});
