import { ReactElement, useCallback, useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Button from '@/components/Button';
import Icon from '@/components/Icon';
import Squeeze from '@/components/Squeeze';
import AlertModal from '@/components/AlertModal';
import { EmptyState, ErrorState, LoadingState, OfflineBanner } from '@/components/states';
import { chevronDownBold, chevronRightBold, fileBold } from '@/assets/icons';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import { getWebSellerReportsUrl } from '@/constants/config';
import DateRangeField from '@/roles/Seller/components/DateRangeField';
import DateRangeModal from '@/roles/Seller/components/DateRangeModal';
import StatusPills from '@/roles/Seller/components/StatusPills';
import {
  fetchSellerStatementApi,
  SellerStatementGroup,
  SellerStatementRow,
  SellerStatement,
} from '@/roles/Seller/services/sellerApi';
import { formatMoney, openWebsite } from '@/roles/Seller/utils/sellerUtils';
import { getStatusStyle, ORDER_STATUS_STYLE } from '@/roles/Seller/utils/statusStyles';
import usePagedList from '@/roles/Seller/utils/usePagedList';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';

// Same filters as the web reports page
const FILTERS = [
  { id: 'today', get label() { return i18n.t('chat.today'); } },
  { id: 'yesterday', get label() { return i18n.t('chat.yesterday'); } },
  { id: '7days', get label() { return i18n.t('sellerAuto.last7Days'); } },
  { id: '14days', get label() { return i18n.t('sellerAuto.last14Days'); } },
  { id: '30days', get label() { return i18n.t('sellerAuto.last30Days'); } },
  { id: 'custom', get label() { return i18n.t('sellerAuto.custom'); } },
];

function buildRange(filter: string, custom: { from: string; to: string }) {
  let start = new Date();
  let end = new Date();

  if (filter === 'today') {
    start.setHours(0, 0, 0, 0);
  } else if (filter === 'yesterday') {
    start.setDate(start.getDate() - 1);
    start.setHours(0, 0, 0, 0);
    end.setDate(end.getDate() - 1);
    end.setHours(23, 59, 59, 999);
  } else if (filter === '7days') {
    start.setDate(start.getDate() - 7);
  } else if (filter === '14days') {
    start.setDate(start.getDate() - 14);
  } else if (filter === '30days') {
    start.setDate(start.getDate() - 30);
  } else {
    const [sy, sm, sd] = custom.from.split('-').map(Number);
    const [ey, em, ed] = custom.to.split('-').map(Number);
    start = new Date(sy, sm - 1, sd, 0, 0, 0, 0);
    end = new Date(ey, em - 1, ed, 23, 59, 59, 999);
  }
  return { startDate: start.toISOString(), endDate: end.toISOString() };
}

type ListRow =
  | { kind: 'group'; key: string; group: SellerStatementGroup; open: boolean }
  | { kind: 'row'; key: string; row: SellerStatementRow; last: boolean };

export default function ReportsScreen({ isActive = true }: any) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const [filter, setFilter] = useState('30days');
  const [custom, setCustom] = useState({ from: '', to: '' });
  const [dateModalOpen, setDateModalOpen] = useState(false);
  const [collapsed, setCollapsed] = useState<string[]>([]);
  const [linkMessage, setLinkMessage] = useState('');

  const customReady = filter !== 'custom' || !!custom.from;

  const fetchPage = useCallback(async () => {
    const { startDate, endDate } = buildRange(filter, custom);
    const statement = await fetchSellerStatementApi(startDate, endDate);
    return { items: statement.groups, totalPages: 1, totalItems: statement.groups.length, extra: statement.summary };
  }, [filter, custom]);

  const list = usePagedList<SellerStatementGroup, SellerStatement['summary']>(fetchPage, isActive, customReady);
  const summary = list.extra;

  const rows = useMemo<ListRow[]>(() => {
    const result: ListRow[] = [];
    list.items.forEach(group => {
      const open = !collapsed.includes(group.date);
      result.push({ kind: 'group', key: `g-${group.date}`, group, open });
      if (open) {
        group.rows.forEach((row, index) =>
          result.push({
            kind: 'row',
            key: `r-${group.date}-${row.id}`,
            row,
            last: index === group.rows.length - 1,
          }),
        );
      }
    });
    return result;
  }, [list.items, collapsed]);

  const toggleGroup = (date: string) =>
    setCollapsed(prev => (prev.includes(date) ? prev.filter(d => d !== date) : [...prev, date]));

  const openStatementPage = async () => {
    const opened = await openWebsite(getWebSellerReportsUrl());
    if (!opened) {
      setLinkMessage(i18n.t('sellerMsg.openLinkFailed', { url: getWebSellerReportsUrl() }));
    }
  };

  const renderItem = ({ item }: { item: ListRow }) => {
    if (item.kind === 'group') {
      return (
        <Squeeze onPress={() => toggleGroup(item.group.date)} scale={0.99}>
          <View style={[styles.groupHeader, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
            <Icon
              source={item.open ? chevronDownBold : chevronRightBold}
              size={12}
              color={colors.textMuted}
            />
            <View style={styles.flex1}>
              <Text style={[styles.groupDate, { color: colors.text }]}>{item.group.date}</Text>
              <Text style={[styles.groupSub, { color: colors.textMuted }]}>{i18n.t('sellerMsg.ordersCount', { count: item.group.orderCount })}</Text>
            </View>
            <Text style={[styles.groupTotal, { color: colors.text }]}>{formatMoney(item.group.total)}</Text>
          </View>
        </Squeeze>
      );
    }

    const { row } = item;
    const badge = getStatusStyle(ORDER_STATUS_STYLE, row.status);
    return (
      <View
        style={[
          styles.txCard,
          { backgroundColor: colors.surface, borderColor: colors.border },
          item.last && styles.txCardLast,
        ]}>
        <View style={styles.txHeader}>
          <Text style={[styles.txOrder, { color: colors.text }]}>{row.orderNo}</Text>
          <View style={[styles.badge, { backgroundColor: badge.color + '20' }]}>
            <Text style={[styles.badgeText, { color: badge.color }]}>{badge.label}</Text>
          </View>
        </View>
        {row.customer ? <Text style={[styles.txSub, { color: colors.textMuted }]}>{row.customer}</Text> : null}
        {row.products ? <Text style={[styles.txSub, { color: colors.textMuted }]}>{row.products}</Text> : null}
        <View style={styles.amountsRow}>
          <Amount label={i18n.t('sellerAuto.amount')} value={formatMoney(row.orderAmount)} />
          <Amount label={i18n.t('sellerAuto.hold')} value={row.holdAmount > 0 ? formatMoney(row.holdAmount) : '-'} />
          <Amount label={i18n.t('sellerAuto.earned')} value={row.availableEarnings > 0 ? formatMoney(row.availableEarnings) : '-'} />
        </View>
      </View>
    );
  };

  const header = (
    <View style={styles.headerWrap}>
      <View>
        <Text style={[styles.mainTitle, { color: colors.text }]}>{t('sellerAuto.reportsAndAccountStatement')}</Text>
        <Text style={[styles.mainSub, { color: colors.textMuted }]}>
          {t('sellerAuto.viewYourTransactionHistoryEarnings')}
        </Text>
      </View>

      <Button title={t('sellerAuto.downloadStatementOnTheWebsite')} size="md" onPress={openStatementPage} />
      <Text style={[styles.note, { color: colors.textMuted }]}>
        {t('sellerAuto.thePdfStatementIsCreated')}
      </Text>

      <StatusPills options={FILTERS} selected={filter} onSelect={setFilter} />

      {filter === 'custom' ? (
        <DateRangeField
          label={t('sellerAuto.customPeriod')}
          from={custom.from}
          to={custom.to}
          onPress={() => setDateModalOpen(true)}
          onClear={() => setCustom({ from: '', to: '' })}
        />
      ) : null}

      {summary && customReady && !list.loading ? (
        <View style={styles.summaryGrid}>
          <SummaryCard label={t('sellerAuto.totalRevenue')} value={formatMoney(summary.totalRevenue)} />
          <SummaryCard label={t('sellerAuto.totalEarnedAvailable')} value={formatMoney(summary.totalEarned)} />
          <SummaryCard label={t('sellerAuto.totalPendingHold')} value={formatMoney(summary.totalPending)} />
          <SummaryCard label={t('sellerAuto.totalOrders')} value={String(summary.totalOrders)} />
        </View>
      ) : null}

      <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('sellerAuto.transactionHistory')}</Text>
    </View>
  );

  let body: ReactElement | null = null;
  if (!customReady) {
    body = (
      <EmptyState
        icon={fileBold}
        title={t('sellerAuto.selectAPeriod')}
        message={t('sellerAuto.chooseTheStartAndEnd')}
        style={styles.stateWrap}
      />
    );
  } else if (list.loading && list.items.length === 0) {
    body = <LoadingState text={t('sellerAuto.loadingStatement')} style={styles.stateWrap} />;
  } else if (list.error && list.items.length === 0) {
    body = <ErrorState error={list.error} onRetry={list.retry} style={styles.stateWrap} />;
  } else if (list.items.length === 0) {
    body = (
      <EmptyState
        icon={fileBold}
        title={t('sellerAuto.noTransactions')}
        message={t('sellerAuto.thereAreNoOrdersIn')}
        style={styles.stateWrap}
      />
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <OfflineBanner />
      <FlatList
        data={customReady ? rows : []}
        keyExtractor={item => item.key}
        renderItem={renderItem}
        ListHeaderComponent={header}
        ListEmptyComponent={body}
        contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={list.refreshing}
            onRefresh={list.onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      />

      <DateRangeModal
        visible={dateModalOpen}
        title={t('sellerAuto.statementPeriod')}
        from={custom.from}
        to={custom.to}
        onApply={(from, to) => {
          setCustom({ from, to });
          setDateModalOpen(false);
        }}
        onClose={() => setDateModalOpen(false)}
      />

      <AlertModal
        visible={!!linkMessage}
        type="info"
        title={t('sellerAuto.openInYourBrowser')}
        message={linkMessage}
        onClose={() => setLinkMessage('')}
      />
      <AlertModal
        visible={!!list.loadError}
        type="error"
        title={t('customer.couldNotRefresh')}
        message={list.loadError || ''}
        onClose={list.clearLoadError}
      />
    </View>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  useTranslation();
  return (
    <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[styles.summaryValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

function Amount({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  useTranslation();
  return (
    <View style={styles.amountCol}>
      <Text style={[styles.amountLabel, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[styles.amountValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  flex1: { flex: 1 },
  container: { paddingHorizontal: 16, paddingTop: 14, flexGrow: 1 },
  stateWrap: { paddingVertical: 40 },
  headerWrap: { gap: 12, marginBottom: 12 },
  mainTitle: { fontFamily: fonts.bold, fontSize: 24 },
  mainSub: { fontFamily: fonts.regular, fontSize: 13, marginTop: 4, lineHeight: 19 },
  note: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 18, marginTop: -4 },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  summaryCard: { flexGrow: 1, flexBasis: '45%', borderRadius: 14, borderWidth: 1, padding: 14, gap: 4 },
  summaryLabel: { fontFamily: fonts.medium, fontSize: 12 },
  summaryValue: { fontFamily: fonts.bold, fontSize: 17 },
  sectionTitle: { fontFamily: fonts.bold, fontSize: 18, marginTop: 4 },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginTop: 10,
  },
  groupDate: { fontFamily: fonts.bold, fontSize: 14 },
  groupSub: { fontFamily: fonts.regular, fontSize: 12, marginTop: 2 },
  groupTotal: { fontFamily: fonts.bold, fontSize: 14 },
  txCard: { borderWidth: 1, borderRadius: 12, padding: 12, gap: 6, marginTop: 6 },
  txCardLast: { marginBottom: 4 },
  txHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  txOrder: { flexShrink: 1, fontFamily: fonts.bold, fontSize: 13 },
  txSub: { fontFamily: fonts.regular, fontSize: 12 },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  badgeText: { fontFamily: fonts.bold, fontSize: 11 },
  amountsRow: { flexDirection: 'row', gap: 8, marginTop: 2 },
  amountCol: { flex: 1, gap: 2 },
  amountLabel: { fontFamily: fonts.regular, fontSize: 11 },
  amountValue: { fontFamily: fonts.medium, fontSize: 12 },
});
