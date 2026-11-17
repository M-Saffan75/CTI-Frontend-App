import { StyleSheet, Text, View } from 'react-native';

import Button from '@/components/Button';
import Icon from '@/components/Icon';
import { clockBold, mapPinBold, mobileBold } from '@/assets/icons';
import { MyOffer } from '@/roles/Repairman/api/repairmanApi';
import { formatDate, timeRemaining } from '@/utils/dateFormat';
import { formatMoney } from '@/utils/money';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import { urgencyLabel } from '../utils/jobBoard';
import {
  canOpenOffer,
  canWithdrawOffer,
  isOfferExpired,
  offerStatusLabel,
  offerTitle,
  offerTone,
} from '../utils/offers';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';

interface Props {
  offer: MyOffer;
  onOpen: () => void;
  onWithdraw: () => void;
}

export default function MyOfferCard({ offer, onOpen, onWithdraw }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const tone = colors[offerTone(offer)];
  const expired = isOfferExpired(offer);
  const job = offer.jobId;
  const currency = offer.pricing?.currency || 'TRY';

  return (
    <View
      style={[
        styles.card,
        expired && styles.dim,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <View style={styles.metaRow}>
        <View style={[styles.pill, { backgroundColor: tone + '22' }]}>
          <Text style={[styles.pillText, { color: tone }]}>
            {offerStatusLabel(offer)}
          </Text>
        </View>
        {job?.urgency ? (
          <View style={styles.pill}>
            <Icon source={clockBold} size={12} color={colors.textMuted} />
            <Text style={[styles.pillText, { color: colors.textMuted }]}>
              {urgencyLabel(job.urgency)}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.titleRow}>
        <View style={[styles.deviceIcon, { borderColor: colors.border }]}>
          <Icon source={mobileBold} size={16} color={colors.primary} />
        </View>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
          {offerTitle(offer)}
        </Text>
      </View>

      <Text style={[styles.price, { color: colors.primary }]}>
        {formatMoney(offer.pricing?.totalPrice, currency)}
      </Text>
      <Text style={[styles.sub, { color: colors.textMuted }]}>
        {offer.estimatedTime?.value} {i18n.t(`customerMsg.unit.${offer.estimatedTime?.unit}`, { defaultValue: String(offer.estimatedTime?.unit || '') })}
        {offer.warranty?.duration
          ? i18n.t('repairmanMsg.warrantyDays', { days: offer.warranty.duration })
          : ''}
      </Text>
      <Text style={[styles.sub, { color: colors.textMuted }]}>
        {i18n.t('repairmanMsg.sentOn', { date: formatDate(offer.createdAt) })}
        {offer.status === 'pending' && offer.expiresAt && !expired
          ? i18n.t('repairmanMsg.offerExpiresIn', { time: timeRemaining(offer.expiresAt) })
          : ''}
      </Text>

      <Text
        style={[styles.description, { color: colors.textMuted }]}
        numberOfLines={2}
      >
        {offer.description}
      </Text>

      {job?.location?.address ? (
        <View style={styles.locationRow}>
          <Icon source={mapPinBold} size={14} color={colors.textMuted} />
          <Text
            style={[styles.sub, styles.flex, { color: colors.textMuted }]}
            numberOfLines={1}
          >
            {job.location.address}
          </Text>
        </View>
      ) : null}

      <View style={styles.actions}>
        {canOpenOffer(offer) ? (
          <Button
            title={t('repairman.view')}
            size="sm"
            variant="soft"
            fullWidth={false}
            style={styles.flex}
            onPress={onOpen}
          />
        ) : null}
        {canWithdrawOffer(offer) ? (
          <Button
            title={t('glossary.withdraw')}
            size="sm"
            variant="outline"
            fullWidth={false}
            style={styles.flex}
            onPress={onWithdraw}
          />
        ) : null}
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
  dim: { opacity: 0.6 },
  flex: { flex: 1 },
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
  price: { fontFamily: fonts.bold, fontSize: 18, marginTop: 8 },
  sub: { fontFamily: fonts.regular, fontSize: 12 },
  description: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  actions: { flexDirection: 'row', gap: 10, marginTop: 12 },
});
