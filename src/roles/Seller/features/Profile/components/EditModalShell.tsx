import { ReactNode, useCallback, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import AlertModal, { AlertModalType } from '@/components/AlertModal';
import Button from '@/components/Button';
import Icon from '@/components/Icon';
import KeyboardSafeView from '@/components/KeyboardSafeView';
import { closeIcon } from '@/assets/icons';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import { useTranslation } from 'react-i18next';

export interface Notice {
  type: AlertModalType;
  title: string;
  message: string;
}

// One themed alert per modal: validation, "no changes", backend success and backend error all go through it
export function useNotice() {
  const [notice, setNotice] = useState<Notice | null>(null);
  const show = useCallback(
    (type: AlertModalType, title: string, message: string) => setNotice({ type, title, message }),
    [],
  );
  const clear = useCallback(() => setNotice(null), []);
  return { notice, show, clear };
}

interface Props {
  visible: boolean;
  title: string;
  subtitle: string;
  saving: boolean;
  notice: Notice | null;
  onClearNotice: () => void;
  onClose: () => void;
  onSave: () => void;
  children: ReactNode;
}

export default function EditModalShell({
  visible,
  title,
  subtitle,
  saving,
  notice,
  onClearNotice,
  onClose,
  onSave,
  children,
}: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const closeNotice = () => {
    const wasSuccess = notice?.type === 'success';
    onClearNotice();
    if (wasSuccess) onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={saving ? undefined : onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={saving ? undefined : onClose} />

        <KeyboardSafeView>
          <View style={styles.center} pointerEvents="box-none">
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <View style={styles.flex}>
                <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
                <Text style={[styles.subtitle, { color: colors.textMuted }]}>{subtitle}</Text>
              </View>
              <TouchableOpacity onPress={onClose} disabled={saving} hitSlop={8} style={styles.close}>
                <Icon source={closeIcon} size={16} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.body}
              showsVerticalScrollIndicator={false}>
              {children}
            </ScrollView>

            <View style={[styles.footer, { borderTopColor: colors.border }]}>
              <Button
                title={t('common.cancel')}
                variant="outline"
                size="sm"
                onPress={onClose}
                disabled={saving}
                style={styles.flex}
              />
              <Button
                title={t('profile.edit.saveChanges')}
                variant="primary"
                size="sm"
                onPress={onSave}
                loading={saving}
                style={styles.flex}
              />
            </View>
          </View>
          </View>
        </KeyboardSafeView>

        <AlertModal
          visible={Boolean(notice)}
          type={notice?.type}
          title={notice?.title}
          message={notice?.message}
          onClose={closeNotice}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.55)' },
  center: { flex: 1, justifyContent: 'center', paddingHorizontal: 20 },
  flex: { flex: 1 },
  card: { borderRadius: 20, borderWidth: 1, overflow: 'hidden', maxHeight: '88%' },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  title: { fontFamily: fonts.bold, fontSize: 18 },
  subtitle: { fontFamily: fonts.regular, fontSize: 12, marginTop: 2 },
  close: { padding: 6 },
  body: { padding: 20, gap: 16 },
  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
});
