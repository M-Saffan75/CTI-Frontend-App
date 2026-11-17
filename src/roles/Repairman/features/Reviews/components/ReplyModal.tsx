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
import repairmanApi, {
  ReceivedReview,
} from '@/roles/Repairman/api/repairmanApi';
import { normalizeApiError } from '@/services/apiError';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';

const MIN_REPLY = 10;
const MAX_REPLY = 500;

interface Props {
  review: ReceivedReview | null;
  onClose: () => void;
  onReplied: (review: ReceivedReview, message: string) => void;
}

// Answer a review (POST /reviews/:id/respond). Answering again replaces the earlier answer.
export default function ReplyModal({ review, onClose, onReplied }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [text, setText] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const busy = useRef(false);

  useEffect(() => {
    if (review) {
      setText(review.repairmanResponse?.text || '');
      setFieldError('');
      setError('');
    }
  }, [review]);

  const submit = async () => {
    if (busy.current || !review) return;
    const reply = text.trim();
    if (reply.length < MIN_REPLY) {
      setFieldError(i18n.t('repairmanMsg.replyMin', { min: MIN_REPLY }));
      return;
    }
    if (reply === (review.repairmanResponse?.text || '').trim()) {
      setFieldError(i18n.t('repairman.thisIsAlreadyYourReply'));
      return;
    }

    busy.current = true;
    setSubmitting(true);
    try {
      const { message, review: updated } = await repairmanApi.respondToReview(
        review._id,
        reply,
      );
      onReplied(
        {
          ...review,
          repairmanResponse: updated?.repairmanResponse || {
            text: reply,
            respondedAt: new Date().toISOString(),
          },
        },
        message || i18n.t('repairman.responseSubmittedSuccessfully'),
      );
    } catch (e) {
      setError(normalizeApiError(e).message);
    } finally {
      busy.current = false;
      setSubmitting(false);
    }
  };

  const editing = Boolean(review?.repairmanResponse?.text);

  return (
    <Modal
      visible={Boolean(review)}
      transparent
      animationType="fade"
      onRequestClose={submitting ? undefined : onClose}
    >
      <View style={[styles.overlay, { backgroundColor: colors.backdrop }]}>
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
                  {editing ? t('repairman.editYourReply') : t('repairman.replyToReview')}
                </Text>
                {review?.reviewText ? (
                  <Text
                    style={[
                      styles.quote,
                      {
                        color: colors.textMuted,
                        borderLeftColor: colors.border,
                      },
                    ]}
                    numberOfLines={4}
                  >
                    {review.reviewText}
                  </Text>
                ) : null}

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
                    value={text}
                    onChangeText={value => {
                      setText(value);
                      setFieldError('');
                    }}
                    placeholder={t('repairman.thankTheCustomerOrAnswer')}
                    placeholderTextColor={colors.textMuted}
                    multiline
                    maxLength={MAX_REPLY}
                    editable={!submitting}
                    style={[styles.input, { color: colors.text }]}
                  />
                </View>
                <View style={styles.counterRow}>
                  <Text style={[styles.error, { color: colors.error }]}>
                    {fieldError}
                  </Text>
                  <Text style={[styles.counter, { color: colors.textMuted }]}>
                    {text.trim().length}/{MAX_REPLY}
                  </Text>
                </View>

                <View style={styles.actions}>
                  <Button
                    title={t('common.cancel')}
                    variant="outline"
                    size="sm"
                    style={styles.flex}
                    disabled={submitting}
                    onPress={onClose}
                  />
                  <Button
                    title={editing ? t('repairman.saveReply') : t('repairman.sendReply')}
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
          title={t('repairman.couldNotSend')}
          message={error}
          onClose={() => setError('')}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', paddingHorizontal: 20 },
  flex: { flex: 1 },
  card: { borderRadius: 20, borderWidth: 1, maxHeight: '88%' },
  body: { padding: 20, gap: 10 },
  title: { fontFamily: fonts.bold, fontSize: 18 },
  quote: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 19,
    borderLeftWidth: 3,
    paddingLeft: 10,
  },
  inputBox: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  input: {
    minHeight: 110,
    textAlignVertical: 'top',
    fontFamily: fonts.regular,
    fontSize: 14,
    padding: 0,
  },
  counterRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  error: { flex: 1, fontFamily: fonts.regular, fontSize: 12 },
  counter: { fontFamily: fonts.regular, fontSize: 11 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 6 },
});
