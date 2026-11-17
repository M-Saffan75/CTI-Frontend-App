import { ReactElement, useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Icon from '@/components/Icon';
import Squeeze from '@/components/Squeeze';
import ProductThumb from '@/components/ProductThumb';
import AlertModal from '@/components/AlertModal';
import { EmptyState, ErrorState, LoadingState, OfflineBanner, PaginationFooter } from '@/components/states';
import { chevronDownBold, checkCircleBold, packageBold, searchBold } from '@/assets/icons';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import DateRangeField from '@/roles/Seller/components/DateRangeField';
import DateRangeModal from '@/roles/Seller/components/DateRangeModal';
import {
  fetchSellerOrdersApi,
  SellerOrderListItem,
} from '@/roles/Seller/services/sellerApi';
import { formatDate, formatMoney } from '@/roles/Seller/utils/sellerUtils';
import { getStatusStyle, ORDER_STATUS_STYLE } from '@/roles/Seller/utils/statusStyles';
import { subscribeOrderChanged, useOrdersChangedChecker } from '@/roles/Seller/utils/orderEvents';
import usePagedList from '@/roles/Seller/utils/usePagedList';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';

const PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 500;

const STATUS_OPTIONS = [
  { id: '', get label() { return i18n.t('sellerAuto.allStatuses'); } },
  { id: 'pending', get label() { return i18n.t('chat.quoteStatus.pending'); } },
  { id: 'processing', get label() { return i18n.t('sellerAuto.processing'); } },
  { id: 'shipping', get label() { return i18n.t('sellerAuto.shipping'); } },
  { id: 'shipped', get label() { return i18n.t('sellerAuto.shipped'); } },
  { id: 'delivered', get label() { return i18n.t('sellerAuto.delivered'); } },
  { id: 'cancelled', get label() { return i18n.t('seller.cancelledFallback'); } },
];

interface DateRange {
  from: string;
  to: string;
}

const NO_RANGE: DateRange = { from: '', to: '' };

const ItemSeparator = () => <View style={styles.separator} />;

export default function OrderManagementScreen({ navigation, isActive = true }: any) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const [status, setStatus] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [orderRange, setOrderRange] = useState<DateRange>(NO_RANGE);
  const [completionRange, setCompletionRange] = useState<DateRange>(NO_RANGE);
  const [dateModal, setDateModal] = useState<'order' | 'completion' | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchPage = useCallback(
    async (page: number) => {
      const res = await fetchSellerOrdersApi({
        page,
        limit: PAGE_SIZE,
        status,
        search,
        orderDateFrom: orderRange.from,
        orderDateTo: orderRange.to,
        completionDateFrom: completionRange.from,
        completionDateTo: completionRange.to,
      });
      return {
        items: res.orders,
        totalPages: res.pagination.totalPages,
        totalItems: res.pagination.totalItems,
      };
    },
    [status, search, orderRange, completionRange],
  );

  const ordersChanged = useOrdersChangedChecker();
  const list = usePagedList<SellerOrderListItem>(fetchPage, isActive, true, ordersChanged);
  const { updateItem, removeItem } = list;

  // A confirmed change on the detail screen shows on the list card at once
  useEffect(() => {
    return subscribeOrderChanged(change => {
      if (status && change.status !== status) {
        removeItem(item => item.id === change.id);
      } else {
        updateItem(item => item.id === change.id, {
          status: change.status,
          completionDate: change.completionDate,
        });
      }
    });
  }, [status, updateItem, removeItem]);

  const hasFilters = !!(status || search || orderRange.from || completionRange.from);
  const statusLabel = STATUS_OPTIONS.find(o => o.id === status)?.label || t('sellerAuto.allStatuses');

  const renderOrder = ({ item }: { item: SellerOrderListItem }) => {
    const badge = getStatusStyle(ORDER_STATUS_STYLE, item.status);
    return (
      <Squeeze
        onPress={() => navigation?.navigate('SellerOrderDetail', { orderId: item.id })}
        scale={0.98}>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.orderNo, { color: colors.text }]}>{item.orderNo}</Text>
            <View style={[styles.badge, { backgroundColor: badge.color + '20' }]}>
              <Text style={[styles.badgeText, { color: badge.color }]}>{badge.label}</Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.dataRow}>
            <Text style={[styles.rowLabel, { color: colors.textMuted }]}>{i18n.t('glossary.customer')}</Text>
            <Text style={[styles.rowValue, { color: colors.text }]}>{item.customer || '-'}</Text>
          </View>

          <View style={styles.itemLine}>
            <ProductThumb uri={item.image} size={48} />
            <View style={styles.itemText}>
              <Text style={[styles.rowValue, styles.itemTitle, { color: colors.text }]}>
                {item.firstItemTitle || '-'}
              </Text>
              {item.itemsCount > 1 ? (
                <Text style={[styles.rowSub, { color: colors.textMuted }]}>
                  {i18n.t('sellerMsg.moreItemsPlus', { count: item.itemsCount - 1 })}
                </Text>
              ) : null}
            </View>
          </View>

          <View style={styles.dataRow}>
            <Text style={[styles.rowLabel, { color: colors.textMuted }]}>{i18n.t('sellerAuto.ordered')}</Text>
            <Text style={[styles.rowValue, { color: colors.text }]}>{formatDate(item.createdAt)}</Text>
          </View>

          <View style={styles.dataRow}>
            <Text style={[styles.rowLabel, { color: colors.textMuted }]}>{i18n.t('sellerAuto.completed')}</Text>
            <Text style={[styles.rowValue, { color: colors.text }]}>
              {item.completionDate ? formatDate(item.completionDate) : '-'}
            </Text>
          </View>

          <View style={styles.dataRow}>
            <Text style={[styles.rowLabel, { color: colors.textMuted }]}>{i18n.t('sellerAuto.total')}</Text>
            <Text style={[styles.totalValue, { color: colors.success }]}>
              {formatMoney(item.total)}
            </Text>
          </View>
        </View>
      </Squeeze>
    );
  };

  const header = (
    <View style={styles.headerWrap}>
      <Text style={[styles.mainTitle, { color: colors.text }]}>{t('sellerAuto.orderManagement')}</Text>
      <Text style={[styles.mainSub, { color: colors.textMuted }]}>{t('sellerAuto.trackAndUpdateAllYour')}</Text>

      <View style={styles.topBtnRow}>
        <Squeeze onPress={() => navigation?.navigate('CancelledOrders')} style={styles.flex1}>
          <View style={[styles.topActionBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}>
            <Text style={[styles.topActionText, { color: colors.text }]}>{t('sellerAuto.cancelledOrder')}</Text>
          </View>
        </Squeeze>
        <Squeeze onPress={() => navigation?.navigate('ReturnRequests')} style={styles.flex1}>
          <View style={[styles.topActionBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}>
            <Text style={[styles.topActionText, { color: colors.text }]}>{t('sellerAuto.returnOrder')}</Text>
          </View>
        </Squeeze>
      </View>

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

      <View style={styles.dropdownContainer}>
        <Squeeze onPress={() => setIsDropdownOpen(prev => !prev)}>
          <View
            style={[
              styles.dropdownBox,
              {
                backgroundColor: colors.surfaceAlt,
                borderColor: isDropdownOpen ? colors.primary : colors.border,
              },
            ]}>
            <Text style={[styles.dropdownText, { color: colors.text }]}>{statusLabel}</Text>
            <Icon
              source={chevronDownBold}
              size={14}
              color={isDropdownOpen ? colors.primary : colors.textMuted}
              style={isDropdownOpen ? styles.rotated : undefined}
            />
          </View>
        </Squeeze>

        {isDropdownOpen ? (
          <View style={[styles.dropdownMenu, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {STATUS_OPTIONS.map((option, index) => {
              const selected = option.id === status;
              return (
                <Squeeze
                  key={option.id || 'all'}
                  onPress={() => {
                    setStatus(option.id);
                    setIsDropdownOpen(false);
                  }}>
                  <View
                    style={[
                      styles.dropdownItem,
                      index < STATUS_OPTIONS.length - 1 && styles.dropdownItemBorder,
                      index < STATUS_OPTIONS.length - 1 && { borderBottomColor: colors.border },
                      selected && { backgroundColor: colors.surfaceAlt },
                    ]}>
                    <Text
                      style={[
                        styles.dropdownItemText,
                        {
                          color: selected ? colors.primary : colors.text,
                          fontFamily: selected ? fonts.bold : fonts.regular,
                        },
                      ]}>
                      {option.label}
                    </Text>
                    {selected ? <Icon source={checkCircleBold} size={14} color={colors.primary} /> : null}
                  </View>
                </Squeeze>
              );
            })}
          </View>
        ) : null}
      </View>

      <DateRangeField
        label={t('sellerAuto.orderDate')}
        from={orderRange.from}
        to={orderRange.to}
        onPress={() => setDateModal('order')}
        onClear={() => setOrderRange(NO_RANGE)}
      />
      <DateRangeField
        label={t('sellerAuto.completionDate')}
        from={completionRange.from}
        to={completionRange.to}
        onPress={() => setDateModal('completion')}
        onClear={() => setCompletionRange(NO_RANGE)}
      />

      <Text style={[styles.ordersHeading, { color: colors.text }]}>
        {!list.loading && !list.error ? i18n.t('sellerMsg.ordersHeadingCount', { count: list.total }) : i18n.t('sellerMsg.ordersHeading')}
      </Text>
    </View>
  );

  let body: ReactElement | null = null;
  if (list.loading && list.items.length === 0) {
    body = <LoadingState text={t('sellerAuto.loadingOrders')} style={styles.stateWrap} />;
  } else if (list.error && list.items.length === 0) {
    body = <ErrorState error={list.error} onRetry={list.retry} style={styles.stateWrap} />;
  } else if (list.items.length === 0) {
    body = (
      <EmptyState
        icon={packageBold}
        title={t('customer.noOrdersFound')}
        message={hasFilters ? t('sellerAuto.noOrdersMatchYourSearch') : t('sellerAuto.youHaveNotReceivedAny')}
        style={styles.stateWrap}
      />
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
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
        visible={dateModal !== null}
        title={dateModal === 'completion' ? t('sellerAuto.completionDate2') : t('sellerAuto.orderDate2')}
        from={dateModal === 'completion' ? completionRange.from : orderRange.from}
        to={dateModal === 'completion' ? completionRange.to : orderRange.to}
        onApply={(from, to) => {
          if (dateModal === 'completion') setCompletionRange({ from, to });
          else setOrderRange({ from, to });
          setDateModal(null);
        }}
        onClose={() => setDateModal(null)}
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

const styles = StyleSheet.create({
  screen: { flex: 1 },
  container: { paddingHorizontal: 16, paddingTop: 14, flexGrow: 1 },
  flex1: { flex: 1 },
  rotated: { transform: [{ rotate: '180deg' }] },
  separator: { height: 14 },
  stateWrap: { paddingVertical: 40 },
  headerWrap: { gap: 12, marginBottom: 14 },
  mainTitle: { fontFamily: fonts.bold, fontSize: 26 },
  mainSub: { fontFamily: fonts.regular, fontSize: 13, marginTop: -6 },
  topBtnRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
  topActionBtn: {
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topActionText: { fontFamily: fonts.medium, fontSize: 13, textAlign: 'center' },
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
  dropdownContainer: {},
  dropdownBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 44,
  },
  dropdownText: { fontFamily: fonts.regular, fontSize: 13 },
  dropdownMenu: { marginTop: 6, borderRadius: 10, borderWidth: 1, overflow: 'hidden' },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dropdownItemBorder: { borderBottomWidth: 1 },
  dropdownItemText: { fontSize: 13 },
  ordersHeading: { fontFamily: fonts.bold, fontSize: 18, marginTop: 4 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 10 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  orderNo: { flexShrink: 1, fontFamily: fonts.bold, fontSize: 15 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontFamily: fonts.bold, fontSize: 11 },
  divider: { height: 1 },
  dataRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  rowLabel: { flexShrink: 1, fontFamily: fonts.regular, fontSize: 13 },
  rowValue: { flexShrink: 1, textAlign: 'right', fontFamily: fonts.medium, fontSize: 13 },
  itemLine: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  itemText: { flex: 1 },
  itemTitle: { textAlign: 'left' },
  rowSub: { fontFamily: fonts.regular, fontSize: 11, marginTop: 2 },
  totalValue: { fontFamily: fonts.bold, fontSize: 15 },
});
