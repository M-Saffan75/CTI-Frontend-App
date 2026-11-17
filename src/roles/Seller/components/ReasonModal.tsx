import { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import Button from '@/components/Button';
import KeyboardSafeView from '@/components/KeyboardSafeView';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import { useTranslation } from 'react-i18next';

interface Props {
  visible: boolean;
  title: string;
  message?: string;
  placeholder: string;
  confirmText: string;
  required?: boolean;
  danger?: boolean;
  loading?: boolean;
  onConfirm: (text: string) => void;
  onCancel: () => void;
}

// A confirm dialog with a text box (reject reason, approval note).
export default function ReasonModal({
  visible,
  title,
  message,
  placeholder,
  confirmText,
  required = false,
  danger = false,
  loading = false,
  onConfirm,
  onCancel,
}: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [text, setText] = useState('');

  useEffect(() => {
    if (visible) setText('');
  }, [visible]);

  const canSubmit = !loading && (!required || text.trim().length > 0);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <KeyboardSafeView style={[styles.center, { backgroundColor: colors.backdrop }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={loading ? undefined : onCancel} />
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          {message ? <Text style={[styles.message, { color: colors.textMuted }]}>{message}</Text> : null}

          <TextInput
            value={text}
            onChangeText={setText}
            placeholder={placeholder}
            placeholderTextColor={colors.textMuted}
            multiline
            editable={!loading}
            textAlignVertical="top"
            style={[
              styles.input,
              { color: colors.text, backgroundColor: colors.surfaceAlt, borderColor: colors.border },
            ]}
          />

          <View style={styles.actions}>
            <Button
              title={t('common.cancel')}
              variant="soft"
              size="md"
              fullWidth={false}
              style={styles.action}
              disabled={loading}
              onPress={onCancel}
            />
            <Button
              title={confirmText}
              size="md"
              fullWidth={false}
              style={styles.action}
              color={danger ? colors.error : null}
              loading={loading}
              disabled={!canSubmit}
              onPress={() => onConfirm(text.trim())}
            />
          </View>
        </View>
      </KeyboardSafeView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  card: { width: '100%', maxWidth: 380, borderRadius: 20, padding: 18 },
  title: { fontFamily: fonts.bold, fontSize: 17 },
  message: { fontFamily: fonts.regular, fontSize: 13, marginTop: 6, lineHeight: 19 },
  input: {
    minHeight: 90,
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    fontFamily: fonts.regular,
    fontSize: 14,
  },
  actions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  action: { flex: 1 },
});
