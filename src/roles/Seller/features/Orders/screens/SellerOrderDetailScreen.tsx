import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Button from '@/components/Button';
import Icon from '@/components/Icon';
import Squeeze from '@/components/Squeeze';
import ProductThumb from '@/components/ProductThumb';
import AlertModal, { AlertModalType } from '@/components/AlertModal';
import ConfirmModal from '@/components/ConfirmModal';
import { ErrorState, LoadingState, OfflineBanner } from '@/components/states';
import { arrowLeftBold } from '@/assets/icons';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import { getWebSellerOrderUrl } from '@/constants/config';
import {
  fetchSellerOrderDetailApi,
  SellerOrderDetail,
  updateSellerOrderStatusApi,
} from '@/roles/Seller/services/sellerApi';
import { formatDate, formatMoney, openWebsite } from '@/roles/Seller/utils/sellerUtils';
import { emitOrderChanged } from '@/roles/Seller/utils/orderEvents';
import {
  cancelledByLabel,
  getStatusStyle,
  ORDER_STATUS_STYLE,
  paymentMethodLabel,
  PAYMENT_STATUS_STYLE,
} from '@/roles/Seller/utils/statusStyles';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';

interface AlertState {
  visible: boolean;
  type: AlertModalType;
  title: string;
  message: string;
}

const HIDDEN_ALERT: AlertState = { visible: false, type: 'info', title: '', message: '' };

const ACTION_LABEL: Record<string, string> = {
  get processing() { return i18n.t('sellerMsg.orderAction.processing'); },
  get cancelled() { return i18n.t('sellerMsg.orderAction.cancelled'); },
};

const CONFIRM_TEXT: Record<string, string> = {
  get processing() { return i18n.t('sellerMsg.orderConfirm.processing'); },
  get cancelled() { return i18n.t('sellerMsg.orderConfirm.cancelled'); },
};

// What still has to be done on the website for each status
const WEBSITE_STEP: Record<string, string> = {
  get processing() { return i18n.t('sellerMsg.websiteStep.processing'); },
  get shipping() { return i18n.t('sellerMsg.websiteStep.shipping'); },
  get shipped() { return i18n.t('sellerMsg.websiteStep.shipped'); },
  get delivered() { return i18n.t('sellerMsg.websiteStep.delivered'); },
};

export default function SellerOrderDetailScreen({ navigation, route }: any) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const orderId: string = route?.params?.orderId;

  const [order, setOrder] = useState<SellerOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [updatingTo, setUpdatingTo] = useState<string | null>(null);
  const updating = updatingTo !== null;
  const [alert, setAlert] = useState<AlertState>(HIDDEN_ALERT);
  const mounted = useRef(true);

  const showAlert = (type: AlertModalType, title: string, message: string) =>
    setAlert({ visible: true, type, title, message });

  const load = useCallback(
    async (mode: 'initial' | 'refresh' | 'silent') => {
      if (mode === 'refresh') setRefreshing(true);
      else if (mode === 'initial') {
        setLoading(true);
        setError(null);
      }
      try {
        const result = await fetchSellerOrderDetailApi(orderId);
        if (!mounted.current) return;
        setOrder(result);
        setError(null);
      } catch (err: any) {
        if (!mounted.current) return;
        const message = err?.message || i18n.t('sellerAuto.couldNotLoadThisOrder');
        if (mode === 'initial') setError(message);
        else if (mode === 'refresh') showAlert('error', i18n.t('customer.couldNotRefresh'), message);
      } finally {
        if (mounted.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [orderId],
  );

  useEffect(() => {
    mounted.current = true;
    load('initial');
    // Coming back from the website steps (shipment, shipped, delivered) shows the new state
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') load('silent');
    });
    return () => {
      mounted.current = false;
      sub.remove();
    };
  }, [load]);

  const openLink = async (url: string) => {
    const opened = await openWebsite(url);
    if (!opened && mounted.current) {
      showAlert('info', i18n.t('sellerAuto.openInYourBrowser'), i18n.t('sellerMsg.openLinkFailed', { url }));
    }
  };

  const confirmStatus = async () => {
    if (!order || !pendingStatus || updating) return;
    const nextStatus = pendingStatus;
    const orderKey = order.id;
    setPendingStatus(null);
    setUpdatingTo(nextStatus);
    try {
      const res = await updateSellerOrderStatusApi(orderKey, nextStatus);
      emitOrderChanged({ id: orderKey, status: res.orderStatus, completionDate: res.completionDate });
      if (!mounted.current) return;
      setOrder(prev => (prev ? { ...prev, status: res.orderStatus, completionDate: res.completionDate } : prev));
      // refunded is the amount the backend sent back to the customer. 0 can mean the refund failed or that nothing was payable, so the wording stays generic.
      const refundFailed = nextStatus === 'cancelled' && res.refunded <= 0;
      showAlert(
        refundFailed ? 'warning' : 'success',
        refundFailed ? i18n.t('sellerAuto.orderCancelledNoAutomaticRefund') : i18n.t('sellerAuto.orderUpdated'),
        res.message || i18n.t('sellerAuto.orderStatusUpdatedSuccessfully'),
      );
      load('silent');
    } catch (err: any) {
      if (!mounted.current) return;
      showAlert('error', i18n.t('sellerAuto.updateFailed'), err?.message || i18n.t('sellerAuto.couldNotUpdateTheOrder'));
      // The order may have changed elsewhere (customer cancelled, shipment created), so show its real state
      load('silent');
    } finally {
      if (mounted.current) setUpdatingTo(null);
    }
  };

  const card = [styles.card, { backgroundColor: colors.surface, borderColor: colors.border }];

  const renderBody = () => {
    if (loading) return <LoadingState text={i18n.t('sellerAuto.loadingOrder')} style={styles.stateWrap} />;
    if (error || !order) {
      return <ErrorState error={error || i18n.t('sellerAuto.orderNotFound')} onRetry={() => load('initial')} style={styles.stateWrap} />;
    }

    const statusStyle = getStatusStyle(ORDER_STATUS_STYLE, order.status);
    const payStyle = getStatusStyle(PAYMENT_STATUS_STYLE, order.paymentStatus);
    const canStart = order.status === 'pending';
    const cancellable = ['pending', 'processing', 'shipping', 'shipped'].includes(order.status);
    const canCancel = cancellable && !order.shipment.created;
    const websiteStep = WEBSITE_STEP[order.status];
    // Same as the web: the shipping cost is taken out of the earnings once the shipment exists
    const netEarnings = Math.max(0, order.totals.earnings - (order.shipment.created ? order.totals.shippingFee : 0));
    const addr = order.address;
    const addressLines = [
      addr.addressLine,
      [addr.area, addr.city].filter(Boolean).join(', '),
      [addr.state, addr.country].filter(Boolean).join(', '),
      addr.postalCode ? `Postal code: ${addr.postalCode}` : '',
    ].filter(Boolean);

    return (
      <>
        <View style={card}>
          <View style={styles.rowBetween}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{i18n.t('sellerAuto.status')}</Text>
            <View style={styles.badges}>
              <View style={[styles.badge, { backgroundColor: statusStyle.color + '20' }]}>
                <Text style={[styles.badgeText, { color: statusStyle.color }]}>{statusStyle.label}</Text>
              </View>
              {order.paymentStatus ? (
                <View style={[styles.badge, { backgroundColor: payStyle.color + '20' }]}>
                  <Text style={[styles.badgeText, { color: payStyle.color }]}>{payStyle.label}</Text>
                </View>
              ) : null}
            </View>
          </View>

          <InfoRow label={i18n.t('glossary.order')} value={order.orderNo} />
          <InfoRow label={i18n.t('sellerAuto.ordered')} value={formatDate(order.createdAt)} />
          {order.completionDate ? <InfoRow label={i18n.t('sellerAuto.completed')} value={formatDate(order.completionDate)} /> : null}
          {order.paymentMethod ? <InfoRow label={i18n.t('sellerAuto.payment')} value={paymentMethodLabel(order.paymentMethod)} /> : null}
          {order.status === 'cancelled' ? (
            <>
              <InfoRow label={i18n.t('sellerAuto.cancelledBy')} value={cancelledByLabel(order.cancelledBy) || '-'} />
              <InfoRow label={i18n.t('sellerAuto.reason')} value={order.cancelReason || '-'} />
            </>
          ) : null}

          {canStart || cancellable ? (
            <View style={styles.actions}>
              {canStart ? (
                <Button
                  title={ACTION_LABEL.processing}
                  size="md"
                  disabled={updating}
                  loading={updatingTo === 'processing'}
                  onPress={() => setPendingStatus('processing')}
                />
              ) : null}
              {canCancel ? (
                <Button
                  title={ACTION_LABEL.cancelled}
                  size="md"
                  variant="outline"
                  color={colors.error}
                  disabled={updating}
                  loading={updatingTo === 'cancelled'}
                  onPress={() => setPendingStatus('cancelled')}
                />
              ) : null}
              {cancellable && !canCancel ? (
                <Text style={[styles.hint, { color: colors.textMuted }]}>
                  {i18n.t('sellerAuto.youCanNoLongerCancel')}
                </Text>
              ) : null}
            </View>
          ) : null}
        </View>

        {websiteStep ? (
          <View style={card}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{i18n.t('sellerAuto.nextStepOnTheWebsite')}</Text>
            <Text style={[styles.addressLine, { color: colors.textMuted }]}>{websiteStep}</Text>
            <Button
              title={i18n.t('sellerAuto.continueOnTheWebsite')}
              size="md"
              onPress={() => openLink(getWebSellerOrderUrl(order.id))}
            />
          </View>
        ) : null}

        <View style={card}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{i18n.t('sellerMsg.itemsCount', { count: order.items.length })}</Text>
          {order.items.map(item => (
            <View key={item.id} style={[styles.itemRow, { borderTopColor: colors.border }]}>
              <ProductThumb uri={item.image} size={60} />
              <View style={styles.flex1}>
                <Text style={[styles.itemTitle, { color: colors.text }]}>{item.title || i18n.t('sellerMsg.productFallback')}</Text>
                {item.variant ? (
                  <Text style={[styles.itemSub, { color: colors.textMuted }]}>{item.variant}</Text>
                ) : null}
                {item.barcode ? (
                  <Text style={[styles.itemSub, { color: colors.textMuted }]}>{i18n.t('sellerMsg.barcodeLine', { value: item.barcode })}</Text>
                ) : null}
                <Text style={[styles.itemSub, { color: colors.textMuted }]}>
                  {item.quantity} x {formatMoney(item.price)}
                </Text>
                <Text style={[styles.itemSub, { color: colors.textMuted }]}>
                  {i18n.t('sellerMsg.feesLine', { fee: formatMoney(item.platformFee), earn: formatMoney(item.sellerEarnings) })}
                </Text>
              </View>
              <Text style={[styles.itemTotal, { color: colors.text }]}>
                {formatMoney(item.price * item.quantity)}
              </Text>
            </View>
          ))}
        </View>

        <View style={card}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{i18n.t('sellerAuto.buyerAndShippingAddress')}</Text>
          <Text style={[styles.buyerName, { color: colors.text }]}>{addr.fullName || order.customer.name}</Text>
          {addressLines.map(line => (
            <Text key={line} style={[styles.addressLine, { color: colors.textMuted }]}>
              {line}
            </Text>
          ))}
          {addr.phone ? <Text style={[styles.addressLine, { color: colors.textMuted }]}>{i18n.t('sellerMsg.phoneLine', { value: addr.phone })}</Text> : null}
          {order.customer.email ? (
            <Text style={[styles.addressLine, { color: colors.textMuted }]}>{i18n.t('sellerMsg.emailLine', { value: order.customer.email })}</Text>
          ) : null}
        </View>

        <View style={card}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{i18n.t('sellerAuto.summary')}</Text>
          <InfoRow label={i18n.t('sellerAuto.subTotal')} value={formatMoney(order.totals.subTotal)} />
          <InfoRow label={i18n.t('sellerAuto.platformFee')} value={formatMoney(order.totals.platformFee)} />
          {order.totals.shippingFee > 0 ? (
            <InfoRow label={i18n.t('sellerAuto.shippingFee')} value={formatMoney(order.totals.shippingFee)} />
          ) : null}
          <InfoRow label={i18n.t('sellerAuto.yourEarnings')} value={formatMoney(netEarnings)} strong />
        </View>

        <View style={card}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{i18n.t('sellerAuto.shipment')}</Text>
          {order.shipment.created ? (
            <>
              <InfoRow label={i18n.t('sellerAuto.status')} value="Created" />
              {order.shipment.trackingNumber ? (
                <InfoRow label={i18n.t('sellerAuto.trackingNumber')} value={order.shipment.trackingNumber} />
              ) : null}
              {order.shipment.shippingCost > 0 ? (
                <InfoRow label={i18n.t('sellerAuto.shippingCost')} value={formatMoney(order.shipment.shippingCost)} />
              ) : null}
              <View style={styles.actions}>
                {order.shipment.trackingUrl ? (
                  <Button
                    title={i18n.t('sellerAuto.trackShipment')}
                    size="md"
                    variant="outline"
                    onPress={() => openLink(order.shipment.trackingUrl)}
                  />
                ) : null}
                {order.shipment.labelUrl ? (
                  <Button
                    title={i18n.t('sellerAuto.openShippingLabel')}
                    size="md"
                    variant="outline"
                    onPress={() => openLink(order.shipment.labelUrl)}
                  />
                ) : null}
              </View>
            </>
          ) : (
            <Text style={[styles.addressLine, { color: colors.textMuted }]}>
              {i18n.t('sellerAuto.noShipmentWasCreatedFor')}
            </Text>
          )}
        </View>
      </>
    );
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: insets.top + 8 }]}>
      <OfflineBanner />
      <ScrollView
        contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load('refresh')}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }>
        <View style={styles.headerRow}>
          <Squeeze onPress={() => navigation?.goBack()} scale={0.9}>
            <View style={[styles.backBtn, { backgroundColor: colors.primary }]}>
              <Icon source={arrowLeftBold} size={18} color={colors.onPrimary} />
            </View>
          </Squeeze>
          <View style={styles.flex1}>
            <Text style={[styles.title, { color: colors.text }]}>{t('sellerAuto.orderDetails')}</Text>
            {order ? <Text style={[styles.subtitle, { color: colors.textMuted }]}>{order.orderNo}</Text> : null}
          </View>
        </View>

        {renderBody()}
      </ScrollView>

      <ConfirmModal
        visible={!!pendingStatus}
        title={pendingStatus ? ACTION_LABEL[pendingStatus] : ''}
        message={pendingStatus ? CONFIRM_TEXT[pendingStatus] : ''}
        confirmText={pendingStatus === 'cancelled' ? t('sellerAuto.yesCancelOrder') : t('sellerAuto.yesContinue')}
        danger={pendingStatus === 'cancelled'}
        onConfirm={confirmStatus}
        onCancel={() => setPendingStatus(null)}
      />

      <AlertModal
        visible={alert.visible}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        onClose={() => setAlert(HIDDEN_ALERT)}
      />
    </View>
  );
}

function InfoRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  const { colors } = useTheme();
  useTranslation();
  return (
    <View style={styles.infoRow}>
      <Text style={[styles.infoLabel, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: colors.text }, strong && styles.strong]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  container: { paddingHorizontal: 16, paddingTop: 6, gap: 14, flexGrow: 1 },
  flex1: { flex: 1 },
  stateWrap: { paddingVertical: 60 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 },
  backBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: fonts.bold, fontSize: 22 },
  subtitle: { fontFamily: fonts.regular, fontSize: 12, marginTop: 2 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 10 },
  sectionTitle: { flexShrink: 1, fontFamily: fonts.bold, fontSize: 15 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 6, flexShrink: 1 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontFamily: fonts.bold, fontSize: 11 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  infoLabel: { fontFamily: fonts.regular, fontSize: 13 },
  infoValue: { flexShrink: 1, textAlign: 'right', fontFamily: fonts.medium, fontSize: 13 },
  strong: { fontFamily: fonts.bold, fontSize: 14 },
  actions: { gap: 10, marginTop: 6 },
  hint: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 17 },
  itemRow: { flexDirection: 'row', gap: 12, paddingTop: 12, borderTopWidth: 1 },
  itemTitle: { fontFamily: fonts.bold, fontSize: 13 },
  itemSub: { fontFamily: fonts.regular, fontSize: 12, marginTop: 2 },
  itemTotal: { fontFamily: fonts.bold, fontSize: 13 },
  buyerName: { fontFamily: fonts.bold, fontSize: 14 },
  addressLine: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19 },
});
