import { useCallback, useEffect, useState } from 'react';
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
import { FadeUp } from '@/animations';
import {
  arrowRightBold,
  checkCircleBold,
  clockBold,
  commentDotsBold,
  exclamationCircleBold,
} from '@/assets/icons';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import AdvertisingBarChart from '../components/AdvertisingBarChart';
import RevenueTrendChart from '../components/RevenueTrendChart';
import { SELLER_DASHBOARD_DATA } from '../data/dashboardData';
import { fetchSellerDashboardOverviewApi, SellerDashboardStats } from '@/roles/Seller/services/sellerApi';

export default function DashboardScreen({ onSelectTab, navigation }: any) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [data, setData] = useState(SELLER_DASHBOARD_DATA);
  const [refreshing, setRefreshing] = useState(false);

  const loadOverview = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const stats = await fetchSellerDashboardOverviewApi();
      if (stats) {
        setData(prev => ({
          ...prev,
          stats: {
            ...prev.stats,
            todayRevenue: stats.totalEarnings ? `$${stats.totalEarnings.toFixed(2)}` : prev.stats.todayRevenue,
            todayOrdersNote: stats.pendingOrders ? `${stats.pendingOrders} Pending Orders` : prev.stats.todayOrdersNote,
          },
        }));
      }
    } catch {
      // Keep existing data safely
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  return (
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
      {/* Hero Welcome Card matching Figma screenshot */}
      <FadeUp delay={40} duration={400}>
        <LinearGradient
          colors={['#421206', '#220802', '#140401']}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={styles.heroCard}>
          <View style={styles.badgeRow}>
            <View style={styles.greetingBadge}>
              <View style={styles.dot} />
              <Text style={styles.greetingText}>{data.greeting}</Text>
            </View>
          </View>

          <Text style={styles.dateText}>{data.dateString}</Text>
          <Text style={styles.welcomeTitle}>
            Welcome back {data.sellerName}
          </Text>
          <Text style={styles.welcomeSubtitle}>
            Here is what's happening with your store today. Keep up the great work!
          </Text>

          <View style={styles.heroBtnRow}>
            <Squeeze onPress={() => onSelectTab?.('Enquiries')} style={{ flex: 1 }}>
              <View style={styles.actionNeededBtn}>
                <Text
                  style={styles.actionNeededBtnText}
                  numberOfLines={1}
                  adjustsFontSizeToFit={true}>
                  3 Action Needed
                </Text>
              </View>
            </Squeeze>

            <Squeeze onPress={() => loadOverview(true)} style={{ flex: 1 }}>
              <View style={styles.refreshBtn}>
                <Text
                  style={styles.refreshBtnText}
                  numberOfLines={1}
                  adjustsFontSizeToFit={true}>
                  {refreshing ? 'Refreshing...' : 'Refresh'}
                </Text>
              </View>
            </Squeeze>
          </View>
        </LinearGradient>
      </FadeUp>

      {/* Two Stat Cards */}
      <FadeUp delay={80} duration={400}>
        <View style={styles.statsGrid}>
          {/* Today's Revenue */}
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.iconBox, { backgroundColor: colors.surfaceAlt }]}>
              <Text style={[styles.iconSymbol, { color: colors.primary }]}>$</Text>
            </View>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Today's Revenue</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>{data.stats.todayRevenue}</Text>
            <View style={styles.statSubRow}>
              <Icon source={clockBold} size={13} color={colors.primary} />
              <Text style={[styles.statSubtext, { color: colors.primary }]}>
                {data.stats.todayOrdersNote}
              </Text>
            </View>
          </View>

          {/* Last 7 Days */}
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.iconBox, { backgroundColor: colors.surfaceAlt }]}>
              <Text style={[styles.iconSymbol, { color: colors.success ?? colors.primary }]}>📊</Text>
            </View>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Last 7 Days</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>{data.stats.last7DaysRevenue}</Text>
            <View style={styles.statSubRow}>
              <Icon source={checkCircleBold} size={13} color={colors.success ?? colors.primary} />
              <Text style={[styles.statSubtext, { color: colors.success ?? colors.primary }]}>
                {data.stats.last7DaysChange}
              </Text>
            </View>
          </View>
        </View>
      </FadeUp>

      {/* Revenue Trend Section */}
      <FadeUp delay={120} duration={400}>
        <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Revenue Trend</Text>
              <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
                Last 7 days delivered order earnings
              </Text>
            </View>
            <View style={[styles.pillBadge, { backgroundColor: colors.surfaceAlt }]}>
              <Text style={[styles.pillText, { color: colors.primary }]}>7 Days</Text>
            </View>
          </View>

          <RevenueTrendChart data={data.revenueTrend} />
        </View>
      </FadeUp>

      {/* Advertising Performance Section */}
      <FadeUp delay={160} duration={400}>
        <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Advertising Performance</Text>
              <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
                Last 7 days 0 active campaigns
              </Text>
            </View>
            <Squeeze onPress={() => onSelectTab?.('Ads')}>
              <View style={[styles.pillBadge, { backgroundColor: colors.surfaceAlt }]}>
                <Text style={[styles.pillText, { color: colors.primary }]}>7 Days →</Text>
              </View>
            </Squeeze>
          </View>

          <AdvertisingBarChart data={data.advertisingPerformance} />
        </View>
      </FadeUp>

      {/* Action Required Section */}
      <FadeUp delay={200} duration={400}>
        <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.actionHeader}>
            <View style={[styles.flashIconBox, { backgroundColor: colors.surfaceAlt }]}>
              <Text style={{ fontSize: 16 }}>⚡</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Action Required</Text>
              <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
                Task needing attention
              </Text>
            </View>
            <View style={[styles.countBadge, { backgroundColor: colors.error ?? '#EF4444' }]}>
              <Text style={styles.countText}>{data.actionsRequired.length}</Text>
            </View>
          </View>

          <View style={styles.actionList}>
            {data.actionsRequired.map(action => (
              <Squeeze
                key={action.id}
                onPress={() => onSelectTab?.(action.tabTarget)}>
                <View style={[styles.actionItem, { borderColor: colors.border }]}>
                  <View style={[styles.actionIconBox, { backgroundColor: colors.surfaceAlt }]}>
                    <Icon source={commentDotsBold} size={16} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.actionTitle, { color: colors.text }]}>{action.title}</Text>
                    <Text style={[styles.actionSub, { color: colors.textMuted }]}>{action.subtitle}</Text>
                  </View>
                  <View style={[styles.actionItemBadge, { backgroundColor: colors.surfaceAlt }]}>
                    <Text style={[styles.actionBadgeText, { color: colors.primary }]}>{action.badge}</Text>
                  </View>
                </View>
              </Squeeze>
            ))}
          </View>
        </View>
      </FadeUp>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
  statSubtext: { fontFamily: fonts.medium, fontSize: 11 },

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
