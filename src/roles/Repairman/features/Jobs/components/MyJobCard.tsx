import { Image, StyleSheet, Text, View } from 'react-native';

import Button from '@/components/Button';
import Icon from '@/components/Icon';
import {
  calendarBold,
  clockBold,
  dummyProfileExtra,
  mobileBold,
} from '@/assets/icons';
import { MyBooking } from '@/roles/Repairman/api/repairmanApi';
import {
  statusLabel,
  statusTone,
} from '@/roles/Repairman/features/Dashboard/utils/bookingStatus';
import { formatDate } from '@/utils/dateFormat';
import { formatMoney } from '@/utils/money';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import {
  bookingDevice,
  bookingServices,
  bookingUrgency,
  serviceTypeLabel,
} from '../utils/bookings';
import { urgencyLabel } from '../utils/jobBoard';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';

interface Props {
  booking: MyBooking;
  onOpen: () => void;
}

export default function MyJobCard({ booking, onOpen }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const status = booking.bookingDetails?.status;
  const tone = colors[statusTone(status)];
  const pricing = booking.bookingDetails?.pricing;
  const urgency = bookingUrgency(booking);
  const urgent = urgency === 'high' || urgency === 'urgent';
  const services = bookingServices(booking.jobDetails);
  const serviceType = serviceTypeLabel(booking.bookingDetails?.serviceType);
  const scheduled = formatDate(booking.bookingDetails?.scheduledDate);
  const avatar = booking.customer?.avatar;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <View style={styles.metaRow}>
        <View style={[styles.pill, { backgroundColor: tone + '22' }]}>
          <Text style={[styles.pillText, { color: tone }]}>
            {statusLabel(status)}
          </Text>
        </View>
        <View style={styles.pill}>
          <Icon
            source={clockBold}
            size={12}
            color={urgent ? colors.error : colors.textMuted}
          />
          <Text
            style={[
              styles.pillText,
              { color: urgent ? colors.error : colors.textMuted },
            ]}
          >
            {urgencyLabel(urgency)}
          </Text>
        </View>
        {serviceType ? (
          <View
            style={[styles.pill, { backgroundColor: colors.primary + '18' }]}
          >
            <Text style={[styles.pillText, { color: colors.primary }]}>
              {serviceType}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.titleRow}>
        <View style={[styles.deviceIcon, { borderColor: colors.border }]}>
          <Icon source={mobileBold} size={16} color={colors.primary} />
        </View>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
          {bookingDevice(booking.jobDetails)}
        </Text>
      </View>

      <View style={styles.customerRow}>
        <Image
          source={avatar ? { uri: avatar } : dummyProfileExtra}
          style={[styles.avatar, { borderColor: colors.avatarBorder }]}
        />
        <Text
          style={[styles.customerName, { color: colors.text }]}
          numberOfLines={1}
        >
          {booking.customer?.name || i18n.t('glossary.customer')}
        </Text>
      </View>

      <Text style={[styles.price, { color: colors.primary }]}>
        {typeof pricing?.totalAmount === 'number'
          ? formatMoney(pricing.totalAmount, pricing.currency || 'TRY')
          : ''}
      </Text>
      {scheduled ? (
        <View style={styles.inline}>
          <Icon source={calendarBold} size={12} color={colors.textMuted} />
          <Text style={[styles.sub, { color: colors.textMuted }]}>
            {i18n.t('repairmanMsg.scheduledOn', { date: scheduled })}
          </Text>
        </View>
      ) : null}

      {booking.jobDetails?.description ? (
        <Text
          style={[styles.description, { color: colors.textMuted }]}
          numberOfLines={2}
        >
          {booking.jobDetails.description}
        </Text>
      ) : null}

      {services.length ? (
        <View style={styles.tags}>
          {services.map(service => (
            <View
              key={service}
              style={[styles.tag, { borderColor: colors.border }]}
            >
              <Text style={[styles.tagText, { color: colors.text }]}>
                {service}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      <Button
        title={
          booking.canUpdateStatus ? t('repairman.viewAndUpdateStatus') : t('customer.viewDetails')
        }
        onPress={onOpen}
        style={styles.action}
      />
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
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pillText: { fontFamily: fonts.bold, fontSize: 11 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  deviceIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { flex: 1, fontFamily: fonts.bold, fontSize: 17 },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  avatar: { width: 26, height: 26, borderRadius: 13, borderWidth: 1 },
  customerName: { flex: 1, fontFamily: fonts.medium, fontSize: 13 },
  price: { fontFamily: fonts.bold, fontSize: 18, marginTop: 6 },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sub: { flexShrink: 1, fontFamily: fonts.regular, fontSize: 12 },
  description: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
  },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  tag: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  tagText: { fontFamily: fonts.medium, fontSize: 12 },
  action: { marginTop: 12 },
});
