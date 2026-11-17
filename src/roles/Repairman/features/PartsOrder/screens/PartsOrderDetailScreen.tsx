import { ReactNode, useRef, useState } from 'react';
import {
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AlertModal, { AlertModalType } from '@/components/AlertModal';
import Button from '@/components/Button';
import ConfirmModal from '@/components/ConfirmModal';
import Icon from '@/components/Icon';
import Squeeze from '@/components/Squeeze';
import { ErrorState, LoadingState } from '@/components/states';
import { FadeUp } from '@/animations';
import {
  arrowLeftBold,
  checkCircleBold,
  clockBold,
  creditCardBold,
  mobileBold,
  packageBold,
  userBold,
} from '@/assets/icons';
import repairmanApi from '@/roles/Repairman/api/repairmanApi';
import { markOffersChanged } from '@/roles/Repairman/utils/offerEvents';
import useApiData from '@/roles/Repairman/utils/useApiData';
import { normalizeApiError } from '@/services/apiError';
import { formatDate, formatDateTime } from '@/utils/dateFormat';
import { formatMoney } from '@/utils/money';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import RepairmanHeader from '../../../components/RepairmanHeader';
import {
  canMarkReceived,
  formatAddress,
  orderStatusLabel,
  orderStatusTone,
  paymentTone,
} from '../utils/parts';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';
import { statusLabel } from '@/utils/labels';

function Card({
  icon,
  title,
  children,
}: {
  icon: number;
  title: string;
  children: ReactNode;
}) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <View style={styles.cardHead}>
        <Icon source={icon} size={16} color={colors.primary} />
        <Text style={[styles.cardTitle, { color: colors.text }]}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function Line({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  const { colors } = useTheme();
  if (value === undefined || value === null || value === '') return null;

  return (
    <View style={styles.line}>
      <Text style={[styles.lineLabel, { color: colors.textMuted }]}>
        {label}
      </Text>
      <Text style={[styles.lineValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

export default function PartsOrderDetailScreen({ navigation, route }: any) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const orderId: string = route.params?.orderId;

  const detail = useApiData(
    () => repairmanApi.getPartsOrder(orderId),
    [orderId],
  );
  const [refreshing, setRefreshing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [marking, setMarking] = useState(false);
  const busy = useRef(false);
  const [notice, setNotice] = useState<{
    type: AlertModalType;
    title: string;
    message: string;
  } | null>(null);

  const order = detail.data;

  const onRefresh = async () => {
    setRefreshing(true);
    const error = await detail.reload(true);
    setRefreshing(false);
    if (error)
      setNotice({
        type: 'error',
        title: i18n.t('customer.couldNotRefresh'),
        message: error.message,
      });
  };

  const markReceived = async () => {
    if (busy.current) return;
    busy.current = true;
    setConfirmOpen(false);
    setMarking(true);
    try {
      await repairmanApi.markPartsReceived(orderId);
      // the backend sends no message for this request
      setNotice({
        type: 'success',
        title: i18n.t('repairman.partsReceived'),
        message: i18n.t('repairman.theOrderIsMarkedAs'),
      });
      markOffersChanged();
      detail.reload(true);
    } catch (e) {
      setNotice({
        type: 'error',
        title: i18n.t('repairman.couldNotUpdate'),
        message: normalizeApiError(e).message,
      });
    } finally {
      busy.current = false;
      setMarking(false);
    }
  };

  const statusColor = order
    ? colors[orderStatusTone(order.orderStatus)]
    : colors.primary;
  const payColor = order
    ? colors[paymentTone(order.paymentStatus)]
    : colors.primary;
  const job = order?.job_id;
  const device = [job?.deviceInfo?.brand, job?.deviceInfo?.model]
    .filter(Boolean)
    .join(' ');
  const address =
    formatAddress(order?.customer?.shippingAddress) ||
    formatAddress(order?.customer?.address);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <RepairmanHeader navigation={navigation} />

      {detail.loading && !order ? (
        <LoadingState text={t('repairman.loadingOrder')} />
      ) : detail.error || !order ? (
        <ErrorState
          error={detail.error}
          onRetry={() => detail.reload()}
          fullScreen
        />
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.body,
            { paddingBottom: insets.bottom + 30 },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >
          <Squeeze onPress={() => navigation.goBack()} scale={0.95}>
            <View style={styles.backWrap}>
              <Icon source={arrowLeftBold} size={16} color={colors.primary} />
              <Text style={[styles.backText, { color: colors.primary }]}>
                {t('repairman.backToPartsOrders')}
              </Text>
            </View>
          </Squeeze>

          <FadeUp delay={40} duration={400}>
            <Text style={[styles.title, { color: colors.text }]}>
              {i18n.t('repairmanMsg.orderNumber', { no: order.orderNumber || order._id.slice(-6) })}
            </Text>
            <Text style={[styles.sub, { color: colors.textMuted }]}>
              {i18n.t('repairmanMsg.createdOn', { date: formatDate(order.createdAt) })}
              {job?._id ? i18n.t('repairmanMsg.jobNo', { id: job._id.slice(-6) }) : ''}
            </Text>
            <View style={styles.pills}>
              <View
                style={[styles.pill, { backgroundColor: statusColor + '22' }]}
              >
                <Text style={[styles.pillText, { color: statusColor }]}>
                  {orderStatusLabel(order.orderStatus)}
                </Text>
              </View>
              <View style={[styles.pill, { backgroundColor: payColor + '22' }]}>
                <Text style={[styles.pillText, { color: payColor }]}>
                  {order.paymentStatus}
                </Text>
              </View>
              {order.isReceived ? (
                <View
                  style={[
                    styles.pill,
                    { backgroundColor: colors.success + '22' },
                  ]}
                >
                  <Icon
                    source={checkCircleBold}
                    size={11}
                    color={colors.success}
                  />
                  <Text style={[styles.pillText, { color: colors.success }]}>
                    {t('repairman.received')}
                  </Text>
                </View>
              ) : null}
            </View>

            {canMarkReceived(order) ? (
              <Button
                title={t('repairman.markAsReceived')}
                icon={checkCircleBold}
                iconPosition="left"
                loading={marking}
                onPress={() => setConfirmOpen(true)}
                style={styles.action}
              />
            ) : null}
          </FadeUp>

          {job ? (
            <FadeUp delay={70} duration={400}>
              <Card icon={mobileBold} title={t('repairman.repairJob2')}>
                <Line label={t('repairman.device')} value={device} />
                <Line label={t('repairman.job')} value={job.title} />
                <Line label={t('customer.description')} value={job.description} />
                <Line
                  label={t('repairman.services')}
                  value={(job.services || [])
                    .map(s => s.name)
                    .filter(Boolean)
                    .join(', ')}
                />
                <Line label={t('repairman.city')} value={job.location?.city?.name} />
                <Line
                  label={t('repairman.deviceWarranty')}
                  value={job.deviceInfo?.warrantyStatus ? statusLabel(job.deviceInfo.warrantyStatus) : ''}
                />
              </Card>
            </FadeUp>
          ) : null}

          <FadeUp delay={100} duration={400}>
            <Card icon={packageBold} title={t('repairman.partsOrdered')}>
              {order.items.map(item => {
                const image =
                  typeof item.part === 'object' && item.part
                    ? item.part.images?.[0]
                    : undefined;
                return (
                  <View
                    key={`${item.partName}-${item.partSku || ''}`}
                    style={[
                      styles.item,
                      { backgroundColor: colors.surfaceAlt },
                    ]}
                  >
                    {image ? (
                      <Image
                        source={{ uri: image }}
                        style={[styles.thumb, { borderColor: colors.border }]}
                      />
                    ) : (
                      <View
                        style={[
                          styles.thumb,
                          styles.thumbEmpty,
                          { borderColor: colors.border },
                        ]}
                      >
                        <Icon
                          source={packageBold}
                          size={16}
                          color={colors.textMuted}
                        />
                      </View>
                    )}
                    <View style={styles.flex}>
                      <Text style={[styles.lineValue, { color: colors.text }]}>
                        {item.partName}
                      </Text>
                      {item.partSku ? (
                        <Text
                          style={[
                            styles.lineLabel,
                            { color: colors.textMuted },
                          ]}
                        >
                          {i18n.t('repairmanMsg.skuLine', { sku: item.partSku })}
                        </Text>
                      ) : null}
                      <Text
                        style={[styles.lineLabel, { color: colors.textMuted }]}
                      >
                        {item.quantity} × {formatMoney(item.finalPrice)}
                        {item.discount
                          ? i18n.t('repairmanMsg.wasPrice', { price: formatMoney(item.price) })
                          : ''}
                      </Text>
                    </View>
                    <Text style={[styles.lineValue, { color: colors.text }]}>
                      {formatMoney(item.subtotal)}
                    </Text>
                  </View>
                );
              })}
              <View style={[styles.totals, { borderTopColor: colors.border }]}>
                <Line label={t('customer.subtotal')} value={formatMoney(order.subtotal)} />
                {order.discount ? (
                  <Line
                    label={t('repairman.discount')}
                    value={`-${formatMoney(order.discount)}`}
                  />
                ) : null}
                {order.tax ? (
                  <Line label={t('repairman.tax')} value={formatMoney(order.tax)} />
                ) : null}
                {order.shippingCharges ? (
                  <Line
                    label={t('repairman.shipping')}
                    value={formatMoney(order.shippingCharges)}
                  />
                ) : null}
                <View style={styles.totalRow}>
                  <Text style={[styles.totalLabel, { color: colors.text }]}>
                    {t('customer.total')}
                  </Text>
                  <Text style={[styles.totalValue, { color: colors.primary }]}>
                    {formatMoney(order.totalAmount)}
                  </Text>
                </View>
              </View>
            </Card>
          </FadeUp>

          <FadeUp delay={130} duration={400}>
            <Card icon={userBold} title={t('glossary.customer')}>
              <Line label={t('repairman.name')} value={order.customer?.name} />
              <Line label={t('customer.email')} value={order.customer?.email} />
              <Line label={t('customer.phone')} value={order.customer?.phone} />
              <Line label={t('customer.address')} value={address} />
            </Card>
          </FadeUp>

          <FadeUp delay={160} duration={400}>
            <Card icon={creditCardBold} title={t('customer.payment')}>
              <Line label={t('repairman.method')} value={order.paymentMethod} />
              <Line label={t('customer.status')} value={order.paymentStatus} />
              <Line
                label={t('repairman.paid')}
                value={
                  typeof order.paidAmount === 'number'
                    ? formatMoney(order.paidAmount)
                    : ''
                }
              />
              <Line
                label={t('repairman.remaining')}
                value={
                  typeof order.remainingAmount === 'number'
                    ? formatMoney(order.remainingAmount)
                    : ''
                }
              />
              <Line label={t('repairman.transaction')} value={order.transactionId} />
              <Line label={t('repairman.paidOn')} value={formatDate(order.paymentDate)} />
            </Card>
          </FadeUp>

          <FadeUp delay={190} duration={400}>
            <Card icon={packageBold} title={t('repairman.shippingAndNotes')}>
              <Line label={t('repairman.method')} value={order.shippingMethod} />
              <Line label={t('repairman.trackingNumber')} value={order.trackingNumber} />
              <Line label={t('repairman.shippedOn')} value={formatDate(order.shippingDate)} />
              <Line
                label={t('repairman.estimatedDelivery')}
                value={formatDate(order.estimatedDelivery)}
              />
              <Line
                label={t('repairman.deliveredOn')}
                value={formatDate(order.deliveryDate)}
              />
              <Line
                label={t('glossary.warranty')}
                value={order.warranty ? i18n.t('repairmanMsg.daysValue', { count: order.warranty }) : ''}
              />
              <Line label={t('repairman.notes')} value={order.orderNotes} />
              <Line
                label={t('repairman.cancellationReason')}
                value={order.cancellationReason}
              />
            </Card>
          </FadeUp>

          <FadeUp delay={220} duration={400}>
            <Card icon={clockBold} title={t('repairman.activityTimeline')}>
              {order.activityLog?.length ? (
                order.activityLog.map(log => (
                  <View
                    key={`${log.newStatus}-${log.createdAt}`}
                    style={styles.line}
                  >
                    <View
                      style={[styles.dot, { backgroundColor: colors.primary }]}
                    />
                    <View style={styles.flex}>
                      <Text style={[styles.lineValue, { color: colors.text }]}>
                        {i18n.t('repairmanMsg.statusChange', { from: orderStatusLabel(log.previousStatus), to: orderStatusLabel(log.newStatus) })}
                      </Text>
                      <Text
                        style={[styles.lineLabel, { color: colors.textMuted }]}
                      >
                        {formatDateTime(log.createdAt)}
                        {log.changedBy?.name
                          ? `  •  ${log.changedBy.name}`
                          : ''}
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={[styles.lineLabel, { color: colors.textMuted }]}>
                  {t('repairman.noUpdatesYet')}
                </Text>
              )}
            </Card>
          </FadeUp>
        </ScrollView>
      )}

      <ConfirmModal
        visible={confirmOpen}
        title={t('repairman.markAsReceived')}
        message={t('repairman.confirmThatYouReceivedThe')}
        confirmText={t('repairman.yesReceived')}
        cancelText={t('repairman.notYet')}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={markReceived}
      />

      <AlertModal
        visible={Boolean(notice)}
        type={notice?.type}
        title={notice?.title}
        message={notice?.message}
        onClose={() => setNotice(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  flex: { flex: 1 },
  body: { paddingHorizontal: 20, paddingTop: 14 },
  backWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
  },
  backText: { flexShrink: 1, fontFamily: fonts.bold, fontSize: 14 },
  title: { fontFamily: fonts.bold, fontSize: 22, marginTop: 16 },
  sub: { fontFamily: fonts.regular, fontSize: 12, marginTop: 2 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pillText: { flexShrink: 1, fontFamily: fonts.bold, fontSize: 11 },
  action: { marginTop: 14 },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginTop: 16,
    gap: 12,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { fontFamily: fonts.bold, fontSize: 15 },
  line: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    justifyContent: 'space-between',
  },
  lineLabel: { fontFamily: fonts.regular, fontSize: 12, maxWidth: '40%' },
  lineValue: { flex: 1, textAlign: 'right', fontFamily: fonts.medium, fontSize: 14, lineHeight: 20 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 10,
    padding: 10,
  },
  thumb: { width: 40, height: 40, borderRadius: 8, borderWidth: 1 },
  thumbEmpty: { alignItems: 'center', justifyContent: 'center' },
  totals: { borderTopWidth: 1, paddingTop: 12, gap: 8 },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: { flexShrink: 1, fontFamily: fonts.bold, fontSize: 14 },
  totalValue: { fontFamily: fonts.bold, fontSize: 18 },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
});
