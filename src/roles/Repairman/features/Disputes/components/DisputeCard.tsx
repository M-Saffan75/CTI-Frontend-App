import { StyleSheet, Text, View } from 'react-native';

import Button from '@/components/Button';
import { RepairmanDispute } from '@/roles/Repairman/api/repairmanApi';
import { formatDate } from '@/utils/dateFormat';
import { useTheme } from '@/theme/ThemeContext';
import Avatar from '@/components/Avatar';
import { fonts } from '@/theme/fonts';
import {
  categoryLabel,
  otherParty,
  priorityLabel,
  priorityTone,
  raisedByMe,
  statusLabel,
  statusTone,
} from '../utils/disputes';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';

export default function DisputeCard({
  dispute,
  onOpen,
}: {
  dispute: RepairmanDispute;
  onOpen: () => void;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const customer = otherParty(dispute)?.userId;
  const status = colors[statusTone(dispute.status)];
  const priority = colors[priorityTone(dispute.priority)];

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <View style={styles.head}>
        <Text
          style={[styles.id, { color: colors.textMuted }]}
          numberOfLines={1}
        >
          {dispute.disputeId}
        </Text>
        <View style={[styles.pill, { backgroundColor: status + '22' }]}>
          <Text style={[styles.pillText, { color: status }]}>
            {statusLabel(dispute.status)}
          </Text>
        </View>
        {dispute.priority ? (
          <View style={[styles.pill, { backgroundColor: priority + '22' }]}>
            <Text style={[styles.pillText, { color: priority }]}>
              {priorityLabel(dispute.priority)}
            </Text>
          </View>
        ) : null}
      </View>

      <Text style={[styles.title, { color: colors.text }]}>
        {categoryLabel(dispute.category)}
      </Text>
      <Text
        style={[styles.desc, { color: colors.textMuted }]}
        numberOfLines={2}
      >
        {dispute.description}
      </Text>

      <View style={styles.person}>
        <Avatar
          uri={customer?.profilePicture}
          name={customer?.name}
          style={[styles.avatar, { borderColor: colors.avatarBorder }]}
        />
        <View style={styles.flex}>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
            {customer?.name || i18n.t('glossary.customer')}
          </Text>
          <Text style={[styles.meta, { color: colors.textMuted }]}>
            {raisedByMe(dispute) ? t('repairman.raisedByYou') : t('repairman.raisedByTheCustomer')}
            {'  •  '}
            {formatDate(dispute.createdAt)}
          </Text>
        </View>
      </View>

      {dispute.jobId?.title ? (
        <Text
          style={[styles.meta, { color: colors.textMuted }]}
          numberOfLines={1}
        >
          {i18n.t('repairmanMsg.jobTitleLine', { title: dispute.jobId.title })}
        </Text>
      ) : null}

      <Button title={t('repairman.view')} size="sm" variant="outline" onPress={onOpen} />
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
    gap: 8,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  id: { flex: 1, fontFamily: fonts.regular, fontSize: 11 },
  pill: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  pillText: { fontFamily: fonts.bold, fontSize: 11 },
  title: { fontFamily: fonts.bold, fontSize: 16 },
  desc: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19 },
  person: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 34, height: 34, borderRadius: 17, borderWidth: 1 },
  name: { fontFamily: fonts.bold, fontSize: 13 },
  meta: { fontFamily: fonts.regular, fontSize: 12 },
});
