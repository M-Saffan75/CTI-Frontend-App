import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
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
import { packageBold, searchBold } from '@/assets/icons';
import repairmanApi, {
  PartsOrder,
  PartsOrdersPage,
} from '@/roles/Repairman/api/repairmanApi';
import {
  subscribeOffersChanged,
  useOffersChangedChecker,
} from '@/roles/Repairman/utils/offerEvents';
import usePagedList from '@/roles/Seller/utils/usePagedList';
import { formatMoney } from '@/utils/money';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import Select from '../../../components/Select';
import PartsOrderCard from '../components/PartsOrderCard';
import {
  ORDER_STATUS_OPTIONS,
  PAYMENT_STATUS_OPTIONS,
  SHIPPING_OPTIONS,
} from '../utils/parts';
import { useTranslation } from 'react-i18next';

const PAGE_SIZE = 10;
const SEARCH_DELAY_MS = 450;

type Option = { label: string; value: string };

function Tile({ label, value }: { label: string; value: string | number }) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.tile,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <Icon source={packageBold} size={14} color={colors.primary} />
      <Text
        style={[styles.tileValue, { color: colors.primary }]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>
      <Text style={[styles.tileLabel, { color: colors.textMuted }]}>
        {label}
      </Text>
    </View>
  );
}

export default function PartsOrderContent({ navigation }: { navigation: any }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const focused = useIsFocused();

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState<Option | null>(null);
  const [payment, setPayment] = useState<Option | null>(null);
  const [shipping, setShipping] = useState<Option | null>(null);

  useEffect(() => {
    const timer = setTimeout(
      () => setDebouncedSearch(search.trim()),
      SEARCH_DELAY_MS,
    );
    return () => clearTimeout(timer);
  }, [search]);

  // Every filter goes to the backend, like the web
  const fetchPage = useCallback(
    async (page: number) => {
      const data = await repairmanApi.getPartsOrders({
        page,
        limit: PAGE_SIZE,
        search: debouncedSearch || undefined,
        orderStatus: status?.value,
        paymentStatus: payment?.value,
        shippingMethod: shipping?.value,
      });
      return {
        items: data.parts,
        totalPages: data.pagination.totalPages,
        totalItems: data.pagination.totalOrders,
        extra: data.summary,
      };
    },
    [debouncedSearch, status, payment, shipping],
  );

  const changed = useOffersChangedChecker();
  const list = usePagedList<PartsOrder, PartsOrdersPage['summary']>(
    fetchPage,
    focused,
    true,
    changed,
  );

  // An order was marked as received while this list is open: reload quietly
  const silentReloadRef = useRef(list.silentReload);
  silentReloadRef.current = list.silentReload;
  const focusedRef = useRef(focused);
  focusedRef.current = focused;
  useEffect(
    () =>
      subscribeOffersChanged(() => {
        if (focusedRef.current && changed()) silentReloadRef.current();
      }),
    [changed],
  );

  const summary = list.extra;
  const hasFilters = Boolean(debouncedSearch || status || payment || shipping);
  const clearFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setStatus(null);
    setPayment(null);
    setShipping(null);
  };

  const pick =
    (options: Option[], setter: (option: Option | null) => void) =>
    (label: string) =>
      setter(options.find(option => option.label === label) || null);

  const header = (
    <View>
      <Text style={[styles.title, { color: colors.text }]}>{t('repairman.partsOrders')}</Text>
      <Text style={[styles.subtitle, { color: colors.textMuted }]}>
        {t('repairman.manageAndTrackPartsOrders')}
      </Text>

      <View style={styles.tiles}>
        <Tile label={t('repairman.totalOrders')} value={summary?.totalOrders ?? 0} />
        <Tile label={t('repairman.pending')} value={summary?.pendingOrders ?? 0} />
        <Tile label={t('repairman.delivered')} value={summary?.deliveredOrders ?? 0} />
        <Tile
          label={t('customer.totalAmount')}
          value={formatMoney(summary?.totalAmount ?? 0)}
        />
      </View>

      <View style={styles.filters}>
        <View style={[styles.search, { borderColor: colors.border }]}>
          <Icon source={searchBold} size={18} color={colors.textMuted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={t('repairman.searchByOrderNumberOr')}
            placeholderTextColor={colors.textMuted}
            style={[styles.searchInput, { color: colors.text }]}
          />
        </View>
        <Select
          placeholder={t('repairman.allStatuses')}
          value={status?.label || null}
          options={ORDER_STATUS_OPTIONS.map(option => option.label)}
          onChange={pick(ORDER_STATUS_OPTIONS, setStatus)}
        />
        <View style={styles.row}>
          <Select
            placeholder={t('repairman.allPayments')}
            value={payment?.label || null}
            options={PAYMENT_STATUS_OPTIONS.map(option => option.label)}
            onChange={pick(PAYMENT_STATUS_OPTIONS, setPayment)}
          />
          <Select
            placeholder={t('repairman.allMethods')}
            value={shipping?.label || null}
            options={SHIPPING_OPTIONS.map(option => option.label)}
            onChange={pick(SHIPPING_OPTIONS, setShipping)}
          />
        </View>
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
    </View>
  );

  return (
    <View style={styles.flex}>
      <FlatList
        data={list.items}
        keyExtractor={order => order._id}
        renderItem={({ item }) => (
          <PartsOrderCard
            order={item}
            onOpen={() =>
              navigation.navigate('PartsOrderDetail', { orderId: item._id })
            }
          />
        )}
        ListHeaderComponent={header}
        ListEmptyComponent={
          list.loading ? (
            <LoadingState fullScreen={false} text={t('repairman.loadingPartsOrders')} />
          ) : list.error ? (
            <ErrorState
              error={list.error}
              onRetry={list.retry}
              fullScreen={false}
            />
          ) : (
            <EmptyState
              fullScreen={false}
              title={t('repairman.noOrdersFound')}
              message={
                hasFilters
                  ? t('repairman.tryAdjustingYourFilters')
                  : t('repairman.noOrdersHaveBeenPlaced')
              }
              icon={packageBold}
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
              endText={t('repairman.youHaveSeenAllOrders')}
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
    paddingHorizontal: 4,
    alignItems: 'center',
    gap: 4,
  },
  tileValue: { fontFamily: fonts.bold, fontSize: 15 },
  tileLabel: { fontFamily: fonts.regular, fontSize: 10, textAlign: 'center' },
  filters: { marginTop: 16, gap: 10 },
  row: { flexDirection: 'row', gap: 10 },
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
});
