import { useEffect, useRef, useState } from 'react';
import { formatMoney } from '@/utils/money';
import {
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';

import CtiLoader from '@/components/CtiLoader';
import Icon from '@/components/Icon';
import Button from '@/components/Button';
import ConfirmModal from '@/components/ConfirmModal';
import AlertModal from '@/components/AlertModal';
import Squeeze from '@/components/Squeeze';
import { FadeUp } from '@/animations';
import {
  arrowLeftBold,
  chevronDownBold,
  mapPinBold,
  packageBold,
  searchBold,
  tagBold,
  uploadBold,
} from '@/assets/icons';
import { ctiLogo } from '@/assets/images';
import ProductThumb from '@/components/ProductThumb';
import { useTheme } from '@/theme/ThemeContext';
import { badges } from '@/theme/colors';
import { fonts } from '@/theme/fonts';
import {
  getAllCustomerOrdersPage,
  getCustomerOrdersPage,
  getCustomerReturnsApi,
  cancelCustomerOrder,
  MobileOrder,
} from '../services/orderApi';
import { normalizeApiError } from '@/services/apiError';
import { formatDate } from '@/utils/dateFormat';
import { subscribeOrderStatus, useOrderStatusChecker } from '../utils/orderLive';
import useRefreshOnActive from '@/utils/useRefreshOnActive';
import { upper } from '@/i18n/locale';
import { useTranslation } from 'react-i18next';
import { statusLabel } from '@/utils/labels';
import i18n from '@/i18n';

const money = (n: number) => formatMoney(n);

function StatusPill({ label, badge }: { label: string; badge: { bg: string; text: string } }) {
  return (
    <View style={[styles.pill, { backgroundColor: badge.bg }]}>
      <Text style={[styles.pillText, { color: badge.text }]}>{upper(statusLabel(label))}</Text>
    </View>
  );
}

function OrderCard({
  order,
  index,
  onViewAll,
  onCancel,
}: {
  order: MobileOrder;
  index: number;
  onViewAll: () => void;
  onCancel?: () => void;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  // The design shows the first card open and the rest collapsed.
  const [open, setOpen] = useState(index === 0);

  const getStatusBadge = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s.includes('deliver') || s === 'paid' || s.includes('success')) return badges.accepted;
    if (s.includes('cancel') || s.includes('fail')) return badges.dispute;
    if (s.includes('shipp')) return badges.booked;
    return badges.inProgress;
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.cardHead}>
        <Text style={[styles.orderId, { color: colors.text }]}>{order.orderId}</Text>
        <Squeeze onPress={() => setOpen(!open)} scale={0.85}>
          <View style={[styles.chevronBtn, { backgroundColor: colors.surfaceAlt }]}>
            <Icon
              source={chevronDownBold}
              size={16}
              color={colors.text}
              style={open && styles.chevronFlipped}
            />
          </View>
        </Squeeze>
      </View>

      <Text style={[styles.orderNo, { color: colors.textMuted }]}>{order.orderNo}</Text>

      <View style={styles.tags}>
        <StatusPill label={order.statusTag} badge={getStatusBadge(order.statusTag)} />
        <StatusPill label={order.paymentTag} badge={getStatusBadge(order.paymentTag)} />
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <View style={styles.row}>
        <View style={styles.rowCol}>
          <Text style={[styles.rowLabel, { color: colors.textMuted }]}>{t('customer.date')}</Text>
          <Text style={[styles.rowValue, { color: colors.text }]}>{order.date}</Text>
          <Text style={[styles.rowSub, { color: colors.textMuted }]}>{order.time}</Text>
        </View>
        <View style={[styles.rowCol, styles.rowColEnd]}>
          <Text style={[styles.rowLabel, { color: colors.textMuted }]}>{t('customer.item')}</Text>
          <Text style={[styles.rowValue, { color: colors.text }]}>
            {order.itemCount} {order.itemCount === 1 ? 'item' : 'items'}
          </Text>
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.rowCol}>
          <Text style={[styles.rowLabel, { color: colors.textMuted }]}>{t('customer.total')}</Text>
          <Text style={[styles.rowValue, { color: colors.primary, fontFamily: fonts.bold }]}>
            {money(order.total)}
          </Text>
        </View>
        <View style={[styles.rowCol, styles.rowColEnd]}>
          <Text style={[styles.rowLabel, { color: colors.textMuted }]}>{t('customer.payment')}</Text>
          <Text style={[styles.rowValue, { color: colors.text }]}>{order.paymentStatus}</Text>
        </View>
      </View>

      {open && (
        <>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('customer.orderItems')}</Text>
          {(order.items || []).map((item, idx) => {
            const variantStr =
              typeof item.variant === 'string'
                ? item.variant
                : typeof item.variant === 'object' && item.variant !== null
                ? Object.values(item.variant).filter(v => typeof v === 'string' || typeof v === 'number').join(' / ')
                : '';

            return (
              <View key={item.id || String(idx)} style={styles.item}>
                <ProductThumb uri={item.image} size={44} radius={8} />
                <View style={styles.itemText}>
                  <Text style={[styles.itemName, { color: colors.text }]}>
                    {String(item.name || '')}
                  </Text>
                  {variantStr ? (
                    <Text style={[styles.itemVariant, { color: colors.textMuted }]}>
                      {variantStr}
                    </Text>
                  ) : null}
                  <Text style={[styles.itemQty, { color: colors.textMuted }]}>
                    {t('customerMsg.qtyEach', { qty: item.qty || 1, price: money(item.price) })}
                  </Text>
                </View>
                <View style={styles.itemPriceCol}>
                  <Text style={[styles.itemPrice, { color: colors.text }]}>
                    {money((item.price || 0) * (item.qty || 1))}
                  </Text>
                  <Text style={[styles.rowSub, { color: colors.textMuted }]}>{i18n.t('customer.subtotal')}</Text>
                </View>
              </View>
            );
          })}
        </>
      )}

      <Pressable onPress={onViewAll} hitSlop={6} style={{ marginTop: 8 }}>
        <Text style={[styles.viewAll, { color: colors.primary }]}>{t('customer.viewDetailsAndTracking')}</Text>
      </Pressable>

      {onCancel ? (
        <Button title={t('customer.cancelOrder')} size="sm" variant="outline" onPress={onCancel} style={{ marginTop: 10 }} />
      ) : null}
    </View>
  );
}

function ReturnCard({ item }: { item: any }) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.cardHead}>
        <Text style={[styles.orderId, { color: colors.text }]}>{String(item.returnId || '')}</Text>
        {item.status ? <StatusPill label={String(item.status)} badge={badges.inProgress} /> : null}
      </View>

      {item.device ? (
        <Text style={[styles.itemName, { color: colors.text, marginTop: 6 }]}>{String(item.device)}</Text>
      ) : null}

      <Text style={[styles.returnNote, { color: colors.textMuted }]}>
        {t('customerMsg.returnNote', { orderNo: String(item.orderNo || ''), amount: money(item.amount) })}
        {'\n'}
        {String(item.date || '')} {String(item.note || '')}
      </Text>

    </View>
  );
}

export default function OrdersScreen({ navigation }: any) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<'orders' | 'returns'>('orders');
  const [orderType, setOrderType] = useState<'all' | 'marketplace' | 'refurbished'>('all');
  const [search, setSearch] = useState('');
  const [orders, setOrders] = useState<MobileOrder[]>([]);
  const [returnsList, setReturnsList] = useState<any[]>([]);
  const [returnsFailed, setReturnsFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [cancellingOrder, setCancellingOrder] = useState<MobileOrder | null>(null);
  const cancelBusy = useRef(false);
  const [modal, setModal] = useState({
    visible: false,
    type: 'success' as 'success' | 'error',
    title: '',
    message: '',
  });

  const requestId = useRef(0);

  const fetchPage = (type: 'all' | 'marketplace' | 'refurbished', pageNo: number, text: string) =>
    type === 'all'
      ? getAllCustomerOrdersPage({ page: pageNo, search: text })
      : getCustomerOrdersPage({ page: pageNo, search: text, isRefurbished: type === 'refurbished' });

  const fetchReturns = async (type: 'all' | 'marketplace' | 'refurbished') => {
    const lists = await Promise.all([
      type !== 'refurbished' ? getCustomerReturnsApi(false) : Promise.resolve([]),
      type !== 'marketplace' ? getCustomerReturnsApi(true) : Promise.resolve([]),
    ]);
    return lists.flat();
  };

  const mapReturn = (ret: any, idx: number) => ({
    id: ret._id || 'ret-' + idx,
    returnId: ret._id ? '#' + String(ret._id).slice(-6).toUpperCase() : '',
    device: ret.items?.[0]?.productId?.title || ret.orderId?.items?.[0]?.productId?.title || '',
    orderNo: ret.orderId?.orderNo || ret.orderId?.orderId || ret.orderNo || '',
    amount: Number(ret.refundAmount || ret.amount || 0),
    date: ret.createdAt ? formatDate(ret.createdAt) : '',
    note: ret.reason || '',
    status: ret.returnStatus ? String(ret.returnStatus) : '',
  });

  const loadOrders = async (type = orderType, silent = false, text = search) => {
    const myRequest = ++requestId.current;
    if (!silent) {
      setLoading(true);
      setLoadError('');
    }
    // Orders and returns load on their own: a failed returns request does not hide the orders
    const [ordersResult, returnsResult] = await Promise.allSettled([fetchPage(type, 1, text), fetchReturns(type)]);
    if (myRequest !== requestId.current) return;

    if (ordersResult.status === 'fulfilled') {
      setOrders(ordersResult.value.orders);
      setPage(1);
      setHasMore(ordersResult.value.pages > 1);
      setLoadError('');
    } else if (!silent) {
      // never show "no orders" when the request failed
      setOrders([]);
      setLoadError(normalizeApiError(ordersResult.reason).message);
    }

    if (returnsResult.status === 'fulfilled') {
      setReturnsList(returnsResult.value.map(mapReturn));
      setReturnsFailed(false);
    } else if (!silent) {
      setReturnsFailed(true);
    }

    setLoading(false);
    setRefreshing(false);
    markLoaded();
  };

  const loadMore = async () => {
    if (loadingMore || loading || !hasMore) return;
    const myRequest = requestId.current;
    setLoadingMore(true);
    try {
      const next = await fetchPage(orderType, page + 1, search);
      if (myRequest !== requestId.current) return;
      setOrders(prev => {
        const seen = new Set(prev.map(o => o.id));
        return [...prev, ...next.orders.filter(o => !seen.has(o.id))];
      });
      setPage(page + 1);
      setHasMore(page + 1 < next.pages);
    } catch (err) {
      setModal({ visible: true, type: 'error', title: i18n.t('customer.couldNotLoadMoreOrders'), message: normalizeApiError(err).message });
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    loadOrders();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Search runs on the server (order number or order id); typing waits a moment
  const firstSearch = useRef(true);
  useEffect(() => {
    if (firstSearch.current) {
      firstSearch.current = false;
      return;
    }
    const timer = setTimeout(() => loadOrders(orderType, false, search), 450);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // A seller changed an order: reload quietly now if this screen is open, or when it comes back into view
  const isFocused = useIsFocused();
  const reloadQuietly = () => {
    loadOrders(orderType, true);
  };
  const reloadRef = useRef(reloadQuietly);
  const focusedRef = useRef(isFocused);
  reloadRef.current = reloadQuietly;
  focusedRef.current = isFocused;
  const orderStatusChanged = useOrderStatusChecker();
  const markLoaded = useRefreshOnActive(isFocused, reloadQuietly, orderStatusChanged);

  useEffect(
    () =>
      subscribeOrderStatus(() => {
        if (focusedRef.current && orderStatusChanged()) reloadRef.current();
      }),
    [orderStatusChanged],
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadOrders();
  };

  const filteredOrders = orders.filter(o => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const matchId = String(o.orderId || '').toLowerCase().includes(q);
    const matchNo = String(o.orderNo || '').toLowerCase().includes(q);
    const matchItems = (o.items || []).some(item =>
      String(item.name || '').toLowerCase().includes(q),
    );
    return matchId || matchNo || matchItems;
  });

  const goToDetail = (order: MobileOrder) => {
    navigation.navigate('OrderDetail', { orderId: order.id, isRefurbished: order.isRefurbished, order });
  };

  // The backend only cancels orders that are still pending
  const isPending = (order: MobileOrder) => String(order.statusTag).toLowerCase() === 'pending';

  const handleCancelOrder = async () => {
    const target = cancellingOrder;
    if (!target || cancelBusy.current) return;
    cancelBusy.current = true;
    setCancellingOrder(null);
    try {
      const res = await cancelCustomerOrder(target.id, target.isRefurbished);
      setModal({
        visible: true,
        type: 'success',
        title: i18n.t('customer.orderCancelled'),
        message: res.message || i18n.t('customer.yourOrderWasCancelled'),
      });
      loadOrders(orderType, true);
    } catch (err: any) {
      setModal({
        visible: true,
        type: 'error',
        title: i18n.t('customer.cancelFailed'),
        message: normalizeApiError(err).message,
      });
      loadOrders(orderType, true);
    } finally {
      cancelBusy.current = false;
    }
  };

  const latestOrder = filteredOrders[0] || orders[0];

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Image source={ctiLogo} resizeMode="contain" style={styles.logo} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 30 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }>
        <Squeeze onPress={() => navigation.goBack()} scale={0.9} style={styles.backWrap}>
          <View style={[styles.back, { backgroundColor: colors.primary }]}>
            <Icon source={arrowLeftBold} size={20} color={colors.onPrimary} />
          </View>
        </Squeeze>

        <Text style={[styles.title, { color: colors.text }]}>{t('settings.menu.myOrders')}</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          {t('customer.trackAndManageAllYour')}
        </Text>

        {/* Purchase Type Filter (All / Marketplace / Refurbished Store matching Next.js) */}
        <View style={styles.orderTypeRow}>
          {[
            { key: 'all', label: t('customer.allOrders') },
            { key: 'marketplace', label: t('customer.marketplace') },
            { key: 'refurbished', label: t('customer.refurbishedStore') },
          ].map(option => {
            const isActive = orderType === option.key;
            return (
              <TouchableOpacity
                key={option.key}
                onPress={() => {
                  setOrderType(option.key as any);
                  loadOrders(option.key as any, false, search);
                }}
                style={[
                  styles.orderTypePill,
                  {
                    backgroundColor: isActive ? colors.primary : colors.surfaceAlt,
                    borderColor: isActive ? colors.primary : colors.border + '33',
                  },
                ]}>
                <Text
                  style={[
                    styles.orderTypePillText,
                    {
                      color: isActive ? '#FFFFFF' : colors.textMuted,
                      fontFamily: isActive ? fonts.bold : fonts.medium,
                    },
                  ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.segment}>
          <Squeeze onPress={() => setTab('orders')} style={styles.segmentItemWrap}>
            <View
              style={[
                styles.segmentItem,
                {
                  backgroundColor: tab === 'orders' ? colors.surface : colors.surfaceAlt,
                  borderColor: tab === 'orders' ? colors.border : 'transparent',
                },
              ]}>
              <Icon source={packageBold} size={16} color={colors.text} />
              <Text style={[styles.segmentText, { color: colors.text }]}>{t('settings.menu.myOrders')}</Text>
            </View>
          </Squeeze>

          <Squeeze onPress={() => setTab('returns')} style={styles.segmentItemWrap}>
            <View
              style={[
                styles.segmentItem,
                {
                  backgroundColor: tab === 'returns' ? colors.surface : colors.surfaceAlt,
                  borderColor: tab === 'returns' ? colors.border : 'transparent',
                },
              ]}>
              <Icon source={uploadBold} size={16} color={colors.text} />
              <Text style={[styles.segmentText, { color: colors.text }]}>{t('customer.myReturns')}</Text>
            </View>
          </Squeeze>
        </View>

        <View style={[styles.search, { borderColor: colors.border, backgroundColor: colors.surfaceAlt }]}>
          <Icon source={searchBold} size={18} color={colors.textMuted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={t('customer.searchOrderOrProduct')}
            placeholderTextColor={colors.textMuted}
            style={[styles.searchInput, { color: colors.text }]}
          />
        </View>

        {loading ? (
          <CtiLoader
            size="md"
            text={t('customer.loadingYourOrders')}
            style={styles.loaderWrap}
          />
        ) : tab === 'orders' && loadError ? (
          <View style={styles.emptyWrap}>
            <Icon source={packageBold} size={42} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>{t('customer.couldNotLoadYourOrders')}</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>{loadError}</Text>
            <Button title={t('customer.tryAgain')} size="sm" onPress={() => loadOrders()} style={{ marginTop: 12 }} />
          </View>
        ) : tab === 'orders' ? (
          filteredOrders.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Icon source={packageBold} size={42} color={colors.textMuted} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>{t('customer.noOrdersFound')}</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                {search ? t('customer.noOrdersMatchYourSearch') : t('customer.youHaveNotPlacedAny')}
              </Text>
            </View>
          ) : (
            filteredOrders.map((order, index) => (
              <FadeUp key={order.id} delay={60 + index * 50} duration={400} style={styles.cardWrap}>
                <OrderCard
                  order={order}
                  index={index}
                  onViewAll={() => goToDetail(order)}
                  onCancel={isPending(order) ? () => setCancellingOrder(order) : undefined}
                />
              </FadeUp>
            ))
          )
        ) : returnsFailed ? (
          <View style={styles.emptyWrap}>
            <Icon source={packageBold} size={42} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>{t('customer.couldNotLoadYourReturns')}</Text>
            <Button title={t('customer.tryAgain')} size="sm" onPress={() => loadOrders()} style={{ marginTop: 12 }} />
          </View>
        ) : returnsList.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Icon source={packageBold} size={42} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>{t('customer.noReturnRequests')}</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
              {t('customer.youHaveNotSubmittedAny')}
            </Text>
          </View>
        ) : (
          returnsList.map((item, index) => (
            <FadeUp key={item.id} delay={60 + index * 50} duration={400} style={styles.cardWrap}>
              <ReturnCard item={item} />
            </FadeUp>
          ))
        )}

        {tab === 'orders' && hasMore && !loadError && filteredOrders.length > 0 ? (
          <Button
            title={t('customer.loadMoreOrders')}
            variant="soft"
            size="sm"
            loading={loadingMore}
            onPress={loadMore}
            style={{ marginTop: 14 }}
          />
        ) : null}

        {tab === 'orders' && latestOrder && !loadError && (
          <FadeUp delay={100} duration={500} style={styles.cardWrap}>
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.summaryHead}>
                <Icon source={mapPinBold} size={16} color={colors.text} />
                <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 0 }]}>
                  {t('customer.shippingAddress')}
                </Text>
              </View>
              <Text style={[styles.text, { color: colors.textMuted }]}>
                {latestOrder.shippingAddress || '-'}
              </Text>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              <View style={styles.summaryHead}>
                <Icon source={tagBold} size={16} color={colors.text} />
                <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 0 }]}>
                  {t('customer.recentOrderSummary')}
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={[styles.text, { color: colors.textMuted, marginTop: 0 }]}>{t('customer.subtotal')}</Text>
                <Text style={[styles.text, { color: colors.text, marginTop: 0 }]}>
                  {money(latestOrder.subtotal || latestOrder.total)}
                </Text>
              </View>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <View style={styles.row}>
                <Text style={[styles.rowValue, { color: colors.text }]}>{t('customer.total')}</Text>
                <Text style={[styles.rowValue, { color: colors.primary, fontFamily: fonts.bold }]}>
                  {money(latestOrder.total)}
                </Text>
              </View>

              <View style={styles.summaryActions}>
                <Button
                  title={t('customer.returns')}
                  variant="soft"
                  color={colors.error}
                  size="sm"
                  onPress={() => setTab('returns')}
                  style={styles.summaryAction}
                />
              </View>
            </View>
          </FadeUp>
        )}
      </ScrollView>

      <ConfirmModal
        visible={Boolean(cancellingOrder)}
        title={t('customer.cancelOrder')}
        message={t('customerMsg.cancelOrderConfirm', { orderNo: cancellingOrder?.orderNo || '' })}
        cancelText={t('settings.notNow')}
        confirmText={t('customer.yesCancelOrder')}
        danger
        onCancel={() => setCancellingOrder(null)}
        onConfirm={handleCancelOrder}
      />

      <AlertModal
        visible={modal.visible}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        onClose={() => setModal(m => ({ ...m, visible: false }))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  logo: { width: 110, height: 59 },

  body: { paddingHorizontal: 20 },
  backWrap: { alignSelf: 'flex-start' },
  back: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: fonts.bold, fontSize: 26, marginTop: 6 },
  subtitle: { fontFamily: fonts.regular, fontSize: 13, marginTop: 4 },

  orderTypeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
    marginBottom: 4,
  },
  orderTypePill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  orderTypePillText: {
    fontSize: 12,
  },
  segment: { flexDirection: 'row', gap: 10, marginTop: 16 },
  segmentItemWrap: { flex: 1 },
  segmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 12,
  },
  segmentText: { flexShrink: 1, fontFamily: fonts.medium, fontSize: 13 },

  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    marginTop: 14,
  },
  searchInput: { flex: 1, fontFamily: fonts.regular, fontSize: 13, padding: 0 },

  filters: { flexDirection: 'row', gap: 10, marginTop: 12 },
  filter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  filterIcon: { width: 20, height: 20, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  filterText: { flex: 1, fontFamily: fonts.regular, fontSize: 13 },

  cardWrap: { marginTop: 14 },
  card: { borderRadius: 14, borderWidth: 1, padding: 16 },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderId: { fontFamily: fonts.bold, fontSize: 15, flex: 1 },
  orderNo: { fontFamily: fonts.regular, fontSize: 12, marginTop: 4 },
  chevronBtn: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  chevronFlipped: { transform: [{ rotate: '180deg' }] },

  tags: { flexDirection: 'row', gap: 8, marginTop: 10 },
  pill: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5 },
  pillText: { fontFamily: fonts.bold, fontSize: 11 },

  divider: { height: 1, marginVertical: 12 },

  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  rowCol: { gap: 3 },
  rowColEnd: { alignItems: 'flex-end' },
  rowLabel: { fontFamily: fonts.regular, fontSize: 11 },
  rowValue: { flexShrink: 1, fontFamily: fonts.bold, fontSize: 13 },
  rowSub: { fontFamily: fonts.regular, fontSize: 11 },

  sectionTitle: { flexShrink: 1, fontFamily: fonts.bold, fontSize: 14, marginTop: 16 },
  summaryHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  text: { flexShrink: 1, fontFamily: fonts.regular, fontSize: 13, marginTop: 8 },

  item: { flexDirection: 'row', gap: 10, marginTop: 12 },
  itemText: { flex: 1, gap: 2 },
  itemName: { fontFamily: fonts.bold, fontSize: 13 },
  itemVariant: { fontFamily: fonts.regular, fontSize: 11, lineHeight: 15 },
  itemQty: { fontFamily: fonts.regular, fontSize: 11 },
  itemPriceCol: { alignItems: 'flex-end', gap: 2 },
  itemPrice: { fontFamily: fonts.bold, fontSize: 13 },

  viewAll: { fontFamily: fonts.bold, fontSize: 13, marginTop: 16 },

  returnNote: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 18, marginTop: 8 },

  summaryActions: { flexDirection: 'row', gap: 12, marginTop: 18 },
  summaryAction: { flex: 1 },

  loaderWrap: { paddingVertical: 40, alignItems: 'center', justifyContent: 'center' },
  loaderText: { fontFamily: fonts.regular, fontSize: 13, marginTop: 10 },
  emptyWrap: { paddingVertical: 40, alignItems: 'center', justifyContent: 'center', gap: 6 },
  emptyTitle: { fontFamily: fonts.bold, fontSize: 16, marginTop: 8 },
  emptySubtitle: { fontFamily: fonts.regular, fontSize: 12, textAlign: 'center', paddingHorizontal: 20 },
});
