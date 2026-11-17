import { StyleSheet, Switch, Text, View } from 'react-native';

import Button from '@/components/Button';
import Icon from '@/components/Icon';
import { mapPinBold, mobileBold, toolExtra } from '@/assets/icons';
import { RepairmanService } from '@/roles/Repairman/api/repairmanApi';
import { formatDate } from '@/utils/dateFormat';
import { formatMoney } from '@/utils/money';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import {
  approvalLabel,
  approvalTone,
  canDeleteService,
  canEditService,
  canToggleService,
  serviceDevice,
  serviceTypeLabel,
} from '../utils/services';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';

interface Props {
  service: RepairmanService;
  toggling: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function Meta({ icon, text }: { icon: number; text: string }) {
  const { colors } = useTheme();
  if (!text) return null;

  return (
    <View style={styles.meta}>
      <Icon source={icon} size={14} color={colors.textMuted} />
      <Text style={[styles.metaText, { color: colors.textMuted }]}>{text}</Text>
    </View>
  );
}

export default function ServiceCard({
  service,
  toggling,
  onToggle,
  onEdit,
  onDelete,
}: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const tone = colors[approvalTone(service.status)];
  const pricing = service.pricing;
  const money = (value?: number) => formatMoney(value ?? 0);

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <View style={styles.head}>
        <Text style={[styles.title, { color: colors.text }]}>
          {service.title}
        </Text>
        <View style={[styles.pill, { backgroundColor: tone + '22' }]}>
          <Text style={[styles.pillText, { color: tone }]}>
            {approvalLabel(service.status)}
          </Text>
        </View>
      </View>

      <Text style={[styles.desc, { color: colors.textMuted }]}>
        {service.description}
      </Text>

      <View style={styles.metaRow}>
        <Meta icon={toolExtra} text={serviceTypeLabel(service.serviceType)} />
        <Meta icon={mobileBold} text={serviceDevice(service)} />
        <Meta icon={mapPinBold} text={service.city || ''} />
      </View>

      <View style={[styles.price, { backgroundColor: colors.surfaceAlt }]}>
        <Text style={[styles.total, { color: colors.text }]}>
          {money(pricing?.total)}
        </Text>
        <Text style={[styles.breakdown, { color: colors.textMuted }]}>
          {i18n.t('repairmanMsg.priceBreakdown', { base: money(pricing?.basePrice), parts: money(pricing?.partsPrice), service: money(pricing?.serviceCharges) })}
        </Text>
      </View>

      {service.status === 'rejected' && service.rejectionReason ? (
        <View
          style={[
            styles.reason,
            { backgroundColor: colors.error + '14', borderColor: colors.error },
          ]}
        >
          <Text style={[styles.reasonTitle, { color: colors.error }]}>
            {t('repairman.rejectionReason')}
          </Text>
          <Text style={[styles.reasonText, { color: colors.text }]}>
            {service.rejectionReason}
          </Text>
        </View>
      ) : null}

      <Text style={[styles.dates, { color: colors.textMuted }]}>
        {i18n.t('repairmanMsg.createdUpdated', { created: formatDate(service.createdAt), updated: formatDate(service.updatedAt) })}
      </Text>

      {canToggleService(service) ? (
        <View style={[styles.switchRow, { borderColor: colors.border }]}>
          <View style={styles.flex}>
            <Text style={[styles.switchTitle, { color: colors.text }]}>
              {service.isActive ? t('repairman.active') : t('repairman.inactive')}
            </Text>
            <Text style={[styles.metaText, { color: colors.textMuted }]}>
              {service.isActive
                ? t('repairman.customersCanSeeThisService')
                : t('repairman.hiddenFromCustomers')}
            </Text>
          </View>
          <Switch
            value={service.isActive}
            disabled={toggling}
            onValueChange={onToggle}
            trackColor={{ true: colors.primary, false: colors.border }}
          />
        </View>
      ) : null}

      {canEditService(service) || canDeleteService(service) ? (
        <View style={styles.actions}>
          {canEditService(service) ? (
            <Button
              title={t('repairman.editOnWebsite')}
              variant="outline"
              size="sm"
              style={styles.flex}
              onPress={onEdit}
            />
          ) : null}
          {canDeleteService(service) ? (
            <Button
              title={t('common.delete')}
              variant="outline"
              size="sm"
              color={colors.error}
              style={styles.flex}
              onPress={onDelete}
            />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginTop: 14,
    gap: 10,
  },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  title: { flex: 1, fontFamily: fonts.bold, fontSize: 16 },
  pill: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  pillText: { fontFamily: fonts.bold, fontSize: 11 },
  desc: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontFamily: fonts.regular, fontSize: 12 },
  price: { borderRadius: 10, padding: 12, gap: 4 },
  total: { fontFamily: fonts.bold, fontSize: 20 },
  breakdown: { fontFamily: fonts.regular, fontSize: 12 },
  reason: { borderRadius: 10, borderWidth: 1, padding: 12, gap: 4 },
  reasonTitle: { fontFamily: fonts.bold, fontSize: 12 },
  reasonText: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19 },
  dates: { fontFamily: fonts.regular, fontSize: 11 },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderTopWidth: 1,
    paddingTop: 10,
  },
  switchTitle: { fontFamily: fonts.bold, fontSize: 13 },
  actions: { flexDirection: 'row', gap: 10 },
});
