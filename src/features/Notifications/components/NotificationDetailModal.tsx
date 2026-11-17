import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import Button from '@/components/Button';
import Icon from '@/components/Icon';
import { bellFilled } from '@/assets/icons';
import { NotificationItem } from '@/services/notificationApi';
import { formatDateTime } from '@/utils/dateFormat';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import {
  DetailRow,
  NotificationAction,
  notificationTypeLabel,
} from '../utils/notificationDetails';
import { useTranslation } from 'react-i18next';

interface Props {
  item: NotificationItem | null;
  rows: DetailRow[];
  action: NotificationAction | null;
  onAction: () => void;
  onClose: () => void;
}

// Full text of one notification with the details the backend saved with it
export default function NotificationDetailModal({
  item,
  rows,
  action,
  onAction,
  onClose,
}: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <Modal
      visible={Boolean(item)}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={[styles.overlay, { backgroundColor: colors.backdrop }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        {item ? (
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.head}>
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: colors.primary + '18' },
                ]}
              >
                <Icon source={bellFilled} size={20} color={colors.primary} />
              </View>
              <View style={styles.flex}>
                <Text style={[styles.type, { color: colors.primary }]}>
                  {notificationTypeLabel(item.type)}
                </Text>
                <Text style={[styles.time, { color: colors.textMuted }]}>
                  {formatDateTime(item.createdAt)}
                </Text>
              </View>
            </View>

            <ScrollView
              style={styles.scroll}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.body}
            >
              <Text style={[styles.title, { color: colors.text }]}>
                {item.title}
              </Text>
              {item.body ? (
                <Text style={[styles.message, { color: colors.textMuted }]}>
                  {item.body}
                </Text>
              ) : null}

              {rows.length > 0 ? (
                <View
                  style={[
                    styles.details,
                    {
                      backgroundColor: colors.surfaceAlt,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  {rows.map(row => (
                    <View key={row.label} style={styles.row}>
                      <Text
                        style={[styles.rowLabel, { color: colors.textMuted }]}
                      >
                        {row.label}
                      </Text>
                      <Text style={[styles.rowValue, { color: colors.text }]}>
                        {row.value}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </ScrollView>

            <View style={styles.actions}>
              <Button
                title={t('common.close')}
                variant="outline"
                size="sm"
                fullWidth={false}
                style={styles.flex}
                onPress={onClose}
              />
              {action ? (
                <Button
                  title={action.label}
                  size="sm"
                  fullWidth={false}
                  style={styles.flex}
                  onPress={onAction}
                />
              ) : null}
            </View>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', padding: 20 },
  flex: { flex: 1 },
  card: { borderRadius: 20, borderWidth: 1, padding: 18, maxHeight: '85%' },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  type: { fontFamily: fonts.bold, fontSize: 13 },
  time: { fontFamily: fonts.regular, fontSize: 12, marginTop: 2 },
  scroll: { marginTop: 12, flexGrow: 0 },
  body: { gap: 10 },
  title: { fontFamily: fonts.bold, fontSize: 17, lineHeight: 23 },
  message: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 21 },
  details: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 10,
    marginTop: 4,
  },
  row: { gap: 2 },
  rowLabel: { fontFamily: fonts.regular, fontSize: 12 },
  rowValue: { fontFamily: fonts.medium, fontSize: 14 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 16 },
});
