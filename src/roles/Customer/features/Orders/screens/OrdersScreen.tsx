import { useEffect, useState } from 'react';
import {
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
import { useTheme } from '@/theme/ThemeContext';
import { badges } from '@/theme/colors';
import { fonts } from '@/theme/fonts';
import {
  getCustomerOrders,
  getCustomerReturnsApi,
  cancelCustomerOrder,
  MobileOrder,
} from '../services/orderApi';

const money = (n: number) => `$${Number(n || 0).toFixed(2)}`;

function StatusPill({ label, badge }: { label: string; badge: { bg: string; text: string } }) {
  return (
    <View style={[styles.pill, { backgroundColor: badge.bg }]}>
      <Text style={[styles.pillText, { color: badge.text }]}>{label}</Text>
    </View>
  );
}

function OrderCard({
  order,
  index,
  onViewAll,
}: {
  order: MobileOrder;
  index: number;
  onViewAll: () => void;
}) {
  const { colors } = useTheme();
  // The design shows the first card open and the rest collapsed.
  const [open, setOpen] = useState(index === 0);

  const getStatusBadge = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s.includes('deliver') || s.includes('paid') || s.includes('success')) return badges.accepted;
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
          <Text style={[styles.rowLabel, { color: colors.textMuted }]}>Date</Text>
          <Text style={[styles.rowValue, { color: colors.text }]}>{order.date}</Text>
          <Text style={[styles.rowSub, { color: colors.textMuted }]}>{order.time}</Text>
        </View>
        <View style={[styles.rowCol, styles.rowColEnd]}>
          <Text style={[styles.rowLabel, { color: colors.textMuted }]}>Item</Text>
          <Text style={[styles.rowValue, { color: colors.text }]}>
            {order.itemCount} {order.itemCount === 1 ? 'item' : 'items'}
          </Text>
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.rowCol}>
          <Text style={[styles.rowLabel, { color: colors.textMuted }]}>Total</Text>
          <Text style={[styles.rowValue, { color: colors.primary, fontFamily: fonts.bold }]}>
            {money(order.total)}
          </Text>
        </View>
        <View style={[styles.rowCol, styles.rowColEnd]}>
          <Text style={[styles.rowLabel, { color: colors.textMuted }]}>Payment</Text>
          <Text style={[styles.rowValue, { color: colors.text }]}>{order.paymentStatus}</Text>
        </View>
      </View>

      {open && (
        <>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Order Items</Text>
          {(order.items || []).map((item, idx) => {
            const variantStr =
              typeof item.variant === 'string'
                ? item.variant
                : typeof item.variant === 'object' && item.variant !== null
                ? Object.values(item.variant).filter(v => typeof v === 'string' || typeof v === 'number').join(' / ') || 'Standard'
                : 'Standard';

            return (
              <View key={item.id || String(idx)} style={styles.item}>
                <Image
                  source={{
                    uri:
                      item.image && typeof item.image === 'string' && item.image.startsWith('http')
                        ? item.image
                        : 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80',
                  }}
                  style={styles.itemImage}
                />
                <View style={styles.itemText}>
                  <Text style={[styles.itemName, { color: colors.text }]}>
                    {String(item.name || 'Purchased Item')}
                  </Text>
                  <Text style={[styles.itemVariant, { color: colors.textMuted }]}>
                    {variantStr}
                  </Text>
                  <Text style={[styles.itemQty, { color: colors.textMuted }]}>
                    Qty: {item.qty || 1} · {money(item.price)} each
                  </Text>
                </View>
                <View style={styles.itemPriceCol}>
                  <Text style={[styles.itemPrice, { color: colors.text }]}>
                    {money((item.price || 0) * (item.qty || 1))}
                  </Text>
                  <Text style={[styles.rowSub, { color: colors.textMuted }]}>Subtotal</Text>
                </View>
              </View>
            );
          })}
        </>
      )}

      <Pressable onPress={onViewAll} hitSlop={6} style={{ marginTop: 8 }}>
        <Text style={[styles.viewAll, { color: colors.primary }]}>View details & tracking →</Text>
      </Pressable>
    </View>
  );
}

function ReturnCard({ item, onViewAll }: { item: any; onViewAll: () => void }) {
  const { colors } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.cardHead}>
        <Text style={[styles.orderId, { color: colors.text }]}>{String(item.returnId || 'RET-000000')}</Text>
        <StatusPill label={String(item.status || 'REQUESTED')} badge={badges.inProgress} />
      </View>

      <Text style={[styles.itemName, { color: colors.text, marginTop: 6 }]}>
        {String(item.device || 'Returned Device')}
      </Text>

      <Text style={[styles.returnNote, { color: colors.textMuted }]}>
        Order: {String(item.orderNo || '')} Amount: ${Number(item.amount || 0).toFixed(2)}
        {'\n'}
        {String(item.date || '')} {String(item.note || '')}
      </Text>

      <Pressable onPress={onViewAll} hitSlop={6}>
        <Text style={[styles.viewAll, { color: colors.primary }]}>View all  →</Text>
      </Pressable>
    </View>
  );
}

export default function OrdersScreen({ navigation }: any) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<'orders' | 'returns'>('orders');
  const [search, setSearch] = useState('');
  const [orders, setOrders] = useState<MobileOrder[]>([]);
  const [returnsList, setReturnsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cancellingOrder, setCancellingOrder] = useState<MobileOrder | null>(null);
  const [modal, setModal] = useState({
    visible: false,
    type: 'success' as 'success' | 'error',
    title: '',
    message: '',
  });

  const loadOrders = async () => {
    try {
      const [ordersData, returnsData] = await Promise.all([
        getCustomerOrders({ search }),
        getCustomerReturnsApi().catch(() => []),
      ]);
      setOrders(ordersData);

      if (Array.isArray(returnsData) && returnsData.length > 0) {
        const mapped = returnsData.map((ret: any, idx: number) => ({
          id: ret._id || `ret-${idx}`,
          returnId: `RET-${(ret._id || '000000').slice(-6).toUpperCase()}`,
          device:
            ret.items?.[0]?.productId?.title ||
            ret.orderId?.items?.[0]?.productId?.title ||
            'Returned Device',
          orderNo: ret.orderId?.orderNo || ret.orderId?.orderId || ret.orderNo || 'TRB-Order',
          amount: Number(ret.refundAmount || ret.amount || 0),
          date: ret.createdAt ? new Date(ret.createdAt).toLocaleDateString() : 'Recent',
          note: ret.reason || 'Return request under processing',
          status: (ret.returnStatus || 'Requested').toUpperCase(),
        }));
        setReturnsList(mapped);
      } else {
        setReturnsList([]);
      }
    } catch (err: any) {
      console.warn('Failed to load customer orders:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

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
    navigation.navigate('OrderDetail', { orderId: order.id, order });
  };

  const handleCancelOrder = async () => {
    if (!cancellingOrder) return;
    try {
      const isRefurbished = cancellingOrder.orderNo?.startsWith('REF-');
      await cancelCustomerOrder(cancellingOrder.id, isRefurbished);
      setCancellingOrder(null);
      setModal({
        visible: true,
        type: 'success',
        title: 'Order Cancelled',
        message: 'Your order cancellation request was processed successfully.',
      });
      loadOrders();
    } catch (err: any) {
      setCancellingOrder(null);
      setModal({
        visible: true,
        type: 'error',
        title: 'Cancel Failed',
        message: err.message || 'Could not cancel this order.',
      });
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

        <Text style={[styles.title, { color: colors.text }]}>My Orders</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          Track and manage all your purchases
        </Text>

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
              <Text style={[styles.segmentText, { color: colors.text }]}>My Orders</Text>
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
              <Text style={[styles.segmentText, { color: colors.text }]}>My Returns</Text>
            </View>
          </Squeeze>
        </View>

        <View style={[styles.search, { borderColor: colors.border, backgroundColor: colors.surfaceAlt }]}>
          <Icon source={searchBold} size={18} color={colors.textMuted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search order or product"
            placeholderTextColor={colors.textMuted}
            style={[styles.searchInput, { color: colors.text }]}
          />
        </View>

        {loading ? (
          <CtiLoader
            size="md"
            text="Loading your orders..."
            style={styles.loaderWrap}
          />
        ) : tab === 'orders' ? (
          filteredOrders.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Icon source={packageBold} size={42} color={colors.textMuted} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No Orders Found</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                {search ? 'No orders match your search filter.' : 'You have not placed any orders yet.'}
              </Text>
            </View>
          ) : (
            filteredOrders.map((order, index) => (
              <FadeUp key={order.id} delay={60 + index * 50} duration={400} style={styles.cardWrap}>
                <OrderCard order={order} index={index} onViewAll={() => goToDetail(order)} />
              </FadeUp>
            ))
          )
        ) : returnsList.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Icon source={packageBold} size={42} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Return Requests</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
              You have not submitted any return requests yet.
            </Text>
          </View>
        ) : (
          returnsList.map((item, index) => (
            <FadeUp key={item.id} delay={60 + index * 50} duration={400} style={styles.cardWrap}>
              <ReturnCard item={item} onViewAll={() => {}} />
            </FadeUp>
          ))
        )}

        {tab === 'orders' && latestOrder && (
          <FadeUp delay={100} duration={500} style={styles.cardWrap}>
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.summaryHead}>
                <Icon source={mapPinBold} size={16} color={colors.text} />
                <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 0 }]}>
                  Shipping Address
                </Text>
              </View>
              <Text style={[styles.text, { color: colors.textMuted }]}>
                {latestOrder.shippingAddress || 'No shipping address provided'}
              </Text>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              <View style={styles.summaryHead}>
                <Icon source={tagBold} size={16} color={colors.text} />
                <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 0 }]}>
                  Recent Order Summary
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={[styles.text, { color: colors.textMuted, marginTop: 0 }]}>Subtotal</Text>
                <Text style={[styles.text, { color: colors.text, marginTop: 0 }]}>
                  {money(latestOrder.subtotal || latestOrder.total)}
                </Text>
              </View>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <View style={styles.row}>
                <Text style={[styles.rowValue, { color: colors.text }]}>Total</Text>
                <Text style={[styles.rowValue, { color: colors.primary, fontFamily: fonts.bold }]}>
                  {money(latestOrder.total)}
                </Text>
              </View>

              <View style={styles.summaryActions}>
                <Button
                  title="Cancel Order"
                  size="sm"
                  variant="outline"
                  onPress={() => setCancellingOrder(latestOrder)}
                  style={styles.summaryAction}
                />
                <Button
                  title="Returns"
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
        title="Cancel Order"
        message={`Are you sure you want to cancel order ${cancellingOrder?.orderNo || ''}?`}
        cancelText="Not now"
        confirmText="Yes, Cancel Order"
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
  segmentText: { fontFamily: fonts.medium, fontSize: 13 },

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
  rowValue: { fontFamily: fonts.bold, fontSize: 13 },
  rowSub: { fontFamily: fonts.regular, fontSize: 11 },

  sectionTitle: { fontFamily: fonts.bold, fontSize: 14, marginTop: 16 },
  summaryHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  text: { fontFamily: fonts.regular, fontSize: 13, marginTop: 8 },

  item: { flexDirection: 'row', gap: 10, marginTop: 12 },
  itemImage: { width: 44, height: 44, borderRadius: 8 },
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
