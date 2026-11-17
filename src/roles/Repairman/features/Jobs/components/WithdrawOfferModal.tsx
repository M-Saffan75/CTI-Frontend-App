import { useEffect, useRef, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import AlertModal from '@/components/AlertModal';
import Button from '@/components/Button';
import KeyboardSafeView from '@/components/KeyboardSafeView';
import repairmanApi from '@/roles/Repairman/api/repairmanApi';
import { normalizeApiError } from '@/services/apiError';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';

const MAX_REASON = 500;

interface Props {
  visible: boolean;
  offerId: string;
  title: string;
  onClose: () => void;
  onWithdrawn: (message: string) => void;
}

// Confirm before withdrawing. Like the web, a reason is required (up to 500 characters).
export default function WithdrawOfferModal({
  visible,
  offerId,
  title,
  onClose,
  onWithdrawn,
}: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [reason, setReason] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const busy = useRef(false);

  useEffect(() => {
    if (visible) {
      setReason('');
      setFieldError('');
      setError('');
    }
  }, [visible]);

  const submit = async () => {
    if (busy.current) return;
    const text = reason.trim();
    if (!text) {
      setFieldError(i18n.t('repairman.pleaseProvideAReasonFor'));
      return;
    }

    busy.current = true;
    setSubmitting(true);
    try {
      const { message } = await repairmanApi.withdrawOffer(offerId, text);
      onWithdrawn(message || i18n.t('repairman.offerWithdrawnSuccessfully'));
    } catch (e) {
      setError(normalizeApiError(e).message);
    } finally {
      busy.current = false;
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={submitting ? undefined : onClose}
    >
      <View style={styles.overlay}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={submitting ? undefined : onClose}
        />
        <KeyboardSafeView>
          <View style={styles.center} pointerEvents="box-none">
            <View
              style={[
                styles.card,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <ScrollView
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.body}
              >
                <Text style={[styles.title, { color: colors.text }]}>
                  {t('repairman.withdrawOffer')}
                </Text>
                <Text style={[styles.message, { color: colors.textMuted }]}>
                  {i18n.t('repairmanMsg.withdrawOfferBody', { title })}
                </Text>

                <Text style={[styles.label, { color: colors.text }]}>
                  {i18n.t('repairmanMsg.reasonLabel')} <Text style={{ color: colors.error }}>*</Text>
                </Text>
                <View
                  style={[
                    styles.inputBox,
                    {
                      backgroundColor: colors.surfaceAlt,
                      borderColor: fieldError
                        ? colors.error
                        : colors.surfaceAlt,
                    },
                  ]}
                >
                  <TextInput
                    value={reason}
                    onChangeText={text => {
                      setReason(text);
                      setFieldError('');
                    }}
                    placeholder={t('repairman.whyDoYouWithdrawThis')}
                    placeholderTextColor={colors.textMuted}
                    multiline
                    maxLength={MAX_REASON}
                    editable={!submitting}
                    style={[styles.input, { color: colors.text }]}
                  />
                </View>
                <View style={styles.counterRow}>
                  <Text style={[styles.error, { color: colors.error }]}>
                    {fieldError}
                  </Text>
                  <Text style={[styles.counter, { color: colors.textMuted }]}>
                    {reason.length}/{MAX_REASON}
                  </Text>
                </View>

                <View style={styles.actions}>
                  <Button
                    title={t('repairman.keepOffer')}
                    variant="outline"
                    size="sm"
                    style={styles.flex}
                    disabled={submitting}
                    onPress={onClose}
                  />
                  <Button
                    title={t('glossary.withdraw')}
                    size="sm"
                    style={styles.flex}
                    loading={submitting}
                    onPress={submit}
                  />
                </View>
              </ScrollView>
            </View>
          </View>
        </KeyboardSafeView>

        <AlertModal
          visible={Boolean(error)}
          type="error"
          title={t('repairman.couldNotWithdraw')}
          message={error}
          onClose={() => setError('')}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.55)' },
  center: { flex: 1, justifyContent: 'center', paddingHorizontal: 20 },
  flex: { flex: 1 },
  card: { borderRadius: 20, borderWidth: 1, maxHeight: '88%' },
  body: { padding: 20, gap: 10 },
  title: { fontFamily: fonts.bold, fontSize: 18 },
  message: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19 },
  label: { fontFamily: fonts.medium, fontSize: 13, marginTop: 6 },
  inputBox: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  input: {
    minHeight: 90,
    textAlignVertical: 'top',
    fontFamily: fonts.regular,
    fontSize: 14,
    padding: 0,
  },
  counterRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  error: { flex: 1, fontFamily: fonts.regular, fontSize: 12 },
  counter: { fontFamily: fonts.regular, fontSize: 11 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 8 },
});
