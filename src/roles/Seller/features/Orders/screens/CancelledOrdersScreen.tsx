import { ReactElement, useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Icon from '@/components/Icon';
import Squeeze from '@/components/Squeeze';
import ProductThumb from '@/components/ProductThumb';
import AlertModal from '@/components/AlertModal';
import { EmptyState, ErrorState, LoadingState, OfflineBanner, PaginationFooter } from '@/components/states';
import { packageBold, searchBold } from '@/assets/icons';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import DateRangeField from '@/roles/Seller/components/DateRangeField';
import DateRangeModal from '@/roles/Seller/components/DateRangeModal';
import SellerScreenHeader from '@/roles/Seller/components/SellerScreenHeader';
import StatusPills from '@/roles/Seller/components/StatusPills';
import {
  fetchSellerCancelledOrdersApi,
  SellerCancelledOrder,
  SellerCancelledPage,
} from '@/roles/Seller/services/sellerApi';
import { formatDate, formatMoney } from '@/roles/Seller/utils/sellerUtils';
import { cancelledByLabel } from '@/roles/Seller/utils/statusStyles';
import usePagedList from '@/roles/Seller/utils/usePagedList';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';

const PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 500;

const ItemSeparator = () => <View style={styles.separator} />;

export default function CancelledOrdersScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const [cancelledBy, setCancelledBy] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [range, setRange] = useState({ from: '', to: '' });
  const [dateModalOpen, setDateModalOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchPage = useCallback(
    async (page: number) => {
      const res = await fetchSellerCancelledOrdersApi({
        page,
        limit: PAGE_SIZE,
        cancelledBy,
        search,
        dateFrom: range.from,
        dateTo: range.to,
      });
      return {
        items: res.orders,
        totalPages: res.pagination.totalPages,
        totalItems: res.pagination.totalItems,
        extra: res.summary,
      };
    },
    [cancelledBy, search, range],
  );

  const list = usePagedList<SellerCancelledOrder, SellerCancelledPage['summary']>(fetchPage);
  const summary = list.extra;

  const tabs = [
    { id: '', label: t('sellerAuto.all'), count: summary?.total },
    { id: 'user', label: t('glossary.customer'), count: summary?.user },
    { id: 'seller', label: t('sellerAuto.myCancellations'), count: summary?.seller },
    { id: 'system', label: t('seller.cancelledBy.system'), count: summary?.system },
  ];
  const hasFilters = !!(cancelledBy || search || range.from);

  const renderOrder = ({ item }: { item: SellerCancelledOrder }) => (
    <Squeeze
      onPress={() => navigation?.navigate('SellerOrderDetail', { orderId: item.id })}
      scale={0.98}>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.orderNo, { color: colors.text }]}>{item.orderNo}</Text>
          <View style={[styles.badge, { backgroundColor: colors.error + '20' }]}>
            <Text style={[styles.badgeText, { color: colors.error }]}>
              {cancelledByLabel(item.cancelledBy) || t('seller.cancelledFallback')}
            </Text>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <Row label={i18n.t('glossary.customer')} value={item.customer || '-'} />
        <View style={styles.itemLine}>
          <ProductThumb uri={item.image} size={48} />
          <Text style={[styles.itemTitle, { color: colors.text }]}>
            {item.firstItemTitle ? `${item.firstItemTitle}${item.itemsCount > 1 ? ` +${item.itemsCount - 1} more` : ''}` : '-'}
          </Text>
        </View>
        <Row label={i18n.t('sellerAuto.reason')} value={item.cancelReason || '-'} />
        <Row label={i18n.t('seller.cancelledFallback')} value={formatDate(item.cancelledAt) || '-'} />
        <View style={styles.dataRow}>
          <Text style={[styles.rowLabel, { color: colors.textMuted }]}>{i18n.t('sellerAuto.total')}</Text>
          <Text style={[styles.totalValue, { color: colors.error }]}>{formatMoney(item.total)}</Text>
        </View>
      </View>
    </Squeeze>
  );

  const header = (
    <View style={styles.headerWrap}>
      <SellerScreenHeader
        title={t('sellerAuto.cancelledOrders')}
        subtitle={t('sellerAuto.ordersCancelledByCustomersBy')}
        onBack={() => navigation?.goBack()}
      />

      <StatusPills options={tabs} selected={cancelledBy} onSelect={setCancelledBy} />

      <View style={[styles.searchBar, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
        <Icon source={searchBold} size={16} color={colors.textMuted} />
        <TextInput
          placeholder={t('sellerAuto.searchOrderCustomerOrProduct')}
          placeholderTextColor={colors.textMuted}
          value={searchInput}
          onChangeText={setSearchInput}
          returnKeyType="search"
          style={[styles.searchInput, { color: colors.text }]}
        />
      </View>

      <DateRangeField
        label={t('sellerAuto.date')}
        from={range.from}
        to={range.to}
        onPress={() => setDateModalOpen(true)}
        onClear={() => setRange({ from: '', to: '' })}
      />
    </View>
  );

  let body: ReactElement | null = null;
  if (list.loading && list.items.length === 0) {
    body = <LoadingState text={t('sellerAuto.loadingCancelledOrders')} style={styles.stateWrap} />;
  } else if (list.error && list.items.length === 0) {
    body = <ErrorState error={list.error} onRetry={list.retry} style={styles.stateWrap} />;
  } else if (list.items.length === 0) {
    body = (
      <EmptyState
        icon={packageBold}
        title={t('sellerAuto.noCancelledOrders')}
        message={hasFilters ? t('sellerAuto.noCancelledOrdersMatchYour') : t('sellerAuto.youHaveNoCancelledOrders')}
        style={styles.stateWrap}
      />
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: insets.top + 8 }]}>
      <OfflineBanner />
      <FlatList
        data={list.items}
        keyExtractor={item => item.id}
        renderItem={renderOrder}
        ListHeaderComponent={header}
        ListEmptyComponent={body}
        ListFooterComponent={<PaginationFooter loading={list.loadingMore} hasMore={list.hasMore} />}
        ItemSeparatorComponent={ItemSeparator}
        contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 32 }]}
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

      <DateRangeModal
        visible={dateModalOpen}
        title={t('sellerAuto.cancelledOrdersDate')}
        from={range.from}
        to={range.to}
        onApply={(from, to) => {
          setRange({ from, to });
          setDateModalOpen(false);
        }}
        onClose={() => setDateModalOpen(false)}
      />

      <AlertModal
        visible={!!list.loadError}
        type="error"
        title={t('sellerAuto.couldNotLoadOrders')}
        message={list.loadError || ''}
        onClose={list.clearLoadError}
      />
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.dataRow}>
      <Text style={[styles.rowLabel, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[styles.rowValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  container: { paddingHorizontal: 16, paddingTop: 6, flexGrow: 1 },
  separator: { height: 14 },
  stateWrap: { paddingVertical: 40 },
  headerWrap: { gap: 12, marginBottom: 14 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
  },
  searchInput: { flex: 1, fontFamily: fonts.regular, fontSize: 13, padding: 0 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 10 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  orderNo: { flexShrink: 1, fontFamily: fonts.bold, fontSize: 15 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontFamily: fonts.bold, fontSize: 11 },
  divider: { height: 1 },
  dataRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  rowLabel: { flexShrink: 1, fontFamily: fonts.regular, fontSize: 13 },
  rowValue: { flex: 1, textAlign: 'right', fontFamily: fonts.medium, fontSize: 13 },
  itemLine: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  itemTitle: { flex: 1, fontFamily: fonts.medium, fontSize: 13 },
  totalValue: { fontFamily: fonts.bold, fontSize: 15 },
});
