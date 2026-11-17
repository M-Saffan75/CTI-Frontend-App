import { StyleSheet, Text, View } from 'react-native';

import Button from '@/components/Button';
import Icon from '@/components/Icon';
import { clockBold, mapPinBold, mobileBold } from '@/assets/icons';
import { BoardJob } from '@/roles/Repairman/api/repairmanApi';
import { formatDate, timeAgo, timeRemaining } from '@/utils/dateFormat';
import { formatMoney } from '@/utils/money';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import { isExpired, isJobAvailable, jobStatusLabel, urgencyLabel } from '../utils/jobBoard';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';

export default function JobBoardCard({ job, onOpen }: { job: BoardJob; onOpen: () => void }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const expired = isExpired(job);
  const available = isJobAvailable(job);
  const statusColor = available ? colors.success : colors.textMuted;
  const urgent = job.urgency === 'high' || job.urgency === 'urgent';
  const priorityColor = urgent ? colors.error : colors.textMuted;
  const currency = job.budget?.currency || 'TRY';
  const place = [job.location?.city?.name, job.location?.address].filter(Boolean).join(', ');

  return (
    <View
      style={[
        styles.card,
        expired && styles.dim,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}>
      <View style={styles.metaRow}>
        <View style={[styles.pill, { backgroundColor: statusColor + '22' }]}>
          <Text style={[styles.pillText, { color: statusColor }]}>{jobStatusLabel(job)}</Text>
        </View>
        <View style={[styles.pill, { backgroundColor: priorityColor + '18' }]}>
          <Icon source={clockBold} size={12} color={priorityColor} />
          <Text style={[styles.pillText, { color: priorityColor }]}>{urgencyLabel(job.urgency)}</Text>
        </View>
      </View>
      {job.expiresAt && !expired ? (
        <Text style={[styles.expires, { color: colors.primary }]}>
          {i18n.t('repairmanMsg.expiresIn', { time: timeRemaining(job.expiresAt) })}
        </Text>
      ) : null}

      <View style={styles.titleRow}>
        <View style={[styles.deviceIcon, { borderColor: colors.border }]}>
          <Icon source={mobileBold} size={16} color={colors.primary} />
        </View>
        <Text style={[styles.deviceName, { color: colors.text }]} numberOfLines={2}>
          {job.deviceInfo.brand} {job.deviceInfo.model}
        </Text>
      </View>

      <Text style={[styles.priceText, { color: colors.textMuted }]}>
        {formatMoney(job.budget?.min, currency)} - {formatMoney(job.budget?.max, currency)}
      </Text>
      <Text style={[styles.posted, { color: colors.primary }]}>
        {i18n.t('repairmanMsg.postedDate', { when: timeAgo(job.createdAt), date: formatDate(job.createdAt) })}
      </Text>

      <Text style={[styles.description, { color: colors.textMuted }]} numberOfLines={3}>
        {job.description}
      </Text>

      {job.services?.length ? (
        <View style={styles.tags}>
          {job.services.map(service => (
            <View key={service._id} style={[styles.tag, { borderColor: colors.border }]}>
              <Text style={[styles.tagText, { color: colors.text }]}>{service.name}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <Text style={[styles.offers, { color: colors.text }]}>
        {i18n.t('repairmanMsg.offersReceived', { count: job.offers?.length || 0, max: job.maxOffers ?? 10 })}
      </Text>
      <View style={styles.locationRow}>
        <Icon source={mapPinBold} size={14} color={colors.textMuted} />
        <Text style={[styles.locationText, { color: colors.textMuted }]} numberOfLines={1}>
          {place || t('repairman.locationNotSet')}
        </Text>
        <Button title={t('customer.viewDetail')} size="sm" fullWidth={false} onPress={onOpen} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1, padding: 16, marginTop: 16 },
  dim: { opacity: 0.6 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pillText: { fontFamily: fonts.bold, fontSize: 11 },
  expires: { fontFamily: fonts.medium, fontSize: 12, marginTop: 8 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  deviceIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deviceName: { flex: 1, fontFamily: fonts.bold, fontSize: 18 },
  priceText: { fontFamily: fonts.bold, fontSize: 14, marginTop: 10 },
  posted: { fontFamily: fonts.medium, fontSize: 12, marginTop: 2 },
  description: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19, marginTop: 12 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  tag: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 5 },
  tagText: { fontFamily: fonts.medium, fontSize: 12 },
  divider: { height: 1, marginVertical: 14 },
  offers: { fontFamily: fonts.medium, fontSize: 12, marginBottom: 8 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  locationText: { flex: 1, fontFamily: fonts.regular, fontSize: 12 },
});
