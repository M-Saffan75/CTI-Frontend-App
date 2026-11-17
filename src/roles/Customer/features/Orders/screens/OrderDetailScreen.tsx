import { useEffect, useRef, useState } from 'react';
import { formatMoney } from '@/utils/money';
import {
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';

import CtiLoader from '@/components/CtiLoader';
import Icon from '@/components/Icon';
import Button from '@/components/Button';
import Squeeze from '@/components/Squeeze';
import AlertModal, { AlertModalType } from '@/components/AlertModal';
import { FadeUp } from '@/animations';
import { arrowLeftBold, commentDotsBold, mapPinBold, packageBold, sendBold } from '@/assets/icons';
import { ctiLogo } from '@/assets/images';
import ProductThumb from '@/components/ProductThumb';
import { useTheme } from '@/theme/ThemeContext';
import { badges } from '@/theme/colors';
import { normalizeApiError } from '@/services/apiError';
import { fonts } from '@/theme/fonts';
import ContactSellerModal from '../components/ContactSellerModal';
import { getCustomerOrderDetail, MobileOrder } from '../services/orderApi';
import { subscribeOrderStatus, useOrderStatusChecker } from '../utils/orderLive';
import useRefreshOnActive from '@/utils/useRefreshOnActive';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';
import { lower, upper } from '@/i18n/locale';
import { paymentMethodLabel, statusLabel, tx } from '@/utils/labels';

// the API status words, in order; the shown text comes from statusLabel()
const PROGRESS_STEPS = ['pending', 'processing', 'shipping', 'shipped', 'delivered'];

const money = (n: number = 0) => formatMoney(n);

function statusBadge(status: string) {
  const t = String(status || '').toLowerCase();
  if (t.includes('deliver') || t === 'paid' || t.includes('success')) return badges.accepted;
  if (t.includes('cancel') || t.includes('fail') || t.includes('return') || t.includes('refund')) return badges.dispute;
  if (t.includes('shipp')) return badges.booked;
  return badges.inProgress;
}

const isClosedOrder = (status: string) => /cancel|return|fail/i.test(String(status || ''));

export default function OrderDetailScreen({ navigation, route }: any) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [contactOpen, setContactOpen] = useState(false);

  const passedOrder: MobileOrder | undefined = route?.params?.order;
  const orderId: string = passedOrder?.id || route?.params?.orderId || '';
  const isRefurbished: boolean = route?.params?.isRefurbished ?? passedOrder?.isRefurbished ?? false;

  const [order, setOrder] = useState<MobileOrder | null>(passedOrder || null);
  const [loading, setLoading] = useState<boolean>(!passedOrder && !!orderId);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [loadError, setLoadError] = useState('');

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

  const loadOrderDetail = async (isRefresh = false, silent = false) => {
    if (!orderId) return;
    if (isRefresh) setRefreshing(true);
    else if (!order && !silent) setLoading(true);

    try {
      const fetched = await getCustomerOrderDetail(orderId, isRefurbished);
      if (fetched) {
        setOrder(fetched);
        setLoadError('');
      }
    } catch (err: any) {
      // No connection / server failure: keep what is on screen, or offer a retry when there is nothing yet
      if (!silent) {
        const message = normalizeApiError(err).message;
        if (order) {
          setModal({ visible: true, type: 'error', title: i18n.t('customer.couldNotRefresh'), message });
        } else {
          setLoadError(message);
        }
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      markLoaded();
    }
  };

  useEffect(() => {
    loadOrderDetail();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  // The seller changed this order: reload quietly while the screen is open, or when the app returns
  const isFocused = useIsFocused();
  const reloadQuietly = () => {
    loadOrderDetail(false, true);
  };
  const reloadRef = useRef(reloadQuietly);
  const focusedRef = useRef(isFocused);
  reloadRef.current = reloadQuietly;
  focusedRef.current = isFocused;
  const orderStatusChanged = useOrderStatusChecker();
  const markLoaded = useRefreshOnActive(isFocused, reloadQuietly, orderStatusChanged);

  useEffect(
    () =>
      subscribeOrderStatus(event => {
        if (event.orderId === orderId && focusedRef.current && orderStatusChanged()) reloadRef.current();
      }),
    [orderId, orderStatusChanged],
  );

  const onRefresh = () => {
    loadOrderDetail(true);
  };

  const rawTags = order?.tags || [order?.statusTag, order?.paymentTag].filter(Boolean);
  const tags = Array.from(new Set((rawTags || []).map(tag => String(tag || '').trim()).filter(Boolean)));
  const customer = order?.customer || {
    name: '',
    phone: '',
    city: '',
    address: order?.shippingAddress || '',
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

        <Text style={[styles.title, { color: colors.text }]}>{t('customer.orderDetails')}</Text>
        {order && (
          <>
            <Text style={[styles.orderId, { color: colors.textMuted }]}>{order.orderId || order.orderNo}</Text>

            <View style={styles.tags}>
              {tags.map((tag, idx) => (
                <View key={`tag-${tag}-${idx}`} style={[styles.pill, { backgroundColor: statusBadge(tag).bg }]}>
                  <Text style={[styles.pillText, { color: statusBadge(tag).text }]}>{upper(statusLabel(tag))}</Text>
                </View>
              ))}
            </View>

            {isClosedOrder(order.statusTag) ? (
              <Text style={{ color: colors.error, fontFamily: fonts.medium, fontSize: 13, marginTop: 10 }}>
                {t('customerMsg.orderClosed', { status: lower(statusLabel(order.statusTag)) })}
              </Text>
            ) : (
              <ProgressBar step={order.progressStep ?? 0} />
            )}
          </>
        )}

        {loading && !refreshing ? (
          <CtiLoader
            size="md"
            text={t('customer.loadingOrderDetails')}
            style={{ paddingVertical: 40 }}
          />
        ) : !order ? (
          <View style={{ paddingVertical: 60, alignItems: 'center' }}>
            <Icon source={packageBold} size={48} color={colors.textMuted} />
            <Text style={[styles.title, { color: colors.text, fontSize: 18, marginTop: 12 }]}>
              {loadError ? t('customer.couldNotLoadTheOrder') : t('customer.orderNotFound')}
            </Text>
            <Text style={{ color: colors.textMuted, fontFamily: fonts.regular, fontSize: 13, marginTop: 6, textAlign: 'center' }}>
              {loadError || t('customer.thisOrderCouldNotBe')}
            </Text>
            {loadError ? <Button title={t('customer.tryAgain')} size="sm" onPress={() => loadOrderDetail()} style={{ marginTop: 14 }} /> : null}
          </View>
        ) : (
          <>
            <FadeUp delay={100} duration={500}>
              <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.cardHead}>
                  <Icon source={packageBold} size={16} color={colors.text} />
                  <Text style={[styles.cardTitle, { color: colors.text }]}>
                    {t('customerMsg.orderItemsCount', { count: (order.items || []).length })}
                  </Text>
                </View>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />

                {(order.items || []).map((item, idx) => {
                  const variantStr =
                    typeof item.variant === 'string'
                      ? item.variant
                      : typeof item.variant === 'object' && item.variant !== null
                      ? Object.values(item.variant).filter(v => typeof v === 'string' || typeof v === 'number').join(' / ')
                      : '';

                  return (
                    <View key={`item-${item.id || idx}-${idx}`} style={styles.item}>
                      <ProductThumb uri={item.image} size={48} radius={8} />
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
                          {t('customerMsg.qtyTimes', { qty: item.qty || 1, price: money(item.price) })}
                        </Text>
                      </View>
                      <View style={styles.itemEnd}>
                        <Text style={[styles.itemPrice, { color: colors.text }]}>
                          {money((item.price || 0) * (item.qty || 1))}
                        </Text>
                        {item.status || order.statusTag ? (
                          <View style={[styles.pill, { backgroundColor: statusBadge(String(item.status || order.statusTag)).bg, marginTop: 6 }]}>
                            <Text style={[styles.pillText, { color: statusBadge(String(item.status || order.statusTag)).text }]}>
                              {upper(statusLabel(item.status || order.statusTag))}
                            </Text>
                          </View>
                        ) : null}
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
                  <Text style={[styles.cardTitle, { color: colors.text }]}>{t('customer.shippingAddress')}</Text>
                </View>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />

                {!!customer.name && (
                  <Text style={[styles.customerName, { color: colors.text }]}>
                    {customer.name}
                  </Text>
                )}
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
                <Text style={[styles.cardTitle, { color: colors.text }]}>{t('customer.orderInfo')}</Text>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />

                <Row label={t('customer.orderId')} value={order.orderId} />
                <Row label={t('customer.orderNo')} value={order.orderNo} />
                <Row label={t('customer.date')} value={tx({ date: order.date, style: 'long' })} />
                <Row label={t('customer.payment')} value={paymentMethodLabel(order.payment || order.paymentStatus)} />
              </View>
            </FadeUp>

            <FadeUp delay={280} duration={500}>
              <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>{t('customer.priceSummary')}</Text>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />

                <Row label={t('customer.subtotal')} value={money(order.subtotal ?? (order.total - (order.shipping || 0)))} />
                <Row label={t('customerMsg.shippingCost')} value={money(order.shipping ?? 0)} />
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <Row label={t('customer.total')} value={money(order.total)} bold />
              </View>

              <Button
                title={t('customer.contactSeller')}
                variant="outline"
                icon={sendBold}
                iconPosition="left"
                onPress={() => setContactOpen(true)}
                style={styles.button}
              />
              <Button
                title={t('settings.menu.myMessages')}
                variant="outline"
                icon={commentDotsBold}
                iconPosition="left"
                onPress={() => navigation.navigate('ChatList')}
                style={styles.button}
              />
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
            title: i18n.t('customer.messageSent'),
            message: i18n.t('customer.yourQueryHasBeenSent'),
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
  useTranslation();

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
            {statusLabel(label)}
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
  cardTitle: { flexShrink: 1, fontFamily: fonts.bold, fontSize: 15 },
  divider: { height: 1, marginVertical: 12 },

  item: { flexDirection: 'row', gap: 10 },
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
