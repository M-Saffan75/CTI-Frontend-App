import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import Icon from '@/components/Icon';
import { chevronDownBold } from '@/assets/icons';
import { DashboardBooking } from '@/roles/Repairman/api/repairmanApi';
import { formatDate } from '@/utils/dateFormat';
import { formatMoney } from '@/utils/money';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import { statusLabel, statusTone } from '../utils/bookingStatus';
import { useTranslation } from 'react-i18next';

const NA = 'N/A';

export default function BookingCard({
  booking,
  onOpen,
}: {
  booking: DashboardBooking;
  onOpen?: () => void;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const tone = colors[statusTone(booking.status)];
  const device = [booking.device.brand, booking.device.model]
    .filter(Boolean)
    .join(' ');
  const total = booking.pricing?.totalAmount;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
      ]}
    >
      <View style={styles.head}>
        <Text style={[styles.id, { color: colors.textMuted }]}>
          #{booking._id.slice(-8)}
        </Text>
        <View style={[styles.pill, { backgroundColor: tone + '22' }]}>
          <Text style={[styles.pillText, { color: tone }]}>
            {statusLabel(booking.status)}
          </Text>
        </View>
      </View>

      <Text style={[styles.label, { color: colors.text }]}>{t('glossary.customer')}</Text>
      <Text style={[styles.value, { color: colors.textMuted }]}>
        {booking.customer.name || NA}
      </Text>
      <Text style={[styles.value, { color: colors.textMuted }]}>
        {booking.customer.phone || NA}
      </Text>

      <View style={styles.meta}>
        <View style={styles.flex}>
          <Text style={[styles.label, { color: colors.text }]}>{t('repairman.device')}</Text>
          <Text style={[styles.value, { color: colors.textMuted }]}>
            {device || NA}
          </Text>
        </View>
        <View style={styles.flex}>
          <Text style={[styles.label, { color: colors.text }]}>{t('repairman.schedule')}</Text>
          <Text style={[styles.value, { color: colors.textMuted }]}>
            {formatDate(booking.scheduledDate) || t('repairman.notScheduled')}
          </Text>
        </View>
      </View>

      <View style={styles.footerRow}>
        <TouchableOpacity
          onPress={() => setOpen(!open)}
          style={styles.toggle}
          hitSlop={6}
        >
          <Text style={[styles.toggleText, { color: colors.primary }]}>
            {open ? t('repairman.hideDetails') : t('repairman.showDetails')}
          </Text>
          <Icon
            source={chevronDownBold}
            size={12}
            color={colors.primary}
            style={open ? styles.flipped : undefined}
          />
        </TouchableOpacity>
        {onOpen ? (
          <TouchableOpacity onPress={onOpen} hitSlop={6}>
            <Text style={[styles.toggleText, { color: colors.primary }]}>
              {t('repairman.openJob')}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {open && (
        <View style={[styles.details, { borderTopColor: colors.border }]}>
          {booking.job?.description ? (
            <>
              <Text style={[styles.label, { color: colors.text }]}>
                {t('customer.description')}
              </Text>
              <Text style={[styles.value, { color: colors.textMuted }]}>
                {booking.job.description}
              </Text>
            </>
          ) : null}
          <Text style={[styles.label, { color: colors.text }]}>{t('customer.total')}</Text>
          <Text style={[styles.value, { color: colors.textMuted }]}>
            {typeof total === 'number'
              ? formatMoney(total, booking.pricing?.currency || 'TRY')
              : NA}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 2 },
  flex: { flex: 1 },
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  id: { fontFamily: fonts.regular, fontSize: 12 },
  pill: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  pillText: { fontFamily: fonts.bold, fontSize: 11 },
  label: { fontFamily: fonts.bold, fontSize: 13, marginTop: 6 },
  value: { fontFamily: fonts.regular, fontSize: 12 },
  meta: { flexDirection: 'row', gap: 16, marginTop: 2 },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  toggle: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  toggleText: { fontFamily: fonts.medium, fontSize: 12 },
  flipped: { transform: [{ rotate: '180deg' }] },
  details: { borderTopWidth: 1, marginTop: 8, paddingTop: 4 },
});
