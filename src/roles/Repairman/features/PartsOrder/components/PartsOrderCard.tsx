import { StyleSheet, Text, View } from 'react-native';

import Button from '@/components/Button';
import Icon from '@/components/Icon';
import { calendarBold, checkCircleBold, packageBold } from '@/assets/icons';
import { PartsOrder } from '@/roles/Repairman/api/repairmanApi';
import { formatDate } from '@/utils/dateFormat';
import { formatMoney } from '@/utils/money';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import { orderStatusLabel, orderStatusTone, paymentTone, shippingLabel } from '../utils/parts';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';

export default function PartsOrderCard({
  order,
  onOpen,
}: {
  order: PartsOrder;
  onOpen: () => void;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const statusColor = colors[orderStatusTone(order.orderStatus)];
  const payColor = colors[paymentTone(order.paymentStatus)];
  const shown = order.items.slice(0, 2);

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <View style={styles.head}>
        <View style={styles.titleRow}>
          <View style={[styles.icon, { borderColor: colors.border }]}>
            <Icon source={packageBold} size={16} color={colors.primary} />
          </View>
          <Text
            style={[styles.orderNo, { color: colors.text }]}
            numberOfLines={1}
          >
            #{order.orderNumber || order._id.slice(-6)}
          </Text>
        </View>
        <Text style={[styles.total, { color: colors.primary }]}>
          {formatMoney(order.totalAmount)}
        </Text>
      </View>

      <View style={styles.pills}>
        <View style={[styles.pill, { backgroundColor: statusColor + '22' }]}>
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
            style={[styles.pill, { backgroundColor: colors.success + '22' }]}
          >
            <Icon source={checkCircleBold} size={11} color={colors.success} />
            <Text style={[styles.pillText, { color: colors.success }]}>
              {t('repairman.received')}
            </Text>
          </View>
        ) : null}
      </View>

      <Text style={[styles.customer, { color: colors.text }]} numberOfLines={1}>
        {order.customer?.name}
      </Text>
      <Text style={[styles.sub, { color: colors.textMuted }]} numberOfLines={1}>
        {[order.customer?.phone, order.customer?.email]
          .filter(Boolean)
          .join('  •  ')}
      </Text>

      <View style={[styles.items, { backgroundColor: colors.surfaceAlt }]}>
        <Text style={[styles.itemsTitle, { color: colors.text }]}>
          {i18n.t(order.items.length === 1 ? 'repairmanMsg.itemsOne' : 'repairmanMsg.itemsMany', { count: order.items.length })}
        </Text>
        {shown.map(item => (
          <Text
            key={`${item.partName}-${item.partSku || ''}`}
            style={[styles.sub, { color: colors.textMuted }]}
            numberOfLines={1}
          >
            {item.partName} ×{item.quantity}
          </Text>
        ))}
        {order.items.length > shown.length ? (
          <Text style={[styles.sub, { color: colors.textMuted }]}>
            {i18n.t('repairmanMsg.moreItems', { count: order.items.length - shown.length })}
          </Text>
        ) : null}
      </View>

      <View style={styles.footer}>
        <View style={styles.inline}>
          <Icon source={calendarBold} size={12} color={colors.textMuted} />
          <Text style={[styles.sub, { color: colors.textMuted }]}>
            {formatDate(order.createdAt)} • {order.shippingMethod ? shippingLabel(order.shippingMethod) : i18n.t('repairmanMsg.pickupDefault')}
          </Text>
        </View>
        <Button title={t('repairman.view')} size="sm" fullWidth={false} onPress={onOpen} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginTop: 16,
    gap: 4,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  titleRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  icon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderNo: { flex: 1, fontFamily: fonts.bold, fontSize: 16 },
  total: { fontFamily: fonts.bold, fontSize: 17 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pillText: { flexShrink: 1, fontFamily: fonts.bold, fontSize: 11 },
  customer: { fontFamily: fonts.medium, fontSize: 14, marginTop: 8 },
  sub: { fontFamily: fonts.regular, fontSize: 12 },
  items: { borderRadius: 10, padding: 10, gap: 2, marginTop: 8 },
  itemsTitle: { fontFamily: fonts.bold, fontSize: 13 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 10,
  },
  inline: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
});
