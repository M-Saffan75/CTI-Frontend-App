import { useEffect, useState } from 'react';
import {
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import CtiLoader from '@/components/CtiLoader';
import Icon from '@/components/Icon';
import Button from '@/components/Button';
import Squeeze from '@/components/Squeeze';
import AlertModal, { AlertModalType } from '@/components/AlertModal';
import { FadeUp } from '@/animations';
import { arrowLeftBold, commentDotsBold, mapPinBold, packageBold, sendBold } from '@/assets/icons';
import { ctiLogo, demoProductPhoto } from '@/assets/images';
import { useTheme } from '@/theme/ThemeContext';
import { badges, palette } from '@/theme/colors';
import { fonts } from '@/theme/fonts';
import ContactSellerModal from '../components/ContactSellerModal';
import { getCustomerOrderDetail, MobileOrder } from '../services/orderApi';

const PROGRESS_STEPS = ['Pending', 'Processing', 'Shipping', 'Shipped', 'Delivered'];

const money = (n: number = 0) => `$${Number(n || 0).toFixed(2)}`;

function OrderItemImage({ uri, style }: { uri?: string; style?: any }) {
  const [loadError, setLoadError] = useState(false);
  const { colors } = useTheme();

  const hasValidUri = Boolean(
    !loadError &&
    uri &&
    typeof uri === 'string' &&
    uri.trim().length > 0 &&
    (uri.startsWith('http://') || uri.startsWith('https://')) &&
    !uri.includes('via.placeholder.com')
  );

  return (
    <View
      style={[
        style,
        {
          backgroundColor: colors.surfaceAlt,
          overflow: 'hidden',
          alignItems: 'center',
          justifyContent: 'center',
        },
      ]}>
      {hasValidUri ? (
        <Image
          source={{ uri }}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
          onError={() => setLoadError(true)}
        />
      ) : (
        <Image
          source={demoProductPhoto}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
        />
      )}
    </View>
  );
}

export default function OrderDetailScreen({ navigation, route }: any) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [contactOpen, setContactOpen] = useState(false);

  const passedOrder: MobileOrder | undefined = route?.params?.order;
  const orderId: string = passedOrder?.id || route?.params?.orderId || '';
  const isRefurbished: boolean =
    route?.params?.isRefurbished ?? passedOrder?.orderNo?.startsWith('REF-') ?? false;

  const [order, setOrder] = useState<MobileOrder | null>(passedOrder || null);
  const [loading, setLoading] = useState<boolean>(!passedOrder && !!orderId);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // AlertModal State
  const [modal, setModal] = useState<{
    visible: boolean;
    type: AlertModalType;
    title: string;
    message: string;
  }>({
    visible: false,
    type: 'info',
    title: '',
    message: '',
  });

  const loadOrderDetail = async (isRefresh = false) => {
    if (!orderId) return;
    if (isRefresh) setRefreshing(true);
    else if (!order) setLoading(true);

    try {
      const fetched = await getCustomerOrderDetail(orderId, isRefurbished);
      if (fetched) {
        setOrder(fetched);
      }
    } catch (err: any) {
      setModal({
        visible: true,
        type: 'error',
        title: 'Error Loading Order',
        message: err?.message || 'Failed to load order details.',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadOrderDetail();
  }, [orderId]);

  const onRefresh = () => {
    loadOrderDetail(true);
  };

  const rawTags = order?.tags || [order?.statusTag, order?.paymentTag].filter(Boolean);
  const tags = Array.from(new Set((rawTags || []).map(t => String(t || '').trim()).filter(Boolean)));
  const customer = order?.customer || {
    name: 'Customer',
    phone: '',
    city: '',
    address: order?.shippingAddress || '',
  };
  const warranty = order?.warranty || {
    returnId: `RET-${(order?.id || '396191').slice(-6).toUpperCase()}`,
    date: order?.date || 'Today',
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Image source={ctiLogo} resizeMode="contain" style={styles.logo} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 30 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }>
        <Squeeze onPress={() => navigation.goBack()} scale={0.9} style={styles.backWrap}>
          <View style={[styles.back, { backgroundColor: colors.primary }]}>
            <Icon source={arrowLeftBold} size={20} color={colors.onPrimary} />
          </View>
        </Squeeze>

        <Text style={[styles.title, { color: colors.text }]}>Orders detail</Text>
        {order && (
          <>
            <Text style={[styles.orderId, { color: colors.textMuted }]}>{order.orderId || order.orderNo}</Text>

            <View style={styles.tags}>
              {tags.map((tag, idx) => (
                <View key={`tag-${tag}-${idx}`} style={[styles.pill, { backgroundColor: badges.accepted.bg }]}>
                  <Text style={[styles.pillText, { color: badges.accepted.text }]}>{tag}</Text>
                </View>
              ))}
            </View>

            <ProgressBar step={order.progressStep ?? 0} />
          </>
        )}

        {loading && !refreshing ? (
          <CtiLoader
            size="md"
            text="Loading order details..."
            style={{ paddingVertical: 40 }}
          />
        ) : !order ? (
          <View style={{ paddingVertical: 60, alignItems: 'center' }}>
            <Icon source={packageBold} size={48} color={colors.textMuted} />
            <Text style={[styles.title, { color: colors.text, fontSize: 18, marginTop: 12 }]}>
              Order Not Found
            </Text>
            <Text style={{ color: colors.textMuted, fontFamily: fonts.regular, fontSize: 13, marginTop: 6, textAlign: 'center' }}>
              The requested order details could not be found or loaded.
            </Text>
          </View>
        ) : (
          <>
            <FadeUp delay={100} duration={500}>
              <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.cardHead}>
                  <Icon source={packageBold} size={16} color={colors.text} />
                  <Text style={[styles.cardTitle, { color: colors.text }]}>
                    Order Items ({(order.items || []).length})
                  </Text>
                </View>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />

                {(order.items || []).map((item, idx) => {
                  const variantStr =
                    typeof item.variant === 'string'
                      ? item.variant
                      : typeof item.variant === 'object' && item.variant !== null
                      ? Object.values(item.variant).filter(v => typeof v === 'string' || typeof v === 'number').join(' / ') || 'Standard'
                      : 'Standard';

                  return (
                    <View key={`item-${item.id || idx}-${idx}`} style={styles.item}>
                      <OrderItemImage uri={item.image} style={styles.itemImage} />
                      <View style={styles.itemText}>
                        <Text style={[styles.itemName, { color: colors.text }]}>
                          {String(item.name || 'Purchased Item')}
                        </Text>
                        <Text style={[styles.itemVariant, { color: colors.textMuted }]}>
                          {variantStr}
                        </Text>
                        <Text style={[styles.itemQty, { color: colors.textMuted }]}>
                          QTY.{item.qty || 1}  {money(item.price)} each
                        </Text>
                      </View>
                      <View style={styles.itemEnd}>
                        <Text style={[styles.itemPrice, { color: colors.text }]}>
                          {money(item.price)}
                        </Text>
                        <View style={[styles.pill, { backgroundColor: badges.accepted.bg, marginTop: 6 }]}>
                          <Text style={[styles.pillText, { color: badges.accepted.text }]}>
                            {String(item.status || order.statusTag || 'Pending')}
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            </FadeUp>

            <FadeUp delay={160} duration={500}>
              <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.cardHead}>
                  <Icon source={mapPinBold} size={16} color={colors.text} />
                  <Text style={[styles.cardTitle, { color: colors.text }]}>Shipping Address</Text>
                </View>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />

                <Text style={[styles.customerName, { color: colors.text }]}>
                  {customer.name}
                </Text>
                {!!customer.phone && (
                  <Text style={[styles.text, { color: colors.textMuted }]}>{customer.phone}</Text>
                )}
                {!!customer.city && (
                  <Text style={[styles.text, { color: colors.textMuted }]}>{customer.city}</Text>
                )}
                <Text style={[styles.text, { color: colors.textMuted }]}>
                  {customer.address}
                </Text>
              </View>
            </FadeUp>

            <FadeUp delay={220} duration={500}>
              <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>Order Info</Text>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />

                <Row label="Order ID" value={order.orderId} />
                <Row label="Order No." value={order.orderNo} />
                <Row label="Date" value={order.date} />
                <Row label="Payment" value={order.payment || order.paymentStatus || 'CARD'} />
              </View>
            </FadeUp>

            <FadeUp delay={280} duration={500}>
              <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>Price Summary</Text>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />

                <Row label="Subtotal" value={money(order.subtotal ?? (order.total - (order.shipping || 0)))} />
                <Row label="Shipping" value={money(order.shipping ?? 0)} />
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <Row label="Total" value={money(order.total)} bold />
              </View>

              <Button
                title="Contact Seller"
                variant="outline"
                icon={sendBold}
                iconPosition="left"
                onPress={() => setContactOpen(true)}
                style={styles.button}
              />
              <Button
                title="My Messages"
                variant="outline"
                icon={commentDotsBold}
                iconPosition="left"
                onPress={() => navigation.navigate('ChatList')}
                style={styles.button}
              />

              <View style={[styles.warranty, { backgroundColor: palette.mintBg }]}>
                <Text style={[styles.warrantyTitle, { color: colors.success }]}>
                  Warranty Information
                </Text>
                <Text style={[styles.warrantyText, { color: colors.success }]}>
                  Return #{warranty.returnId} - {warranty.date}
                </Text>
              </View>
            </FadeUp>
          </>
        )}
      </ScrollView>

      <ContactSellerModal
        visible={contactOpen}
        orderId={order?.id || orderId}
        orderNo={order?.orderId || order?.orderNo || orderId}
        sellerId={order?.items?.[0]?.sellerId}
        onClose={() => setContactOpen(false)}
        onSuccess={() => {
          setModal({
            visible: true,
            type: 'success',
            title: 'Message Sent',
            message: 'Your query has been sent to the seller successfully.',
          });
        }}
      />

      <AlertModal
        visible={modal.visible}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        onClose={() => setModal(prev => ({ ...prev, visible: false }))}
      />
    </View>
  );
}

function ProgressBar({ step }) {
  const { colors } = useTheme();

  return (
    <View style={styles.progress}>
      <View style={styles.progressBars}>
        {PROGRESS_STEPS.map((label, index) => (
          <View
            key={`step-bar-${label}-${index}`}
            style={[
              styles.progressBar,
              { backgroundColor: index <= step ? colors.primary : colors.border },
            ]}
          />
        ))}
      </View>
      <View style={styles.progressLabels}>
        {PROGRESS_STEPS.map((label, index) => (
          <Text
            key={`step-label-${label}-${index}`}
            style={[
              styles.progressLabel,
              { color: index <= step ? colors.primary : colors.textMuted },
              index <= step && { fontFamily: fonts.bold },
            ]}>
            {label}
          </Text>
        ))}
      </View>
    </View>
  );
}

function Row({ label, value, bold = false }) {
  const { colors } = useTheme();

  return (
    <View style={styles.row}>
      <Text
        style={[
          styles.rowLabel,
          { color: bold ? colors.text : colors.textMuted, fontFamily: bold ? fonts.bold : fonts.regular },
        ]}>
        {label}
      </Text>
      <Text style={[styles.rowValue, { color: colors.text, fontFamily: bold ? fonts.bold : fonts.regular }]}>
        {String(value ?? '-')}
      </Text>
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

  title: { fontFamily: fonts.bold, fontSize: 24, marginTop: 16 },
  orderId: { fontFamily: fonts.regular, fontSize: 13, marginTop: 4 },

  tags: { flexDirection: 'row', gap: 8, marginTop: 12 },
  pill: { alignSelf: 'flex-start', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5 },
  pillText: { fontFamily: fonts.bold, fontSize: 11 },

  progress: { marginTop: 20 },
  progressBars: { flexDirection: 'row', gap: 4 },
  progressBar: { flex: 1, height: 4, borderRadius: 2 },
  progressLabels: { flexDirection: 'row', marginTop: 8 },
  progressLabel: { flex: 1, fontFamily: fonts.regular, fontSize: 10, textAlign: 'center' },

  card: { borderRadius: 14, borderWidth: 1, padding: 16, marginTop: 16 },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { fontFamily: fonts.bold, fontSize: 15 },
  divider: { height: 1, marginVertical: 12 },

  item: { flexDirection: 'row', gap: 10 },
  itemImage: { width: 48, height: 48, borderRadius: 8 },
  itemText: { flex: 1, gap: 2 },
  itemName: { fontFamily: fonts.bold, fontSize: 14 },
  itemVariant: { fontFamily: fonts.regular, fontSize: 12 },
  itemQty: { fontFamily: fonts.regular, fontSize: 12 },
  itemEnd: { alignItems: 'flex-end' },
  itemPrice: { fontFamily: fonts.bold, fontSize: 14 },

  customerName: { fontFamily: fonts.bold, fontSize: 15 },
  text: { fontFamily: fonts.regular, fontSize: 13, marginTop: 6 },

  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  rowLabel: { fontSize: 13 },
  rowValue: { fontSize: 13 },

  button: { marginTop: 12 },

  warranty: { borderRadius: 12, padding: 16, marginTop: 16, gap: 4 },
  warrantyTitle: { fontFamily: fonts.bold, fontSize: 15 },
  warrantyText: { fontFamily: fonts.regular, fontSize: 12 },
});
